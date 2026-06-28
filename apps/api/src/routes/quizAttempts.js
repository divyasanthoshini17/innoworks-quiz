import { Router } from 'express';
import { Quiz } from '../models/Quiz.js';
import { QuizAttempt } from '../models/QuizAttempt.js';
import { User } from '../models/User.js';
import { authenticate } from '../middleware/auth.js';
import { sendNotification } from '../lib/notifications.js';
import jwt from 'jsonwebtoken';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || "secret";

// 1. Submit a completed quiz attempt (with optional auth)
router.post('/:quizId', async (req, res) => {
  try {
    const { quizId } = req.params;
    const { answers, timeTaken } = req.body; // answers: Array of { questionId, selectedOptionIndex }

    const quiz = await Quiz.findById(quizId);
    if (!quiz) {
      return res.status(404).json({ message: 'Quiz not found' });
    }

    if (!answers || !Array.isArray(answers)) {
      return res.status(400).json({ message: 'Answers array is required.' });
    }

    // Process and score answers
    let correctAnswersCount = 0;
    const mappedAnswers = quiz.questions.map((question) => {
      const userAnswer = answers.find(a => a.questionId === question._id.toString());
      const selectedIndex = userAnswer ? userAnswer.selectedOptionIndex : -1;
      const isCorrect = selectedIndex === question.correctOptionIndex;
      
      if (isCorrect) {
        correctAnswersCount++;
      }

      return {
        questionId: question._id,
        selectedOptionIndex: selectedIndex,
        isCorrect
      };
    });

    const totalQuestions = quiz.questions.length;
    const score = totalQuestions > 0 ? Math.round((correctAnswersCount / totalQuestions) * 100) : 0;
    const passed = score >= quiz.passingScore;

    // Optional Authentication check (if user is logged in, associate attempt and award XP)
    let user = null;
    let xpEarned = 0;
    const authHeader = req.headers.authorization || req.headers.Authorization;
    
    if (authHeader) {
      const parts = authHeader.split(' ');
      if (parts.length === 2 && parts[0] === 'Bearer') {
        try {
          const decoded = jwt.verify(parts[1], JWT_SECRET);
          user = await User.findById(decoded.userId);
          
          if (user) {
            // Gamification logic:
            // 5 XP per correct answer + 50 XP if quiz is passed!
            xpEarned = (correctAnswersCount * 5) + (passed ? 50 : 0);
            user.xp = (user.xp || 0) + xpEarned;
            
            // Increment category-specific collaboration or consistency scores slightly
            if (passed) {
              user.perfectionScore = Math.min((user.perfectionScore || 0) + 5, 100);
              user.consistencyScore = Math.min((user.consistencyScore || 0) + 3, 100);
            }

            await user.save();

            // Emit Toast notification
            if (passed) {
              await sendNotification(
                user._id,
                'ACHIEVEMENT_UNLOCKED',
                `Legendary! You passed the "${quiz.title}" quiz with a score of ${score}%! Earned +${xpEarned} XP.`,
                '/quiz'
              );
            } else {
              await sendNotification(
                user._id,
                'NEW_SUBMISSION',
                `Quiz completed: "${quiz.title}". Score: ${score}% (+${xpEarned} XP). Try again to pass!`,
                '/quiz'
              );
            }
          }
        } catch (err) {
          console.warn('⚠️ Token verification failed in quiz submission: ignoring user relation.');
        }
      }
    }

    const attempt = new QuizAttempt({
      user: user ? user._id : null,
      quiz: quiz._id,
      score,
      totalQuestions,
      correctAnswers: correctAnswersCount,
      timeTaken: timeTaken || 0,
      answers: mappedAnswers,
      passed
    });

    await attempt.save();

    res.status(201).json({
      attempt,
      xpEarned,
      newLevel: user ? user.level : null
    });
  } catch (error) {
    console.error('❌ Submit Quiz Attempt Error:', error.message);
    res.status(500).json({ message: 'Failed to process quiz submission' });
  }
});

// 2. Fetch authenticated user's attempts and statistics
router.get('/user', authenticate, async (req, res) => {
  try {
    const userId = req.user.userId;

    const attempts = await QuizAttempt.find({ user: userId })
      .populate('quiz', 'title category description')
      .sort({ createdAt: -1 });

    if (attempts.length === 0) {
      return res.json({
        stats: {
          totalAttempts: 0,
          averageScore: 0,
          highestScore: 0,
          quizzesTaken: 0
        },
        attempts: []
      });
    }

    // Calculate aggregated stats
    const totalAttempts = attempts.length;
    const sumScores = attempts.reduce((acc, curr) => acc + curr.score, 0);
    const averageScore = Math.round(sumScores / totalAttempts);
    const highestScore = Math.max(...attempts.map(a => a.score));

    // Get unique quiz count
    const uniqueQuizIds = new Set(attempts.map(a => a.quiz?._id?.toString()).filter(Boolean));
    const quizzesTaken = uniqueQuizIds.size;

    res.json({
      stats: {
        totalAttempts,
        averageScore,
        highestScore,
        quizzesTaken
      },
      attempts
    });
  } catch (error) {
    console.error('❌ Fetch User Attempts Error:', error.message);
    res.status(500).json({ message: 'Failed to retrieve user attempts' });
  }
});

// 3. Fetch detailed single past attempt
router.get('/:id', authenticate, async (req, res) => {
  try {
    const attempt = await QuizAttempt.findById(req.params.id)
      .populate({
        path: 'quiz',
        select: 'title category description questions creator'
      })
      .populate({
        path: 'user',
        select: 'username email avatarUrl'
      });

    if (!attempt) {
      return res.status(404).json({ message: 'Attempt record not found' });
    }

    // Security check: Only the user who attempted OR the quiz creator can view the details
    const attemptUserId = attempt.user ? (attempt.user._id ? attempt.user._id.toString() : attempt.user.toString()) : null;
    const isOwner = attemptUserId === req.user.userId;
    const isCreator = attempt.quiz && attempt.quiz.creator && attempt.quiz.creator.toString() === req.user.userId;

    if (!isOwner && !isCreator) {
      return res.status(403).json({ message: 'Access denied.' });
    }

    res.json(attempt);
  } catch (error) {
    console.error('❌ Fetch Single Attempt Error:', error.message);
    res.status(500).json({ message: 'Failed to retrieve attempt details' });
  }
});

export default router;
