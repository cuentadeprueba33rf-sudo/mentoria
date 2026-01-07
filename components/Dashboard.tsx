import React, { useState, useEffect } from 'react';
import { SUBJECTS } from '../constants';
import { Subject, SubjectCategory, EducationLevel } from '../types';
import { IconGraduationCap, IconBook, IconTarget, IconWand, IconSearch, IconBrain } from './Icons';

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
  const [greeting, setGreeting] = useState('Buenos días');

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Buenos días');
    else if (hour < 18) setGreeting('Buenas tardes');
    else setGreeting('Buenas noches');
  }, []);

  const availableSubjects = SUBJECTS.filter(s => s.levels.includes(userLevel));
  const displayedSubjects = availableSubjects.filter(s => {
    const matchesTab = activeTab === 'Todos' || s.category === activeTab;
    const matchesSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          s.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesTab && matchesSearch;
  });

  const categories = Object.values(SubjectCategory);

  return (
    <div className="flex-1 overflow-y-auto pb-32 md:pb-12 scroll-smooth bg-slate-50/50 dark:bg-slate-950/50 relative">
      {/* Background Ambience */}
      <div className="fixed top-0 left-0 w-full h-[500px] bg-gradient-to-b from-blue-50/80 to-transparent dark:from-blue-900/10 dark:to-transparent pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 md:px-8 pt-8 relative z-10">
        
        {/* --- HEADER SECTION --- */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 gap-6 animate-fade-in">
            <div>
                <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-2">
                    {greeting}.
                </h1>
                <p className="text-lg text-slate-500 dark:text-slate-400 font-medium">
                    ¿Qué quieres aprender hoy en nivel <span className="text-primary-600 dark:text-primary-400 font-bold">{userLevel}</span>?
                </p>
            </div>

            {/* Level Switcher - Glass Capsule */}
            <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md p-1.5 rounded-full border border-slate-200 dark:border-slate-700 flex shadow-sm">
                <button
                    onClick={() => setUserLevel(EducationLevel.BACHILLER)}
                    className={`flex items-center gap-2 px-5 py-2 rounded-full text-sm font-bold transition-all duration-300 ${
                    userLevel === EducationLevel.BACHILLER
                        ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-md'
                        : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                >
                    <IconGraduationCap className="w-4 h-4" />
                    <span className="hidden sm:inline">Colegio</span>
                </button>
                <button
                    onClick={() => setUserLevel(EducationLevel.UNIVERSIDAD)}
                    className={`flex items-center gap-2 px-5 py-2 rounded-full text-sm font-bold transition-all duration-300 ${
                    userLevel === EducationLevel.UNIVERSIDAD
                        ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-md'
                        : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                >
                    <IconBook className="w-4 h-4" />
                    <span className="hidden sm:inline">Universidad</span>
                </button>
            </div>
        </div>

        {/* --- SEARCH BAR (HERO) --- */}
        <div className="relative max-w-2xl mb-12 group animate-slide-up">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <IconSearch className="h-6 w-6 text-slate-400 group-focus-within:text-primary-500 transition-colors" />
            </div>
            <input
                type="text"
                className="block w-full pl-12 pr-4 py-4 rounded-2xl bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-primary-500/50 focus:ring-4 focus:ring-primary-500/10 transition-all text-lg shadow-sm group-hover:shadow-md"
                placeholder="Buscar materias, temas o conceptos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
            />
        </div>

        {/* --- QUICK ACTIONS (WIDGETS) --- */}
        <div className="mb-10">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 px-1">Herramientas Rápidas</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-slide-up" style={{ animationDelay: '0.1s' }}>
                {[
                { id: 'solve', label: 'Resolver', sub: 'Paso a paso', icon: IconTarget, gradient: 'from-blue-500 to-cyan-500' },
                { id: 'explain', label: 'Explicar', sub: 'Teoría clara', icon: IconBrain, gradient: 'from-emerald-500 to-teal-500' },
                { id: 'exam', label: 'Practicar', sub: 'Simular Examen', icon: IconGraduationCap, gradient: 'from-amber-500 to-orange-500' },
                { id: 'create', label: 'Crear', sub: 'Ejercicios', icon: IconWand, gradient: 'from-purple-500 to-pink-500' },
                ].map((action) => (
                <button
                    key={action.id}
                    onClick={() => onQuickAction(action.id)}
                    className="relative overflow-hidden group p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 hover:border-transparent text-left transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
                >
                    <div className={`absolute inset-0 bg-gradient-to-br ${action.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-300`} />
                    <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${action.gradient} flex items-center justify-center text-white mb-3 shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300`}>
                        <action.icon className="w-6 h-6" />
                    </div>
                    <h3 className="font-bold text-lg text-slate-900 dark:text-white">{action.label}</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">{action.sub}</p>
                </button>
                ))}
            </div>
        </div>

        {/* --- CATEGORY TABS --- */}
        <div className="flex overflow-x-auto gap-2 mb-6 pb-2 no-scrollbar mask-gradient-right sticky top-0 z-20 bg-slate-50/90 dark:bg-slate-950/90 backdrop-blur-xl py-2 -mx-4 px-4 md:mx-0 md:px-0 md:bg-transparent md:backdrop-filter-none">
            <button
                onClick={() => setActiveTab('Todos')}
                className={`whitespace-nowrap px-6 py-2.5 rounded-full text-sm font-bold transition-all duration-200 border ${
                    activeTab === 'Todos'
                    ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 border-slate-900 dark:border-white shadow-lg transform scale-105'
                    : 'bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:border-slate-300'
                }`}
            >
                Todas
            </button>
            {categories.map((cat) => (
                <button
                    key={cat}
                    onClick={() => setActiveTab(cat)}
                    className={`whitespace-nowrap px-6 py-2.5 rounded-full text-sm font-bold transition-all duration-200 border ${
                        activeTab === cat
                        ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 border-slate-900 dark:border-white shadow-lg transform scale-105'
                        : 'bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:border-slate-300'
                    }`}
                >
                    {cat}
                </button>
            ))}
        </div>

        {/* --- SUBJECTS GRID --- */}
        <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 animate-slide-up" style={{ animationDelay: '0.2s' }}>
            {displayedSubjects.map((subject) => (
                <button
                    key={subject.id}
                    onClick={() => onSelectSubject(subject)}
                    className="group relative flex flex-col p-6 bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-2xl hover:shadow-slate-200/50 dark:hover:shadow-black/30 hover:-translate-y-1.5 transition-all duration-300 text-left h-full overflow-hidden"
                >
                    {/* Hover Gradient Overlay */}
                    <div className={`absolute inset-0 bg-gradient-to-br ${subject.gradient} opacity-0 group-hover:opacity-[0.03] transition-opacity duration-300`} />
                    
                    {/* Top Decorative Line */}
                    <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${subject.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />

                    <div className="flex items-start justify-between mb-5 relative z-10">
                        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-3xl bg-gradient-to-br ${subject.gradient} text-white shadow-lg group-hover:scale-110 group-hover:rotate-6 transition-all duration-300 ring-4 ring-white dark:ring-slate-900`}>
                            {subject.icon}
                        </div>
                        <div className="w-8 h-8 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-300 group-hover:text-primary-500 group-hover:bg-primary-50 dark:group-hover:bg-primary-900/20 transition-colors">
                             <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                        </div>
                    </div>

                    <div className="mt-auto relative z-10">
                        <span className="inline-block px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                            {subject.category}
                        </span>
                        <h4 className="font-extrabold text-xl text-slate-900 dark:text-white mb-2 leading-tight group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-slate-900 group-hover:to-slate-600 dark:group-hover:from-white dark:group-hover:to-slate-300 transition-all">
                            {subject.name}
                        </h4>
                        <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed font-medium">
                            {subject.description}
                        </p>
                    </div>
                </button>
            ))}
        </div>
        
        {displayedSubjects.length === 0 && (
             <div className="py-20 text-center">
                 <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-slate-100 dark:bg-slate-800 mb-4 text-4xl">
                     🔍
                 </div>
                 <h3 className="text-xl font-bold text-slate-900 dark:text-white">No se encontraron materias</h3>
                 <p className="text-slate-500 mt-2">Prueba con otro término de búsqueda o categoría.</p>
                 <button onClick={() => {setSearchTerm(''); setActiveTab('Todos')}} className="mt-4 text-primary-600 font-bold hover:underline">Limpiar filtros</button>
             </div>
        )}
      </div>
    </div>
  );
};