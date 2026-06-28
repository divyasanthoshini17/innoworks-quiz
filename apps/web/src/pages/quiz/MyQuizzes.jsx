import React, { useEffect, useState, useRef } from 'react';
import { useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, Filter, Plus, MoreVertical, Copy, Edit2, Play, Share2, Trash2, 
  Clock, CheckCircle, Users, CheckSquare, Eye, EyeOff, LayoutDashboard,
  LayoutGrid, List as ListIcon, ChevronDown, Zap, Shield, BookOpen, Code, Trophy
} from 'lucide-react';
import api from '../../lib/api';

const CATEGORY_COLORS = ['text-blue-500 bg-blue-500/10', 'text-emerald-500 bg-emerald-500/10', 'text-purple-500 bg-purple-500/10', 'text-amber-500 bg-amber-500/10', 'text-rose-500 bg-rose-500/10'];

const getIconForQuiz = (title) => {
  const hash = title.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const colorClass = CATEGORY_COLORS[hash % CATEGORY_COLORS.length];
  const initials = title.substring(0, 2).toUpperCase();
  return { initials, colorClass };
};

const MyQuizzes = () => {
  const { user } = useSelector(state => state.auth);
  const navigate = useNavigate();
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ totalPages: 1, currentPage: 1 });
  
  // Filters & Search
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [sort, setSort] = useState('newest');
  const [viewMode, setViewMode] = useState('grid');
  
  // Dropdown state
  const [openDropdownId, setOpenDropdownId] = useState(null);
  const [isSortOpen, setIsSortOpen] = useState(false);
  const dropdownRef = useRef(null);
  const sortRef = useRef(null);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 500);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    fetchQuizzes(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter, debouncedSearch, sort]);

  // Click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpenDropdownId(null);
      }
      if (sortRef.current && !sortRef.current.contains(e.target)) {
        setIsSortOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchQuizzes = async (page = 1) => {
    setLoading(true);
    try {
      const res = await api.get(`/my-quizzes?page=${page}&limit=6&filter=${filter}&search=${debouncedSearch}&sort=${sort}`);
      setQuizzes(res.data.quizzes || []);
      setPagination(res.data.pagination || { totalPages: 1, currentPage: 1 });
    } catch (err) {
      console.error('Failed to load my quizzes', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      fetchQuizzes(newPage);
    }
  };

  const handleCopyLink = (slug, e) => {
    e.preventDefault();
    e.stopPropagation();
    const url = `${window.location.origin}/quiz/play/${slug}`;
    navigator.clipboard.writeText(url);
    alert('Link copied to clipboard!');
    setOpenDropdownId(null);
  };

  const handleDelete = async (id, e) => {
    e.preventDefault();
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this quiz?')) {
      try {
        await api.delete(`/quizzes/${id}`);
        fetchQuizzes(pagination.currentPage);
      } catch (err) {
        alert('Failed to delete quiz.');
      }
    }
    setOpenDropdownId(null);
  };

  const handleMenuClick = (id, e) => {
    e.preventDefault();
    e.stopPropagation();
    setOpenDropdownId(openDropdownId === id ? null : id);
  };

  return (
    <div className="space-y-8">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-4xl font-black tracking-tight text-foreground flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-inner">
              <LayoutDashboard size={24} />
            </div>
            Instructor Dashboard
          </h1>
          <p className="text-muted-foreground mt-2 text-sm font-medium max-w-lg">Manage, analyze, and refine your custom quizzes with our premium authoring tools.</p>
        </div>
        <Link to="/quiz/create" className="group relative inline-flex items-center justify-center px-6 py-3 text-sm font-black text-white transition-all duration-300 ease-in-out rounded-2xl bg-primary hover:bg-primary/90 shadow-[0_10px_20px_rgba(99,102,241,0.2)] hover:shadow-[0_15px_30px_rgba(99,102,241,0.3)] hover:-translate-y-0.5 overflow-hidden ring-1 ring-primary/50">
          <div className="absolute inset-0 w-full h-full bg-gradient-to-tr from-white/0 via-white/10 to-white/0 -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]" />
          <Plus size={18} className="mr-2.5 transition-transform duration-300 group-hover:scale-110" /> 
          <span className="tracking-wide uppercase">Create Quiz</span>
        </Link>
      </div>

      <div className="flex flex-col xl:flex-row justify-between gap-4 bg-card/40 p-3 rounded-[2rem] border border-border/40 backdrop-blur-xl shadow-lg shadow-black/5">
        {/* Filter Tabs */}
        <div className="flex overflow-x-auto hide-scrollbar gap-2 p-1.5 bg-background/50 rounded-2xl border border-border/50">
          {['all', 'public', 'private', 'drafts'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-5 py-2.5 rounded-xl text-sm font-bold capitalize whitespace-nowrap transition-all duration-300 ${
                filter === f 
                  ? 'bg-primary text-white shadow-lg shadow-primary/30' 
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row gap-4 flex-1 xl:justify-end">
          {/* Search */}
          <div className="relative flex-1 max-w-md w-full">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input 
              type="text" 
              placeholder="Search quizzes..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-full bg-background/80 border border-border/50 rounded-2xl py-3 pl-11 pr-4 text-sm focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-muted-foreground/50 font-medium shadow-sm"
            />
          </div>

          <div className="flex gap-2">
            {/* Sort Dropdown */}
            <div className="relative" ref={sortRef}>
              <button 
                onClick={() => setIsSortOpen(!isSortOpen)}
                className="h-full px-4 py-3 bg-background/80 border border-border/50 rounded-2xl text-sm font-bold flex items-center gap-2 hover:bg-muted/50 transition-colors shadow-sm"
              >
                {sort === 'newest' ? 'Newest First' : sort === 'oldest' ? 'Oldest First' : 'Most Attempts'}
                <ChevronDown size={16} className={`transition-transform duration-300 ${isSortOpen ? 'rotate-180' : ''}`} />
              </button>
              <AnimatePresence>
                {isSortOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute right-0 top-full mt-2 w-48 bg-card border border-border/50 rounded-2xl shadow-xl overflow-hidden z-20 backdrop-blur-3xl"
                  >
                    <div className="p-1.5 flex flex-col gap-1">
                      {['newest', 'oldest', 'most-attempts'].map(s => (
                        <button
                          key={s}
                          onClick={() => { setSort(s); setIsSortOpen(false); }}
                          className={`px-3 py-2 text-sm font-semibold rounded-xl text-left transition-colors ${sort === s ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}
                        >
                          {s === 'newest' ? 'Newest First' : s === 'oldest' ? 'Oldest First' : 'Most Attempts'}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* View Toggle */}
            <div className="flex bg-background/80 border border-border/50 rounded-2xl p-1 shadow-sm">
              <button 
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-xl transition-all ${viewMode === 'grid' ? 'bg-primary/10 text-primary shadow-sm' : 'text-muted-foreground hover:text-foreground hover:bg-muted'}`}
              >
                <LayoutGrid size={18} />
              </button>
              <button 
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-xl transition-all ${viewMode === 'list' ? 'bg-primary/10 text-primary shadow-sm' : 'text-muted-foreground hover:text-foreground hover:bg-muted'}`}
              >
                <ListIcon size={18} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className={viewMode === 'grid' ? "grid gap-6 md:grid-cols-2 xl:grid-cols-3" : "flex flex-col gap-4"}>
          {[1,2,3,4,5,6].map(n => (
            <div key={n} className={`bg-card/20 rounded-3xl p-6 border border-border/30 animate-pulse ${viewMode === 'grid' ? 'h-[320px]' : 'h-[160px]'}`}>
              <div className="h-12 w-12 bg-muted/50 rounded-2xl mb-4"></div>
              <div className="h-6 bg-muted/50 rounded-lg w-3/4 mb-4"></div>
              <div className="h-4 bg-muted/50 rounded-lg w-full mb-2"></div>
              <div className="h-4 bg-muted/50 rounded-lg w-5/6 mb-8"></div>
            </div>
          ))}
        </div>
      ) : quizzes.length === 0 ? (
        <div className="bg-card/20 border border-border/30 rounded-3xl p-12 text-center flex flex-col items-center justify-center min-h-[400px]">
          <div className="w-24 h-24 bg-primary/10 text-primary rounded-full flex items-center justify-center mb-6 shadow-inner">
            <LayoutDashboard size={48} />
          </div>
          <h3 className="text-3xl font-black mb-3 tracking-tight">No quizzes found</h3>
          <p className="text-muted-foreground mb-8 font-medium max-w-md">You haven't created any custom quizzes matching these criteria yet. Get started by building a new one.</p>
          <Link to="/quiz/create" className="btn-primary shadow-lg shadow-primary/20">
            Create New Quiz
          </Link>
        </div>
      ) : (
        <div className={viewMode === 'grid' ? "grid gap-5 md:grid-cols-2 xl:grid-cols-3" : "flex flex-col gap-4"}>
          {quizzes.map(quiz => {
            const { initials, colorClass } = getIconForQuiz(quiz.title);
            return (
            <div
              key={quiz._id}
              className={`group bg-card/40 hover:bg-card/80 backdrop-blur-xl border border-border/40 rounded-3xl p-5 hover:border-primary/50 transition-all duration-300 relative shadow-lg shadow-black/5 hover:shadow-2xl hover:shadow-primary/10 hover:-translate-y-1 flex ${viewMode === 'grid' ? 'flex-col' : 'flex-col md:flex-row items-center gap-5'}`}
            >
              <Link to={`/quiz/my-quizzes/${quiz._id}`} className={`flex-1 flex ${viewMode === 'grid' ? 'flex-col h-full' : 'flex-row items-center w-full gap-5'}`}>
                {/* Header: Icon & Badges */}
                <div className={`flex justify-between items-start ${viewMode === 'grid' ? 'mb-4 pr-8' : 'w-48 shrink-0'}`}>
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-sm font-black text-xl tracking-tight ${colorClass}`}>
                    {initials}
                  </div>
                  
                  {viewMode === 'grid' && (
                    <div className="absolute right-5 top-5 flex flex-col items-end gap-2">
                      {/* Menu (Absolute in grid) */}
                      <div className="relative z-20" ref={openDropdownId === quiz._id ? dropdownRef : null}>
                        <button 
                          onClick={(e) => handleMenuClick(quiz._id, e)}
                          className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors border border-transparent hover:border-border/50 bg-transparent"
                        >
                          <MoreVertical size={18} />
                        </button>
                        
                        <AnimatePresence>
                          {openDropdownId === quiz._id && (
                            <motion.div
                              initial={{ opacity: 0, scale: 0.95, y: -10 }}
                              animate={{ opacity: 1, scale: 1, y: 0 }}
                              exit={{ opacity: 0, scale: 0.95, y: -10 }}
                              transition={{ duration: 0.15 }}
                              className="absolute top-full right-0 mt-1 w-56 bg-card border border-border/50 rounded-2xl shadow-2xl overflow-hidden backdrop-blur-3xl"
                            >
                              <div className="p-1.5 flex flex-col">
                                <button onClick={(e) => handleCopyLink(quiz.slug, e)} className="flex items-center gap-3 px-3 py-2 text-sm font-semibold text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-xl transition-colors text-left w-full">
                                  <Copy size={15} /> Copy Link
                                </button>
                                <Link to={`/quiz/play/${quiz.slug}`} onClick={(e) => e.stopPropagation()} className="flex items-center gap-3 px-3 py-2 text-sm font-semibold text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-xl transition-colors text-left w-full">
                                  <Play size={15} /> Preview
                                </Link>
                                <Link to={`/quiz/edit/${quiz._id}`} onClick={(e) => e.stopPropagation()} className="flex items-center gap-3 px-3 py-2 text-sm font-semibold text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-xl transition-colors text-left w-full">
                                  <Edit2 size={15} /> Edit
                                </Link>
                                <div className="h-px bg-border/50 my-1 mx-2"></div>
                                <button onClick={(e) => handleDelete(quiz._id, e)} className="flex items-center gap-3 px-3 py-2 text-sm font-semibold text-red-500 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-colors text-left w-full">
                                  <Trash2 size={15} /> Delete
                                </button>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>

                      {quiz.isPublished ? (
                        <span className={`px-2.5 py-1 text-[9px] font-black uppercase tracking-wider rounded-lg flex items-center gap-1 shadow-sm ${
                          quiz.isPublic 
                            ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' 
                            : 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                        }`}>
                          {quiz.isPublic ? <Eye size={12}/> : <EyeOff size={12}/>}
                          {quiz.isPublic ? 'Public' : 'Private'}
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 text-[9px] font-black uppercase tracking-wider rounded-lg flex items-center gap-1 bg-muted/50 text-muted-foreground border border-border shadow-sm">
                          Draft
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Title & Description */}
                <div className={`${viewMode === 'grid' ? '' : 'flex-1 min-w-0'}`}>
                  {viewMode === 'list' && (
                    <div className="flex items-center gap-2 mb-2">
                      {quiz.isPublished ? (
                        <span className={`px-2 py-0.5 text-[9px] font-black uppercase tracking-wider rounded flex items-center gap-1 ${
                          quiz.isPublic 
                            ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' 
                            : 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                        }`}>
                          {quiz.isPublic ? <Eye size={10}/> : <EyeOff size={10}/>}
                          {quiz.isPublic ? 'Public' : 'Private'}
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 text-[9px] font-black uppercase tracking-wider rounded flex items-center gap-1 bg-muted/50 text-muted-foreground border border-border">
                          Draft
                        </span>
                      )}
                    </div>
                  )}
                  <h3 className="text-xl font-black text-foreground mb-1.5 line-clamp-1 group-hover:text-primary transition-colors pr-2">
                    {quiz.title}
                  </h3>
                  <p className={`text-xs text-muted-foreground line-clamp-2 ${viewMode === 'grid' ? 'mb-5 min-h-[34px]' : ''}`}>
                    {quiz.description || "No description provided."}
                  </p>
                </div>

                {/* Stats Grid */}
                <div className={`${viewMode === 'grid' ? 'mt-auto grid grid-cols-4 gap-2 mb-5' : 'flex gap-3 shrink-0'}`}>
                  <div className={`bg-background/50 rounded-xl flex flex-col justify-center items-center ${viewMode === 'grid' ? 'p-2 py-3' : 'p-2 w-20'}`}>
                    <span className="text-lg font-black leading-tight">{quiz.questionCount}</span>
                    <span className="text-[9px] text-muted-foreground font-bold uppercase tracking-wider mt-0.5">Q's</span>
                  </div>
                  <div className={`bg-background/50 rounded-xl flex flex-col justify-center items-center ${viewMode === 'grid' ? 'p-2 py-3' : 'p-2 w-20'}`}>
                    <span className="text-lg font-black leading-tight">{quiz.attemptsCount}</span>
                    <span className="text-[9px] text-muted-foreground font-bold uppercase tracking-wider mt-0.5">Plays</span>
                  </div>
                  {viewMode === 'grid' && (
                    <>
                      <div className="bg-background/50 rounded-xl flex flex-col justify-center items-center p-2 py-3">
                        <span className="text-lg font-black leading-tight">{quiz.timeLimit}m</span>
                        <span className="text-[9px] text-muted-foreground font-bold uppercase tracking-wider mt-0.5">Time</span>
                      </div>
                      <div className="bg-background/50 rounded-xl flex flex-col justify-center items-center p-2 py-3">
                        <span className="text-lg font-black leading-tight text-primary">{quiz.passingScore}%</span>
                        <span className="text-[9px] text-muted-foreground font-bold uppercase tracking-wider mt-0.5">Pass</span>
                      </div>
                    </>
                  )}
                </div>

                {/* Footer */}
                {viewMode === 'grid' && (
                  <div className="pt-4 border-t border-border/30 text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex justify-between items-center mt-auto">
                    <span>
                      {quiz.updatedAt && quiz.updatedAt !== quiz.createdAt 
                        ? `Updated ${new Date(quiz.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}` 
                        : `Created ${new Date(quiz.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`}
                    </span>
                    <span className="px-3 py-1.5 rounded-lg bg-primary/10 text-primary font-black group-hover:bg-primary group-hover:text-white transition-all flex items-center gap-1">Manage Quiz &rarr;</span>
                  </div>
                )}
              </Link>
              
              {/* Menu (Inline in list view) */}
              {viewMode === 'list' && (
                <div className="shrink-0 relative z-20" ref={openDropdownId === quiz._id ? dropdownRef : null}>
                  <button 
                    onClick={(e) => handleMenuClick(quiz._id, e)}
                    className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-xl transition-colors bg-background/50 border border-border/50 shadow-sm"
                  >
                    <MoreVertical size={20} />
                  </button>
                  
                  <AnimatePresence>
                    {openDropdownId === quiz._id && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: -10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -10 }}
                        transition={{ duration: 0.15 }}
                        className="absolute top-full right-0 mt-2 w-56 bg-card border border-border/50 rounded-2xl shadow-2xl overflow-hidden backdrop-blur-3xl"
                      >
                        <div className="p-1.5 flex flex-col">
                          <button onClick={(e) => handleCopyLink(quiz.slug, e)} className="flex items-center gap-3 px-3 py-2.5 text-sm font-semibold text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-xl transition-colors text-left w-full">
                            <Copy size={16} /> Copy Link
                          </button>
                          <Link to={`/quiz/play/${quiz.slug}`} onClick={(e) => e.stopPropagation()} className="flex items-center gap-3 px-3 py-2.5 text-sm font-semibold text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-xl transition-colors text-left w-full">
                            <Play size={16} /> Preview
                          </Link>
                          <Link to={`/quiz/edit/${quiz._id}`} onClick={(e) => e.stopPropagation()} className="flex items-center gap-3 px-3 py-2.5 text-sm font-semibold text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-xl transition-colors text-left w-full">
                            <Edit2 size={16} /> Edit
                          </Link>
                          <div className="h-px bg-border/50 my-1.5 mx-2"></div>
                          <button onClick={(e) => handleDelete(quiz._id, e)} className="flex items-center gap-3 px-3 py-2.5 text-sm font-semibold text-red-500 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-colors text-left w-full">
                            <Trash2 size={16} /> Delete
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}
            </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 mt-8">
          <button
            onClick={() => handlePageChange(pagination.currentPage - 1)}
            disabled={pagination.currentPage === 1}
            className="px-4 py-2 rounded-xl border border-border/50 text-sm font-bold hover:bg-muted/50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Prev
          </button>
          <div className="flex gap-1">
            {Array.from({ length: pagination.totalPages }).map((_, i) => (
              <button
                key={i}
                onClick={() => handlePageChange(i + 1)}
                className={`w-9 h-9 rounded-xl text-sm font-bold transition-all flex items-center justify-center ${
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
            className="px-4 py-2 rounded-xl border border-border/50 text-sm font-bold hover:bg-muted/50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default MyQuizzes;
