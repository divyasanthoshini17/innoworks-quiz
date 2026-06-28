import React, { useState } from 'react';
import { BookOpen, PlusCircle, History, Menu, X, User, ChevronDown, Plus, List } from 'lucide-react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';

const QuizSidebar = ({ mobileOpen, setMobileOpen }) => {
  const { user } = useSelector((state) => state.auth);
  const navigate = useNavigate();
  const location = useLocation();
  const [customOpen, setCustomOpen] = useState(false);

  // Determine active tab based on current path
  const getActiveTab = () => {
    const path = location.pathname;
    if (path.startsWith('/quiz/create')) return 'create';
    if (path.startsWith('/quiz/my-quizzes')) return 'my';
    if (path.startsWith('/quiz/attempts')) return 'attempts';
    if (path.startsWith('/quiz')) return 'quiz';
    return '';
  };
  const activeTab = getActiveTab();

  const handleNav = (path, tab) => {
    setMobileOpen(false);
    navigate(path);
  };

  const menuItems = [
    { id: 'quiz', label: 'Quiz', icon: BookOpen, path: '/quiz' },
    // Custom Quiz will be an expandable parent, not a direct navigation item
    { id: 'attempts', label: 'Attempts', icon: History, path: '/quiz/attempts' },
  ];

  const renderItem = (item) => {
    const isActive = activeTab === item.id;
    return (
      <button
        key={item.id}
        onClick={() => handleNav(item.path, item.id)}
        className={`flex items-center gap-3.5 px-4 py-3 rounded-2xl text-sm font-bold transition-all duration-300 relative group overflow-hidden ${
          isActive
            ? 'text-primary'
            : 'text-muted-foreground hover:bg-muted/30 hover:text-foreground'
        }`}
      >
        {isActive && (
          <motion.div
            layoutId="active-indicator"
            className="absolute inset-0 bg-primary/5 border border-primary/20 rounded-2xl shadow-[inset_0_0_12px_rgba(99,102,241,0.08)] z-0"
            transition={{ type: 'spring', stiffness: 380, damping: 30 }}
          />
        )}
        {isActive && (
          <div className="absolute left-0 top-3 bottom-3 w-1 bg-primary rounded-full shadow-[0_0_8px_rgba(99,102,241,0.5)]" />
        )}
        <item.icon size={18} className="relative z-10" />
        <span className="relative z-10">{item.label}</span>
      </button>
    );
  };

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:block w-[240px] fixed top-[69px] bottom-0 left-0 z-20">
        <div className="flex flex-col h-full bg-card/10 backdrop-blur-2xl border-r border-border/40 p-4 justify-between">
          <div className="space-y-6">
            {/* Sidebar Header */}
            <div className="px-3 py-2">
              <p className="text-xs font-black uppercase tracking-[0.2em] text-primary/80">QUIZ MODULE</p>
              <h2 className="text-xl font-black text-foreground mt-0.5 tracking-tight">Navigation Center</h2>
            </div>
            {/* Menu Items */}
            <div className="flex flex-col gap-1">
              {menuItems.map(renderItem)}
              {/* Custom Quiz expandable */}
              <div className="flex flex-col gap-1">
                <button
                  onClick={() => setCustomOpen(!customOpen)}
                  className={`flex items-center justify-between px-4 py-3 rounded-2xl text-sm font-bold transition-all duration-300 relative group overflow-hidden ${
                    (activeTab === 'create' || activeTab === 'my')
                      ? 'text-primary'
                      : 'text-muted-foreground hover:bg-muted/30 hover:text-foreground'
                  }`}
                >
                  <div className="flex items-center gap-3.5 relative z-10">
                    {((activeTab === 'create' || activeTab === 'my')) && (
                      <motion.div
                        layoutId="active-indicator"
                        className="absolute -inset-x-4 -inset-y-3 bg-primary/5 border border-primary/20 rounded-2xl shadow-[inset_0_0_12px_rgba(99,102,241,0.08)] z-0"
                        transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                      />
                    )}
                    {((activeTab === 'create' || activeTab === 'my')) && (
                      <div className="absolute -left-4 top-0 bottom-0 w-1 bg-primary rounded-full shadow-[0_0_8px_rgba(99,102,241,0.5)]" />
                    )}
                    <PlusCircle size={18} />
                    <span>Custom Quiz</span>
                  </div>
                  <ChevronDown size={14} className={`relative z-10 transition-transform duration-300 ${customOpen ? 'rotate-180' : ''}`} />
                </button>
                {/* Submenu items */}
                <AnimatePresence>
                  {customOpen && (
                    <motion.div 
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="ml-6 flex flex-col gap-1 overflow-hidden border-l border-border/40 pl-2 mt-1"
                    >
                      <button
                        onClick={() => handleNav('/quiz/create', 'create')}
                        className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 ${
                          activeTab === 'create' 
                            ? 'bg-primary text-white shadow-md shadow-primary/20' 
                            : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                        }`}
                      >
                        <Plus size={14} /> Create Quiz
                      </button>
                      <button
                        onClick={() => handleNav('/quiz/my-quizzes', 'my')}
                        className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 ${
                          activeTab === 'my' 
                            ? 'bg-primary text-white shadow-md shadow-primary/20' 
                            : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                        }`}
                      >
                        <List size={14} /> My Quizzes
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
          {/* User profile at the bottom */}
          <div className="border-t border-border/40 pt-4 px-2">
            <Link
              to={`/profile/${user?.username}`}
              className="flex items-center gap-3 p-2 rounded-2xl hover:bg-muted/30 transition-colors group"
            >
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-primary to-blue-400 p-[2px] shadow-sm">
                <div className="w-full h-full rounded-full bg-background flex items-center justify-center overflow-hidden">
                  {user?.avatarUrl ? (
                    <img src={user.avatarUrl} alt={user.username} className="w-full h-full object-cover" />
                  ) : (
                    <User size={18} className="text-primary" />
                  )}
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-bold text-foreground truncate group-hover:text-primary transition-colors">
                  {user?.username || 'DevUser'}
                </h4>
                <p className="text-[10px] text-muted-foreground font-black uppercase tracking-wider">
                  View Profile
                </p>
              </div>
            </Link>
          </div>
        </div>
      </aside>

      {/* Mobile hamburger button */}
      <div className="lg:hidden fixed bottom-6 right-6 z-40">
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="w-12 h-12 rounded-full bg-primary text-white shadow-lg shadow-primary/20 flex items-center justify-center focus:outline-none hover:scale-105 active:scale-95 transition-transform"
        >
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              className="lg:hidden fixed inset-0 bg-black z-30"
            />
            {/* Drawer */}
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'tween', duration: 0.3 }}
              className="lg:hidden fixed top-[69px] bottom-0 left-0 w-[240px] z-30"
            >
              {/* Reuse the same sidebar content */}
              <div className="flex flex-col h-full bg-card/10 backdrop-blur-2xl border-r border-border/40 p-4 justify-between">
                {/* Same content as desktop, duplicated for brevity */}
                <div className="space-y-6">
                  <div className="px-3 py-2">
                    <p className="text-xs font-black uppercase tracking-[0.2em] text-primary/80">QUIZ MODULE</p>
                    <h2 className="text-xl font-black text-foreground mt-0.5 tracking-tight">Navigation Center</h2>
                  </div>
                  <div className="flex flex-col gap-1">
                    {menuItems.map(renderItem)}
                    <div className="flex flex-col gap-1">
                      <button
                        onClick={() => setCustomOpen(!customOpen)}
                        className={`flex items-center justify-between px-4 py-3 rounded-2xl text-sm font-bold transition-all duration-300 relative group overflow-hidden ${
                          (activeTab === 'create' || activeTab === 'my')
                            ? 'text-primary'
                            : 'text-muted-foreground hover:bg-muted/30 hover:text-foreground'
                        }`}
                      >
                        <div className="flex items-center gap-3.5 relative z-10">
                          {((activeTab === 'create' || activeTab === 'my')) && (
                            <motion.div
                              layoutId="active-indicator-mobile"
                              className="absolute -inset-x-4 -inset-y-3 bg-primary/5 border border-primary/20 rounded-2xl shadow-[inset_0_0_12px_rgba(99,102,241,0.08)] z-0"
                              transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                            />
                          )}
                          {((activeTab === 'create' || activeTab === 'my')) && (
                            <div className="absolute -left-4 top-0 bottom-0 w-1 bg-primary rounded-full shadow-[0_0_8px_rgba(99,102,241,0.5)]" />
                          )}
                          <PlusCircle size={18} />
                          <span>Custom Quiz</span>
                        </div>
                        <ChevronDown size={14} className={`relative z-10 transition-transform duration-300 ${customOpen ? 'rotate-180' : ''}`} />
                      </button>
                      
                      <AnimatePresence>
                        {customOpen && (
                          <motion.div 
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="ml-6 flex flex-col gap-1 overflow-hidden border-l border-border/40 pl-2 mt-1"
                          >
                            <button
                              onClick={() => handleNav('/quiz/create', 'create')}
                              className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 ${
                                activeTab === 'create' 
                                  ? 'bg-primary text-white shadow-md shadow-primary/20' 
                                  : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                              }`}
                            >
                              <Plus size={14} /> Create Quiz
                            </button>
                            <button
                              onClick={() => handleNav('/quiz/my-quizzes', 'my')}
                              className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 ${
                                activeTab === 'my' 
                                  ? 'bg-primary text-white shadow-md shadow-primary/20' 
                                  : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                              }`}
                            >
                              <List size={14} /> My Quizzes
                            </button>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                </div>
                <div className="border-t border-border/40 pt-4 px-2">
                  <Link
                    to={`/profile/${user?.username}`}
                    className="flex items-center gap-3 p-2 rounded-2xl hover:bg-muted/30 transition-colors group"
                  >
                    <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-primary to-blue-400 p-[2px] shadow-sm">
                      <div className="w-full h-full rounded-full bg-background flex items-center justify-center overflow-hidden">
                        {user?.avatarUrl ? (
                          <img src={user.avatarUrl} alt={user.username} className="w-full h-full object-cover" />
                        ) : (
                          <User size={18} className="text-primary" />
                        )}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-bold text-foreground truncate group-hover:text-primary transition-colors">
                        {user?.username || 'DevUser'}
                      </h4>
                      <p className="text-[10px] text-muted-foreground font-black uppercase tracking-wider">
                        View Profile
                      </p>
                    </div>
                  </Link>
                </div>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default QuizSidebar;
