import { Router } from 'express';
import { Quiz } from '../models/Quiz.js';
import { QuizAttempt } from '../models/QuizAttempt.js';
import { User } from '../models/User.js';
import { authenticate } from '../middleware/auth.js';
import mongoose from 'mongoose';

const router = Router();

// 1. GET /my-quizzes: List quizzes created by user (paginated, with attempt count, filters)
router.get('/', authenticate, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 6;
    const filter = req.query.filter || 'all'; // 'all' | 'public' | 'private' | 'drafts'
    const search = req.query.search || '';
    const skip = (page - 1) * limit;

    const matchQuery = { creator: new mongoose.Types.ObjectId(req.user.userId) };
    
    if (filter === 'public') {
      matchQuery.isPublic = true;
      matchQuery.isPublished = true;
    } else if (filter === 'private') {
      matchQuery.isPublic = false;
      matchQuery.isPublished = true;
    } else if (filter === 'drafts') {
      matchQuery.isPublished = false;
    }

    if (search.trim() !== '') {
      matchQuery.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    // Sorting options
    const sort = req.query.sort || 'newest';

    // We can't sort by attempt count directly using `find()` because attempts are in a separate collection.
    // If 'most-attempts' is requested, we'll handle it using aggregation, but for simplicity we fall back
    // to newest if aggregation is not requested, or we can just fetch all and sort them if there aren't many.
    // For now, let's just support 'newest' and 'oldest' directly in the query.
    let sortOptions = { createdAt: -1 };
    if (sort === 'oldest') sortOptions = { createdAt: 1 };
    
    let quizzes = [];
    let totalCount = 0;
    
    if (sort === 'most-attempts') {
      // Aggregation for most-attempts
      totalCount = await Quiz.countDocuments(matchQuery);
      quizzes = await Quiz.aggregate([
        { $match: matchQuery },
        {
          $lookup: {
            from: 'quizattempts',
            localField: '_id',
            foreignField: 'quiz',
            as: 'attemptsList'
          }
        },
        {
          $addFields: { tempAttemptCount: { $size: '$attemptsList' } }
        },
        { $sort: { tempAttemptCount: -1, createdAt: -1 } },
        { $skip: skip },
        { $limit: limit },
        { $project: { attemptsList: 0, tempAttemptCount: 0 } }
      ]);
      // The aggregated docs need to be transformed to match mongoose doc style for later processing or we can use them directly.
    } else {
      // Regular query
      quizzes = await Quiz.find(matchQuery)
        .sort(sortOptions)
        .skip(skip)
        .limit(limit);
      totalCount = await Quiz.countDocuments(matchQuery);
    }

    const totalPages = Math.ceil(totalCount / limit);

    // Fetch attempt count using aggregate lookup
    const quizIds = quizzes.map(q => q._id);
    const attemptCounts = await QuizAttempt.aggregate([
      { $match: { quiz: { $in: quizIds } } },
      { $group: { _id: "$quiz", count: { $sum: 1 } } }
    ]);

    const countsMap = attemptCounts.reduce((acc, curr) => {
      acc[curr._id.toString()] = curr.count;
      return acc;
    }, {});

    const quizzesWithAttempts = quizzes.map(q => {
      const qObj = typeof q.toObject === 'function' ? q.toObject() : q;
      return {
        ...qObj,
        questionCount: q.questions ? q.questions.length : 0,
        attemptsCount: countsMap[q._id.toString()] || 0
      };
    });

    res.json({
      quizzes: quizzesWithAttempts,
      pagination: {
        totalCount,
        totalPages,
        currentPage: page,
        limit
      }
    });
  } catch (error) {
    console.error('❌ Get My Quizzes Error:', error.message);
    res.status(500).json({ message: 'Failed to fetch your quizzes' });
  }
});

