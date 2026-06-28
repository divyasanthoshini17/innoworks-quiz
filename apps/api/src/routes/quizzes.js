import { Router } from 'express';
import { Quiz } from '../models/Quiz.js';
import { authenticate } from '../middleware/auth.js';
import jwt from 'jsonwebtoken';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || "secret";

// Helper helper to generate random 6 character slug
const generateSlug = () => {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let slug = '';
  for (let i = 0; i < 6; i++) {
    slug += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return slug;
};

// 1. Get all published quizzes
// Separate them into default/category quizzes (creator is null) and custom user quizzes
router.get('/', async (req, res) => {
  try {
    const quizzes = await Quiz.find({ isPublished: true })
      .populate('creator', 'username avatarUrl')
      .sort({ createdAt: -1 });

    const defaultQuizzes = quizzes.filter(q => q.creator === null);
    const customQuizzes = quizzes.filter(q => q.creator !== null);

    res.json({
      defaultQuizzes,
      customQuizzes
    });
  } catch (error) {
    console.error('❌ Get Quizzes Error:', error.message);
    res.status(500).json({ message: 'Failed to fetch quizzes' });
  }
});

// 2. Get a single quiz by slug (with optional auth checking for private quizzes)
router.get('/by-slug/:slug', async (req, res) => {
  try {
    const quiz = await Quiz.findOne({ slug: req.params.slug })
      .populate('creator', 'username avatarUrl');

    if (!quiz) {
      return res.status(404).json({ message: 'Quiz not found' });
    }

    // If quiz is private, check if the user is authenticated and has access
    if (!quiz.isPublic) {
      const authHeader = req.headers.authorization || req.headers.Authorization;
      if (!authHeader) {
        return res.status(401).json({ message: 'This quiz is private. Please authenticate to view.' });
      }

      const parts = authHeader.split(' ');
      if (parts.length !== 2 || parts[0] !== 'Bearer') {
        return res.status(401).json({ message: 'This quiz is private. Invalid token format.' });
      }

      const token = parts[1];
      try {
        const decoded = jwt.verify(token, JWT_SECRET);
        // User is authenticated, they can view
      } catch (err) {
        return res.status(401).json({ message: 'This quiz is private. Invalid or expired session.' });
      }
    }

    res.json(quiz);
  } catch (error) {
    console.error('❌ Get Quiz by Slug Error:', error.message);
    res.status(500).json({ message: 'Failed to retrieve quiz' });
  }
});

// 3. Create a custom quiz
router.post('/', authenticate, async (req, res) => {
  try {
    const { title, description, category, timeLimit, passingScore, isPublic, questions } = req.body;

    if (!title || !questions || !Array.isArray(questions) || questions.length === 0) {
      return res.status(400).json({ message: 'Title and at least one question are required.' });
    }

    // Validate options count for each question
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.questionText || !q.options || q.options.length < 4 || q.correctOptionIndex === undefined) {
        return res.status(400).json({ 
          message: `Question ${i + 1} is invalid. It must contain text, at least 4 options, and a correct option selected.` 
        });
      }
    }

    let slug = generateSlug();
    // Ensure slug uniqueness
    let slugExists = await Quiz.findOne({ slug });
    while (slugExists) {
      slug = generateSlug();
      slugExists = await Quiz.findOne({ slug });
    }

    const newQuiz = new Quiz({
      title,
      description,
      category: category || 'Custom',
      creator: req.user.userId,
      timeLimit: timeLimit || 15,
      passingScore: passingScore || 60,
      isPublic: isPublic !== undefined ? isPublic : true,
      slug,
      questions,
      isPublished: true
    });

    await newQuiz.save();
    res.status(201).json(newQuiz);
  } catch (error) {
    console.error('❌ Create Quiz Error:', error.message);
    res.status(500).json({ message: 'Failed to create quiz' });
  }
});

// 4. Delete a custom quiz
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id);
    if (!quiz) {
      return res.status(404).json({ message: 'Quiz not found' });
    }

    // Ensure user is the creator
    if (!quiz.creator || quiz.creator.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Access denied. You can only delete quizzes you created.' });
    }

    await Quiz.findByIdAndDelete(req.params.id);
    res.json({ message: 'Quiz deleted successfully' });
  } catch (error) {
    console.error('❌ Delete Quiz Error:', error.message);
    res.status(500).json({ message: 'Failed to delete quiz' });
  }
});

// 5. Update a custom quiz
router.put('/:id', authenticate, async (req, res) => {
  try {
    const { title, description, category, timeLimit, passingScore, isPublic, questions } = req.body;

    const quiz = await Quiz.findById(req.params.id);
    if (!quiz) {
      return res.status(404).json({ message: 'Quiz not found' });
    }

    // Ensure user is the creator
    if (!quiz.creator || quiz.creator.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Access denied. You can only edit quizzes you created.' });
    }

    if (!title || !questions || !Array.isArray(questions) || questions.length === 0) {
      return res.status(400).json({ message: 'Title and at least one question are required.' });
    }

    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.questionText || !q.options || q.options.length < 4 || q.correctOptionIndex === undefined) {
        return res.status(400).json({ 
          message: `Question ${i + 1} is invalid. It must contain text, at least 4 options, and a correct option selected.` 
        });
      }
    }

    quiz.title = title;
    quiz.description = description;
    quiz.category = category || 'Custom';
    quiz.timeLimit = timeLimit || 15;
    quiz.passingScore = passingScore || 60;
    quiz.isPublic = isPublic !== undefined ? isPublic : true;
    quiz.questions = questions;

    await quiz.save();
    res.json(quiz);
  } catch (error) {
    console.error('❌ Update Quiz Error:', error.message);
    res.status(500).json({ message: 'Failed to update quiz' });
  }
});

export default router;
