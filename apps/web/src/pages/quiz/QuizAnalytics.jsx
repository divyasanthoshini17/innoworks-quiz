import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  ArrowLeft, Users, TrendingUp, Clock, CheckCircle, 
  BarChart2, Trophy, Activity, Target
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';
import api from '../../lib/api';

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

const QuizAnalytics = () => {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const res = await api.get(`/my-quizzes/${id}/analytics`);
        setData(res.data);
      } catch (err) {
        console.error('Failed to load analytics', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, [id]);

  if (loading) {
    return (
      <div className="space-y-8 animate-pulse">
        <div className="h-10 bg-card rounded-xl w-1/4"></div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
          {[1,2,3,4,5,6].map(i => <div key={i} className="h-32 bg-card rounded-3xl w-full"></div>)}
        </div>
        <div className="grid lg:grid-cols-2 gap-6">
          <div className="h-80 bg-card rounded-3xl w-full"></div>
          <div className="h-80 bg-card rounded-3xl w-full"></div>
        </div>
      </div>
    );
  }

  if (!data || !data.cards) {
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl font-black mb-2">Analytics Not Available</h2>
        <p className="text-muted-foreground mb-6">Could not load analytics for this quiz. Please ensure it has attempts.</p>
        <Link to={`/quiz/my-quizzes/${id}`} className="btn-primary">Go Back</Link>
      </div>
    );
  }

  const { cards, charts } = data;
  
  // Format Data for Recharts
  const scoreDistData = charts.scoreDistribution || [];
  const perfOverTimeData = charts.performanceOverTime?.map(d => ({
    ...d,
    dateLabel: new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  })) || [];
  
  // For Question Accuracy (Bar Chart)
  const questionAccuracyData = charts.questionAccuracy?.map((q, idx) => ({
    name: `Q${idx + 1}`,
    fullText: q.questionText,
    accuracy: q.accuracy,
    difficulty: q.difficulty
  })) || [];

  // Count Difficulty levels for Pie Chart
  const difficultyCounts = { Easy: 0, Medium: 0, Hard: 0 };
  charts.questionAccuracy?.forEach(q => {
    if (difficultyCounts[q.difficulty] !== undefined) {
      difficultyCounts[q.difficulty]++;
    }
  });
  const difficultyPieData = [
    { name: 'Easy', value: difficultyCounts.Easy, color: '#10b981' }, // emerald-500
    { name: 'Medium', value: difficultyCounts.Medium, color: '#f59e0b' }, // amber-500
    { name: 'Hard', value: difficultyCounts.Hard, color: '#ef4444' } // red-500
  ].filter(d => d.value > 0);

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return m > 0 ? `${m}m ${s}s` : `${s}s`;
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card/90 backdrop-blur-md border border-border/50 rounded-xl p-3 shadow-xl">
          <p className="font-bold text-sm mb-1">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} className="text-xs font-medium" style={{ color: entry.color }}>
              {entry.name}: <span className="font-bold">{entry.value}</span>
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const QuestionTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-card/90 backdrop-blur-md border border-border/50 rounded-xl p-3 shadow-xl max-w-[250px]">
          <p className="font-bold text-sm mb-1 text-primary">{label}</p>
          <p className="text-xs text-muted-foreground mb-2 line-clamp-3">{data.fullText}</p>
          <p className="text-xs font-medium text-emerald-500">
            Accuracy: <span className="font-bold">{data.accuracy}%</span>
          </p>
          <p className="text-xs font-medium mt-1">
            Difficulty: <span className="font-bold">{data.difficulty}</span>
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-8">
      {/* Top Nav */}
      <div className="flex items-center gap-4">
        <Link to={`/quiz/my-quizzes/${id}`} className="p-2 rounded-xl bg-card hover:bg-muted/50 border border-border/50 transition-colors">
          <ArrowLeft size={20} className="text-muted-foreground" />
        </Link>
        <div className="flex flex-col">
          <span className="text-xs font-black uppercase tracking-widest text-primary">Instructor Dashboard</span>
          <h1 className="text-2xl font-black text-foreground">Advanced Analytics</h1>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
        <div className="bg-card/40 backdrop-blur-sm border border-border/30 rounded-3xl p-6 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform duration-500">
            <Users size={80} />
          </div>
          <p className="text-sm font-bold text-muted-foreground mb-2 flex items-center gap-2">
             Total Attempts
          </p>
          <p className="text-4xl font-black">{cards.totalAttempts}</p>
        </div>

        <div className="bg-card/40 backdrop-blur-sm border border-border/30 rounded-3xl p-6 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform duration-500 text-primary">
            <TrendingUp size={80} />
          </div>
          <p className="text-sm font-bold text-primary mb-2 flex items-center gap-2">
             Average Score
          </p>
          <p className="text-4xl font-black">{cards.averageScore}%</p>
        </div>

        <div className="bg-card/40 backdrop-blur-sm border border-border/30 rounded-3xl p-6 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform duration-500 text-amber-500">
            <Trophy size={80} />
          </div>
          <p className="text-sm font-bold text-amber-500 mb-2 flex items-center gap-2">
             Highest Score
          </p>
          <p className="text-4xl font-black">{cards.highestScore}%</p>
        </div>

        <div className="bg-card/40 backdrop-blur-sm border border-border/30 rounded-3xl p-6 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform duration-500 text-emerald-500">
            <CheckCircle size={80} />
          </div>
          <p className="text-sm font-bold text-emerald-500 mb-2 flex items-center gap-2">
             Completion Rate
          </p>
          <p className="text-4xl font-black">{cards.completionRate}%</p>
        </div>

        <div className="bg-card/40 backdrop-blur-sm border border-border/30 rounded-3xl p-6 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform duration-500 text-blue-500">
            <Clock size={80} />
          </div>
          <p className="text-sm font-bold text-blue-500 mb-2 flex items-center gap-2">
             Avg. Time
          </p>
          <p className="text-4xl font-black">{formatTime(cards.averageCompletionTime)}</p>
        </div>

        <div className="bg-card/40 backdrop-blur-sm border border-border/30 rounded-3xl p-6 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform duration-500 text-purple-500">
            <Target size={80} />
          </div>
          <p className="text-sm font-bold text-purple-500 mb-2 flex items-center gap-2">
             Questions Answered
          </p>
          <p className="text-4xl font-black">{cards.questionsAnswered}</p>
        </div>
      </div>

      {/* Charts Section 1 */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Score Distribution */}
        <div className="bg-card/40 backdrop-blur-sm border border-border/30 rounded-[2rem] p-6 shadow-xl shadow-black/5">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <BarChart2 size={20} />
            </div>
            <div>
              <h3 className="text-lg font-black tracking-tight">Score Distribution</h3>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Number of attempts per range</p>
            </div>
          </div>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={scoreDistData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                <XAxis dataKey="range" tick={{ fontSize: 12, fill: '#888' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: '#888' }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
                <Bar dataKey="count" name="Attempts" radius={[6, 6, 0, 0]}>
                  {scoreDistData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Performance Over Time */}
        <div className="bg-card/40 backdrop-blur-sm border border-border/30 rounded-[2rem] p-6 shadow-xl shadow-black/5">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
              <Activity size={20} />
            </div>
            <div>
              <h3 className="text-lg font-black tracking-tight">Performance Trend</h3>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Average score over time</p>
            </div>
          </div>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={perfOverTimeData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                <XAxis dataKey="dateLabel" tick={{ fontSize: 12, fill: '#888' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: '#888' }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="averageScore" name="Avg Score" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorScore)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Charts Section 2 */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Question Accuracy */}
        <div className="lg:col-span-2 bg-card/40 backdrop-blur-sm border border-border/30 rounded-[2rem] p-6 shadow-xl shadow-black/5">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-500">
              <Target size={20} />
            </div>
            <div>
              <h3 className="text-lg font-black tracking-tight">Question Accuracy</h3>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Correct answer % per question</p>
            </div>
          </div>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={questionAccuracyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#888' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: '#888' }} axisLine={false} tickLine={false} domain={[0, 100]} />
                <Tooltip content={<QuestionTooltip />} cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
                <Bar dataKey="accuracy" name="Accuracy %" radius={[4, 4, 0, 0]}>
                  {questionAccuracyData.map((entry, index) => {
                    // Color based on accuracy
                    let color = '#f59e0b'; // Medium (amber)
                    if (entry.accuracy > 70) color = '#10b981'; // Easy (emerald)
                    if (entry.accuracy < 40) color = '#ef4444'; // Hard (red)
                    return <Cell key={`cell-${index}`} fill={color} />;
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Difficulty Breakdown */}
        <div className="bg-card/40 backdrop-blur-sm border border-border/30 rounded-[2rem] p-6 shadow-xl shadow-black/5 flex flex-col">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-500">
              <BarChart2 size={20} />
            </div>
            <div>
              <h3 className="text-lg font-black tracking-tight">Difficulty</h3>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Calculated composition</p>
            </div>
          </div>
          <div className="flex-1 flex flex-col items-center justify-center relative min-h-[250px]">
            {difficultyPieData.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={difficultyPieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                    stroke="none"
                  >
                    {difficultyPieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
               <p className="text-muted-foreground font-medium text-sm text-center">Not enough data to calculate difficulty.</p>
            )}
            
            {/* Custom Legend */}
            {difficultyPieData.length > 0 && (
              <div className="flex justify-center gap-4 mt-2">
                {difficultyPieData.map(entry => (
                  <div key={entry.name} className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }}></div>
                    <span className="text-xs font-bold text-muted-foreground">{entry.name}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuizAnalytics;
