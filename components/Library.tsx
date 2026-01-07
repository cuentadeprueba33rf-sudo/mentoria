import React, { useState, useEffect, useRef } from 'react';
import { supabase, uploadBookFile, addBookToDatabase, updateBookInDatabase, deleteBookFromLibrary } from '../services/supabase';
import { IconSearch, IconBook, IconExternalLink, IconChevronLeft, IconLibrary, IconRefresh, IconWand, IconTrash, IconEdit } from './Icons';
import { SubjectCategory } from '../types';

// --- TYPES ---

type LibrarySource = 'google' | 'gutenberg' | 'mentor_ia';

interface Book {
  id: string;
  title: string;
  author: string;
  coverUrl: string;
  description: string;
  category?: string; // Added category for easier editing
  source: LibrarySource;
  // Google specific
  googleId?: string;
  canEmbed?: boolean;
  previewLink?: string;
  // Supabase specific
  pdfUrl?: string;
}

// --- API SERVICES ---

const searchGoogleBooks = async (query: string): Promise<Book[]> => {
  try {
    const res = await fetch(`https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&maxResults=20&filter=ebooks&langRestrict=es`);
    const data = await res.json();
    
    if (!data.items) return [];

    return data.items.map((item: any) => ({
      id: item.id,
      title: item.volumeInfo.title,
      author: item.volumeInfo.authors ? item.volumeInfo.authors[0] : 'Autor desconocido',
      coverUrl: item.volumeInfo.imageLinks?.thumbnail?.replace('http:', 'https:') || '',
      description: item.volumeInfo.description || 'Sin descripción disponible.',
      category: 'Otras',
      source: 'google',
      googleId: item.id,
      canEmbed: item.accessInfo?.embeddable || false,
      previewLink: item.volumeInfo.previewLink
    }));
  } catch (e) {
    console.error("Google Books API Error:", e);
    return [];
  }
};

const searchClassics = async (query: string): Promise<Book[]> => {
  try {
    const res = await fetch(`https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&maxResults=20&filter=free-ebooks&printType=books&langRestrict=es`);
    const data = await res.json();

    if (!data.items) return [];

    return data.items.map((item: any) => ({
      id: `free_${item.id}`,
      title: item.volumeInfo.title,
      author: item.volumeInfo.authors ? item.volumeInfo.authors[0] : 'Dominio Público',
      coverUrl: item.volumeInfo.imageLinks?.thumbnail?.replace('http:', 'https:') || '',
      description: item.volumeInfo.description || 'Libro completo disponible gratuitamente.',
      category: 'Literatura',
      source: 'gutenberg',
      googleId: item.id,
      canEmbed: true,
      previewLink: item.volumeInfo.previewLink
    }));
  } catch (e) {
    console.error("Gutenberg API Error:", e);
    return [];
  }
};

const fetchRecommendedBooks = async (): Promise<Book[]> => {
    try {
        const { data, error } = await supabase
            .from('library_books')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            // Logueamos el error de forma legible
            console.error("Supabase Fetch Error:", error.message, error.details || '');
            throw error;
        }
        if (!data) return [];

        return data.map((item: any) => ({
            id: item.id,
            title: item.title,
            author: item.author,
            coverUrl: item.cover_url || '',
            description: `Categoría: ${item.category}`,
            category: item.category,
            source: 'mentor_ia',
            canEmbed: true,
            pdfUrl: item.file_url
        }));
    } catch (e: any) {
        // Evitamos el [object Object] logueando el mensaje o stringificando
        console.error("Error cargando libros recomendados:", e.message || JSON.stringify(e));
        return [];
    }
}

// --- GOOGLE DRIVE LINK TRANSFORMER ---
// Versión mejorada y robusta para detectar IDs de Google Drive
const transformDriveLink = (url: string): string => {
    if (!url.includes('drive.google.com')) return url;

    // Regex para capturar ID en formatos comunes:
    // 1. /file/d/ID_AQUI/
    // 2. id=ID_AQUI (común en enlaces antiguos o de exportación)
    // 3. open?id=ID_AQUI
    const idMatch = url.match(/\/d\/([a-zA-Z0-9_-]+)/) || 
                    url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
    
    if (idMatch && idMatch[1]) {
        // Retornamos siempre la versión /preview que permite el embed sin headers restrictivos
        return `https://drive.google.com/file/d/${idMatch[1]}/preview`;
    }
    
    return url;
}

