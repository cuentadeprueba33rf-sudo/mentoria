import React, { useState, useEffect, useRef } from 'react';
import { supabase, uploadBookFile, addBookToDatabase, updateBookInDatabase, deleteBookFromLibrary } from '../services/supabase';
import { IconSearch, IconBook, IconExternalLink, IconChevronLeft, IconLibrary, IconRefresh, IconWand, IconTrash, IconEdit } from './Icons';
import { SubjectCategory } from '../types';

type LibrarySource = 'google' | 'gutenberg' | 'mentor_ia';

interface Book {
  id: string;
  title: string;
  author: string;
  coverUrl: string;
  description: string;
  category?: string;
  source: LibrarySource;
  googleId?: string;
  canEmbed?: boolean;
  previewLink?: string;
  pdfUrl?: string;
}

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
      description: item.volumeInfo.description || 'Sin descripción.',
      category: 'Otras',
      source: 'google',
      googleId: item.id,
      canEmbed: item.accessInfo?.embeddable || false,
      previewLink: item.volumeInfo.previewLink
    }));
  } catch (e) { return []; }
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
      description: item.volumeInfo.description || 'Libro gratuito.',
      category: 'Literatura',
      source: 'gutenberg',
      googleId: item.id,
      canEmbed: true,
      previewLink: item.volumeInfo.previewLink
    }));
  } catch (e) { return []; }
};

const fetchRecommendedBooks = async (): Promise<Book[]> => {
    const { data, error } = await supabase.from('library_books').select('*').order('created_at', { ascending: false });
    if (error || !data) return [];
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
}

const transformDriveLink = (url: string) => {
    if (!url || !url.includes('drive.google.com')) return url;
    const idMatch = url.match(/\/d\/([a-zA-Z0-9_-]+)/) || url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
    return (idMatch && idMatch[1]) ? `https://drive.google.com/file/d/${idMatch[1]}/preview` : url;
}

const transformDriveCoverImage = (url: string) => {
    if (!url || !url.includes('drive.google.com')) return url;
    const idMatch = url.match(/\/d\/([a-zA-Z0-9_-]+)/) || url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
    return (idMatch && idMatch[1]) ? `https://drive.google.com/thumbnail?id=${idMatch[1]}&sz=w800` : url;
}

