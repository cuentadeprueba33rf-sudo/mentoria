export enum Role {
  USER = 'user',
  MODEL = 'model',
  SYSTEM = 'system'
}

export enum EducationLevel {
  BACHILLER = 'Bachillerato',
  UNIVERSIDAD = 'Universidad'
}

export enum SubjectCategory {
  MATH = 'Matemáticas',
  SCIENCE = 'Ciencias',
  HUMANITIES = 'Sociales y Humanidades',
  LANGUAGES = 'Idiomas',
  TECH = 'Tecnología',
  OTHER = 'Otras'
}

export interface Subject {
  id: string;
  name: string;
  icon: string;
  category: SubjectCategory;
  description: string;
  levels: EducationLevel[]; // Which levels is this subject available for?
  gradient: string; // Aesthetic gradient for the card
}

export interface Message {
  id: string;
  role: Role;
  text: string;
  timestamp: number;
  isError?: boolean;
  isLoading?: boolean;
}

export type ExplanationMode = 
  | 'standard' 
  | 'child' 
  | 'step_by_step' 
  | 'socratic' 
  | 'exam_prep'; 

export interface UserState {
  level: EducationLevel;
  darkMode: boolean;
  currentSubject: Subject | null;
  history: Message[];
}

export interface UserProfile {
  name: string;
  strongestSubject: string;
  focusSubject: string;
  onboardingCompleted: boolean;
}