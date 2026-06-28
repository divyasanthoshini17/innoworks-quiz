import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  Users, TrendingUp, Clock, CheckCircle, Share2, Copy, Edit2, Trash2, 
  Play, BarChart2, ListChecks, ArrowLeft, Eye, EyeOff, CheckSquare
} from 'lucide-react';
import api from '../../lib/api';

const QuizDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchQuizDetails = async () => {
      try {
        const res = await api.get(`/my-quizzes/${id}`);
        setData(res.data);
      } catch (err) {
        console.error('Failed to load quiz details', err);
      } finally {
        setLoading(false);
      }
    };
    fetchQuizDetails();
  }, [id]);

  const handleCopyLink = () => {
    const url = `${window.location.origin}/quiz/play/${data.quiz.slug}`;
    navigator.clipboard.writeText(url);
    alert('Link copied to clipboard!');
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this quiz? All attempts and analytics will be permanently lost.')) {
      try {
        await api.delete(`/quizzes/${id}`);
        navigate('/quiz/my-quizzes');
      } catch (err) {
        alert('Failed to delete quiz.');
      }
    }
  };

  if (loading) {
    return (
      <div className="space-y-8 animate-pulse">
        <div className="h-10 bg-card rounded-xl w-1/4"></div>
        <div className="h-40 bg-card rounded-3xl w-full"></div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {[1,2,3,4].map(i => <div key={i} className="h-32 bg-card rounded-3xl w-full"></div>)}
        </div>
      </div>
    );
  }

  if (!data || !data.quiz) {
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl font-black mb-2">Quiz Not Found</h2>
        <p className="text-muted-foreground mb-6">The quiz you are looking for does not exist or you do not have permission to view it.</p>
        <Link to="/quiz/my-quizzes" className="btn-primary">Return to My Quizzes</Link>
      </div>
    );
  }

  const { quiz, stats } = data;

  return (
    <div className="space-y-8">
      {/* Top Nav */}
      <div className="flex items-center gap-4">
        <Link to="/quiz/my-quizzes" className="p-2 rounded-xl bg-card hover:bg-muted/50 border border-border/50 transition-colors">
          <ArrowLeft size={20} className="text-muted-foreground" />
        </Link>
        <div className="flex flex-col">
          <span className="text-xs font-black uppercase tracking-widest text-primary">Instructor Dashboard</span>
          <h1 className="text-2xl font-black text-foreground">Quiz Overview</h1>
        </div>
      </div>

      {/* Hero Header */}
      <div className="bg-card/40 backdrop-blur-xl border border-border/30 rounded-[2.5rem] p-8 md:p-10 relative overflow-hidden shadow-2xl shadow-black/5">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[100px] pointer-events-none translate-x-1/3 -translate-y-1/3"></div>
        
        <div className="relative z-10 flex flex-col lg:flex-row justify-between gap-8 items-start lg:items-center">
          <div className="max-w-2xl">
            <div className="flex flex-wrap items-center gap-3 mb-4">
              <span className={`px-3 py-1 text-xs font-black uppercase tracking-wider rounded-lg flex items-center gap-1.5 ${
                quiz.isPublic 
                  ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' 
                  : 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
              }`}>
                {quiz.isPublic ? <Eye size={14}/> : <EyeOff size={14}/>}
                {quiz.isPublic ? 'Public' : 'Private'}
              </span>
              <span className="text-sm font-bold text-muted-foreground">
                Created {new Date(quiz.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
              </span>
            </div>
            
            <h2 className="text-4xl font-black tracking-tight mb-4">{quiz.title}</h2>
            <p className="text-lg text-muted-foreground font-medium mb-8 leading-relaxed">
              {quiz.description || "No description provided."}
            </p>

            <div className="flex flex-wrap items-center gap-6">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                  <CheckSquare size={20} />
                </div>
                <div>
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Questions</p>
                  <p className="text-lg font-black leading-none">{quiz.questionCount}</p>
                </div>
              </div>
              <div className="w-px h-10 bg-border/50"></div>
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                  <Clock size={20} />
                </div>
                <div>
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Duration</p>
                  <p className="text-lg font-black leading-none">{quiz.timeLimit} min</p>
                </div>
              </div>
              <div className="w-px h-10 bg-border/50"></div>
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                  <CheckCircle size={20} />
                </div>
                <div>
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Passing Score</p>
                  <p className="text-lg font-black leading-none">{quiz.passingScore}%</p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3 min-w-[200px] w-full lg:w-auto">
            <Link to={`/quiz/play/${quiz.slug}`} className="btn-primary flex items-center justify-center gap-2 w-full py-3">
              <Play size={18} /> Preview Quiz
            </Link>
            <button onClick={handleCopyLink} className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-card border border-border hover:bg-muted/50 font-bold transition-colors">
              <Copy size={18} /> Copy Link
            </button>
            <div className="grid grid-cols-2 gap-3 mt-1">
              <Link to={`/quiz/edit/${quiz._id}`} className="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-card border border-border hover:bg-muted/50 font-bold text-sm transition-colors">
                <Edit2 size={16} /> Edit
              </Link>
              <button onClick={handleDelete} className="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 hover:bg-red-500/20 font-bold text-sm transition-colors">
                <Trash2 size={16} /> Delete
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        <div className="bg-card/40 backdrop-blur-sm border border-border/30 rounded-3xl p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Users size={80} />
          </div>
          <p className="text-sm font-bold text-muted-foreground mb-2 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-blue-500"></span> Total Attempts
          </p>
          <p className="text-4xl font-black">{stats.totalAttempts}</p>
        </div>
        
        <div className="bg-card/40 backdrop-blur-sm border border-border/30 rounded-3xl p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <TrendingUp size={80} />
          </div>
          <p className="text-sm font-bold text-muted-foreground mb-2 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-primary"></span> Average Score
          </p>
          <p className="text-4xl font-black">{stats.averageScore}%</p>
        </div>

        <div className="bg-card/40 backdrop-blur-sm border border-border/30 rounded-3xl p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <CheckCircle size={80} />
          </div>
          <p className="text-sm font-bold text-muted-foreground mb-2 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Completion Rate
          </p>
          <p className="text-4xl font-black">{stats.completionRate}%</p>
        </div>

        <div className="bg-card/40 backdrop-blur-sm border border-border/30 rounded-3xl p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Clock size={80} />
          </div>
          <p className="text-sm font-bold text-muted-foreground mb-2 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-500"></span> Avg. Time
          </p>
          <p className="text-4xl font-black">{Math.round(stats.averageTime / 60)}m {stats.averageTime % 60}s</p>
        </div>
      </div>

      {/* Large Actions */}
      <div className="grid md:grid-cols-2 gap-6">
        <Link 
          to={`/quiz/my-quizzes/${quiz._id}/attempts`}
          className="group relative overflow-hidden bg-gradient-to-br from-card/80 to-card/40 border border-border/50 rounded-3xl p-8 hover:border-primary/50 transition-all duration-300"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl group-hover:bg-primary/20 transition-all"></div>
          <div className="w-16 h-16 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
            <ListChecks size={32} />
          </div>
          <h3 className="text-2xl font-black tracking-tight mb-2">View Attempts</h3>
          <p className="text-muted-foreground font-medium mb-6">See a detailed list of everyone who has taken this quiz, including scores, time taken, and individual attempt breakdowns.</p>
          <div className="flex items-center text-primary font-bold text-sm tracking-wide uppercase gap-2 group-hover:gap-4 transition-all">
            Explore Logs <span>&rarr;</span>
          </div>
        </Link>

        <Link 
          to={`/quiz/my-quizzes/${quiz._id}/analytics`}
          className="group relative overflow-hidden bg-gradient-to-br from-card/80 to-card/40 border border-border/50 rounded-3xl p-8 hover:border-primary/50 transition-all duration-300"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl group-hover:bg-indigo-500/20 transition-all"></div>
          <div className="w-16 h-16 bg-indigo-500/10 text-indigo-500 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
            <BarChart2 size={32} />
          </div>
          <h3 className="text-2xl font-black tracking-tight mb-2">Quiz Analytics</h3>
          <p className="text-muted-foreground font-medium mb-6">Dive deep into performance metrics, score distributions, and question difficulty to understand how participants are doing.</p>
          <div className="flex items-center text-indigo-500 font-bold text-sm tracking-wide uppercase gap-2 group-hover:gap-4 transition-all">
            View Insights <span>&rarr;</span>
          </div>
        </Link>
      </div>
    </div>
  );
};

export default QuizDetails;
