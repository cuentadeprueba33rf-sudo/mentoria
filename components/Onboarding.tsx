import React, { useState } from 'react';
import { EducationLevel, SubjectCategory, UserProfile } from '../types';
import { IconBrain, IconGraduationCap, IconTarget, IconWand } from './Icons';

interface OnboardingProps {
  onComplete: (profile: UserProfile, level: EducationLevel) => void;
}

export const Onboarding: React.FC<OnboardingProps> = ({ onComplete }) => {
  const [step, setStep] = useState(0);
  const [name, setName] = useState('');
  const [level, setLevel] = useState<EducationLevel>(EducationLevel.BACHILLER);
  const [strongest, setStrongest] = useState('');
  const [focus, setFocus] = useState('');

  const categories = Object.values(SubjectCategory);

  const nextStep = () => setStep(prev => prev + 1);
  const prevStep = () => setStep(prev => Math.max(0, prev - 1));

  const handleFinish = () => {
    const profile: UserProfile = {
      name,
      strongestSubject: strongest,
      focusSubject: focus,
      onboardingCompleted: true
    };
    onComplete(profile, level);
  };

  // --- STEPS RENDERERS ---

  const renderWelcome = () => (
    <div className="text-center space-y-6 animate-fade-in">
      <div className="w-24 h-24 bg-gradient-to-br from-primary-500 to-violet-600 rounded-3xl mx-auto flex items-center justify-center shadow-xl shadow-primary-500/20 mb-6">
        <IconBrain className="w-12 h-12 text-white" />
      </div>
      <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white">
        Bienvenido a <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-violet-600">MentorIA</span>
      </h1>
      <p className="text-lg text-slate-600 dark:text-slate-300 max-w-sm mx-auto">
        Tu tutor personal de inteligencia artificial diseñado para explicar, no solo para resolver.
      </p>
      <button 
        onClick={nextStep}
        className="mt-8 px-8 py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl font-bold text-lg hover:scale-105 transition-transform shadow-lg"
      >
        Comenzar
      </button>
    </div>
  );

  const renderName = () => (
    <div className="space-y-6 animate-slide-up">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">¿Cómo te llamas?</h2>
        <p className="text-slate-500">Para dirigirnos a ti correctamente.</p>
      </div>
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Tu nombre"
        className="w-full text-center text-2xl py-4 border-b-2 border-slate-200 dark:border-slate-700 bg-transparent focus:border-primary-500 outline-none transition-colors placeholder:text-slate-300 dark:text-white"
        autoFocus
        onKeyDown={(e) => e.key === 'Enter' && name && nextStep()}
      />
      <div className="flex justify-center">
        <button 
            disabled={!name.trim()}
            onClick={nextStep}
            className="px-8 py-3 bg-primary-600 text-white rounded-xl font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary-700 transition-colors"
        >
            Continuar
        </button>
      </div>
    </div>
  );

  const renderLevel = () => (
    <div className="space-y-8 animate-slide-up">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">¿Cuál es tu nivel actual?</h2>
        <p className="text-slate-500">Adaptaremos las explicaciones a tu contexto.</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <button
          onClick={() => { setLevel(EducationLevel.BACHILLER); nextStep(); }}
          className="p-6 rounded-2xl border-2 border-slate-100 dark:border-slate-700 hover:border-primary-500 dark:hover:border-primary-500 bg-white dark:bg-slate-800 hover:bg-primary-50 dark:hover:bg-slate-800/50 transition-all group text-left"
        >
          <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center text-blue-600 mb-4 group-hover:scale-110 transition-transform">
            <IconGraduationCap className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-lg text-slate-900 dark:text-white">Bachillerato / Colegio</h3>
          <p className="text-sm text-slate-500 mt-1">Educación secundaria, preparación para la universidad.</p>
        </button>

        <button
          onClick={() => { setLevel(EducationLevel.UNIVERSIDAD); nextStep(); }}
          className="p-6 rounded-2xl border-2 border-slate-100 dark:border-slate-700 hover:border-violet-500 dark:hover:border-violet-500 bg-white dark:bg-slate-800 hover:bg-violet-50 dark:hover:bg-slate-800/50 transition-all group text-left"
        >
          <div className="w-12 h-12 bg-violet-100 dark:bg-violet-900/30 rounded-full flex items-center justify-center text-violet-600 mb-4 group-hover:scale-110 transition-transform">
            <IconBrain className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-lg text-slate-900 dark:text-white">Universidad / Superior</h3>
          <p className="text-sm text-slate-500 mt-1">Pregrado, ingeniería, ciencias y estudios avanzados.</p>
        </button>
      </div>
    </div>
  );

  const renderStrongest = () => (
    <div className="space-y-6 animate-slide-up">
       <div className="text-center">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">¿Cuál es tu "Superpoder"?</h2>
        <p className="text-slate-500">La materia donde te sientes más cómodo.</p>
      </div>
      <div className="flex flex-wrap gap-3 justify-center">
        {categories.map(cat => (
            <button
                key={cat}
                onClick={() => { setStrongest(cat); nextStep(); }}
                className="px-5 py-3 rounded-full border border-slate-200 dark:border-slate-700 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 hover:border-emerald-500 dark:hover:border-emerald-500 hover:text-emerald-700 dark:hover:text-emerald-400 transition-all font-medium text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800"
            >
                {cat}
            </button>
        ))}
      </div>
    </div>
  );

  const renderFocus = () => (
    <div className="space-y-6 animate-slide-up">
       <div className="text-center">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">¿Cuál es tu Misión?</h2>
        <p className="text-slate-500">¿Qué área quieres reforzar principalmente?</p>
      </div>
      <div className="flex flex-wrap gap-3 justify-center">
        {categories.map(cat => (
            <button
                key={cat}
                onClick={() => { setFocus(cat); setTimeout(handleFinish, 300); }}
                className="px-5 py-3 rounded-full border border-slate-200 dark:border-slate-700 hover:bg-primary-50 dark:hover:bg-primary-900/20 hover:border-primary-500 dark:hover:border-primary-500 hover:text-primary-700 dark:hover:text-primary-400 transition-all font-medium text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800"
            >
                {cat}
            </button>
        ))}
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-50/50 dark:bg-slate-950/80 backdrop-blur-xl">
        <div className="w-full max-w-2xl px-6">
            <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl p-8 md:p-12 border border-slate-100 dark:border-slate-800 relative overflow-hidden">
                
                {/* Progress Bar */}
                {step > 0 && (
                    <div className="absolute top-0 left-0 w-full h-1.5 bg-slate-100 dark:bg-slate-800">
                        <div 
                            className="h-full bg-gradient-to-r from-primary-500 to-violet-500 transition-all duration-500 ease-out"
                            style={{ width: `${(step / 4) * 100}%` }}
                        />
                    </div>
                )}

                {/* Back Button */}
                {step > 1 && (
                    <button 
                        onClick={prevStep}
                        className="absolute top-6 left-6 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                    >
                        ← Atrás
                    </button>
                )}

                {step === 0 && renderWelcome()}
                {step === 1 && renderName()}
                {step === 2 && renderLevel()}
                {step === 3 && renderStrongest()}
                {step === 4 && renderFocus()}

            </div>
            
            {step > 0 && (
                <div className="text-center mt-6 text-sm text-slate-400 font-medium">
                    Paso {step} de 4
                </div>
            )}
        </div>
    </div>
  );
};