// 2. GET /my-quizzes/:id: Fetch single quiz detail for creator dashboard (with overview metrics)
router.get('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid quiz ID format' });
    }

    const quiz = await Quiz.findById(id);
    if (!quiz) {
      return res.status(404).json({ message: 'Quiz not found' });
    }

    // Authorization check
    if (!quiz.creator || quiz.creator.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Access denied. Only the quiz creator can view this page.' });
    }

    // Aggregate overview stats from QuizAttempts
    const statsAgg = await QuizAttempt.aggregate([
      { $match: { quiz: quiz._id } },
      {
        $group: {
          _id: null,
          totalAttempts: { $sum: 1 },
          averageScore: { $avg: "$score" },
          averageTime: { $avg: "$timeTaken" },
          passedCount: {
            $sum: { $cond: [{ $eq: ["$passed", true] }, 1, 0] }
          }
        }
      }
    ]);

    const stats = statsAgg[0] || {
      totalAttempts: 0,
      averageScore: 0,
      averageTime: 0,
      passedCount: 0
    };

    const totalAttempts = stats.totalAttempts;
    const completionRate = totalAttempts > 0 ? Math.round((stats.passedCount / totalAttempts) * 100) : 0;

    res.json({
      quiz: {
        ...quiz.toObject(),
        questionCount: quiz.questions.length
      },
      stats: {
        totalAttempts,
        averageScore: Math.round(stats.averageScore || 0),
        completionRate,
        averageTime: Math.round(stats.averageTime || 0)
      }
    });
  } catch (error) {
    console.error('❌ Get My Quiz Details Error:', error.message);
    res.status(500).json({ message: 'Failed to fetch quiz details' });
  }
});

// 3. GET /my-quizzes/:id/attempts: Fetch attempts logs (paginated, sorted, searchable, filtered)
router.get('/:id/attempts', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid quiz ID format' });
    }

    const quiz = await Quiz.findById(id);
    if (!quiz) {
      return res.status(404).json({ message: 'Quiz not found' });
    }

    // Authorization check
    if (!quiz.creator || quiz.creator.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Access denied. Only the quiz creator can view attempts.' });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    const search = req.query.search || '';
    const status = req.query.status || 'all'; // 'all' | 'completed' | 'passed' | 'failed' | 'inProgress'
    const sortBy = req.query.sortBy || 'date'; // 'date' | 'score' | 'time'
    const sortOrder = req.query.sortOrder || 'desc';

    const attemptMatch = { quiz: quiz._id };

    // Status filter
    if (status === 'passed') {
      attemptMatch.passed = true;
    } else if (status === 'failed') {
      attemptMatch.passed = false;
    } else if (status === 'inProgress') {
      // In-progress attempts are not stored in QuizAttempt, so match an empty condition
      attemptMatch._id = null;
    }

    // User search (by username or email)
    if (search.trim() !== '') {
      const users = await User.find({
        $or: [
          { username: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } }
        ]
      }).select('_id');
      const userIds = users.map(u => u._id);
      attemptMatch.user = { $in: userIds };
    }

    // Sorting
    const sortOption = {};
    if (sortBy === 'score') {
      sortOption.score = sortOrder === 'asc' ? 1 : -1;
    } else if (sortBy === 'time') {
      sortOption.timeTaken = sortOrder === 'asc' ? 1 : -1;
    } else {
      sortOption.createdAt = sortOrder === 'asc' ? 1 : -1;
    }

    const attempts = await QuizAttempt.find(attemptMatch)
      .populate('user', 'username email avatarUrl')
      .sort(sortOption)
      .skip(skip)
      .limit(limit);

    const totalCount = await QuizAttempt.countDocuments(attemptMatch);
    const totalPages = Math.ceil(totalCount / limit);

    res.json({
      attempts,
      pagination: {
        totalCount,
        totalPages,
        currentPage: page,
        limit
      }
    });
  } catch (error) {
    console.error('❌ Get Quiz Attempts Error:', error.message);
    res.status(500).json({ message: 'Failed to fetch quiz attempts' });
  }
});

