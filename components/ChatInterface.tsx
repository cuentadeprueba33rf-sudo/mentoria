import React, { useState, useRef, useEffect } from 'react';
import { Message, Role, Subject, ExplanationMode, EducationLevel } from '../types';
import { IconSend, IconBrain, IconTarget } from './Icons';
import { MarkdownView } from './MarkdownView';
import { sendMessageToGemini } from '../services/geminiService';

interface ChatInterfaceProps {
  currentSubject: Subject | null;
  level: EducationLevel;
  onBack: () => void;
  history: Message[];
  setHistory: React.Dispatch<React.SetStateAction<Message[]>>;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({ 
  currentSubject, 
  level, 
  onBack,
  history,
  setHistory
}) => {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [mode, setMode] = useState<ExplanationMode>('standard');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [history, isLoading]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: Role.USER,
      text: input,
      timestamp: Date.now()
    };

    setHistory(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const responseText = await sendMessageToGemini({
        history: [...history, userMsg],
        prompt: input,
        level,
        subject: currentSubject,
        mode
      });

      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: Role.MODEL,
        text: responseText,
        timestamp: Date.now()
      };

      setHistory(prev => [...prev, aiMsg]);
    } catch (error) {
      const errorMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: Role.SYSTEM,
        text: "Hubo un pequeño problema de conexión. Intenta de nuevo.",
        timestamp: Date.now(),
        isError: true
      };
      setHistory(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleModeChange = (newMode: ExplanationMode) => {
    setMode(newMode);
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-900 md:rounded-3xl md:shadow-2xl md:border md:border-slate-200 md:dark:border-slate-800 overflow-hidden relative">
      
      {/* Aesthetic Header */}
      <div className="px-6 py-4 flex items-center justify-between bg-white/90 dark:bg-slate-900/90 backdrop-blur-md z-10 border-b border-slate-100 dark:border-slate-800 sticky top-0">
        <div className="flex items-center gap-4">
          <button 
            onClick={onBack}
            className="p-2 -ml-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-500"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
          </button>
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xl shadow-sm ${currentSubject ? `bg-gradient-to-br ${currentSubject.gradient} text-white` : 'bg-primary-600 text-white'}`}>
                {currentSubject ? currentSubject.icon : <IconBrain />}
            </div>
            <div>
                <h2 className="font-bold text-slate-800 dark:text-white leading-tight">
                {currentSubject ? currentSubject.name : 'MentorIA General'}
                </h2>
                <div className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                    <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                        En línea • {level}
                    </span>
                </div>
            </div>
          </div>
        </div>
        
        {/* Simple Mode Toggle Dropdown/Group */}
        <div className="hidden md:flex bg-slate-100 dark:bg-slate-800 rounded-lg p-1">
           <button onClick={() => setMode('standard')} className={`px-3 py-1 text-xs rounded-md transition-all ${mode === 'standard' ? 'bg-white dark:bg-slate-700 shadow text-slate-900 dark:text-white' : 'text-slate-500'}`}>Normal</button>
           <button onClick={() => setMode('child')} className={`px-3 py-1 text-xs rounded-md transition-all ${mode === 'child' ? 'bg-white dark:bg-slate-700 shadow text-slate-900 dark:text-white' : 'text-slate-500'}`}>Sencillo</button>
        </div>
      </div>

      {/* Chat Area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 bg-slate-50 dark:bg-slate-950 scroll-smooth">
        {history.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center space-y-4 opacity-0 animate-fade-in" style={{ animationDelay: '0.2s', animationFillMode: 'forwards' }}>
                <div className={`w-20 h-20 rounded-3xl flex items-center justify-center text-4xl shadow-xl mb-2 ${currentSubject ? `bg-gradient-to-br ${currentSubject.gradient} text-white` : 'bg-slate-200 dark:bg-slate-800 text-slate-400'}`}>
                   {currentSubject ? currentSubject.icon : <IconBrain />}
                </div>
                <div className="max-w-xs">
                    <p className="text-lg font-semibold text-slate-800 dark:text-white">¡Listo para aprender!</p>
                    <p className="text-sm text-slate-500">Haz una pregunta sobre el tema para comenzar.</p>
                </div>
            </div>
        )}
        
        {history.map((msg, index) => (
          <div 
            key={msg.id} 
            className={`flex flex-col animate-slide-up ${msg.role === Role.USER ? 'items-end' : 'items-start'}`}
            style={{ animationDelay: `${index * 50}ms` }}
          >
             <div className={`flex gap-2 max-w-[90%] md:max-w-[80%] ${msg.role === Role.USER ? 'flex-row-reverse' : 'flex-row'}`}>
                {msg.role === Role.MODEL && (
                    <div className={`w-8 h-8 shrink-0 rounded-full flex items-center justify-center text-xs text-white shadow-sm mt-1 ${currentSubject ? `bg-gradient-to-br ${currentSubject.gradient}` : 'bg-primary-600'}`}>
                        M
                    </div>
                )}
                
                <div 
                    className={`
                        p-4 rounded-2xl shadow-sm text-[15px]
                        ${msg.role === Role.USER 
                        ? 'bg-slate-900 dark:bg-primary-600 text-white rounded-tr-none' 
                        : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-100 dark:border-slate-700 rounded-tl-none'
                        }
                    `}
                >
                    {msg.role === Role.USER ? (
                        <p className="whitespace-pre-wrap leading-relaxed">{msg.text}</p>
                    ) : (
                        <div className="prose-custom">
                           <MarkdownView content={msg.text} />
                        </div>
                    )}
                </div>
            </div>
            {/* Timestamp or status could go here */}
          </div>
        ))}
        
        {isLoading && (
          <div className="flex items-start gap-2 animate-fade-in">
             <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs text-white shadow-sm mt-1 ${currentSubject ? `bg-gradient-to-br ${currentSubject.gradient}` : 'bg-primary-600'}`}>M</div>
             <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl rounded-tl-none border border-slate-100 dark:border-slate-700 shadow-sm flex items-center gap-1.5">
                <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></span>
                <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-100"></span>
                <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-200"></span>
             </div>
          </div>
        )}
      </div>

      {/* Modern Input Area */}
      <div className="p-4 bg-white/80 dark:bg-slate-900/80 backdrop-blur-lg border-t border-slate-100 dark:border-slate-800 z-10">
        <div className="max-w-4xl mx-auto relative flex items-end gap-2 bg-slate-100 dark:bg-slate-800 p-1.5 rounded-3xl border border-transparent focus-within:border-primary-500/50 focus-within:bg-white dark:focus-within:bg-slate-950 focus-within:shadow-lg focus-within:shadow-primary-500/5 transition-all duration-300">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Escribe tu pregunta aquí..."
            className="w-full bg-transparent border-none focus:ring-0 resize-none max-h-32 min-h-[44px] py-2.5 px-4 text-slate-800 dark:text-white placeholder-slate-400"
            rows={1}
            style={{ height: 'auto' }}
          />
          <button 
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className={`p-2.5 mb-0.5 mr-0.5 rounded-full text-white shadow-md transition-all duration-200 ${!input.trim() ? 'bg-slate-300 dark:bg-slate-700 cursor-not-allowed' : 'bg-primary-600 hover:bg-primary-700 hover:scale-105 active:scale-95'}`}
          >
            <IconSend className="w-5 h-5 translate-x-0.5" />
          </button>
        </div>
        <div className="text-center mt-2">
           <p className="text-[10px] text-slate-400 font-medium tracking-wide uppercase">Powered by Gemini 2.0</p>
        </div>
      </div>
    </div>
  );
};
