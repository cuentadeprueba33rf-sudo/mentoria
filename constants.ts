import { EducationLevel, Subject, SubjectCategory } from './types';

export const SYSTEM_INSTRUCTION_BASE = `
Eres MentorIA, un tutor de IA de clase mundial, sofisticado y altamente pedagógico.
Tu tono es profesional pero cercano, motivador y claro.

REGLAS DE ORO:
1. ADÁPTATE ESTRICTAMENTE al nivel educativo:
   - Si es BACHILLERATO: Usa lenguaje accesible, ejemplos cotidianos y fomenta la curiosidad.
   - Si es UNIVERSIDAD: Usa terminología técnica precisa, rigor académico y profundidad teórica.
2. En MATEMÁTICAS/CIENCIAS: Prioriza el razonamiento. Usa LaTeX para fórmulas.
3. En HUMANIDADES/SOCIALES: Fomenta el pensamiento crítico y el análisis de contexto.
4. FORMATO: Usa Markdown elegante. Negritas para conceptos clave. Listas para claridad.
5. PEDAGOGÍA: No des solo la respuesta. Guía al estudiante.
`;

const ALL_LEVELS = [EducationLevel.BACHILLER, EducationLevel.UNIVERSIDAD];

export const SUBJECTS: Subject[] = [
  // --- MATEMÁTICAS ---
  { 
    id: 'math_basic', name: 'Aritmética y Pre-Álgebra', icon: '➗', category: SubjectCategory.MATH, 
    description: 'Operaciones fundamentales.', levels: [EducationLevel.BACHILLER], gradient: 'from-blue-400 to-blue-600' 
  },
  { 
    id: 'math_geo', name: 'Geometría', icon: '📐', category: SubjectCategory.MATH, 
    description: 'Formas, ángulos y espacio.', levels: [EducationLevel.BACHILLER], gradient: 'from-cyan-400 to-blue-500' 
  },
  { 
    id: 'math_trig', name: 'Trigonometría', icon: '⊿', category: SubjectCategory.MATH, 
    description: 'Triángulos y funciones periódicas.', levels: [EducationLevel.BACHILLER], gradient: 'from-blue-500 to-indigo-500' 
  },
  { 
    id: 'math_calc1', name: 'Cálculo Diferencial', icon: '∫', category: SubjectCategory.MATH, 
    description: 'Límites y derivadas.', levels: ALL_LEVELS, gradient: 'from-indigo-500 to-purple-600' 
  },
  { 
    id: 'math_calc2', name: 'Cálculo Integral/Multivariado', icon: '∬', category: SubjectCategory.MATH, 
    description: 'Integrales y series.', levels: [EducationLevel.UNIVERSIDAD], gradient: 'from-purple-600 to-pink-600' 
  },
  { 
    id: 'math_diff_eq', name: 'Ecuaciones Diferenciales', icon: '∂', category: SubjectCategory.MATH, 
    description: 'Modelado de cambios.', levels: [EducationLevel.UNIVERSIDAD], gradient: 'from-fuchsia-600 to-rose-600' 
  },
  { 
    id: 'math_lin_alg', name: 'Álgebra Lineal', icon: '▦', category: SubjectCategory.MATH, 
    description: 'Matrices y espacios vectoriales.', levels: [EducationLevel.UNIVERSIDAD], gradient: 'from-violet-500 to-indigo-700' 
  },
  { 
    id: 'math_stats', name: 'Probabilidad y Estadística', icon: '📊', category: SubjectCategory.MATH, 
    description: 'Análisis de datos.', levels: ALL_LEVELS, gradient: 'from-emerald-400 to-teal-600' 
  },

  // --- CIENCIAS ---
  { 
    id: 'sci_nat', name: 'Ciencias Naturales', icon: '🌿', category: SubjectCategory.SCIENCE, 
    description: 'El mundo natural.', levels: [EducationLevel.BACHILLER], gradient: 'from-green-400 to-emerald-600' 
  },
  { 
    id: 'sci_bio', name: 'Biología', icon: '🧬', category: SubjectCategory.SCIENCE, 
    description: 'La ciencia de la vida.', levels: ALL_LEVELS, gradient: 'from-emerald-500 to-green-700' 
  },
  { 
    id: 'sci_chem', name: 'Química', icon: '🧪', category: SubjectCategory.SCIENCE, 
    description: 'Materia y transformaciones.', levels: ALL_LEVELS, gradient: 'from-teal-400 to-cyan-600' 
  },
  { 
    id: 'sci_phys', name: 'Física', icon: '⚛️', category: SubjectCategory.SCIENCE, 
    description: 'Movimiento y energía.', levels: ALL_LEVELS, gradient: 'from-orange-400 to-red-500' 
  },
  { 
    id: 'sci_org', name: 'Química Orgánica', icon: '⚗️', category: SubjectCategory.SCIENCE, 
    description: 'Compuestos de carbono.', levels: [EducationLevel.UNIVERSIDAD], gradient: 'from-lime-500 to-green-600' 
  },

  // --- SOCIALES Y HUMANIDADES ---
  { 
    id: 'hum_soc', name: 'Ciencias Sociales', icon: '🌍', category: SubjectCategory.HUMANITIES, 
    description: 'Sociedad y cultura.', levels: [EducationLevel.BACHILLER], gradient: 'from-amber-400 to-orange-500' 
  },
  { 
    id: 'hum_hist', name: 'Historia', icon: '🏛️', category: SubjectCategory.HUMANITIES, 
    description: 'Eventos pasados.', levels: ALL_LEVELS, gradient: 'from-yellow-500 to-amber-600' 
  },
  { 
    id: 'hum_civ', name: 'Competencia Ciudadana', icon: '🤝', category: SubjectCategory.HUMANITIES, 
    description: 'Derechos y deberes.', levels: [EducationLevel.BACHILLER], gradient: 'from-sky-400 to-blue-500' 
  },
  { 
    id: 'hum_phil', name: 'Filosofía', icon: '🦉', category: SubjectCategory.HUMANITIES, 
    description: 'Lógica y pensamiento.', levels: ALL_LEVELS, gradient: 'from-rose-400 to-pink-600' 
  },
  { 
    id: 'hum_law', name: 'Derecho / Leyes', icon: '⚖️', category: SubjectCategory.HUMANITIES, 
    description: 'Marco legal básico.', levels: [EducationLevel.UNIVERSIDAD], gradient: 'from-slate-500 to-slate-700' 
  },
  { 
    id: 'hum_psych', name: 'Psicología', icon: '🧠', category: SubjectCategory.HUMANITIES, 
    description: 'Mente y comportamiento.', levels: [EducationLevel.UNIVERSIDAD], gradient: 'from-pink-400 to-rose-500' 
  },

  // --- IDIOMAS ---
  { 
    id: 'lang_es', name: 'Lengua Castellana', icon: '📚', category: SubjectCategory.LANGUAGES, 
    description: 'Gramática y literatura.', levels: ALL_LEVELS, gradient: 'from-red-400 to-red-600' 
  },
  { 
    id: 'lang_en', name: 'Inglés', icon: '🇺🇸', category: SubjectCategory.LANGUAGES, 
    description: 'Writing, reading & grammar.', levels: ALL_LEVELS, gradient: 'from-blue-400 to-red-500' 
  },

  // --- TECNOLOGÍA ---
  { 
    id: 'tech_info', name: 'Informática', icon: '🖥️', category: SubjectCategory.TECH, 
    description: 'Herramientas digitales.', levels: [EducationLevel.BACHILLER], gradient: 'from-violet-400 to-purple-600' 
  },
  { 
    id: 'tech_prog', name: 'Programación', icon: '💻', category: SubjectCategory.TECH, 
    description: 'Algoritmos y código.', levels: ALL_LEVELS, gradient: 'from-indigo-500 to-blue-600' 
  },
];

export const INITIAL_GREETING = (level: EducationLevel) => `¡Bienvenido a MentorIA! 
Estás en el modo **${level}**. Selecciona una materia del panel para comenzar una sesión de aprendizaje personalizada.`;
