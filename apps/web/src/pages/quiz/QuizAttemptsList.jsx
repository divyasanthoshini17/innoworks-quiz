import React, { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  Search, Filter, ArrowLeft, Download, CheckCircle, 
  XCircle, Clock, ChevronDown, ChevronUp, User
} from 'lucide-react';
import api from '../../lib/api';

const QuizAttemptsList = () => {
  const { id } = useParams();
  const [attempts, setAttempts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ totalPages: 1, currentPage: 1, totalCount: 0 });
  
  // Controls
  const [status, setStatus] = useState('all');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState('desc');

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 500);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    fetchAttempts(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, debouncedSearch, sortBy, sortOrder]);

  const fetchAttempts = async (page = 1) => {
    setLoading(true);
    try {
      const res = await api.get(`/my-quizzes/${id}/attempts?page=${page}&limit=10&status=${status}&search=${debouncedSearch}&sortBy=${sortBy}&sortOrder=${sortOrder}`);
      setAttempts(res.data.attempts || []);
      setPagination(res.data.pagination || { totalPages: 1, currentPage: 1, totalCount: 0 });
    } catch (err) {
      console.error('Failed to load quiz attempts', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      fetchAttempts(newPage);
    }
  };

  const toggleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  const exportCSV = async () => {
    try {
      // Fetch up to 1000 records for export
      const res = await api.get(`/my-quizzes/${id}/attempts?page=1&limit=1000&status=${status}&search=${debouncedSearch}&sortBy=${sortBy}&sortOrder=${sortOrder}`);
      const exportData = res.data.attempts;
      
      if (!exportData || exportData.length === 0) {
        alert("No data to export");
        return;
      }

      const headers = ['Name', 'Username', 'Email', 'Status', 'Score', 'Correct Answers', 'Time Taken (s)', 'Date'];
      const csvRows = [headers.join(',')];

      exportData.forEach(attempt => {
        const u = attempt.user || {};
        const name = `"${(u.username || 'Anonymous').replace(/"/g, '""')}"`;
        const username = `"${(u.username || 'N/A').replace(/"/g, '""')}"`;
        const email = `"${(u.email || 'N/A').replace(/"/g, '""')}"`;
        const attemptStatus = attempt.passed ? 'Passed' : 'Failed';
        const score = attempt.score;
        const correct = attempt.correctAnswers;
        const time = attempt.timeTaken;
        const date = `"${new Date(attempt.createdAt).toLocaleString()}"`;

        csvRows.push([name, username, email, attemptStatus, score, correct, time, date].join(','));
      });

      const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.setAttribute('hidden', '');
      a.setAttribute('href', url);
      a.setAttribute('download', `quiz_attempts_${id}.csv`);
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (err) {
      alert("Failed to export CSV");
    }
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return m > 0 ? `${m}m ${s}s` : `${s}s`;
  };

  return (
    <div className="space-y-8">
      {/* Top Nav */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link to={`/quiz/my-quizzes/${id}`} className="p-2 rounded-xl bg-card hover:bg-muted/50 border border-border/50 transition-colors">
            <ArrowLeft size={20} className="text-muted-foreground" />
          </Link>
          <div className="flex flex-col">
            <span className="text-xs font-black uppercase tracking-widest text-primary">Participant Logs</span>
            <h1 className="text-2xl font-black text-foreground">Quiz Attempts</h1>
          </div>
        </div>
        <button onClick={exportCSV} className="btn-secondary flex items-center gap-2 text-sm bg-card/50">
          <Download size={16} /> Export CSV
        </button>
      </div>

      {/* Controls */}
      <div className="flex flex-col lg:flex-row justify-between gap-4 bg-card/30 p-2 rounded-2xl border border-border/30 backdrop-blur-md">
        {/* Filters */}
        <div className="flex overflow-x-auto hide-scrollbar gap-1 p-1">
          {['all', 'completed', 'passed', 'failed', 'inProgress'].map((f) => {
            const labels = {
              all: 'All Attempts',
              completed: 'Completed',
              passed: 'Passed',
              failed: 'Failed',
              inProgress: 'In Progress'
            };
            return (
              <button
                key={f}
                onClick={() => setStatus(f)}
                className={`px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-all ${
                  status === f 
                    ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20' 
                    : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                }`}
              >
                {labels[f]}
              </button>
            );
          })}
        </div>

        {/* Search */}
        <div className="relative flex-1 max-w-md w-full shrink-0">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input 
            type="text" 
            placeholder="Search by name, username, or email..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-background border border-border/50 rounded-xl py-2.5 pl-11 pr-4 text-sm focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all placeholder:text-muted-foreground/50 font-medium"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-card/40 backdrop-blur-xl border border-border/30 rounded-[2rem] overflow-hidden shadow-xl shadow-black/5">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-muted/30 border-b border-border/50 text-xs font-black uppercase tracking-wider text-muted-foreground">
                <th className="p-5 font-bold">Participant</th>
                <th className="p-5 font-bold">Status</th>
                <th className="p-5 font-bold cursor-pointer hover:text-foreground group" onClick={() => toggleSort('score')}>
                  <div className="flex items-center gap-1">Score {sortBy === 'score' && (sortOrder === 'asc' ? <ChevronUp size={14}/> : <ChevronDown size={14}/>)}</div>
                </th>
                <th className="p-5 font-bold cursor-pointer hover:text-foreground group" onClick={() => toggleSort('time')}>
                  <div className="flex items-center gap-1">Time Taken {sortBy === 'time' && (sortOrder === 'asc' ? <ChevronUp size={14}/> : <ChevronDown size={14}/>)}</div>
                </th>
                <th className="p-5 font-bold cursor-pointer hover:text-foreground group" onClick={() => toggleSort('date')}>
                  <div className="flex items-center gap-1">Date {sortBy === 'date' && (sortOrder === 'asc' ? <ChevronUp size={14}/> : <ChevronDown size={14}/>)}</div>
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-border/20">
                    <td className="p-5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-muted/50 animate-pulse"></div>
                        <div className="space-y-2">
                          <div className="h-4 w-24 bg-muted/50 animate-pulse rounded"></div>
                          <div className="h-3 w-32 bg-muted/50 animate-pulse rounded"></div>
                        </div>
                      </div>
                    </td>
                    <td className="p-5"><div className="h-6 w-16 bg-muted/50 animate-pulse rounded-lg"></div></td>
                    <td className="p-5"><div className="h-4 w-12 bg-muted/50 animate-pulse rounded"></div></td>
                    <td className="p-5"><div className="h-4 w-16 bg-muted/50 animate-pulse rounded"></div></td>
                    <td className="p-5"><div className="h-4 w-24 bg-muted/50 animate-pulse rounded"></div></td>
                  </tr>
                ))
              ) : attempts.length === 0 ? (
                <tr>
                  <td colSpan="5" className="p-12 text-center text-muted-foreground">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-16 h-16 rounded-2xl bg-muted/30 flex items-center justify-center text-muted-foreground">
                        <Filter size={32} />
                      </div>
                      <p className="font-medium text-base">No attempts found</p>
                      <p className="text-sm">Try adjusting your search or filters.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                attempts.map(attempt => (
                  <tr 
                    key={attempt._id} 
                    className="border-b border-border/20 hover:bg-muted/20 transition-colors group cursor-pointer"
                    onClick={() => window.open(`/quiz/my-quizzes/${id}/attempts/${attempt._id}`, '_blank')}
                  >
                    <td className="p-5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-primary to-blue-400 p-[2px] shrink-0">
                          <div className="w-full h-full rounded-full bg-background flex items-center justify-center overflow-hidden">
                            {attempt.user?.avatarUrl ? (
                              <img src={attempt.user.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                            ) : (
                              <User size={16} className="text-primary" />
                            )}
                          </div>
                        </div>
                        <div>
                          <p className="text-sm font-bold text-foreground line-clamp-1">{attempt.user?.username || 'Anonymous'}</p>
                          {attempt.user?.email && (
                            <p className="text-xs text-muted-foreground line-clamp-1">{attempt.user.email}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="p-5">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-black uppercase tracking-wider rounded-lg ${
                        attempt.passed 
                          ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' 
                          : 'bg-red-500/10 text-red-500 border border-red-500/20'
                      }`}>
                        {attempt.passed ? <CheckCircle size={12}/> : <XCircle size={12}/>}
                        {attempt.passed ? 'Passed' : 'Failed'}
                      </span>
                    </td>
                    <td className="p-5 font-bold text-foreground">
                      {attempt.score}%
                      <div className="text-[10px] text-muted-foreground font-medium uppercase mt-0.5">{attempt.correctAnswers} Correct</div>
                    </td>
                    <td className="p-5 font-medium text-muted-foreground flex items-center gap-1.5 mt-2">
                      <Clock size={14} className="text-primary/70" />
                      {formatTime(attempt.timeTaken)}
                    </td>
                    <td className="p-5 text-sm font-medium text-muted-foreground">
                      {new Date(attempt.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      <div className="text-[10px] uppercase tracking-wider mt-0.5">
                        {new Date(attempt.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex justify-between items-center bg-card/20 p-4 rounded-2xl border border-border/30">
          <p className="text-sm text-muted-foreground font-medium">
            Showing <span className="text-foreground font-bold">{attempts.length}</span> of <span className="text-foreground font-bold">{pagination.totalCount}</span> attempts
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => handlePageChange(pagination.currentPage - 1)}
              disabled={pagination.currentPage === 1}
              className="px-3 py-1.5 rounded-lg border border-border/50 text-sm font-bold hover:bg-muted/50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Prev
            </button>
            <div className="flex gap-1">
              {Array.from({ length: pagination.totalPages }).map((_, i) => (
                <button
                  key={i}
                  onClick={() => handlePageChange(i + 1)}
                  className={`w-8 h-8 rounded-lg text-sm font-bold transition-all flex items-center justify-center ${
                    pagination.currentPage === i + 1
                      ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20'
                      : 'hover:bg-muted/50 text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {i + 1}
                </button>
              ))}
            </div>
            <button
              onClick={() => handlePageChange(pagination.currentPage + 1)}
              disabled={pagination.currentPage === pagination.totalPages}
              className="px-3 py-1.5 rounded-lg border border-border/50 text-sm font-bold hover:bg-muted/50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuizAttemptsList;