// --- COMPONENTS ---

export const Library: React.FC = () => {
  const [query, setQuery] = useState('');
  const [activeSource, setActiveSource] = useState<LibrarySource>('mentor_ia');
  const [books, setBooks] = useState<Book[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const topRef = useRef<HTMLDivElement>(null);
  
  // Reader State
  const [readingBook, setReadingBook] = useState<Book | null>(null);

  // --- ADMIN STATE ---
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  
  // Upload/Edit State
  const [editingBook, setEditingBook] = useState<Book | null>(null);
  const [uploadMode, setUploadMode] = useState<'file' | 'url'>('url'); // Default to URL for large files
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadAuthor, setUploadAuthor] = useState('');
  const [uploadCover, setUploadCover] = useState(''); 
  const [uploadCategory, setUploadCategory] = useState('Matemáticas');
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [externalUrl, setExternalUrl] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  // Check Session
  useEffect(() => {
    const checkSession = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user?.email === 'samuelcasseresbx@gmail.com') {
            setIsAdmin(true);
        }
    };
    checkSession();
    
    // Initial load
    if (activeSource === 'mentor_ia') {
        handleSearch(new Event('submit') as any);
    } else {
        handleSearch(new Event('submit') as any, 'ciencia');
    }
  }, []);

  const handleAdminLogin = async (e: React.FormEvent) => {
      e.preventDefault();
      setLoginError('');
      
      const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password
      });

      if (error) {
          setLoginError('Credenciales incorrectas o usuario no creado.');
          return;
      }

      if (data.session?.user.email === 'samuelcasseresbx@gmail.com') {
          setIsAdmin(true);
          setShowAdminLogin(false);
      } else {
          setLoginError('No tienes permisos de administrador.');
          await supabase.auth.signOut();
      }
  };

  const handleEditClick = (book: Book) => {
      setEditingBook(book);
      setUploadTitle(book.title);
      setUploadAuthor(book.author);
      setUploadCover(book.coverUrl);
      setUploadCategory(book.category || 'Otras');
      
      // Assume URL mode for editing to show the current link by default
      setUploadMode('url');
      setExternalUrl(book.pdfUrl || '');
      setUploadFile(null); // Clear file input
      
      // Scroll to top to see the edit form
      topRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const cancelEdit = () => {
      setEditingBook(null);
      setUploadTitle('');
      setUploadAuthor('');
      setUploadCover('');
      setUploadCategory('Matemáticas');
      setExternalUrl('');
      setUploadFile(null);
  };

  const handleUploadOrUpdate = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!uploadTitle || !uploadAuthor) return;

      setIsUploading(true);
      
      try {
          let finalFileUrl = externalUrl; // Default to existing/entered URL

          // Handle file upload if a NEW file is selected
          if (uploadMode === 'file' && uploadFile) {
              const publicUrl = await uploadBookFile(uploadFile);
              if (!publicUrl) throw new Error("No se pudo obtener la URL pública del archivo.");
              finalFileUrl = publicUrl;
          } else if (uploadMode === 'url') {
               if (!externalUrl) throw new Error("Debes ingresar una URL válida.");
               finalFileUrl = transformDriveLink(externalUrl);
          }

          if (editingBook) {
              // UPDATE MODE
               console.log("Actualizando libro...", editingBook.id);
               await updateBookInDatabase(editingBook.id, {
                   title: uploadTitle,
                   author: uploadAuthor,
                   category: uploadCategory,
                   cover_url: uploadCover,
                   file_url: finalFileUrl
               });
               alert('¡Libro actualizado correctamente!');
               cancelEdit(); // Exit edit mode
          } else {
              // CREATE MODE
              console.log("Guardando libro nuevo con URL:", finalFileUrl);
              await addBookToDatabase({
                  title: uploadTitle,
                  author: uploadAuthor,
                  category: uploadCategory,
                  file_url: finalFileUrl,
                  cover_url: uploadCover
              });
              
              // Reset Form
              setUploadTitle('');
              setUploadAuthor('');
              setUploadCover('');
              setUploadFile(null);
              setExternalUrl('');
              alert('¡Libro agregado correctamente!');
          }

          // Refresh List
          handleSearch(new Event('submit') as any);

      } catch (error: any) {
          console.error("Action Error:", error);
          let msg = 'Error desconocido.';
          if (error.message) {
              msg = `Error: ${error.message}`;
          }
          alert(msg);
      } finally {
          setIsUploading(false);
      }
  };

  const handleDeleteBook = async (book: Book) => {
      if (!window.confirm(`¿Estás seguro de que quieres eliminar "${book.title}"? Esta acción no se puede deshacer.`)) {
          return;
      }

      try {
          await deleteBookFromLibrary(book.id, book.pdfUrl || '');
          // Remove from local state immediately
          setBooks(prev => prev.filter(b => b.id !== book.id));
          alert('Libro eliminado correctamente.');
      } catch (error: any) {
          console.error("Delete Error:", error);
          alert(`Error al eliminar: ${error.message}`);
      }
  };

  const handleSearch = async (e: React.FormEvent, overrideQuery?: string) => {
    if (e) e.preventDefault();
    
    if (activeSource === 'mentor_ia') {
        setIsLoading(true);
        const results = await fetchRecommendedBooks();
        const q = overrideQuery || query;
        if (q) {
            const filtered = results.filter(b => b.title.toLowerCase().includes(q.toLowerCase()) || b.description.toLowerCase().includes(q.toLowerCase()));
            setBooks(filtered);
        } else {
            setBooks(results);
        }
        setIsLoading(false);
        return;
    }

    const q = overrideQuery || query;
    if (!q.trim()) return;

    setIsLoading(true);
    setBooks([]);

    let results: Book[] = [];
    
    if (activeSource === 'google') {
      results = await searchGoogleBooks(q);
    } else {
      results = await searchClassics(q);
    }

    setBooks(results);
    setIsLoading(false);
  };

  useEffect(() => {
    if (activeSource === 'mentor_ia') {
         setQuery('');
         handleSearch(new Event('submit') as any);
    } else {
        if (query) {
            handleSearch(new Event('submit') as any);
        } else {
            handleSearch(new Event('submit') as any, activeSource === 'gutenberg' ? 'literatura' : 'matemáticas');
        }
    }
  }, [activeSource]);


  // --- READER RENDER ---
  if (readingBook) {
    let embedUrl = '';
    
    if (readingBook.source === 'mentor_ia' && readingBook.pdfUrl) {
        embedUrl = readingBook.pdfUrl;
    } else {
        embedUrl = `https://books.google.com/books?id=${readingBook.googleId}&printsec=frontcover&output=embed`;
    }

    return (
      <div className="absolute inset-0 z-50 bg-white dark:bg-slate-900 flex flex-col animate-fade-in">
        <div className="h-14 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-4 bg-white dark:bg-slate-900 shadow-sm shrink-0">
          <button 
            onClick={() => setReadingBook(null)}
            className="flex items-center gap-2 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors"
          >
            <IconChevronLeft className="w-5 h-5" />
            <span className="font-semibold">Cerrar Libro</span>
          </button>
          <span className="text-xs font-bold uppercase truncate max-w-[200px] text-slate-500">
            {readingBook.title}
          </span>
          <div className="w-6"></div>
        </div>
        
        <div className="flex-1 w-full bg-slate-100 dark:bg-black relative">
             <iframe 
               src={embedUrl}
               className="w-full h-full border-none bg-white"
               title="Book Reader"
               allow="autoplay; encrypted-media"
               allowFullScreen
             />
        </div>
      </div>
    );
  }

  // --- LIBRARY GRID RENDER ---
  return (
    <div className="flex-1 overflow-y-auto pb-32 md:pb-12 scroll-smooth">
      <div ref={topRef} className="max-w-7xl mx-auto px-4 md:px-8 pt-6">
        
        {/* Header & Controls */}
        <div className="mb-8 animate-fade-in relative">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
            <div>
                <div className="flex items-center gap-3 mb-2">
                    <div className="p-2.5 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl text-indigo-600 dark:text-indigo-400">
                    <IconLibrary className="w-8 h-8" />
                    </div>
                    <div className="flex items-center gap-2">
                        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white">
                        Biblioteca Universal
                        </h1>
                        {/* SECRET LOCK BUTTON */}
                        <button 
                            onClick={() => setShowAdminLogin(!showAdminLogin)}
                            className="opacity-10 hover:opacity-100 transition-opacity p-1"
                            title="Admin Access"
                        >
                            🔒
                        </button>
                    </div>
                </div>
                <p className="text-slate-600 dark:text-slate-400 max-w-xl">
                    Accede a conocimiento global.
                </p>
            </div>

            {/* Source Toggle */}
            <div className="bg-slate-200 dark:bg-slate-800 p-1 rounded-xl flex shrink-0 self-start md:self-end overflow-x-auto max-w-full">
                 <button
                    onClick={() => setActiveSource('mentor_ia')}
                    className={`px-4 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${
                        activeSource === 'mentor_ia'
                        ? 'bg-white dark:bg-slate-600 text-violet-600 dark:text-violet-300 shadow-sm'
                        : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                    }`}
                >
                    ⭐ Recomendados
                </button>
                <button
                    onClick={() => setActiveSource('gutenberg')}
                    className={`px-4 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${
                        activeSource === 'gutenberg'
                        ? 'bg-white dark:bg-slate-600 text-emerald-600 dark:text-emerald-300 shadow-sm'
                        : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                    }`}
                >
                    Clásicos
                </button>
                <button
                    onClick={() => setActiveSource('google')}
                    className={`px-4 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${
                        activeSource === 'google'
                        ? 'bg-white dark:bg-slate-600 text-blue-600 dark:text-blue-300 shadow-sm'
                        : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                    }`}
                >
                    Modernos
                </button>
            </div>
          </div>

          {/* ADMIN PANELS */}
          
          {/* 1. Login Panel */}
          {showAdminLogin && !isAdmin && (
              <div className="mb-6 bg-slate-100 dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 animate-slide-up max-w-2xl mx-auto shadow-lg">
                  <h3 className="font-bold text-slate-800 dark:text-white mb-2 text-lg">Acceso Bibliotecario (Privado)</h3>
                  <p className="text-sm text-slate-500 mb-4">
                    Este panel es solo para el administrador. Para crear tu contraseña o usuario, debes hacerlo desde el panel de Supabase.
                  </p>
                  
                  <form onSubmit={handleAdminLogin} className="flex flex-col gap-3">
                      <div className="flex flex-col md:flex-row gap-3">
                        <input 
                            type="email" 
                            placeholder="Email admin" 
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            className="flex-1 px-4 py-3 rounded-xl border dark:bg-slate-700 dark:border-slate-600 dark:text-white focus:ring-2 focus:ring-violet-500 outline-none"
                        />
                        <input 
                            type="password" 
                            placeholder="Contraseña" 
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            className="flex-1 px-4 py-3 rounded-xl border dark:bg-slate-700 dark:border-slate-600 dark:text-white focus:ring-2 focus:ring-violet-500 outline-none"
                        />
                      </div>
                      <div className="flex items-center justify-between mt-2">
                        <a 
                            href="https://supabase.com/dashboard/project/prdridyufkqjeakzbekb/auth/users" 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-xs text-violet-600 dark:text-violet-400 hover:underline flex items-center gap-1"
                        >
                            <IconExternalLink className="w-3 h-3" /> Crear/Gestionar Usuario
                        </a>
                        <button type="submit" className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-6 py-2.5 rounded-xl font-bold hover:opacity-90 transition-opacity">
                            Acceder
                        </button>
                      </div>
                  </form>
                  {loginError && <div className="mt-3 p-3 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-300 text-sm rounded-lg">{loginError}</div>}
              </div>
          )}

          {/* 2. Upload/Edit Panel (Only Visible to Admin) */}
          {isAdmin && (
              <div className={`mb-6 p-6 rounded-2xl border animate-slide-up transition-colors duration-300 ${editingBook ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-700' : 'bg-violet-50 dark:bg-violet-900/20 border-violet-200 dark:border-violet-700'}`}>
                  <div className="flex justify-between items-center mb-4">
                      <h3 className={`font-bold flex items-center gap-2 ${editingBook ? 'text-amber-900 dark:text-amber-100' : 'text-violet-900 dark:text-violet-100'}`}>
                          {editingBook ? <><IconEdit className="w-5 h-5"/> Editando: {editingBook.title}</> : <><IconWand className="w-5 h-5"/> Panel de Carga (Admin: Samuel)</>}
                      </h3>
                      {editingBook ? (
                           <button onClick={cancelEdit} className="text-sm font-bold text-amber-600 hover:text-amber-800 dark:text-amber-400">
                               ✕ Cancelar Edición
                           </button>
                      ) : (
                           <button onClick={() => { setIsAdmin(false); setShowAdminLogin(false); }} className="text-xs text-violet-500 underline">Cerrar Sesión</button>
                      )}
                  </div>
                  
                  {/* Toggle Upload Mode */}
                  <div className="flex gap-2 mb-4 bg-white dark:bg-slate-800 p-1.5 rounded-lg w-fit shadow-sm">
                      <button 
                        onClick={() => setUploadMode('url')}
                        className={`px-3 py-1.5 rounded-md text-xs font-bold transition-colors ${uploadMode === 'url' ? 'bg-violet-100 text-violet-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                      >
                          ☁️ Libros Pesados (+50MB)
                      </button>
                      <button 
                        onClick={() => setUploadMode('file')}
                        className={`px-3 py-1.5 rounded-md text-xs font-bold transition-colors ${uploadMode === 'file' ? 'bg-violet-100 text-violet-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                      >
                          📂 Archivos Ligeros
                      </button>
                  </div>

                  {/* INFO ALERT BOX FOR LARGE FILES */}
                  {uploadMode === 'url' && (
                    <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-200 text-sm rounded-lg border border-blue-100 dark:border-blue-800">
                        <div className="flex items-center gap-2 font-bold mb-2 text-blue-700 dark:text-blue-300">
                           <span>💡</span> Cómo subir libros de +60MB (Gratis)
                        </div>
                        <ol className="list-decimal pl-5 space-y-1 text-xs md:text-sm opacity-90">
                            <li>Sube el PDF a tu <strong>Google Drive personal</strong>.</li>
                            <li>Clic derecho en el archivo → Compartir.</li>
                            <li>Cambia el acceso a: <strong>"Cualquier persona con el enlace"</strong>.</li>
                            <li>Copia ese enlace y <strong>pégalo abajo</strong>.</li>
                        </ol>
                        <p className="mt-2 text-xs text-blue-600 dark:text-blue-400 font-medium">
                            * El sistema convertirá automáticamente el enlace para que se pueda leer aquí.
                        </p>
                    </div>
                  )}
                  {uploadMode === 'file' && !editingBook && (
                    <div className="mb-4 p-3 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 text-xs rounded-lg border border-amber-100 dark:border-amber-800 flex items-start gap-2">
                        <span>⚠️</span>
                        <div>
                            <strong>Límite Estricto: 50MB</strong>
                            <p className="mt-1">
                                Si tu archivo pesa 60MB o más, la subida fallará.
                                <br />
                                <a href="https://www.ilovepdf.com/compress_pdf" target="_blank" rel="noopener noreferrer" className="underline font-bold hover:text-amber-900">
                                    Haz clic aquí para comprimirlo gratis
                                </a> antes de subirlo, o usa la opción "Libros Pesados".
                            </p>
                        </div>
                    </div>
                  )}
                  
                  <form onSubmit={handleUploadOrUpdate} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <input 
                        type="text" 
                        placeholder="Título del Libro" 
                        value={uploadTitle}
                        onChange={e => setUploadTitle(e.target.value)}
                        className={`px-4 py-2 rounded-xl border-2 dark:bg-slate-900 outline-none ${editingBook ? 'border-amber-100 focus:border-amber-500 dark:border-amber-800' : 'border-violet-100 focus:border-violet-500 dark:border-violet-800'}`}
                        required
                      />
                      <input 
                        type="text" 
                        placeholder="Autor" 
                        value={uploadAuthor}
                        onChange={e => setUploadAuthor(e.target.value)}
                        className={`px-4 py-2 rounded-xl border-2 dark:bg-slate-900 outline-none ${editingBook ? 'border-amber-100 focus:border-amber-500 dark:border-amber-800' : 'border-violet-100 focus:border-violet-500 dark:border-violet-800'}`}
                        required
                      />
                      <select 
                        value={uploadCategory}
                        onChange={e => setUploadCategory(e.target.value)}
                        className={`px-4 py-2 rounded-xl border-2 dark:bg-slate-900 outline-none ${editingBook ? 'border-amber-100 focus:border-amber-500 dark:border-amber-800' : 'border-violet-100 focus:border-violet-500 dark:border-violet-800'}`}
                      >
                          {Object.values(SubjectCategory).map(cat => (
                              <option key={cat} value={cat}>{cat}</option>
                          ))}
                      </select>

                      <input 
                        type="text" 
                        placeholder="URL de Portada (Imagen Opcional)" 
                        value={uploadCover}
                        onChange={e => setUploadCover(e.target.value)}
                        className={`px-4 py-2 rounded-xl border-2 dark:bg-slate-900 outline-none ${editingBook ? 'border-amber-100 focus:border-amber-500 dark:border-amber-800' : 'border-violet-100 focus:border-violet-500 dark:border-violet-800'}`}
                      />
                      
                      {/* Dynamic Input based on Mode */}
                      <div className="relative md:col-span-2">
                          {uploadMode === 'file' ? (
                            <input 
                                type="file" 
                                accept=".pdf"
                                onChange={e => setUploadFile(e.target.files ? e.target.files[0] : null)}
                                className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-violet-100 file:text-violet-700 hover:file:bg-violet-200"
                                required={uploadMode === 'file' && !editingBook} // Only required if creating new
                            />
                          ) : (
                            <input 
                                type="url" 
                                placeholder="Pegar enlace del PDF (Google Drive, etc)..."
                                value={externalUrl}
                                onChange={e => setExternalUrl(e.target.value)}
                                className={`w-full h-full px-4 py-2 rounded-xl border-2 dark:bg-slate-900 outline-none ${editingBook ? 'border-amber-100 focus:border-amber-500 dark:border-amber-800' : 'border-violet-100 focus:border-violet-500 dark:border-violet-800'}`}
                                required={uploadMode === 'url' && !editingBook}
                            />
                          )}
                      </div>
                      
                      <div className="md:col-span-2">
                          <button 
                            type="submit" 
                            disabled={isUploading}
                            className={`w-full text-white py-3 rounded-xl font-bold shadow-lg disabled:opacity-50 transition-all ${editingBook ? 'bg-amber-500 hover:bg-amber-600' : 'bg-violet-600 hover:bg-violet-700'}`}
                          >
                              {isUploading ? 'Procesando...' : editingBook ? '💾 Guardar Cambios' : (uploadMode === 'file' ? '✨ Subir Libro a la Nube' : '✨ Guardar Enlace (Sin Límite)')}
                          </button>
                      </div>
                  </form>
              </div>
          )}

          {/* Search Bar */}
          <div className="sticky top-0 z-20 bg-slate-50/90 dark:bg-slate-950/90 backdrop-blur-md py-2 transition-all">
            <form onSubmit={(e) => handleSearch(e)} className="relative max-w-full shadow-lg rounded-2xl">
                <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={
                    activeSource === 'mentor_ia' ? "Filtrar recomendaciones..." :
                    activeSource === 'gutenberg' ? "Busca clásicos gratis..." : "Busca libros modernos..."
                }
                className="w-full pl-12 pr-4 py-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:border-primary-500 dark:focus:border-primary-500 outline-none transition-all text-lg placeholder-slate-400 dark:text-white"
                />
                <IconSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-6 h-6" />
                <button 
                type="submit"
                disabled={isLoading}
                className="absolute right-3 top-1/2 -translate-y-1/2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-6 py-2 rounded-xl font-bold text-sm hover:opacity-90 disabled:opacity-50 transition-opacity"
                >
                {isLoading ? '...' : 'Buscar'}
                </button>
            </form>
          </div>
        </div>

        {/* CUSTOM HEADER FOR UPLOADED BOOKS */}
        {!isLoading && activeSource === 'mentor_ia' && books.length > 0 && (
            <div className="mb-6 animate-fade-in">
                 <h2 className="text-xl md:text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                    <span className="text-violet-600">📚</span> Que tal vez vayas a necesitar
                 </h2>
                 <p className="text-slate-500 text-sm mt-1">Material seleccionado especialmente por el administrador.</p>
            </div>
        )}

        {/* Results Grid */}
        {!isLoading && books.length === 0 && (
            <div className="text-center py-20 opacity-50 flex flex-col items-center animate-fade-in">
                <IconBook className="w-20 h-20 mb-4 text-slate-300 dark:text-slate-700" />
                <p className="text-slate-500 font-medium">No se encontraron resultados.</p>
                {activeSource === 'mentor_ia' && (
                     <p className="text-sm mt-2 text-slate-400">El administrador aún no ha subido libros aquí.</p>
                )}
            </div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 animate-slide-up">
            {books.map((book) => (
                <div 
                    key={book.id}
                    className="group bg-white dark:bg-slate-800 rounded-2xl overflow-hidden shadow-sm hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 border border-slate-100 dark:border-slate-700 flex flex-col h-full relative"
                >
                    {/* ADMIN ACTIONS */}
                    {isAdmin && activeSource === 'mentor_ia' && (
                        <div className="absolute top-2 left-2 z-10 flex gap-2">
                            <button 
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteBook(book);
                                }}
                                className="p-2 bg-red-500 hover:bg-red-600 text-white rounded-full shadow-lg transition-transform hover:scale-110"
                                title="Eliminar libro"
                            >
                                <IconTrash className="w-4 h-4" />
                            </button>
                            <button 
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleEditClick(book);
                                }}
                                className="p-2 bg-amber-500 hover:bg-amber-600 text-white rounded-full shadow-lg transition-transform hover:scale-110"
                                title="Editar libro"
                            >
                                <IconEdit className="w-4 h-4" />
                            </button>
                        </div>
                    )}

                    {/* Cover */}
                    <div className="aspect-[2/3] bg-slate-100 dark:bg-slate-900 relative overflow-hidden flex items-center justify-center">
                        {book.coverUrl ? (
                            <img 
                                src={book.coverUrl} 
                                alt={book.title}
                                className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
                                loading="lazy"
                            />
                        ) : (
                            <div className="text-center text-slate-400 p-4 flex flex-col items-center">
                                <IconBook className="w-12 h-12 mb-2 opacity-50" />
                                <span className="text-[10px] font-bold uppercase tracking-widest">{book.source}</span>
                            </div>
                        )}
                        
                        {/* Badge */}
                        <div className="absolute top-2 right-2">
                             {book.source === 'gutenberg' ? (
                                <span className="bg-emerald-500 text-white text-[10px] font-bold px-2 py-1 rounded-full shadow-lg">
                                    GRATIS
                                </span>
                             ) : book.source === 'mentor_ia' ? (
                                <span className="bg-violet-600 text-white text-[10px] font-bold px-2 py-1 rounded-full shadow-lg">
                                    PREMIUM
                                </span>
                             ) : book.canEmbed ? (
                                <span className="bg-blue-500 text-white text-[10px] font-bold px-2 py-1 rounded-full shadow-lg">
                                    VISTA PREVIA
                                </span>
                             ) : (
                                <span className="bg-slate-500 text-white text-[10px] font-bold px-2 py-1 rounded-full shadow-lg">
                                    INFO
                                </span>
                             )}
                        </div>
                    </div>

                    {/* Info */}
                    <div className="p-4 flex flex-col flex-1">
                        <h3 className="font-bold text-slate-900 dark:text-white text-sm line-clamp-2 mb-1 leading-snug group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                            {book.title}
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mb-3 line-clamp-1">
                            {book.author}
                        </p>
                        
                        <div className="mt-auto pt-3 border-t border-slate-100 dark:border-slate-700">
                            <button
                                onClick={() => {
                                    if (book.canEmbed) {
                                        setReadingBook(book);
                                    } else {
                                        window.open(book.previewLink, '_blank');
                                    }
                                }}
                                className={`w-full py-2 px-4 rounded-lg text-xs font-bold uppercase tracking-wide transition-colors flex items-center justify-center gap-2 ${
                                    book.canEmbed
                                    ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-primary-600 dark:hover:bg-primary-400'
                                    : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                                }`}
                            >
                                <IconBook className="w-3 h-3" />
                                {book.canEmbed ? 'Leer Ahora' : 'Ver Ficha'}
                            </button>
                        </div>
                    </div>
                </div>
            ))}
        </div>
        
        {/* Loading State */}
        {isLoading && (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                {[...Array(10)].map((_, i) => (
                    <div key={i} className="bg-white dark:bg-slate-800 rounded-2xl overflow-hidden shadow-sm border border-slate-100 dark:border-slate-700 h-[320px] animate-pulse">
                        <div className="h-2/3 bg-slate-200 dark:bg-slate-700"></div>
                        <div className="p-4 space-y-3">
                            <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded-full w-3/4"></div>
                            <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded-full w-1/2"></div>
                        </div>
                    </div>
                ))}
            </div>
        )}
      </div>
    </div>
  );
};