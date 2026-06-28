import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  ArrowLeft, CheckCircle, XCircle, Clock, Award, Target, 
  AlertCircle, ChevronRight, User, ListChecks
} from 'lucide-react';
import api from '../../lib/api';

const CircularProgress = ({ value, size = 120, strokeWidth = 10, colorClass = "text-primary" }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (value / 100) * circumference;

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          className="stroke-muted/30"
          strokeWidth={strokeWidth}
          fill="none"
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          className={colorClass}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          fill="none"
          style={{ transition: "stroke-dashoffset 1s ease-in-out" }}
        />
      </svg>
      <div className="absolute flex flex-col items-center justify-center text-center">
        <span className="text-3xl font-black">{value}%</span>
      </div>
    </div>
  );
};

const AttemptDetails = () => {
  const { id, quizId } = useParams(); // URL could be /quiz/attempts/:id or /quiz/my-quizzes/:quizId/attempts/:id
  const navigate = useNavigate();
  const location = useLocation();
  const [attempt, setAttempt] = useState(null);
  const [loading, setLoading] = useState(true);

  const handleBack = () => {
    // If they came from a specific route and history exists, try to go back
    if (location.key !== "default" && window.history.length > 2) {
      navigate(-1);
    } else if (quizId) {
      navigate(`/quiz/my-quizzes/${quizId}/attempts`);
    } else if (attempt?.quiz?._id) {
      navigate(`/quiz/my-quizzes/${attempt.quiz._id}/attempts`);
    } else {
      navigate('/quiz/my-quizzes');
    }
  };

  useEffect(() => {
    const fetchAttempt = async () => {
      try {
        // ID here is the attemptId
        const res = await api.get(`/quiz-attempts/${id}`);
        setAttempt(res.data);
      } catch (err) {
        console.error('Failed to load attempt details', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAttempt();
  }, [id]);

  if (loading) {
    return (
      <div className="space-y-8 animate-pulse">
        <div className="h-10 bg-card rounded-xl w-1/4"></div>
        <div className="h-48 bg-card rounded-3xl w-full"></div>
        <div className="space-y-4">
          {[1,2,3].map(i => <div key={i} className="h-32 bg-card rounded-2xl w-full"></div>)}
        </div>
      </div>
    );
  }

  if (!attempt) {
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl font-black mb-2">Attempt Not Found</h2>
        <p className="text-muted-foreground mb-6">We couldn't find the details for this attempt.</p>
        <button onClick={handleBack} className="btn-primary">Go Back</button>
      </div>
    );
  }

  const { quiz, user, score, passed, timeTaken, correctAnswers, totalQuestions, answers, createdAt } = attempt;
  const incorrectAnswers = totalQuestions - correctAnswers;
  const progressColor = passed ? "stroke-emerald-500" : "stroke-red-500";
  
  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return m > 0 ? `${m}m ${s}s` : `${s}s`;
  };

  const renderQuestionReview = (question, index) => {
    const userAnswer = answers.find(a => a.questionId === question._id);
    const selectedOptionIndex = userAnswer ? userAnswer.selectedOptionIndex : -1;
    const isCorrect = userAnswer ? userAnswer.isCorrect : false;

    return (
      <div key={question._id} className="bg-card/40 backdrop-blur-sm border border-border/50 rounded-3xl p-6 relative">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-4">
          <h4 className="text-lg font-bold">
            <span className="text-muted-foreground mr-2">Q{index + 1}.</span> 
            {question.questionText}
          </h4>
          <span className={`px-3 py-1 text-xs font-black uppercase tracking-wider rounded-lg flex items-center gap-1.5 shrink-0 ${
            isCorrect 
              ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' 
              : 'bg-red-500/10 text-red-500 border border-red-500/20'
          }`}>
            {isCorrect ? <CheckCircle size={14}/> : <XCircle size={14}/>}
            {isCorrect ? 'Correct' : 'Incorrect'}
          </span>
        </div>

        <div className="space-y-2 mt-6">
          {question.options.map((option, optIdx) => {
            const isUserSelection = optIdx === selectedOptionIndex;
            const isActualCorrect = optIdx === question.correctOptionIndex;
            
            let optionClass = "bg-background/50 border border-border/50 text-muted-foreground";
            let indicator = null;

            if (isActualCorrect && isUserSelection) {
              optionClass = "bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400";
              indicator = <CheckCircle size={18} className="text-emerald-500" />;
            } else if (isActualCorrect && !isUserSelection) {
              optionClass = "bg-emerald-500/5 border-emerald-500/30 text-emerald-600 dark:text-emerald-400 border-dashed";
              indicator = <CheckCircle size={18} className="text-emerald-500 opacity-50" />;
            } else if (isUserSelection && !isActualCorrect) {
              optionClass = "bg-red-500/10 border-red-500/30 text-red-600 dark:text-red-400";
              indicator = <XCircle size={18} className="text-red-500" />;
            }

            return (
              <div key={optIdx} className={`p-4 rounded-xl flex justify-between items-center transition-colors ${optionClass}`}>
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-md bg-background/50 flex items-center justify-center text-xs font-bold shadow-sm">
                    {String.fromCharCode(65 + optIdx)}
                  </div>
                  <span className="font-medium">{option}</span>
                </div>
                {indicator}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8">
      {/* Top Nav */}
      <div className="flex items-center gap-4">
        <button onClick={handleBack} className="p-2 rounded-xl bg-card hover:bg-muted/50 border border-border/50 transition-colors">
          <ArrowLeft size={20} className="text-muted-foreground" />
        </button>
        <div className="flex flex-col">
          <span className="text-xs font-black uppercase tracking-widest text-primary">Attempt Report</span>
          <h1 className="text-2xl font-black text-foreground line-clamp-1">{quiz?.title || 'Quiz'}</h1>
        </div>
      </div>

      {/* Summary Header */}
      <div className="bg-card/40 backdrop-blur-xl border border-border/30 rounded-[2.5rem] p-8 md:p-10 relative overflow-hidden shadow-2xl shadow-black/5">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[100px] pointer-events-none translate-x-1/3 -translate-y-1/3"></div>
        
        <div className="relative z-10 flex flex-col lg:flex-row justify-between gap-10 items-center">
          
          <div className="flex items-center gap-6 w-full lg:w-auto text-left">
            <div className="w-20 h-20 md:w-24 md:h-24 rounded-3xl bg-gradient-to-tr from-primary to-blue-400 p-[3px] shadow-xl shrink-0">
              <div className="w-full h-full rounded-[21px] bg-background flex items-center justify-center overflow-hidden">
                {user?.avatarUrl ? (
                  <img src={user.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <User size={32} className="text-primary" />
                )}
              </div>
            </div>
            <div>
              <h2 className="text-3xl font-black tracking-tight mb-1">{user?.username ? user.username : 'Anonymous'}</h2>
              <p className="text-muted-foreground font-medium flex items-center gap-2">
                {user?.username && <span className="text-primary font-bold">@{user.username}</span>}
                {user?.email && <span>&bull; {user.email}</span>}
                {!user && <span>Unregistered User</span>}
              </p>
              <div className="mt-3 text-[11px] font-bold text-muted-foreground bg-background/50 inline-block px-3 py-1.5 rounded-xl border border-border/50 shadow-sm uppercase tracking-wider">
                Attempted on {new Date(createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute:'2-digit' })}
              </div>
            </div>
          </div>

          <div className="flex flex-col md:flex-row items-center gap-8 lg:gap-12 w-full lg:w-auto">
            {/* Stats */}
            <div className="grid grid-cols-2 gap-4 w-full md:w-auto">
              <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4 flex flex-col items-center justify-center min-w-[120px]">
                <Target size={24} className="text-emerald-500 mb-2" />
                <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{correctAnswers}</span>
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-600/70 dark:text-emerald-400/70">Correct</span>
              </div>
              <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 flex flex-col items-center justify-center min-w-[120px]">
                <AlertCircle size={24} className="text-red-500 mb-2" />
                <span className="text-2xl font-black text-red-600 dark:text-red-400">{incorrectAnswers}</span>
                <span className="text-xs font-bold uppercase tracking-wider text-red-600/70 dark:text-red-400/70">Incorrect</span>
              </div>
              <div className="bg-primary/10 border border-primary/20 rounded-2xl p-4 flex flex-col items-center justify-center min-w-[120px] col-span-2 md:col-span-1">
                <Clock size={24} className="text-primary mb-2" />
                <span className="text-2xl font-black text-primary">{formatTime(timeTaken)}</span>
                <span className="text-xs font-bold uppercase tracking-wider text-primary/70">Time Taken</span>
              </div>
            </div>

            {/* Score Ring */}
            <div className="flex flex-col items-center justify-center">
              <CircularProgress value={score} size={140} strokeWidth={12} colorClass={progressColor} />
              <div className="mt-4">
                {passed ? (
                  <span className="px-4 py-1.5 text-sm font-black uppercase tracking-wider rounded-xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 flex items-center gap-2">
                    <Award size={16}/> Passed
                  </span>
                ) : (
                  <span className="px-4 py-1.5 text-sm font-black uppercase tracking-wider rounded-xl bg-red-500/10 text-red-500 border border-red-500/20 flex items-center gap-2">
                    <XCircle size={16}/> Failed
                  </span>
                )}
              </div>
            </div>
          </div>
          
        </div>
      </div>

      {/* Questions Breakdown */}
      <div className="space-y-6">
        <h3 className="text-2xl font-black flex items-center gap-3">
          <ListChecks size={24} className="text-primary" /> Question Review
        </h3>
        
        <div className="space-y-4">
          {quiz?.questions?.map((question, index) => renderQuestionReview(question, index))}
        </div>
      </div>
    </div>
  );
};

export default AttemptDetails;
