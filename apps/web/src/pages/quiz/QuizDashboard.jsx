import React, { useState } from 'react';
import { Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import QuizSidebar from '../../components/quiz/QuizSidebar';
import QuizCategories from './QuizCategories';
import CustomQuiz from './CustomQuiz';
import MyQuizzes from './MyQuizzes';
import Attempts from './Attempts';
import QuizDetails from './QuizDetails';
import QuizAttemptsList from './QuizAttemptsList';
import QuizAnalytics from './QuizAnalytics';
import AttemptDetails from './AttemptDetails';
import { motion, AnimatePresence } from 'framer-motion';

const QuizDashboard = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const getActiveTab = () => {
    const path = location.pathname;
    if (path.startsWith('/quiz/create') || path.startsWith('/quiz/edit')) return 'create';
    if (path.startsWith('/quiz/my-quizzes')) return 'my';
    if (path.startsWith('/quiz/attempts')) return 'attempts';
    return 'quiz';
  };
  
  const activeTab = getActiveTab();

  const handleTabChange = (tab) => {
    const routeMap = {
      quiz: '/quiz',
      create: '/quiz/create',
      my: '/quiz/my-quizzes',
      attempts: '/quiz/attempts',
    };
    navigate(routeMap[tab] || '/quiz');
    setMobileSidebarOpen(false);
  };

  return (
    <div className="flex min-h-[calc(100vh-69px)] bg-background relative overflow-hidden">
      <QuizSidebar
        activeTab={activeTab}
        setActiveTab={handleTabChange}
        mobileOpen={mobileSidebarOpen}
        setMobileOpen={setMobileSidebarOpen}
      />
      <main className="flex-1 lg:pl-[240px] transition-all duration-300">
        <div className="max-w-7xl mx-auto px-6 py-8 md:py-10">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.25, ease: 'easeInOut' }}
            >
              <Routes>
                <Route index element={<QuizCategories />} />
                <Route path="create" element={<CustomQuiz />} />
                <Route path="edit/:id" element={<CustomQuiz />} />
                <Route path="my-quizzes" element={<MyQuizzes />} />
                <Route path="my-quizzes/:id" element={<QuizDetails />} />
                <Route path="my-quizzes/:id/attempts" element={<QuizAttemptsList />} />
                <Route path="my-quizzes/:id/analytics" element={<QuizAnalytics />} />
                <Route path="attempts" element={<Attempts />} />
                <Route path="attempts/:id" element={<AttemptDetails />} />
                <Route path="my-quizzes/:quizId/attempts/:id" element={<AttemptDetails />} />
              </Routes>
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
};

export default QuizDashboard;
