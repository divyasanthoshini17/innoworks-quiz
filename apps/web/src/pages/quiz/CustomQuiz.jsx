import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import CustomQuizForm from '../../components/quiz/CustomQuizForm';
import QuestionBuilder from '../../components/quiz/QuestionBuilder';
import { PlusCircle, Link as LinkIcon, Send, Copy, Check, MessageSquare, Compass, CheckCircle, Edit2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../lib/api';

const CustomQuiz = () => {
  const { id } = useParams(); // if id exists, we are in edit mode
  const navigate = useNavigate();
  const isEditMode = !!id;

  const [settings, setSettings] = useState({
    title: '',
    description: '',
    timeLimit: 15,
    passingScore: 60,
    isPublic: true
  });

  const [questions, setQuestions] = useState([
    {
      questionText: '',
      options: ['', '', '', ''],
      correctOptionIndex: 0
    }
  ]);

  const [isLoading, setIsLoading] = useState(false);
  const [initialFetchLoading, setInitialFetchLoading] = useState(isEditMode);
  const [createdQuiz, setCreatedQuiz] = useState(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [copied, setCopied] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Fetch quiz details if in edit mode
  useEffect(() => {
    if (isEditMode) {
      const fetchQuiz = async () => {
        try {
          const res = await api.get(`/my-quizzes/${id}`);
          const data = res.data.quiz;
          setSettings({
            title: data.title,
            description: data.description || '',
            timeLimit: data.timeLimit,
            passingScore: data.passingScore,
            isPublic: data.isPublic
          });
          setQuestions(data.questions);
        } catch (err) {
          console.error('Failed to fetch quiz for editing', err);
          setErrorMsg('Failed to load quiz data for editing.');
        } finally {
          setInitialFetchLoading(false);
        }
      };
      fetchQuiz();
    }
  }, [id, isEditMode]);

  const handleCopyLink = () => {
    if (!createdQuiz) return;
    const shareUrl = `${window.location.origin}/quiz/play/${createdQuiz.slug}`;
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShareWhatsApp = () => {
    if (!createdQuiz) return;
    const shareUrl = `${window.location.origin}/quiz/play/${createdQuiz.slug}`;
    const text = encodeURIComponent(`Hey! I ${isEditMode ? 'updated a' : 'created a new'} technical quiz "${createdQuiz.title}" on Innoworks. Test your skills here: ${shareUrl}`);
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  };

  const handleShareTelegram = () => {
    if (!createdQuiz) return;
    const shareUrl = `${window.location.origin}/quiz/play/${createdQuiz.slug}`;
    const text = encodeURIComponent(`Check out my quiz "${createdQuiz.title}" on Innoworks!`);
    window.open(`https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${text}`, '_blank');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    // Validations
    if (!settings.title.trim()) {
      setErrorMsg('Quiz title is required.');
      return;
    }

    // Question validation
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.questionText.trim()) {
        setErrorMsg(`Question ${i + 1} text cannot be empty.`);
        return;
      }
      for (let j = 0; j < q.options.length; j++) {
        if (!q.options[j].trim()) {
          setErrorMsg(`Question ${i + 1}, Option ${j + 1} cannot be empty.`);
          return;
        }
      }
    }

    setIsLoading(true);
    try {
      let response;
      if (isEditMode) {
        response = await api.put(`/quizzes/${id}`, {
          ...settings,
          questions
        });
      } else {
        response = await api.post('/quizzes', {
          ...settings,
          questions
        });
      }

      setCreatedQuiz(response.data);
      setShowShareModal(true);

      if (!isEditMode) {
        // Reset form states if we just created a new one
        setSettings({
          title: '',
          description: '',
          timeLimit: 15,
          passingScore: 60,
          isPublic: true
        });
        setQuestions([
          {
            questionText: '',
            options: ['', '', '', ''],
            correctOptionIndex: 0
          }
        ]);
      }
    } catch (err) {
      console.error(err);
      setErrorMsg(err.response?.data?.message || `Failed to ${isEditMode ? 'update' : 'deploy'} quiz. Check fields and retry.`);
    } finally {
      setIsLoading(false);
    }
  };

  if (initialFetchLoading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-8 pb-16"
    >
      {/* Header */}
      <div className="space-y-2 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-foreground tracking-tight flex items-center gap-3">
            {isEditMode ? <Edit2 size={28} className="text-primary" /> : <PlusCircle size={28} className="text-primary" />}
            <span>{isEditMode ? 'Edit Custom Quiz' : 'Create Custom Quiz'}</span>
          </h1>
          <p className="text-sm text-muted-foreground font-medium leading-relaxed max-w-2xl mt-2">
            {isEditMode 
              ? 'Update your quiz details, questions, and settings.'
              : 'Build your own custom quiz, publish it, and share the unique link with peers to benchmark their capability scores.'
            }
          </p>
        </div>
        {isEditMode && (
          <button onClick={() => navigate(-1)} className="btn-secondary whitespace-nowrap self-start">
            Cancel Editing
          </button>
        )}
      </div>

      {errorMsg && (
        <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-2xl text-xs font-bold text-destructive">
          {errorMsg}
        </div>
      )}

      {/* Forms Workspace Grid */}
      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        <CustomQuizForm settings={settings} setSettings={setSettings} />
        
        <div className="space-y-6">
          <QuestionBuilder questions={questions} setQuestions={setQuestions} />
          
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary w-full sm:w-auto px-8 py-3.5 text-xs font-black uppercase tracking-widest rounded-2xl bg-primary hover:bg-primary/95 text-white flex items-center justify-center gap-2 shadow-[0_15px_30px_rgba(99,102,241,0.2)] disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>{isEditMode ? 'Updating...' : 'Deploying Quiz...'}</span>
                </>
              ) : (
                <>
                  {isEditMode ? <Check size={15} /> : <Send size={15} />}
                  <span>{isEditMode ? 'Update Quiz' : 'Create & Deploy Quiz'}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </form>

      {/* Shareable Link modal popup */}
      <AnimatePresence>
        {showShareModal && createdQuiz && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowShareModal(false)}
              className="absolute inset-0 bg-black backdrop-blur-sm"
            />
            {/* Modal Dialog */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-background border border-border rounded-3xl w-full max-w-lg shadow-2xl z-10 p-6 sm:p-8 space-y-6 text-center overflow-hidden"
            >
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(99,102,241,0.08),transparent)] pointer-events-none" />
              
              <div className="w-16 h-16 rounded-3xl bg-primary/10 flex items-center justify-center text-primary mx-auto shadow-md">
                <CheckCircle size={32} />
              </div>

              <div className="space-y-2">
                <h3 className="text-xl font-black text-foreground tracking-tight">Quiz {isEditMode ? 'Updated' : 'Deployed'} Successfully!</h3>
                <p className="text-xs text-muted-foreground font-medium leading-relaxed max-w-sm mx-auto">
                  Your custom quiz "{createdQuiz.title}" has been saved in the system. Share the unique identifier link below.
                </p>
              </div>

              {/* Copy URL widget */}
              <div className="bg-muted/40 border border-border/40 rounded-2xl p-1.5 flex items-center justify-between">
                <span className="text-xs font-bold text-muted-foreground px-3 truncate max-w-[280px]">
                  {`${window.location.origin}/quiz/play/${createdQuiz.slug}`}
                </span>
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="bg-primary hover:bg-primary/95 text-white p-2.5 rounded-xl flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider transition-colors shrink-0"
                >
                  {copied ? (
                    <>
                      <Check size={12} />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy size={12} />
                      <span>Copy Link</span>
                    </>
                  )}
                </button>
              </div>

              {/* Social Channels buttons */}
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={handleShareWhatsApp}
                  className="p-3 bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500/25 rounded-2xl text-xs font-bold text-emerald-500 flex items-center justify-center gap-2 transition-all"
                >
                  <MessageSquare size={14} className="fill-emerald-500/10" />
                  <span>WhatsApp</span>
                </button>

                <button
                  type="button"
                  onClick={handleShareTelegram}
                  className="p-3 bg-blue-500/10 border border-blue-500/20 hover:bg-blue-500/25 rounded-2xl text-xs font-bold text-blue-500 flex items-center justify-center gap-2 transition-all"
                >
                  <Compass size={14} />
                  <span>Telegram</span>
                </button>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowShareModal(false);
                    if (isEditMode) navigate(`/quiz/my-quizzes/${createdQuiz._id}`);
                  }}
                  className="btn-secondary w-full py-3 text-xs font-black uppercase tracking-widest rounded-2xl"
                >
                  {isEditMode ? 'Return to Quiz' : 'Close'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </motion.div>
  );
};

export default CustomQuiz;
