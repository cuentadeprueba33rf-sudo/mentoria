import React, { useState } from 'react';
import { SUBJECTS } from '../constants';
import { Subject, SubjectCategory, EducationLevel } from '../types';
import { IconGraduationCap, IconBook, IconTarget, IconWand } from './Icons';

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

  // Filter subjects based on level and active tab
  const availableSubjects = SUBJECTS.filter(s => s.levels.includes(userLevel));
  const displayedSubjects = activeTab === 'Todos' 
    ? availableSubjects 
    : availableSubjects.filter(s => s.category === activeTab);

  const categories = Object.values(SubjectCategory);

  return (
    <div className="flex-1 overflow-y-auto pb-24 md:pb-12 scroll-smooth">
      <div className="max-w-6xl mx-auto px-4 md:px-8 pt-6">
        
        {/* Hero Section */}
        <div className="mb-8 animate-fade-in">
            <div className="flex flex-col md:flex-row md:justify-between md:items-start mb-6 gap-4">
                <div>
                    <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-violet-600 dark:from-primary-400 dark:to-violet-400">
                           MentorIA
                        </span>
                    </h1>
                    <p className="mt-1 md:mt-2 text-slate-600 dark:text-slate-400 text-base md:text-lg">
                        Tu asistente educativo personal.
                    </p>
                </div>
                {/* Level Toggle - Mobile Optimized */}
                <div className="bg-white dark:bg-slate-900 p-1 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 flex self-start w-full md:w-auto">
                    <button
                        onClick={() => setUserLevel(EducationLevel.BACHILLER)}
                        className={`flex-1 md:flex-none px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-300 ${
                        userLevel === EducationLevel.BACHILLER
                            ? 'bg-primary-500 text-white shadow-md'
                            : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                        }`}
                    >
                        Colegio
                    </button>
                    <button
                        onClick={() => setUserLevel(EducationLevel.UNIVERSIDAD)}
                        className={`flex-1 md:flex-none px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-300 ${
                        userLevel === EducationLevel.UNIVERSIDAD
                            ? 'bg-violet-600 text-white shadow-md'
                            : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                        }`}
                    >
                        Universidad
                    </button>
                </div>
            </div>

            {/* Quick Action Cards - Grid 2x2 on mobile */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
                {[
                { id: 'solve', label: 'Resolver', sub: 'Paso a paso', icon: IconTarget, grad: 'from-blue-500 to-cyan-500' },
                { id: 'explain', label: 'Explicar', sub: 'Conceptos', icon: IconBook, grad: 'from-emerald-500 to-green-500' },
                { id: 'exam', label: 'Practicar', sub: 'Examen', icon: IconGraduationCap, grad: 'from-amber-500 to-orange-500' },
                { id: 'create', label: 'Crear', sub: 'Ejercicios', icon: IconWand, grad: 'from-purple-500 to-pink-500' },
                ].map((action, idx) => (
                <button
                    key={action.id}
                    onClick={() => onQuickAction(action.id)}
                    className="relative group overflow-hidden rounded-2xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 p-4 md:p-5 text-left shadow-sm hover:shadow-xl transition-all duration-300 active:scale-95"
                >
                    <div className={`absolute top-0 right-0 w-20 h-20 md:w-24 md:h-24 bg-gradient-to-br ${action.grad} opacity-10 rounded-bl-full group-hover:scale-110 transition-transform`}></div>
                    <div className={`w-10 h-10 md:w-12 md:h-12 rounded-xl bg-gradient-to-br ${action.grad} text-white flex items-center justify-center mb-3 shadow-lg`}>
                        <action.icon className="w-5 h-5 md:w-6 md:h-6" />
                    </div>
                    <h3 className="font-bold text-slate-900 dark:text-white text-base md:text-lg">{action.label}</h3>
                    <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400">{action.sub}</p>
                </button>
                ))}
            </div>
        </div>

        {/* Categories Tabs - No Scrollbar Class added */}
        <div className="flex overflow-x-auto pb-4 gap-2 mb-4 no-scrollbar -mx-4 px-4 md:mx-0 md:px-0">
            <button
                onClick={() => setActiveTab('Todos')}
                className={`whitespace-nowrap px-4 py-2 md:px-5 md:py-2.5 rounded-full text-sm font-medium transition-all ${
                    activeTab === 'Todos'
                    ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-lg'
                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
                }`}
            >
                Todas
            </button>
            {categories.map((cat) => (
                <button
                    key={cat}
                    onClick={() => setActiveTab(cat)}
                    className={`whitespace-nowrap px-4 py-2 md:px-5 md:py-2.5 rounded-full text-sm font-medium transition-all ${
                        activeTab === cat
                        ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-lg'
                        : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
                    }`}
                >
                    {cat}
                </button>
            ))}
        </div>

        {/* Subjects Grid - Optimized for mobile density */}
        <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 animate-slide-up">
            {displayedSubjects.length > 0 ? (
                displayedSubjects.map((subject) => (
                    <button
                        key={subject.id}
                        onClick={() => onSelectSubject(subject)}
                        className="group flex flex-col p-4 md:p-5 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm hover:shadow-xl hover:border-primary-200 dark:hover:border-primary-800 transition-all duration-300 text-left active:scale-[0.98] h-full"
                    >
                        <div className="flex items-start justify-between mb-3 md:mb-4">
                            <div className={`w-12 h-12 md:w-14 md:h-14 rounded-2xl flex items-center justify-center text-2xl md:text-3xl bg-gradient-to-br ${subject.gradient} text-white shadow-lg group-hover:scale-105 transition-transform duration-300`}>
                                {subject.icon}
                            </div>
                            <span className="text-[9px] md:text-[10px] font-bold uppercase tracking-wider text-slate-400 bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded-md">
                                {subject.category.split(' ')[0]}
                            </span>
                        </div>
                        <h4 className="font-bold text-base md:text-lg text-slate-900 dark:text-white mb-1 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                            {subject.name}
                        </h4>
                        <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                            {subject.description}
                        </p>
                    </button>
                ))
            ) : (
                <div className="col-span-full py-12 text-center text-slate-400 bg-slate-50 dark:bg-slate-900 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800">
                    <p>No hay materias disponibles para esta categoría.</p>
                    <button onClick={() => setActiveTab('Todos')} className="text-primary-600 font-semibold mt-2 hover:underline">Ver todas</button>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};