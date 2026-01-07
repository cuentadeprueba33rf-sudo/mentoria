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
      delete: () => ({ eq: () => ({ select: () => Promise.resolve({ data: [], error: null }) }) }),
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
    const MAX_SIZE_MB = 50; 
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      throw new Error(`El archivo supera el límite de ${MAX_SIZE_MB}MB.`);
    }

    const fileExt = file.name.split('.').pop();
    const safeName = file.name.replace(/[^a-zA-Z0-9]/g, '').substring(0, 15);
    const fileName = `${Date.now()}_${safeName}.${fileExt}`;
    const filePath = fileName;

    console.log(`Subiendo: ${filePath}...`);

    const { data, error: uploadError } = await supabase.storage
      .from('books')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true
      });

    if (uploadError) {
        if (uploadError.message.includes('new row violates row-level security policy')) {
             throw new Error("Permiso denegado: No tienes permisos de administrador.");
        }
        throw new Error(uploadError.message);
    }

    if (!data) throw new Error("No se recibieron datos de confirmación.");

    const { data: urlData } = supabase.storage.from('books').getPublicUrl(filePath);
    return urlData.publicUrl;

  } catch (error: any) {
    console.error('Upload Service Error:', error);
    throw error;
  }
};

export const addBookToDatabase = async (bookData: {
  title: string;
  author: string;
  category: string;
  file_url: string;
  cover_url?: string;
}) => {
  const { error } = await supabase.from('library_books').insert([bookData]);
  if (error) throw new Error(error.message);
};

export const updateBookInDatabase = async (id: string, updates: any) => {
  const { error } = await supabase.from('library_books').update(updates).eq('id', id);
  if (error) throw new Error(error.message);
};

export const deleteBookFromLibrary = async (bookId: string, fileUrl: string) => {
    if (!bookId) throw new Error("ID inválido.");

    console.log("Eliminando ID:", bookId);
    
    // 0. Verificar sesión (opcional para debug)
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData.session) console.warn("Sin sesión activa.");

    // 1. ELIMINACIÓN CON VERIFICACIÓN (.select())
    // Esto es crucial: si RLS bloquea el borrado, data será vacío
    const { data, error: dbError } = await supabase
        .from('library_books')
        .delete()
        .eq('id', bookId)
        .select(); // <--- ESTO ES LO QUE FALTABA

    if (dbError) throw new Error("Error DB: " + dbError.message);

    // Si data está vacío, significa que NO se borró nada (probablemente permisos)
    if (!data || data.length === 0) {
        throw new Error("NO SE PUDO ELIMINAR: Permiso denegado por el servidor o el libro ya no existe.");
    }

    // 2. Eliminar archivo físico
    if (fileUrl && fileUrl.includes('/storage/v1/object/public/books/')) {
        try {
            const parts = fileUrl.split('/books/');
            const fileName = parts.length > 1 ? parts.pop() : null;
            if (fileName) {
                await supabase.storage.from('books').remove([decodeURIComponent(fileName)]);
            }
        } catch (e) {
            console.warn("No se pudo borrar el archivo físico:", e);
        }
    }
};