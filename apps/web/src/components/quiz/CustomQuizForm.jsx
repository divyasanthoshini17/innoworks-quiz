import React from 'react';
import { Settings, HelpCircle } from 'lucide-react';

const CustomQuizForm = ({ settings, setSettings }) => {
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSettings(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handlePrivacyChange = (isPublic) => {
    setSettings(prev => ({
      ...prev,
      isPublic
    }));
  };

  return (
    <div className="bg-card/40 backdrop-blur-2xl border border-border/50 rounded-[2rem] p-6 sm:p-10 space-y-8 shadow-2xl shadow-black/10 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-[80px] pointer-events-none -translate-y-1/2 translate-x-1/3" />
      
      <div className="flex items-center gap-4 border-b border-border/30 pb-6 relative z-10">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center text-primary shadow-inner border border-primary/10">
          <Settings size={24} />
        </div>
        <div>
          <h2 className="text-2xl font-black tracking-tight">Quiz Configuration</h2>
          <p className="text-sm text-muted-foreground font-medium mt-1">Define metadata and access rules for this deployment.</p>
        </div>
      </div>

      <div className="space-y-6 relative z-10">
        {/* Title */}
        <div className="space-y-2">
          <label htmlFor="title" className="text-[11px] font-black text-muted-foreground uppercase tracking-widest pl-1">
            Quiz Title
          </label>
          <input
            id="title"
            type="text"
            name="title"
            value={settings.title}
            onChange={handleChange}
            placeholder="e.g. Advanced System Design Challenge"
            className="w-full bg-background/80 border border-border/50 focus:border-primary/50 focus:ring-4 focus:ring-primary/10 rounded-2xl px-5 py-3.5 text-base text-foreground placeholder-muted-foreground/50 outline-none transition-all shadow-sm font-medium"
            required
          />
        </div>

        {/* Description */}
        <div className="space-y-2">
          <label htmlFor="description" className="text-[11px] font-black text-muted-foreground uppercase tracking-widest pl-1">
            Description
          </label>
          <textarea
            id="description"
            name="description"
            rows="3"
            value={settings.description}
            onChange={handleChange}
            placeholder="Provide summary details about what engineers should know to clear this quiz..."
            className="w-full bg-background/80 border border-border/50 focus:border-primary/50 focus:ring-4 focus:ring-primary/10 rounded-2xl px-5 py-3.5 text-base text-foreground placeholder-muted-foreground/50 outline-none transition-all resize-none shadow-sm font-medium leading-relaxed"
          />
        </div>

        {/* Dynamic configuration numeric grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {/* Time Limit */}
          <div className="space-y-2">
            <label htmlFor="timeLimit" className="text-[11px] font-black text-muted-foreground uppercase tracking-widest pl-1">
              Time Limit (Minutes)
            </label>
            <input
              id="timeLimit"
              type="number"
              name="timeLimit"
              min="1"
              max="180"
              value={settings.timeLimit}
              onChange={handleChange}
              className="w-full bg-background/80 border border-border/50 focus:border-primary/50 focus:ring-4 focus:ring-primary/10 rounded-2xl px-5 py-3.5 text-base text-foreground outline-none transition-all shadow-sm font-black"
            />
          </div>

          {/* Passing Score */}
          <div className="space-y-2">
            <label htmlFor="passingScore" className="text-[11px] font-black text-muted-foreground uppercase tracking-widest pl-1">
              Passing Score (%)
            </label>
            <input
              id="passingScore"
              type="number"
              name="passingScore"
              min="10"
              max="100"
              value={settings.passingScore}
              onChange={handleChange}
              className="w-full bg-background/80 border border-border/50 focus:border-primary/50 focus:ring-4 focus:ring-primary/10 rounded-2xl px-5 py-3.5 text-base text-foreground outline-none transition-all shadow-sm font-black text-primary"
            />
          </div>
        </div>

        {/* Privacy public/private toggle */}
        <div className="space-y-3 pt-4">
          <span className="text-[11px] font-black text-muted-foreground uppercase tracking-widest pl-1">
            Visibility & Access
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => handlePrivacyChange(true)}
              className={`p-5 border rounded-2xl text-left transition-all duration-300 flex flex-col justify-between ${
                settings.isPublic
                  ? 'border-primary bg-primary/10 text-primary shadow-lg shadow-primary/10 scale-[1.02]'
                  : 'border-border/50 bg-background/50 hover:border-primary/30 hover:bg-muted/30 text-muted-foreground'
              }`}
            >
              <span className="text-base font-black">Public Quiz</span>
              <span className="text-xs opacity-80 mt-1.5 font-medium leading-relaxed">Anyone with the share link can view and attempt this quiz anonymously or logged in.</span>
            </button>

            <button
              type="button"
              onClick={() => handlePrivacyChange(false)}
              className={`p-5 border rounded-2xl text-left transition-all duration-300 flex flex-col justify-between ${
                !settings.isPublic
                  ? 'border-primary bg-primary/10 text-primary shadow-lg shadow-primary/10 scale-[1.02]'
                  : 'border-border/50 bg-background/50 hover:border-primary/30 hover:bg-muted/30 text-muted-foreground'
              }`}
            >
              <span className="text-base font-black">Private Quiz</span>
              <span className="text-xs opacity-80 mt-1.5 font-medium leading-relaxed">Only users who are authenticated can access and attempt this quiz.</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomQuizForm;
