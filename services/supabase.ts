import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Usamos las credenciales proporcionadas o las del entorno
const supabaseUrl = process.env.SUPABASE_URL || process.env.REACT_APP_SUPABASE_URL || 'https://prdridyufkqjeakzbekb.supabase.co';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.REACT_APP_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InByZHJpZHl1ZmtxamVha3piZWtiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc3NTQzMzMsImV4cCI6MjA4MzMzMDMzM30.PtTiCAxbFDlASbrFPu6Hjbb20L-0u-osaP5n8I0gafA';

let supabaseInstance: SupabaseClient;

const createMockClient = () => {
  console.warn('Usando cliente Supabase offline (Mock) debido a error de inicialización.');
  return {
    from: (_table: string) => ({
      select: (_cols: string) => ({
        order: (_col: string, _opts?: any) => Promise.resolve({ data: [], error: null })
      }),
      insert: (_data: any) => Promise.resolve({ data: null, error: null }),
      delete: () => ({ eq: () => Promise.resolve({ error: null }) }),
      update: (_data: any) => ({ eq: () => Promise.resolve({ error: null }) })
    }),
    storage: {
      from: (_bucket: string) => ({
        upload: (_path: string, _file: any) => Promise.resolve({ data: { path: 'mock_path' }, error: null }),
        getPublicUrl: (_path: string) => ({ data: { publicUrl: 'mock_url' } }),
        remove: (_paths: string[]) => Promise.resolve({ error: null })
      })
    },
    auth: {
      getSession: () => Promise.resolve({ data: { session: null }, error: null }),
      signInWithPassword: () => Promise.resolve({ data: {}, error: null }),
      signOut: () => Promise.resolve({ error: null })
    }
  } as unknown as SupabaseClient;
};

if (supabaseUrl && supabaseAnonKey && supabaseUrl.startsWith('http')) {
  try {
    supabaseInstance = createClient(supabaseUrl, supabaseAnonKey);
  } catch (error) {
    console.error('Error crítico al inicializar Supabase:', error);
    supabaseInstance = createMockClient();
  }
} else {
  supabaseInstance = createMockClient();
}

export const supabase = supabaseInstance;

// --- ADMIN SERVICES ---

export const uploadBookFile = async (file: File): Promise<string | null> => {
  try {
    // Check file size - Standard Supabase Free Tier limit is 50MB per file.
    // We check this on client side to avoid waiting for upload just to fail.
    const MAX_SIZE_MB = 50; 
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      throw new Error(`El archivo supera el límite de ${MAX_SIZE_MB}MB (Estándar de Supabase).`);
    }

    // 1. Sanitizar nombre de archivo agresivamente
    const fileExt = file.name.split('.').pop();
    const safeName = file.name.replace(/[^a-zA-Z0-9]/g, '').substring(0, 15);
    const fileName = `${Date.now()}_${safeName}.${fileExt}`;
    const filePath = fileName;

    console.log(`Intentando subir: ${filePath} (${(file.size / 1024 / 1024).toFixed(2)} MB) al bucket 'books'...`);

    // 2. Subir al bucket 'books'
    const { data, error: uploadError } = await supabase.storage
      .from('books')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true
      });

    if (uploadError) {
        // Handle specific server errors
        if (uploadError.message.includes('The object exceeded the maximum allowed size')) {
             throw new Error("El archivo es demasiado grande para el servidor (Límite 50MB).");
        }
        if (uploadError.message.includes('new row violates row-level security policy')) {
             throw new Error("Permiso denegado: No tienes permisos de administrador.");
        }
        
        console.error('Error detallado de Supabase Storage:', uploadError);
        throw new Error(uploadError.message || JSON.stringify(uploadError));
    }

    if (!data) {
        throw new Error("No se recibieron datos de confirmación de subida.");
    }

    // 3. Obtener URL pública
    const { data: urlData } = supabase.storage.from('books').getPublicUrl(filePath);
    
    if (!urlData || !urlData.publicUrl) {
        throw new Error("No se pudo generar la URL pública.");
    }

    console.log("Archivo subido exitosamente:", urlData.publicUrl);
    return urlData.publicUrl;

  } catch (error: any) {
    // Only log unknown errors to avoid noise
    if (!error.message.includes('El archivo supera') && !error.message.includes('demasiado grande')) {
        console.error('Upload Service Error:', error);
    }
    throw error;
  }
};

export const addBookToDatabase = async (bookData: {
  title: string;
  author: string;
  category: string;
  file_url: string;
  cover_url?: string; // Opcional
}) => {
  console.log("Guardando metadatos en base de datos...", bookData);
  const { error } = await supabase
    .from('library_books')
    .insert([bookData]);
  
  if (error) {
      console.error("Database Insert Error:", error);
      // Ensure we convert object errors to string
      throw new Error(error.message || error.details || JSON.stringify(error));
  }
};

export const updateBookInDatabase = async (id: string, updates: Partial<{
  title: string;
  author: string;
  category: string;
  cover_url: string;
  file_url: string;
}>) => {
  console.log("Actualizando libro:", id, updates);
  const { error } = await supabase
    .from('library_books')
    .update(updates)
    .eq('id', id);

  if (error) {
    console.error("Database Update Error:", error);
    // Ensure we convert object errors to string
    throw new Error(error.message || error.details || JSON.stringify(error));
  }
};

export const deleteBookFromLibrary = async (bookId: string, fileUrl: string) => {
    console.log("Iniciando eliminación completa para ID:", bookId);
    
    // 1. Eliminar de la base de datos (Fuente de Verdad)
    const { error: dbError } = await supabase
        .from('library_books')
        .delete()
        .eq('id', bookId);

    if (dbError) {
        throw new Error("Error eliminando de la base de datos: " + (dbError.message || JSON.stringify(dbError)));
    }

    console.log("Registro eliminado de base de datos.");

    // 2. Intentar eliminar del Storage (si es un archivo alojado en Supabase)
    // Comprobamos si la URL es válida y pertenece a nuestro storage
    if (fileUrl && fileUrl.includes('/storage/v1/object/public/books/')) {
        try {
            // Extraer el nombre del archivo de la URL
            // URL Típica: https://.../storage/v1/object/public/books/filename.pdf
            const parts = fileUrl.split('/books/');
            const fileName = parts.length > 1 ? parts.pop() : null;
            
            if (fileName) {
                // Decodificar el nombre por si tiene espacios o caracteres especiales
                const decodedFileName = decodeURIComponent(fileName);
                console.log("Intentando eliminar archivo físico del bucket:", decodedFileName);
                
                const { error: storageError } = await supabase.storage
                    .from('books')
                    .remove([decodedFileName]);
                
                if (storageError) {
                    // Solo es una advertencia, no detiene el flujo porque la DB ya se limpió
                    console.warn("Advertencia: No se pudo eliminar el archivo físico.", storageError);
                } else {
                    console.log("Archivo físico eliminado correctamente.");
                }
            }
        } catch (e) {
            console.warn("Error procesando eliminación de archivo (no crítico):", e);
        }
    }
};