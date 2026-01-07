import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // Use '.' instead of process.cwd() to avoid "Property 'cwd' does not exist on type 'Process'"
  const env = loadEnv(mode, '.', '');
  return {
    plugins: [react()],
    define: {
      'process.env': env
    },
    server: {
      port: 3000
    },
    build: {
      // Aumentamos el límite de advertencia de tamaño de chunk a 1600kB (1.6MB)
      // para evitar que Vercel llene el log de advertencias.
      chunkSizeWarningLimit: 1600,
      rollupOptions: {
        output: {
          // Estrategia de división de código (Code Splitting) para optimizar la carga
          // y separar las librerías grandes del código de la aplicación.
          manualChunks(id) {
            if (id.includes('node_modules')) {
              // Separar React y ReactDOM
              if (id.includes('react') || id.includes('react-dom')) {
                return 'vendor-react';
              }
              // Separar Supabase
              if (id.includes('@supabase')) {
                return 'vendor-supabase';
              }
              // Separar Google GenAI
              if (id.includes('@google/genai')) {
                return 'vendor-genai';
              }
              // El resto de librerías van a un chunk general
              return 'vendor';
            }
          }
        }
      }
    }
  };
});