import React, { useState } from 'react';
import { SUBJECTS } from '../constants';
import { Subject, SubjectCategory, EducationLevel } from '../types';
import { IconGraduationCap, IconBook, IconTarget, IconWand, IconSearch } from './Icons';

interface DashboardProps {
  userLevel: EducationLevel;
  setUserLevel: (level: EducationLevel) => void;
  onSelectSubject: (subject: Subject) => void;
  onQuickAction: (action: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ 
  userLevel, 
  setUserLevel, 
  onSelectSubject,
  onQuickAction
}) => {
  const [activeTab, setActiveTab] = useState<SubjectCategory | 'Todos'>('Todos');
  const [searchTerm, setSearchTerm] = useState('');

  // Filter subjects based on level, active tab, and search term
  const availableSubjects = SUBJECTS.filter(s => s.levels.includes(userLevel));
  
  const displayedSubjects = availableSubjects.filter(s => {
    const matchesTab = activeTab === 'Todos' || s.category === activeTab;
    const matchesSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          s.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesTab && matchesSearch;
  });

  const categories = Object.values(SubjectCategory);

  return (
    <div className="flex-1 overflow-y-auto pb-32 md:pb-12 scroll-smooth bg-slate-50/50 dark:bg-slate-950/50">
      <div className="max-w-7xl mx-auto px-4 md:px-8 pt-8">
        
        {/* --- HERO SECTION --- */}
        <div className="flex flex-col md:flex-row justify-between items-end mb-10 gap-6 animate-fade-in">
            <div className="relative z-10">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 text-blue-600 dark:text-blue-300 text-xs font-bold uppercase tracking-wider mb-3">
                    ✨ Tu Tutor Inteligente
                </div>
                <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-tight">
                    Aprende <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-violet-600 dark:from-primary-400 dark:to-violet-400">sin límites.</span>
                </h1>
                <p className="mt-3 text-slate-500 dark:text-slate-400 text-lg max-w-lg leading-relaxed">
                    Selecciona una herramienta o materia para comenzar tu sesión personalizada.
                </p>
            </div>

            {/* Aesthetic Level Switcher */}
            <div className="bg-white dark:bg-slate-900 p-1.5 rounded-full shadow-lg shadow-slate-200/50 dark:shadow-black/20 border border-slate-100 dark:border-slate-800 flex relative w-full md:w-auto min-w-[260px]">
                {/* Sliding Background Animation Logic can be added here with framer-motion, for now CSS transitions */}
                <button
                    onClick={() => setUserLevel(EducationLevel.BACHILLER)}
                    className={`flex-1 flex items-center justify-center gap-2 px-6 py-2.5 rounded-full text-sm font-bold transition-all duration-300 relative z-10 ${
                    userLevel === EducationLevel.BACHILLER
                        ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-md transform scale-100'
                        : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                >
                    <IconGraduationCap className="w-4 h-4" />
                    Colegio
                </button>
                <button
                    onClick={() => setUserLevel(EducationLevel.UNIVERSIDAD)}
                    className={`flex-1 flex items-center justify-center gap-2 px-6 py-2.5 rounded-full text-sm font-bold transition-all duration-300 relative z-10 ${
                    userLevel === EducationLevel.UNIVERSIDAD
                        ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-md transform scale-100'
                        : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                >
                    <IconBook className="w-4 h-4" />
                    Universidad
                </button>
            </div>
        </div>

        {/* --- QUICK ACTIONS WIDGETS --- */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10 animate-slide-up" style={{ animationDelay: '0.1s' }}>
            {[
            { id: 'solve', label: 'Resolver', sub: 'Paso a paso', icon: IconTarget, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-900/20', border: 'border-blue-100 dark:border-blue-800' },
            { id: 'explain', label: 'Explicar', sub: 'Conceptos', icon: IconBook, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-900/20', border: 'border-emerald-100 dark:border-emerald-800' },
            { id: 'exam', label: 'Practicar', sub: 'Modo Examen', icon: IconGraduationCap, color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-900/20', border: 'border-amber-100 dark:border-amber-800' },
            { id: 'create', label: 'Crear', sub: 'Ejercicios', icon: IconWand, color: 'text-purple-600', bg: 'bg-purple-50 dark:bg-purple-900/20', border: 'border-purple-100 dark:border-purple-800' },
            ].map((action) => (
            <button
                key={action.id}
                onClick={() => onQuickAction(action.id)}
                className={`
                    relative group flex flex-col items-start justify-between p-5 h-32 md:h-36
                    rounded-3xl border transition-all duration-300
                    bg-white dark:bg-slate-900/80 backdrop-blur-sm
                    hover:shadow-xl hover:-translate-y-1 active:scale-95
                    ${action.border}
                `}
            >
                <div className={`w-10 h-10 rounded-2xl ${action.bg} ${action.color} flex items-center justify-center mb-2 group-hover:scale-110 transition-transform duration-300`}>
                    <action.icon className="w-5 h-5" />
                </div>
                <div>
                    <h3 className="font-bold text-lg text-slate-900 dark:text-white leading-tight">{action.label}</h3>
                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-0.5">{action.sub}</p>
                </div>
                
                {/* Decorative glow */}
                <div className={`absolute top-4 right-4 w-12 h-12 rounded-full ${action.bg} blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none`} />
            </button>
            ))}
        </div>

        {/* --- FILTERS & SEARCH --- */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6 sticky top-0 z-20 bg-slate-50/90 dark:bg-slate-950/90 backdrop-blur-xl py-4 -mx-4 px-4 md:mx-0 md:px-0">
            
            {/* Category Tabs (Pills) */}
            <div className="flex overflow-x-auto gap-2 no-scrollbar w-full md:w-auto mask-gradient-right">
                <button
                    onClick={() => setActiveTab('Todos')}
                    className={`whitespace-nowrap px-5 py-2 rounded-full text-sm font-bold transition-all duration-200 border ${
                        activeTab === 'Todos'
                        ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 border-slate-900 dark:border-white shadow-md'
                        : 'bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-600'
                    }`}
                >
                    Todas
                </button>
                {categories.map((cat) => (
                    <button
                        key={cat}
                        onClick={() => setActiveTab(cat)}
                        className={`whitespace-nowrap px-5 py-2 rounded-full text-sm font-bold transition-all duration-200 border ${
                            activeTab === cat
                            ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 border-slate-900 dark:border-white shadow-md'
                            : 'bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-600'
                        }`}
                    >
                        {cat}
                    </button>
                ))}
            </div>

            {/* Search Input */}
            <div className="relative w-full md:w-64 shrink-0">
                <input 
                    type="text" 
                    placeholder="Buscar materia..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 dark:focus:ring-primary-900/30 outline-none transition-all text-sm font-medium text-slate-800 dark:text-white"
                />
                <IconSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            </div>
        </div>

        {/* --- SUBJECTS GRID --- */}
        <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6 animate-slide-up" style={{ animationDelay: '0.2s' }}>
            {displayedSubjects.length > 0 ? (
                displayedSubjects.map((subject) => (
                    <button
                        key={subject.id}
                        onClick={() => onSelectSubject(subject)}
                        className="group relative flex flex-col p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-xl hover:shadow-slate-200/50 dark:hover:shadow-black/30 hover:-translate-y-1 transition-all duration-300 text-left h-full overflow-hidden"
                    >
                        {/* Gradient Top Line */}
                        <div className={`absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r ${subject.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />

                        <div className="flex items-start justify-between mb-4">
                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-3xl bg-gradient-to-br ${subject.gradient} text-white shadow-lg shadow-primary-500/10 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300`}>
                                {subject.icon}
                            </div>
                            {/* Arrow Icon on Hover */}
                            <div className="w-8 h-8 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-400 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
                            </div>
                        </div>

                        <div className="mt-2">
                             <span className="inline-block text-[10px] font-extrabold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-1.5">
                                {subject.category}
                            </span>
                            <h4 className="font-bold text-xl text-slate-900 dark:text-white mb-2 leading-tight group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-slate-900 group-hover:to-slate-600 dark:group-hover:from-white dark:group-hover:to-slate-300 transition-all">
                                {subject.name}
                            </h4>
                            <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed font-medium">
                                {subject.description}
                            </p>
                        </div>
                    </button>
                ))
            ) : (
                <div className="col-span-full py-16 flex flex-col items-center justify-center text-center">
                    <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center text-slate-300 mb-4">
                        <IconSearch className="w-8 h-8" />
                    </div>
                    <p className="text-slate-500 font-medium">No se encontraron materias.</p>
                    <button onClick={() => { setActiveTab('Todos'); setSearchTerm(''); }} className="text-primary-600 font-bold mt-2 hover:underline">
                        Limpiar filtros
                    </button>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};