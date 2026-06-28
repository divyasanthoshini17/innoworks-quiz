import mongoose from 'mongoose';

const questionSchema = new mongoose.Schema({
  questionText: { type: String, required: true },
  options: { type: [String], required: true },
  correctOptionIndex: { type: Number, required: true }
});

const quizSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  category: { type: String, required: true }, // 'Java', 'Python', 'JavaScript', 'React', 'SQL', 'Git', 'DSA', 'C++', or 'Custom'
  creator: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }, // Null for default/predefined quizzes
  timeLimit: { type: Number, default: 15 }, // In minutes
  passingScore: { type: Number, default: 60 }, // In percentage
  isPublic: { type: Boolean, default: true },
  slug: { type: String, required: true, unique: true },
  questions: { type: [questionSchema], required: true },
  isPublished: { type: Boolean, default: true }
}, { timestamps: true });

// Index for looking up quizzes by slug quickly
quizSchema.index({ slug: 1 });
quizSchema.index({ creator: 1 });

export const Quiz = mongoose.model('Quiz', quizSchema);
