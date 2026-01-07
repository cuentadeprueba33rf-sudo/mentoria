import React, { useState, useEffect } from 'react';
import { Dashboard } from './components/Dashboard';
import { ChatInterface } from './components/ChatInterface';
import { Library } from './components/Library';
import { Onboarding } from './components/Onboarding';
import { IconSun, IconMoon, IconBrain, IconLibrary, IconBook } from './components/Icons';
import { EducationLevel, Subject, Message, Role, UserProfile } from './types';
import { INITIAL_GREETING } from './constants';

export default function App() {
  const [darkMode, setDarkMode] = useState(false);
  const [currentView, setCurrentView] = useState<'dashboard' | 'chat' | 'library'>('dashboard');
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  
  // State
  const [userLevel, setUserLevel] = useState<EducationLevel>(EducationLevel.BACHILLER);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [chatHistory, setChatHistory] = useState<Message[]>([]);

  // Initialize theme & Onboarding check
  useEffect(() => {
    // Theme check
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setDarkMode(true);
    }

    // Onboarding check
    const savedProfile = localStorage.getItem('mentorIA_profile');
    if (savedProfile) {
      const parsed = JSON.parse(savedProfile);
      setUserProfile(parsed);
      // We also try to restore the level from the profile context if saved, 
      // but for now we just load the profile. Ideally we'd save level in profile too.
    } else {
      setShowOnboarding(true);
    }
  }, []);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  const handleOnboardingComplete = (profile: UserProfile, level: EducationLevel) => {
    setUserProfile(profile);
    setUserLevel(level);
    localStorage.setItem('mentorIA_profile', JSON.stringify(profile));
    setShowOnboarding(false);
  };

  const handleSubjectSelect = (subject: Subject) => {
    setSelectedSubject(subject);
    
    // Personalize Greeting
    const name = userProfile?.name ? ` ${userProfile.name}` : '';
    let greeting = `Hola${name}, soy tu tutor de **${subject.name}**.`;
    
    if (userProfile?.focusSubject === subject.category) {
        greeting += `\n\nVeo que tu objetivo es mejorar en **${subject.category}**. ¡Excelente elección! Vamos a reforzar esos conceptos.`;
    } else if (userProfile?.strongestSubject === subject.category) {
        greeting += `\n\nSé que **${subject.category}** es tu fuerte. Vamos a profundizar en temas avanzados.`;
    } else {
        greeting += `\n\n¿En qué puedo ayudarte hoy? Podemos repasar teoría, resolver problemas o prepararnos para un examen.`;
    }

    setChatHistory([{
      id: 'init',
      role: Role.MODEL,
      text: greeting,
      timestamp: Date.now()
    }]);
    setCurrentView('chat');
  };

  const handleQuickAction = (action: string) => {
    setSelectedSubject(null);
    let initialText = '';
    const name = userProfile?.name ? `, ${userProfile.name}` : '';
    
    switch(action) {
      case 'solve':
        initialText = `### 🧮 Resolución de Problemas\nListo${name}. Pega el problema aquí. Lo analizaremos paso a paso.`;
        break;
      case 'explain':
        initialText = `### 📖 Explicación Conceptual\nDime el tema${name}. Usaré analogías y ejemplos claros.`;
        break;
      case 'exam':
        initialText = `### 📝 Modo Examen\n¿Qué materia repasamos hoy${name}? Te haré preguntas difíciles.`;
        break;
      case 'create':
        initialText = `### ✨ Generador de Ejercicios\nDime el tema y el nivel de dificultad.`;
        break;
      default:
        initialText = INITIAL_GREETING(userLevel);
    }

    setChatHistory([{
      id: 'init',
      role: Role.MODEL,
      text: initialText,
      timestamp: Date.now()
    }]);
    setCurrentView('chat');
  };

  const handleBackToDashboard = () => {
    setCurrentView('dashboard');
    setSelectedSubject(null);
  };

  return (
    <div className="flex flex-col h-[100dvh] bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans transition-colors duration-300 overflow-hidden relative selection:bg-primary-200 dark:selection:bg-primary-900">
      
      {/* Onboarding Modal */}
      {showOnboarding && (
        <Onboarding onComplete={handleOnboardingComplete} />
      )}

      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-primary-50 to-transparent dark:from-slate-900 dark:to-transparent pointer-events-none z-0" />
      
      {/* Navbar - Modern Glass */}
      <nav className="h-14 md:h-16 px-4 md:px-6 flex items-center justify-between shrink-0 z-20 relative glass border-b border-slate-200/50 dark:border-slate-800/50">
        <div 
          className="flex items-center gap-2 cursor-pointer group"
          onClick={handleBackToDashboard}
        >
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary-600 to-violet-600 flex items-center justify-center text-white shadow-lg group-hover:scale-105 transition-transform duration-300">
            <IconBrain className="w-5 h-5" />
          </div>
          <span className="font-bold text-lg md:text-xl tracking-tight text-slate-800 dark:text-white hidden xs:block">
            Mentor<span className="text-primary-600 dark:text-primary-400">IA</span>
          </span>
        </div>

        {/* Navigation Tabs (Center) */}
        <div className="flex bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl shadow-inner mx-2">
            <button
                onClick={() => setCurrentView('dashboard')}
                className={`flex items-center gap-2 px-3 md:px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                    currentView === 'dashboard' 
                    ? 'bg-white dark:bg-slate-700 text-primary-600 dark:text-white shadow-sm' 
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800'
                }`}
            >
                <IconBrain className="w-4 h-4 md:hidden"/>
                <span className="hidden md:inline">Inicio</span>
            </button>
            <button
                onClick={() => setCurrentView('library')}
                className={`flex items-center gap-2 px-3 md:px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                    currentView === 'library' 
                    ? 'bg-white dark:bg-slate-700 text-amber-600 dark:text-amber-400 shadow-sm' 
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800'
                }`}
            >
                <IconLibrary className="w-4 h-4 md:hidden" />
                <span className="hidden md:inline">Biblioteca</span>
            </button>
        </div>

        <div className="flex items-center gap-3">
             {/* Profile Name (Tiny) */}
             {userProfile && (
                <div className="hidden md:flex flex-col items-end mr-2">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-200">{userProfile.name}</span>
                    <span className="text-[10px] text-primary-600 dark:text-primary-400 uppercase tracking-wider">{userLevel === EducationLevel.UNIVERSIDAD ? 'Uni' : 'Col'}</span>
                </div>
             )}

            {/* Dark Mode Toggle */}
            <button
            onClick={() => setDarkMode(!darkMode)}
            className="w-9 h-9 md:w-10 md:h-10 rounded-full flex items-center justify-center bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-primary-600 hover:border-primary-200 dark:hover:text-primary-400 transition-all shadow-sm"
            >
            {darkMode ? <IconSun className="w-5 h-5" /> : <IconMoon className="w-5 h-5" />}
            </button>
        </div>
      </nav>

      {/* Main Container - Mobile Optimized: No padding on mobile, Rounded on Desktop */}
      <main className="flex-1 flex flex-col relative z-10 w-full max-w-7xl mx-auto md:p-6 overflow-hidden">
        <div className="flex-1 w-full h-full flex flex-col min-h-0 bg-white dark:bg-slate-900 md:bg-white/50 md:dark:bg-slate-900/50 md:backdrop-blur-sm md:rounded-3xl md:border md:border-white/20 md:dark:border-white/5 md:shadow-2xl overflow-hidden">
             {currentView === 'dashboard' && (
               <Dashboard 
                 userLevel={userLevel} 
                 setUserLevel={setUserLevel}
                 onSelectSubject={handleSubjectSelect}
                 onQuickAction={handleQuickAction}
               />
             )}
             
             {currentView === 'chat' && (
               <ChatInterface 
                 currentSubject={selectedSubject}
                 level={userLevel}
                 onBack={handleBackToDashboard}
                 history={chatHistory}
                 setHistory={setChatHistory}
               />
             )}

             {currentView === 'library' && (
               <Library />
             )}
        </div>
      </main>
    </div>
  );
}