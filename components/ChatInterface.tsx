import React, { useState, useRef, useEffect } from 'react';
import { Message, Role, Subject, ExplanationMode, EducationLevel } from '../types';
import { IconSend, IconBrain, IconTarget, IconChevronLeft } from './Icons';
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

  const modes: {id: ExplanationMode, label: string}[] = [
      { id: 'standard', label: 'Normal' },
      { id: 'step_by_step', label: 'Paso a paso' },
      { id: 'child', label: 'Sencillo' },
      { id: 'exam_prep', label: 'Examen' },
      { id: 'socratic', label: 'Socrático' }
  ];

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-900 md:bg-transparent overflow-hidden relative">
      
      {/* Aesthetic Header - Mobile Optimized */}
      <div className="flex flex-col md:flex-row md:items-center justify-between bg-white/90 dark:bg-slate-900/90 backdrop-blur-md z-10 border-b border-slate-100 dark:border-slate-800 sticky top-0 px-4 py-2 md:px-6 md:py-4 gap-2 md:gap-0">
        <div className="flex items-center gap-3">
          <button 
            onClick={onBack}
            className="p-2 -ml-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-500"
          >
            <IconChevronLeft className="w-6 h-6" />
          </button>
          <div className="flex items-center gap-3 overflow-hidden">
            <div className={`w-9 h-9 md:w-10 md:h-10 shrink-0 rounded-full flex items-center justify-center text-lg md:text-xl shadow-sm ${currentSubject ? `bg-gradient-to-br ${currentSubject.gradient} text-white` : 'bg-primary-600 text-white'}`}>
                {currentSubject ? currentSubject.icon : <IconBrain />}
            </div>
            <div className="min-w-0">
                <h2 className="font-bold text-slate-800 dark:text-white leading-tight truncate text-sm md:text-base">
                {currentSubject ? currentSubject.name : 'MentorIA General'}
                </h2>
                <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                    <span className="text-[10px] md:text-xs text-slate-500 dark:text-slate-400 font-medium truncate">
                        {level} • En línea
                    </span>
                </div>
            </div>
          </div>
        </div>
        
        {/* Scrollable Mode Toggle for Mobile */}
        <div className="flex items-center overflow-x-auto no-scrollbar gap-2 pb-1 md:pb-0 md:ml-auto w-full md:w-auto">
           {modes.map((m) => (
             <button 
                key={m.id}
                onClick={() => setMode(m.id)} 
                className={`whitespace-nowrap px-3 py-1.5 text-xs font-medium rounded-lg transition-all flex-shrink-0 ${
                    mode === m.id 
                    ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-md transform scale-105' 
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
                }`}
             >
                {m.label}
             </button>
           ))}
        </div>
      </div>

      {/* Chat Area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 bg-slate-50 dark:bg-slate-950 scroll-smooth">
        {history.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center space-y-4 opacity-0 animate-fade-in" style={{ animationDelay: '0.2s', animationFillMode: 'forwards' }}>
                <div className={`w-16 h-16 md:w-20 md:h-20 rounded-3xl flex items-center justify-center text-3xl md:text-4xl shadow-xl mb-2 ${currentSubject ? `bg-gradient-to-br ${currentSubject.gradient} text-white` : 'bg-slate-200 dark:bg-slate-800 text-slate-400'}`}>
                   {currentSubject ? currentSubject.icon : <IconBrain />}
                </div>
                <div className="max-w-xs px-4">
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
             <div className={`flex gap-2 max-w-[95%] md:max-w-[85%] ${msg.role === Role.USER ? 'flex-row-reverse' : 'flex-row'}`}>
                {msg.role === Role.MODEL && (
                    <div className={`hidden md:flex w-8 h-8 shrink-0 rounded-full items-center justify-center text-xs text-white shadow-sm mt-1 ${currentSubject ? `bg-gradient-to-br ${currentSubject.gradient}` : 'bg-primary-600'}`}>
                        M
                    </div>
                )}
                
                <div 
                    className={`
                        p-3 md:p-4 rounded-2xl shadow-sm text-[15px]
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
          </div>
        ))}
        
        {isLoading && (
          <div className="flex items-start gap-2 animate-fade-in">
             <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl rounded-tl-none border border-slate-100 dark:border-slate-700 shadow-sm flex items-center gap-1.5 ml-2 md:ml-10">
                <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></span>
                <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-100"></span>
                <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-200"></span>
             </div>
          </div>
        )}
      </div>

      {/* Modern Input Area */}
      <div className="p-3 md:p-4 bg-white/95 dark:bg-slate-900/95 backdrop-blur-lg border-t border-slate-100 dark:border-slate-800 z-10 pb-safe">
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
            className="w-full bg-transparent border-none focus:ring-0 resize-none max-h-32 min-h-[44px] py-2.5 px-4 text-slate-800 dark:text-white placeholder-slate-400 text-base"
            rows={1}
            style={{ height: 'auto' }}
          />
          <button 
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className={`p-2.5 mb-0.5 mr-0.5 rounded-full text-white shadow-md transition-all duration-200 shrink-0 ${!input.trim() ? 'bg-slate-300 dark:bg-slate-700 cursor-not-allowed' : 'bg-primary-600 hover:bg-primary-700 active:scale-95'}`}
          >
            <IconSend className="w-5 h-5 translate-x-0.5" />
          </button>
        </div>
      </div>
    </div>
  );
};