export const Library: React.FC = () => {
  const [query, setQuery] = useState('');
  const [activeSource, setActiveSource] = useState<LibrarySource>('mentor_ia');
  const [books, setBooks] = useState<Book[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const topRef = useRef<HTMLDivElement>(null);
  const [readingBook, setReadingBook] = useState<Book | null>(null);

  // Admin State
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  
  // Upload/Edit State
  const [editingBook, setEditingBook] = useState<Book | null>(null);
  const [uploadMode, setUploadMode] = useState<'file' | 'url'>('url');
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadAuthor, setUploadAuthor] = useState('');
  const [uploadCover, setUploadCover] = useState(''); 
  const [uploadCategory, setUploadCategory] = useState('Matemáticas');
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [externalUrl, setExternalUrl] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    const checkSession = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user?.email === 'samuelcasseresbx@gmail.com') setIsAdmin(true);
    };
    checkSession();
    handleSearch(new Event('submit') as any, activeSource === 'mentor_ia' ? '' : 'ciencia');
  }, []);

  const handleAdminLogin = async (e: React.FormEvent) => {
      e.preventDefault();
      setLoginError('');
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error || data.session?.user.email !== 'samuelcasseresbx@gmail.com') {
          setLoginError('Acceso denegado.');
          if(!error) await supabase.auth.signOut();
          return;
      }
      setIsAdmin(true);
      setShowAdminLogin(false);
  };

  const handleEditClick = (book: Book) => {
      setEditingBook(book);
      setUploadTitle(book.title);
      setUploadAuthor(book.author);
      setUploadCover(book.coverUrl);
      setUploadCategory(book.category || 'Otras');
      setUploadMode('url');
      setExternalUrl(book.pdfUrl || '');
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
          let finalFileUrl = externalUrl;
          if (uploadMode === 'file' && uploadFile) {
              const publicUrl = await uploadBookFile(uploadFile);
              if (publicUrl) finalFileUrl = publicUrl;
          } else if (uploadMode === 'url') {
               finalFileUrl = transformDriveLink(externalUrl);
          }
          const finalCoverUrl = transformDriveCoverImage(uploadCover);

          if (editingBook) {
               await updateBookInDatabase(editingBook.id, {
                   title: uploadTitle, author: uploadAuthor, category: uploadCategory,
                   cover_url: finalCoverUrl, file_url: finalFileUrl
               });
               alert('¡Libro actualizado!');
               cancelEdit();
          } else {
              await addBookToDatabase({
                  title: uploadTitle, author: uploadAuthor, category: uploadCategory,
                  file_url: finalFileUrl, cover_url: finalCoverUrl
              });
              setUploadTitle(''); setUploadAuthor(''); setUploadCover(''); setUploadFile(null); setExternalUrl('');
              alert('¡Libro agregado!');
          }
          handleSearch(new Event('submit') as any);
      } catch (error: any) {
          alert(`Error: ${error.message}`);
      } finally {
          setIsUploading(false);
      }
  };

  const handleDeleteBook = async (book: Book) => {
      if (!window.confirm(`¿Eliminar "${book.title}" definitivamente?`)) return;

      setIsLoading(true); 
      // Optimistic update removal
      const previousBooks = [...books];
      setBooks(books.filter(b => b.id !== book.id));

      try {
          await deleteBookFromLibrary(book.id, book.pdfUrl || '');
          alert('Libro eliminado correctamente.');
          // Refresh data strictly
          handleSearch(new Event('submit') as any);
      } catch (error: any) {
          // Revert optimistic update if failed
          setBooks(previousBooks);
          console.error(error);
          alert(`ERROR CRÍTICO: ${error.message}`);
      } finally {
          setIsLoading(false);
      }
  };

  const handleSearch = async (e: React.FormEvent, overrideQuery?: string) => {
    if (e) e.preventDefault();
    setIsLoading(true);
    
    let results: Book[] = [];
    const q = overrideQuery !== undefined ? overrideQuery : query;

    if (activeSource === 'mentor_ia') {
        const all = await fetchRecommendedBooks();
        results = q ? all.filter(b => b.title.toLowerCase().includes(q.toLowerCase())) : all;
    } else if (q.trim()) {
        results = activeSource === 'google' ? await searchGoogleBooks(q) : await searchClassics(q);
    }
    
    setBooks(results);
    setIsLoading(false);
  };

  useEffect(() => {
    setQuery('');
    handleSearch(new Event('submit') as any, activeSource === 'mentor_ia' ? '' : (activeSource === 'gutenberg' ? 'literatura' : 'matemáticas'));
  }, [activeSource]);

  if (readingBook) {
    const embedUrl = (readingBook.source === 'mentor_ia' && readingBook.pdfUrl) 
        ? readingBook.pdfUrl 
        : `https://books.google.com/books?id=${readingBook.googleId}&printsec=frontcover&output=embed`;

    return (
      <div className="absolute inset-0 z-50 bg-white dark:bg-slate-900 flex flex-col">
        <div className="h-14 border-b dark:border-slate-800 flex items-center justify-between px-4 bg-white dark:bg-slate-900">
          <button onClick={() => setReadingBook(null)} className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
            <IconChevronLeft className="w-5 h-5" /> <span>Cerrar</span>
          </button>
          <span className="text-xs font-bold uppercase truncate max-w-[200px] text-slate-500">{readingBook.title}</span>
          <div className="w-6"></div>
        </div>
        <iframe src={embedUrl} className="flex-1 w-full border-none bg-white" title="Reader" allowFullScreen />
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto pb-24 md:pb-12 scroll-smooth">
      <div ref={topRef} className="max-w-7xl mx-auto px-4 md:px-8 pt-6">
        <div className="mb-8 relative">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
            <div>
                <div className="flex items-center gap-3 mb-2">
                    <div className="p-2.5 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl text-indigo-600 dark:text-indigo-400">
                        <IconLibrary className="w-8 h-8" />
                    </div>
                    <div className="flex items-center gap-2">
                        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">Biblioteca</h1>
                        <button onClick={() => setShowAdminLogin(!showAdminLogin)} className="opacity-10 hover:opacity-100">🔒</button>
                    </div>
                </div>
                <p className="text-slate-500 text-sm">Recursos educativos curados para ti.</p>
            </div>
            <div className="bg-slate-100 dark:bg-slate-800 p-1 rounded-xl flex gap-1 overflow-x-auto no-scrollbar">
                 {['mentor_ia', 'gutenberg', 'google'].map((src) => (
                     <button
                        key={src}
                        onClick={() => setActiveSource(src as any)}
                        className={`px-4 py-2 rounded-lg text-sm font-bold capitalize transition-all whitespace-nowrap ${activeSource === src ? 'bg-white dark:bg-slate-600 shadow-sm text-slate-900 dark:text-white' : 'text-slate-500'}`}
                    >
                        {src === 'mentor_ia' ? '⭐ Premium' : src}
                    </button>
                 ))}
            </div>
          </div>

          {showAdminLogin && !isAdmin && (
              <div className="mb-6 bg-slate-100 dark:bg-slate-800 p-6 rounded-2xl max-w-md mx-auto">
                  <form onSubmit={handleAdminLogin} className="flex flex-col gap-3">
                      <input type="email" placeholder="Email admin" value={email} onChange={e => setEmail(e.target.value)} className="p-3 rounded-lg border dark:bg-slate-700 dark:border-slate-600" />
                      <input type="password" placeholder="Contraseña" value={password} onChange={e => setPassword(e.target.value)} className="p-3 rounded-lg border dark:bg-slate-700 dark:border-slate-600" />
                      <button type="submit" className="bg-slate-900 text-white py-2 rounded-lg font-bold">Entrar</button>
                  </form>
                  {loginError && <p className="text-red-500 text-sm mt-2">{loginError}</p>}
              </div>
          )}

          {isAdmin && (
              <div className={`mb-6 p-6 rounded-2xl border ${editingBook ? 'bg-amber-50 border-amber-200' : 'bg-violet-50 border-violet-200'} dark:bg-slate-800 dark:border-slate-700`}>
                   <h3 className="font-bold mb-4 flex items-center gap-2">{editingBook ? 'Editando Libro' : 'Nuevo Libro'} <button onClick={() => setIsAdmin(false)} className="text-xs underline text-slate-400 font-normal">Salir</button></h3>
                   <form onSubmit={handleUploadOrUpdate} className="grid md:grid-cols-2 gap-4">
                      <input type="text" placeholder="Título" value={uploadTitle} onChange={e => setUploadTitle(e.target.value)} className="p-2 border rounded-lg dark:bg-slate-900" required />
                      <input type="text" placeholder="Autor" value={uploadAuthor} onChange={e => setUploadAuthor(e.target.value)} className="p-2 border rounded-lg dark:bg-slate-900" required />
                      <select value={uploadCategory} onChange={e => setUploadCategory(e.target.value)} className="p-2 border rounded-lg dark:bg-slate-900">
                        {Object.values(SubjectCategory).map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                      <input type="text" placeholder="URL Portada" value={uploadCover} onChange={e => setUploadCover(e.target.value)} className="p-2 border rounded-lg dark:bg-slate-900" />
                      <div className="md:col-span-2 flex gap-2">
                           <button type="button" onClick={() => setUploadMode('url')} className={`flex-1 py-1 rounded ${uploadMode==='url'?'bg-blue-100 text-blue-700':'bg-slate-200'}`}>Enlace</button>
                           <button type="button" onClick={() => setUploadMode('file')} className={`flex-1 py-1 rounded ${uploadMode==='file'?'bg-blue-100 text-blue-700':'bg-slate-200'}`}>Archivo</button>
                      </div>
                      <div className="md:col-span-2">
                          {uploadMode === 'url' ? 
                              <input type="text" placeholder="Enlace PDF" value={externalUrl} onChange={e => setExternalUrl(e.target.value)} className="w-full p-2 border rounded-lg dark:bg-slate-900" /> :
                              <input type="file" accept="application/pdf" onChange={e => setUploadFile(e.target.files?.[0] || null)} className="w-full" />
                          }
                      </div>
                      <div className="md:col-span-2 flex gap-2">
                        {editingBook && <button type="button" onClick={cancelEdit} className="flex-1 py-2 bg-slate-200 rounded-lg">Cancelar</button>}
                        <button type="submit" disabled={isUploading} className="flex-1 py-2 bg-slate-900 text-white rounded-lg font-bold">{isUploading ? '...' : 'Guardar'}</button>
                      </div>
                   </form>
              </div>
          )}

          <form onSubmit={e => handleSearch(e)} className="relative">
              <input type="text" value={query} onChange={e => setQuery(e.target.value)} placeholder="Buscar..." className="w-full pl-12 pr-4 py-3 rounded-2xl border dark:bg-slate-800 dark:border-slate-700 outline-none focus:ring-2 ring-indigo-500" />
              <IconSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
          </form>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-5 gap-4">
            {books.map((book) => (
                <div key={book.id} className="bg-white dark:bg-slate-800 rounded-xl overflow-hidden shadow-sm border border-slate-100 dark:border-slate-700 hover:shadow-md transition-all flex flex-col h-full group">
                    <div className="aspect-[2/3] bg-slate-100 relative overflow-hidden">
                        {book.coverUrl ? <img src={book.coverUrl} alt={book.title} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-slate-300"><IconBook className="w-10 h-10"/></div>}
                        {book.source === 'mentor_ia' && <span className="absolute top-2 right-2 bg-violet-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">PRO</span>}
                    </div>
                    <div className="p-3 flex flex-col flex-1">
                        <h3 className="font-bold text-sm leading-tight mb-1 line-clamp-2 dark:text-white">{book.title}</h3>
                        <p className="text-xs text-slate-500 mb-2">{book.author}</p>
                        <div className="mt-auto pt-2 border-t dark:border-slate-700 flex flex-col gap-2">
                            <button onClick={() => book.canEmbed ? setReadingBook(book) : window.open(book.previewLink, '_blank')} className="w-full py-1.5 bg-slate-100 dark:bg-slate-700 text-xs font-bold rounded hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300">
                                {book.canEmbed ? 'Leer' : 'Ver'}
                            </button>
                            {isAdmin && book.source === 'mentor_ia' && (
                                <div className="flex gap-1">
                                    <button onClick={(e) => {e.stopPropagation(); handleEditClick(book)}} className="flex-1 py-1 bg-amber-100 text-amber-700 text-[10px] font-bold rounded"><IconEdit className="w-3 h-3 mx-auto"/></button>
                                    <button onClick={(e) => {e.stopPropagation(); handleDeleteBook(book)}} className="flex-1 py-1 bg-red-100 text-red-700 text-[10px] font-bold rounded"><IconTrash className="w-3 h-3 mx-auto"/></button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            ))}
        </div>
      </div>
    </div>
  );
};