// 4. GET /my-quizzes/:id/analytics: Fetch full aggregated analytics details
router.get('/:id/analytics', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid quiz ID format' });
    }

    const quiz = await Quiz.findById(id);
    if (!quiz) {
      return res.status(404).json({ message: 'Quiz not found' });
    }

    // Authorization check
    if (!quiz.creator || quiz.creator.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Access denied. Only the quiz creator can view analytics.' });
    }

    // Aggregated Stats
    const statsAgg = await QuizAttempt.aggregate([
      { $match: { quiz: quiz._id } },
      {
        $group: {
          _id: null,
          totalAttempts: { $sum: 1 },
          averageScore: { $avg: "$score" },
          highestScore: { $max: "$score" },
          averageTime: { $avg: "$timeTaken" },
          passedCount: {
            $sum: { $cond: [{ $eq: ["$passed", true] }, 1, 0] }
          }
        }
      }
    ]);

    const stats = statsAgg[0] || {
      totalAttempts: 0,
      averageScore: 0,
      highestScore: 0,
      averageTime: 0,
      passedCount: 0
    };

    const totalAttempts = stats.totalAttempts;
    const completionRate = totalAttempts > 0 ? Math.round((stats.passedCount / totalAttempts) * 100) : 0;
    const questionsAnswered = totalAttempts * quiz.questions.length;

    // Score Distribution Aggregation
    const distributionAgg = await QuizAttempt.aggregate([
      { $match: { quiz: quiz._id } },
      {
        $bucket: {
          groupBy: "$score",
          boundaries: [0, 21, 41, 61, 81, 101],
          default: "unknown",
          output: {
            count: { $sum: 1 }
          }
        }
      }
    ]);

    // Map boundaries to readable label ranges
    const rangeLabels = {
      0: '0-20',
      21: '21-40',
      41: '41-60',
      61: '61-80',
      81: '81-100'
    };
    const scoreDistribution = Object.keys(rangeLabels).map(bound => {
      const bucket = distributionAgg.find(b => b._id === parseInt(bound));
      return {
        range: rangeLabels[bound],
        count: bucket ? bucket.count : 0
      };
    });

    // Performance Over Time aggregation (group by YYYY-MM-DD of createdAt)
    const timelineAgg = await QuizAttempt.aggregate([
      { $match: { quiz: quiz._id } },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" }
          },
          averageScore: { $avg: "$score" },
          attemptCount: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } },
      { $limit: 30 }
    ]);

    const performanceOverTime = timelineAgg.map(item => ({
      date: item._id,
      averageScore: Math.round(item.averageScore),
      attemptCount: item.attemptCount
    }));

    // Question Accuracy & Difficulty aggregation
    // Initialize stats
    const questionStats = quiz.questions.map(q => ({
      questionId: q._id.toString(),
      questionText: q.questionText,
      correctCount: 0,
      attemptCount: 0
    }));

    // Retrieve all answers for calculations
    const allAttemptsAnswers = await QuizAttempt.find({ quiz: quiz._id }).select('answers');
    allAttemptsAnswers.forEach(attempt => {
      if (attempt.answers && Array.isArray(attempt.answers)) {
        attempt.answers.forEach(ans => {
          const qStat = questionStats.find(qs => qs.questionId === ans.questionId?.toString());
          if (qStat) {
            qStat.attemptCount++;
            if (ans.isCorrect) {
              qStat.correctCount++;
            }
          }
        });
      }
    });

    const questionAccuracy = questionStats.map(qs => {
      const accuracy = qs.attemptCount > 0 ? Math.round((qs.correctCount / qs.attemptCount) * 100) : 0;
      let difficulty = 'Medium';
      if (accuracy > 70) difficulty = 'Easy';
      else if (accuracy < 40) difficulty = 'Hard';

      return {
        questionText: qs.questionText,
        accuracy,
        difficulty,
        correctCount: qs.correctCount,
        attemptCount: qs.attemptCount
      };
    });

    // Recent Attempts (last 5)
    const recentAttempts = await QuizAttempt.find({ quiz: quiz._id })
      .populate('user', 'username avatarUrl')
      .sort({ createdAt: -1 })
      .limit(5)
      .select('_id user score passed timeTaken createdAt');

    res.json({
      cards: {
        totalAttempts,
        averageScore: Math.round(stats.averageScore),
        highestScore: Math.round(stats.highestScore),
        averageCompletionTime: Math.round(stats.averageTime),
        completionRate,
        questionsAnswered
      },
      charts: {
        scoreDistribution,
        performanceOverTime,
        questionAccuracy
      },
      recentAttempts
    });
  } catch (error) {
    console.error('❌ Get Quiz Analytics Error:', error.message);
    res.status(500).json({ message: 'Failed to fetch quiz analytics' });
  }
});

export default router;
