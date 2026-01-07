import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // Fix: process.cwd() exists in Node.js environment; casting to any to satisfy TypeScript
  const env = loadEnv(mode, (process as any).cwd(), '');
  return {
    plugins: [react()],
    define: {
      'process.env': env
    },
    server: {
      port: 3000
    },
    build: {
      // 1. Aumentamos el límite de alerta a 2MB. Las apps de IA suelen ser pesadas, es normal.
      chunkSizeWarningLimit: 2048, 
      
      // 2. Configuración para generar archivos más pequeños y eficientes
      rollupOptions: {
        output: {
          manualChunks(id) {
            // Separa las librerías grandes en sus propios archivos
            if (id.includes('node_modules')) {
              if (id.includes('react') || id.includes('react-dom')) {
                return 'vendor-react';
              }
              if (id.includes('@supabase')) {
                return 'vendor-supabase';
              }
              if (id.includes('@google/genai')) {
                return 'vendor-genai'; // Esta librería es grande, mejor separarla
              }
              if (id.includes('lucide-react')) {
                return 'vendor-icons';
              }
              // Cualquier otra cosa va al chunk general de proveedores
              return 'vendor-utils'; 
            }
          }
        }
      }
    }
  };
});