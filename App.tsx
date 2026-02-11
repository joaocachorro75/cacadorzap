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
      setError("FALHA CRÍTICA: Não foi possível sincronizar com o Radar.");
      setIsLoading(false);
      document.body.classList.remove('scanning');
    }
  }, []);

  return (
    <div className="min-h-screen flex flex-col w-full selection:bg-green-500/30">
      <div className="scanner-line"></div>
      
      <div className="flex-grow container mx-auto max-w-7xl px-4 py-8">
        <Header />
        
        {view === 'public' ? (
          <div className="animate-slide-up">
            <SearchBar onSearch={handleSearch} isLoading={isLoading && results.length === 0} />

            {sources.length > 0 && (
              <div className="mb-10 px-8 py-5 glass rounded-[2.5rem] border-green-500/20">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Varredura em tempo real em:</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {sources.slice(0, 12).map((s, i) => (
                    <a 
                      key={i} 
                      href={s.uri} 
                      target="_blank" 
                      rel="noreferrer" 
                      className="text-[9px] bg-white/5 border border-white/10 px-4 py-2 rounded-xl text-slate-400 hover:text-green-400 hover:border-green-500/30 transition-all flex items-center gap-2 group"
                    >
                      <i className="fas fa-satellite text-[8px] group-hover:animate-bounce"></i> {s.title.substring(0, 25)}...
                    </a>
                  ))}
                </div>
              </div>
            )}

            {error && (
              <div className="p-8 glass border-red-500/30 rounded-[3rem] text-red-400 mb-10 flex flex-col md:flex-row items-center gap-6 animate-shake">
                <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center">
                  <i className="fas fa-radiation-alt text-2xl"></i>
                </div>
                <div className="flex-1 text-center md:text-left">
                  <h4 className="font-black uppercase text-sm tracking-widest mb-1">Interferência de Sinal</h4>
                  <p className="text-[11px] opacity-70 font-medium leading-relaxed">{error}</p>
                </div>
                <button 
                  onClick={() => { setHasSearched(false); setError(null); }} 
                  className="px-8 py-3 bg-white/5 hover:bg-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest border border-white/10 transition-all"
                >
                  Reiniciar Radar
                </button>
              </div>
            )}

            {(isLoading || results.length > 0) && (
              <section className="mt-12">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 gap-6 px-4">
                  <div className="flex items-center gap-8">
                    <div className="flex flex-col">
                      <span className="text-7xl font-black text-white italic tracking-tighter leading-none">
                        {results.length}
                      </span>
                      <span className="text-[10px] font-black text-green-500 uppercase tracking-[0.4em] mt-2">Interceptações</span>
                    </div>
                    <div className="h-16 w-px bg-slate-800 hidden md:block"></div>
                    <div>
                      <h2 className="text-2xl font-black text-slate-200 uppercase tracking-tight italic leading-tight">
                        Fluxo de Dados <br/> em Tempo Real
                      </h2>
                    </div>
                  </div>
                  
                  {isLoading && (
                    <div className="flex items-center gap-4 bg-green-500/10 border border-green-500/20 px-8 py-4 rounded-3xl">
                      <div className="flex gap-2">
                        <div className="w-1.5 h-6 bg-green-500 animate-bounce"></div>
                        <div className="w-1.5 h-6 bg-green-500 animate-bounce [animation-delay:0.2s]"></div>
                        <div className="w-1.5 h-6 bg-green-500 animate-bounce [animation-delay:0.4s]"></div>
                      </div>
                      <span className="text-green-500 text-[11px] font-black uppercase tracking-[0.2em] animate-pulse">Sincronizando com Satélites...</span>
                    </div>
                  )}
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-32">
                  {results.map((group) => (
                    <GroupCard key={group.id} group={group} />
                  ))}
                </div>
              </section>
            )}

            {!hasSearched && (
              <div className="mt-20 py-48 glass rounded-[6rem] text-center relative overflow-hidden group border-white/5">
                <div className="absolute inset-0 bg-gradient-to-b from-green-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000"></div>
                <div className="relative z-10">
                  <div className="w-28 h-28 bg-slate-900 rounded-[2.5rem] flex items-center justify-center mx-auto mb-10 border border-slate-800 shadow-2xl group-hover:scale-110 group-hover:rotate-12 transition-all duration-700">
                    <i className="fas fa-satellite-dish text-5xl text-green-500"></i>
                  </div>
                  <h2 className="text-6xl md:text-8xl font-black text-white mb-8 italic uppercase tracking-tighter">
                    Radar <span className="text-gradient">V5.0</span>
                  </h2>
                  <p className="text-slate-400 max-w-2xl mx-auto mb-16 font-medium px-8 text-base md:text-xl leading-relaxed opacity-80">
                    O Caçador To-Ligado utiliza tecnologia de IA avançada para interceptar comunidades ativas e seguras em toda a rede pública.
                  </p>
                  <div className="flex justify-center gap-12 md:gap-24 opacity-30">
                    <div className="text-center">
                      <div className="text-4xl font-black text-white tracking-tighter">0.3s</div>
                      <div className="text-[10px] uppercase font-black tracking-[0.3em] mt-2">Latência de Busca</div>
                    </div>
                    <div className="text-center">
                      <div className="text-4xl font-black text-white tracking-tighter">100%</div>
                      <div className="text-[10px] uppercase font-black tracking-[0.3em] mt-2">Segurança IA</div>
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

      <footer className="py-20 border-t border-white/5 text-center mt-auto bg-black/40">
        <p className="text-[11px] text-slate-500 font-black uppercase tracking-[0.6em] mb-6">Desenvolvido por To-Ligado.com Intelligence</p>
        <div className="flex justify-center gap-8 opacity-20 hover:opacity-100 transition-opacity duration-500 grayscale hover:grayscale-0">
           <i className="fab fa-whatsapp text-2xl"></i>
           <i className="fas fa-shield-virus text-2xl"></i>
           <i className="fas fa-microchip text-2xl"></i>
        </div>
        <p className="text-[9px] text-slate-800 font-bold px-10 mt-8 max-w-lg mx-auto leading-relaxed">
          O uso desta ferramenta é para fins educacionais e de indexação de dados públicos. Respeite as políticas de privacidade de cada comunidade interceptada.
        </p>
      </footer>
    </div>
  );
};

export default App;