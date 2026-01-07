import { GoogleGenAI } from "@google/genai";
import { Message, Role, ExplanationMode, EducationLevel, Subject } from '../types';
import { SYSTEM_INSTRUCTION_BASE } from '../constants';

interface GenerateParams {
  history: Message[];
  prompt: string;
  level: EducationLevel;
  subject: Subject | null;
  mode: ExplanationMode;
}

export const sendMessageToGemini = async ({
  history,
  prompt,
  level,
  subject,
  mode
}: GenerateParams): Promise<string> => {
  try {
    // Initialize the client with the API key from the environment variable
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    // Select model based on complexity. 
    // Math & High logic -> Pro Preview.
    // General chat -> Flash Preview.
    const isMathOrComplex = subject?.category === 'Matemáticas' || subject?.category === 'Ciencias' || mode === 'step_by_step';
    const modelId = isMathOrComplex ? 'gemini-3-pro-preview' : 'gemini-3-flash-preview';

    // Construct the context-aware system instruction
    let specificInstruction = SYSTEM_INSTRUCTION_BASE;
    specificInstruction += `\nCONTEXTO ACTUAL:\nNivel del estudiante: ${level}\n`;
    
    if (subject) {
      specificInstruction += `Materia actual: ${subject.name} (${subject.description})\n`;
    }

    if (mode === 'child') {
      specificInstruction += `MODO: Explica como si el estudiante tuviera 10 años. Usa analogías divertidas.\n`;
    } else if (mode === 'step_by_step') {
      specificInstruction += `MODO: Resolución paso a paso detallada. Numera los pasos lógicos. No te saltes nada.\n`;
    } else if (mode === 'socratic') {
      specificInstruction += `MODO: Socrático. NO des la respuesta. Haz preguntas guía para que el estudiante llegue a la conclusión.\n`;
    } else if (mode === 'exam_prep') {
      specificInstruction += `MODO: Preparación de examen. Genera una pregunta difícil sobre el tema y espera la respuesta del usuario, o corrige su respuesta anterior.\n`;
    }

    // Convert internal message format to Gemini format
    const chatHistory = history
      .filter(msg => msg.role !== Role.SYSTEM && !msg.isError)
      .map(msg => ({
        role: msg.role === Role.USER ? 'user' : 'model',
        parts: [{ text: msg.text }],
      }));

    // Configure thinking budget for complex tasks to ensure quality
    const thinkingBudget = isMathOrComplex ? 2048 : 0;

    const chat = ai.chats.create({
      model: modelId,
      config: {
        systemInstruction: specificInstruction,
        thinkingConfig: thinkingBudget > 0 ? { thinkingBudget } : undefined,
        temperature: mode === 'exam_prep' ? 0.9 : 0.7, // More creative for exams, more precise for explanations
      },
      history: chatHistory,
    });

    const result = await chat.sendMessage({ message: prompt });
    
    return result.text || "Lo siento, no pude generar una respuesta. Intenta de nuevo.";

  } catch (error: any) {
    console.error("Gemini API Error:", error);
    throw new Error(error.message || "Error conectando con MentorIA");
  }
};