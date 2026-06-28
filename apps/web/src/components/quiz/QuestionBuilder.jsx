import React, { useState } from 'react';
import { Plus, Trash2, ArrowLeft, ArrowRight, Check, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const QuestionBuilder = ({ questions, setQuestions }) => {
  const [activeIndex, setActiveIndex] = useState(0);

  const currentQuestion = questions[activeIndex] || {
    questionText: '',
    options: ['', '', '', ''],
    correctOptionIndex: 0
  };

  const handleQuestionTextChange = (e) => {
    const updated = [...questions];
    updated[activeIndex] = {
      ...currentQuestion,
      questionText: e.target.value
    };
    setQuestions(updated);
  };

  const handleOptionChange = (optIdx, val) => {
    const updatedOptions = [...currentQuestion.options];
    updatedOptions[optIdx] = val;

    const updated = [...questions];
    updated[activeIndex] = {
      ...currentQuestion,
      options: updatedOptions
    };
    setQuestions(updated);
  };

  const handleSelectCorrect = (optIdx) => {
    const updated = [...questions];
    updated[activeIndex] = {
      ...currentQuestion,
      correctOptionIndex: optIdx
    };
    setQuestions(updated);
  };

  const handleAddOption = () => {
    const updated = [...questions];
    updated[activeIndex] = {
      ...currentQuestion,
      options: [...currentQuestion.options, '']
    };
    setQuestions(updated);
  };

  const handleRemoveOption = (optIdx) => {
    if (currentQuestion.options.length <= 4) {
      return; // Minimum 4 options
    }
    const updatedOptions = currentQuestion.options.filter((_, idx) => idx !== optIdx);
    
    // Correct index adjustment
    let correctIdx = currentQuestion.correctOptionIndex;
    if (correctIdx === optIdx) {
      correctIdx = 0; // Default back to first
    } else if (correctIdx > optIdx) {
      correctIdx--;
    }

    const updated = [...questions];
    updated[activeIndex] = {
      ...currentQuestion,
      options: updatedOptions,
      correctOptionIndex: correctIdx
    };
    setQuestions(updated);
  };

  const handleAddQuestion = () => {
    const newQuestion = {
      questionText: '',
      options: ['', '', '', ''],
      correctOptionIndex: 0
    };
    setQuestions([...questions, newQuestion]);
    setActiveIndex(questions.length); // Jump to new question
  };

  const handleDeleteQuestion = () => {
    if (questions.length <= 1) {
      // Clear instead of delete last
      setQuestions([{
        questionText: '',
        options: ['', '', '', ''],
        correctOptionIndex: 0
      }]);
      return;
    }
    
    const updated = questions.filter((_, idx) => idx !== activeIndex);
    setQuestions(updated);
    setActiveIndex(prev => Math.max(0, prev - 1));
  };

  return (
    <div className="bg-card/40 backdrop-blur-2xl border border-border/50 rounded-[2rem] p-6 sm:p-10 space-y-8 shadow-2xl shadow-black/10 relative overflow-hidden">
      {/* Decorative Glow */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-[80px] pointer-events-none -translate-y-1/3 translate-x-1/4" />

      {/* Header */}
      <div className="flex justify-between items-center border-b border-border/30 pb-6 relative z-10">
        <div>
          <h2 className="text-2xl font-black tracking-tight">Question Builder</h2>
          <p className="text-sm text-muted-foreground font-medium mt-1">Draft questions and label correct answers.</p>
        </div>
        <button
          type="button"
          onClick={handleDeleteQuestion}
          className="text-xs font-bold text-destructive hover:bg-destructive/10 px-3 py-2 rounded-xl border border-destructive/20 transition-all flex items-center gap-1.5"
        >
          <Trash2 size={13} />
          <span>Delete Question</span>
        </button>
      </div>

      {/* Main Area */}
      <div className="space-y-6 relative z-10">
        {/* Progress Navigation Tracker */}
        <div className="flex items-center justify-between text-xs font-black text-muted-foreground uppercase tracking-widest">
          <span>Editing Question {activeIndex + 1} of {questions.length}</span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveIndex(prev => Math.max(0, prev - 1))}
              disabled={activeIndex === 0}
              className="p-2 border border-border/50 rounded-xl hover:border-primary/50 hover:bg-primary/5 disabled:opacity-30 disabled:pointer-events-none transition-all"
            >
              <ArrowLeft size={16} />
            </button>
            <button
              type="button"
              onClick={() => setActiveIndex(prev => Math.min(questions.length - 1, prev + 1))}
              disabled={activeIndex === questions.length - 1}
              className="p-2 border border-border/50 rounded-xl hover:border-primary/50 hover:bg-primary/5 disabled:opacity-30 disabled:pointer-events-none transition-all"
            >
              <ArrowRight size={16} />
            </button>
          </div>
        </div>

        {/* Question Text */}
        <div className="space-y-2">
          <label htmlFor="questionText" className="text-[11px] font-black text-muted-foreground uppercase tracking-widest pl-1">
            Question Text
          </label>
          <input
            id="questionText"
            type="text"
            value={currentQuestion.questionText}
            onChange={handleQuestionTextChange}
            placeholder="e.g. Which HTML tag is used to create a hyperlink?"
            className="w-full bg-background/80 border border-border/50 focus:border-primary/50 focus:ring-4 focus:ring-primary/10 rounded-2xl px-5 py-4 text-base font-semibold text-foreground outline-none transition-all shadow-sm placeholder-muted-foreground/50"
            required
          />
        </div>

        {/* Options List */}
        <div className="space-y-4">
          <span className="text-[11px] font-black text-muted-foreground uppercase tracking-widest pl-1">
            Options & Correct Answer
          </span>
          
          <div className="flex flex-col gap-3.5">
            {currentQuestion.options.map((option, optIdx) => {
              const isCorrect = currentQuestion.correctOptionIndex === optIdx;
              
              return (
                <div key={optIdx} className={`flex items-center gap-3 p-1.5 pr-3 rounded-2xl border transition-all ${
                  isCorrect 
                    ? 'bg-emerald-500/5 border-emerald-500/30' 
                    : 'bg-background/50 border-border/50 hover:border-primary/30'
                }`}>
                  {/* Select Correct Radio Button */}
                  <button
                    type="button"
                    onClick={() => handleSelectCorrect(optIdx)}
                    className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-all shadow-sm ${
                      isCorrect 
                        ? 'bg-emerald-500 text-white shadow-emerald-500/20' 
                        : 'bg-card border border-border hover:bg-muted text-muted-foreground'
                    }`}
                    title="Mark as correct answer"
                  >
                    {isCorrect ? <Check size={18} strokeWidth={3} /> : <span className="text-xs font-bold font-mono">{String.fromCharCode(65 + optIdx)}</span>}
                  </button>

                  {/* Input Option Text */}
                  <input
                    type="text"
                    value={option}
                    onChange={(e) => handleOptionChange(optIdx, e.target.value)}
                    placeholder={`Option ${optIdx + 1}`}
                    className="flex-grow bg-transparent border-none text-sm font-medium text-foreground outline-none px-2"
                    required
                  />

                  {/* Delete Option Icon (visible if count > 4) */}
                  <button
                    type="button"
                    onClick={() => handleRemoveOption(optIdx)}
                    disabled={currentQuestion.options.length <= 4}
                    className="text-muted-foreground hover:text-red-500 hover:bg-red-500/10 p-2 rounded-xl disabled:opacity-0 disabled:pointer-events-none transition-all shrink-0"
                    title="Remove option"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Warning if option count is low */}
        {currentQuestion.options.length < 4 && (
          <div className="flex items-center gap-3 text-[11px] font-bold text-amber-500 bg-amber-500/10 p-4 border border-amber-500/20 rounded-2xl">
            <AlertCircle size={16} />
            <span>A minimum of 4 options is required for each question.</span>
          </div>
        )}

        {/* Builder bottom controls */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-6 border-t border-border/30 mt-6">
          <button
            type="button"
            onClick={handleAddOption}
            className="text-sm font-bold text-primary hover:bg-primary/10 px-5 py-2.5 rounded-2xl border border-primary/20 transition-all flex items-center gap-2"
          >
            <Plus size={16} />
            <span>Add Option</span>
          </button>

          <button
            type="button"
            onClick={handleAddQuestion}
            className="btn-secondary px-6 py-2.5 rounded-2xl text-xs font-black uppercase tracking-widest flex items-center gap-2 shadow-sm"
          >
            <Plus size={16} />
            <span>Add Question</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default QuestionBuilder;
