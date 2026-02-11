
import React, { useState, useCallback, useEffect } from 'react';
import Header from './components/Header';
import SearchBar from './components/SearchBar';
import GroupCard from './components/GroupCard';
import LoginForm from './components/LoginForm';
import AdminPanel from './components/AdminPanel';
import { huntGroupsStream, StreamUpdate } from './services/geminiService';
import { WhatsAppGroup, AppStats } from './types';

const App: React.FC = () => {
  const [view, setView] = useState<'public' | 'admin-login' | 'admin-panel'>('public');
  const [results, setResults] = useState<WhatsAppGroup[]>([]);
  const [sources, setSources] = useState<Array<{title: string, uri: string}>>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  
  const [stats, setStats] = useState<AppStats>({
    totalSearches: 0,
    groupsFound: 0,
    estimatedCost: 0
  });

  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash;
      if (hash === '#admin') setView('admin-login');
      else if (hash === '#dashboard' && localStorage.getItem('is_admin') === 'true') setView('admin-panel');
      else setView('public');
    };
    window.addEventListener('hashchange', handleHash);
    handleHash();
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  const handleSearch = useCallback(async (keyword: string) => {
    setIsLoading(true);
    setError(null);
    setResults([]);
    setSources([]);
    setHasSearched(true);
    
    document.body.classList.add('scanning');
    setStats(prev => ({ ...prev, totalSearches: prev.totalSearches + 1 }));

    try {
      await huntGroupsStream(keyword, (update: StreamUpdate) => {
        if (update.error) {
          setError(update.error);
          setIsLoading(false);
          document.body.classList.remove('scanning');
        }
        
        if (update.sources) {
          setSources(prev => {
            const existing = new Set(prev.map(p => p.uri));
            const unique = update.sources!.filter(s => !existing.has(s.uri));
            return [...prev, ...unique];
          });
        }
        
        if (update.group) {
          setResults(prev => [...prev, update.group as WhatsAppGroup]);
          setStats(s => ({ ...s, groupsFound: s.groupsFound + 1 }));
        }
        
        if (update.done) {
          setIsLoading(false);
          document.body.classList.remove('scanning');
        }
      });
    } catch (err) {
      setError("FALHA DE SINCRONIA: Tivemos um problema ao conectar com a rede de busca.");
      setIsLoading(false);
      document.body.classList.remove('scanning');
    }
  }, []);

  return (
    <div className="min-h-screen flex flex-col w-full selection:bg-green-500/20">
      <div className="scanner-line"></div>
      
      <div className="flex-grow container mx-auto max-w-7xl px-4 py-8 md:py-12">
        <Header />
        
        {view === 'public' ? (
          <div className="animate-slide-up">
            <SearchBar onSearch={handleSearch} isLoading={isLoading && results.length === 0} />

            {sources.length > 0 && (
              <div className="mb-8 px-6 py-4 glass rounded-2xl border-green-500/20 relative overflow-hidden group">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-ping"></div>
                  <span className="text-[9px] font-black text-white/40 uppercase tracking-[0.3em] font-mono-tech italic">Indexadores Ativos ({sources.length}):</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {sources.slice(0, 15).map((s, i) => (
                    <a 
                      key={i} 
                      href={s.uri} 
                      target="_blank" 
                      rel="noreferrer" 
                      className="text-[8px] bg-black/40 border border-white/5 px-3 py-1.5 rounded-lg text-slate-500 hover:text-green-400 hover:border-green-500/30 transition-all truncate max-w-[150px]"
                    >
                      {s.title}
                    </a>
                  ))}
                </div>
              </div>
            )}

            {error && (
              <div className="p-8 glass border-red-500/30 rounded-3xl text-red-400 mb-12 flex flex-col md:flex-row items-center gap-6 animate-shake">
                <i className="fas fa-radiation text-3xl animate-pulse"></i>
                <p className="text-sm font-bold uppercase tracking-tight">{error}</p>
                <button 
                  onClick={() => { setHasSearched(false); setError(null); }} 
                  className="ml-auto px-6 py-3 bg-white/5 hover:bg-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest border border-white/10 transition-all"
                >
                  Reiniciar
                </button>
              </div>
            )}

            {(isLoading || results.length > 0) && (
              <section className="mt-8">
                <div className="flex flex-col md:flex-row justify-between items-center mb-12 gap-8 px-4">
                  <div className="flex items-center gap-8">
                    <div className="flex flex-col items-center">
                      <span className="text-6xl md:text-8xl font-black text-white italic tracking-tighter leading-none">
                        {results.length}
                      </span>
                      <span className="text-[10px] font-black text-green-500 uppercase tracking-[0.5em] mt-2 font-mono-tech">Extraídos</span>
                    </div>
                    <div className="h-20 w-[1px] bg-white/10"></div>
                    <div>
                      <h2 className="text-2xl font-black text-white uppercase tracking-tighter italic leading-none">
                        Volume <br/> <span className="text-green-500">Máximo</span>
                      </h2>
                    </div>
                  </div>
                  
                  {isLoading && (
                    <div className="flex items-center gap-4 bg-green-500/5 border border-green-500/10 px-8 py-4 rounded-2xl">
                      <div className="flex gap-1.5">
                        <div className="w-1.5 h-6 bg-green-500 animate-bounce"></div>
                        <div className="w-1.5 h-6 bg-green-500 animate-bounce [animation-delay:0.2s]"></div>
                        <div className="w-1.5 h-6 bg-green-500 animate-bounce [animation-delay:0.4s]"></div>
                      </div>
                      <span className="text-green-500 text-[10px] font-black uppercase tracking-[0.4em] animate-pulse">Sincronizando Rede...</span>
                    </div>
                  )}
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-32">
                  {results.map((group) => (
                    <GroupCard key={group.id} group={group} />
                  ))}
                </div>
              </section>
            )}

            {!hasSearched && (
              <div className="mt-12 py-32 md:py-48 glass rounded-[4rem] text-center relative overflow-hidden group border-white/5 shadow-2xl">
                <div className="relative z-10 px-8">
                  <div className="w-32 h-32 bg-slate-900 rounded-3xl flex items-center justify-center mx-auto mb-12 border border-slate-800 shadow-2xl group-hover:scale-110 transition-transform duration-700">
                    <i className="fas fa-radar text-5xl text-green-500 animate-pulse"></i>
                  </div>
                  <h2 className="text-5xl md:text-8xl font-black text-white mb-8 italic uppercase tracking-tighter leading-none">
                    Massive <span className="text-gradient">V14</span>
                  </h2>
                  <p className="text-slate-400 max-w-3xl mx-auto mb-16 font-medium text-lg md:text-2xl leading-relaxed opacity-80 italic">
                    Tecnologia de busca neural otimizada para retorno de volume máximo de dados e interceptação de links ativos.
                  </p>
                  <div className="flex justify-center gap-12 opacity-30">
                    <div className="text-center">
                      <div className="text-4xl font-black text-white font-mono-tech">80+</div>
                      <div className="text-[10px] uppercase font-black tracking-widest text-green-500">Alvos/Busca</div>
                    </div>
                    <div className="text-center">
                      <div className="text-4xl font-black text-white font-mono-tech">1s</div>
                      <div className="text-[10px] uppercase font-black tracking-widest text-green-500">Latency</div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : view === 'admin-login' ? (
          <LoginForm 
            onLogin={() => { 
              localStorage.setItem('is_admin', 'true'); 
              window.location.hash = '#dashboard'; 
            }} 
            onCancel={() => window.location.hash = ''} 
          />
        ) : (
          <AdminPanel 
            stats={stats} 
            onLogout={() => { 
              localStorage.removeItem('is_admin'); 
              window.location.hash = ''; 
            }} 
            systemReady={true} 
          />
        )}
      </div>

      <footer className="py-20 border-t border-white/5 text-center mt-auto bg-black/40 backdrop-blur-md">
        <div className="container mx-auto px-8">
            <p className="text-[11px] text-slate-600 font-black uppercase tracking-[1em] mb-8 italic">To-Ligado Intelligence Systems</p>
            <p className="text-[10px] text-slate-700 font-bold max-w-3xl mx-auto leading-relaxed uppercase tracking-[0.2em] italic">
              Operacional sob licença To-Ligado.com. Varredura de dados públicos em conformidade com políticas de transparência.
            </p>
        </div>
      </footer>
    </div>
  );
};

export default App;
