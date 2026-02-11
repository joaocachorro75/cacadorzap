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
      setError("ERRO DE CONEXÃO: O radar perdeu sincronia com a rede global.");
      setIsLoading(false);
      document.body.classList.remove('scanning');
    }
  }, []);

  return (
    <div className="min-h-screen flex flex-col w-full selection:bg-green-500/40">
      <div className="scanner-line"></div>
      
      <div className="flex-grow container mx-auto max-w-7xl px-4 py-12">
        <Header />
        
        {view === 'public' ? (
          <div className="animate-slide-up">
            <SearchBar onSearch={handleSearch} isLoading={isLoading && results.length === 0} />

            {sources.length > 0 && (
              <div className="mb-16 px-10 py-8 glass rounded-[3.5rem] border-green-500/30 relative overflow-hidden group">
                <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-green-500 to-transparent"></div>
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-3 h-3 bg-green-500 rounded-full animate-ping"></div>
                  <span className="text-[12px] font-black text-white/80 uppercase tracking-[0.5em] font-mono-tech italic">Varredura Satelital Ativa:</span>
                </div>
                <div className="flex flex-wrap gap-4">
                  {sources.slice(0, 15).map((s, i) => (
                    <a 
                      key={i} 
                      href={s.uri} 
                      target="_blank" 
                      rel="noreferrer" 
                      className="text-[11px] bg-black/40 border border-white/10 px-6 py-3 rounded-2xl text-slate-400 hover:text-green-400 hover:border-green-500/60 transition-all flex items-center gap-3 group/link hover:shadow-[0_10px_30px_rgba(37,211,102,0.1)]"
                    >
                      <i className="fas fa-radar text-[10px] opacity-40 group-hover/link:opacity-100 group-hover/link:animate-pulse"></i> 
                      <span className="font-bold tracking-tight">{s.title.substring(0, 35)}</span>
                    </a>
                  ))}
                </div>
              </div>
            )}

            {error && (
              <div className="p-14 glass border-red-500/40 rounded-[5rem] text-red-400 mb-16 flex flex-col md:flex-row items-center gap-12 animate-shake shadow-[0_0_100px_rgba(239,68,68,0.2)]">
                <div className="w-28 h-28 bg-red-500/10 rounded-full flex items-center justify-center border border-red-500/20 shadow-2xl">
                  <i className="fas fa-triangle-exclamation text-5xl animate-pulse"></i>
                </div>
                <div className="flex-1 text-center md:text-left">
                  <h4 className="font-black uppercase text-3xl tracking-tighter mb-3 italic">Erro de Frequência</h4>
                  <p className="text-base md:text-lg opacity-80 font-medium leading-relaxed max-w-3xl">{error}</p>
                </div>
                <button 
                  onClick={() => { setHasSearched(false); setError(null); }} 
                  className="px-14 py-6 bg-white/5 hover:bg-white/10 rounded-[2rem] text-[13px] font-black uppercase tracking-[0.4em] border border-white/10 transition-all active:scale-95 shadow-2xl"
                >
                  Reiniciar Radar
                </button>
              </div>
            )}

            {(isLoading || results.length > 0) && (
              <section className="mt-24">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-24 gap-12 px-10">
                  <div className="flex items-center gap-16">
                    <div className="flex flex-col">
                      <span className="text-[10rem] font-black text-white italic tracking-tighter leading-none drop-shadow-[0_30px_30px_rgba(0,0,0,0.6)]">
                        {results.length}
                      </span>
                      <span className="text-[14px] font-black text-green-500 uppercase tracking-[0.8em] mt-6 font-mono-tech">Sinais Captados</span>
                    </div>
                    <div className="h-32 w-[2px] bg-white/10 hidden md:block"></div>
                    <div className="max-w-[300px]">
                      <h2 className="text-4xl md:text-5xl font-black text-slate-100 uppercase tracking-tighter italic leading-[0.8]">
                        Busca <br/> Neural <br/> <span className="text-green-500">Ativa</span>
                      </h2>
                    </div>
                  </div>
                  
                  {isLoading && (
                    <div className="flex items-center gap-8 bg-green-500/10 border border-green-500/20 px-16 py-8 rounded-[4rem] shadow-2xl relative overflow-hidden">
                      <div className="absolute inset-0 bg-green-500/5 animate-pulse"></div>
                      <div className="flex gap-4">
                        <div className="w-3.5 h-12 bg-green-500 animate-[bounce_1s_infinite]"></div>
                        <div className="w-3.5 h-12 bg-green-500 animate-[bounce_1s_infinite_0.2s]"></div>
                        <div className="w-3.5 h-12 bg-green-500 animate-[bounce_1s_infinite_0.4s]"></div>
                      </div>
                      <span className="text-green-500 text-[16px] font-black uppercase tracking-[0.6em] animate-pulse relative z-10">Escaneando...</span>
                    </div>
                  )}
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-14 mb-64">
                  {results.map((group) => (
                    <GroupCard key={group.id} group={group} />
                  ))}
                </div>
              </section>
            )}

            {!hasSearched && (
              <div className="mt-28 py-72 glass rounded-[10rem] text-center relative overflow-hidden group border-white/5 hover:border-green-500/40 transition-all duration-1000 shadow-[0_40px_100px_rgba(0,0,0,0.6)]">
                <div className="absolute inset-0 bg-gradient-to-br from-green-500/15 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000"></div>
                <div className="relative z-10 px-12">
                  <div className="w-48 h-48 bg-slate-900 rounded-[5rem] flex items-center justify-center mx-auto mb-20 border border-slate-800 shadow-[0_45px_70px_-20px_rgba(0,0,0,0.8)] group-hover:scale-110 group-hover:rotate-[20deg] transition-all duration-1000">
                    <i className="fas fa-satellite-dish text-8xl text-green-500 drop-shadow-[0_0_25px_rgba(37,211,102,0.8)] animate-pulse"></i>
                  </div>
                  <h2 className="text-8xl md:text-[13rem] font-black text-white mb-16 italic uppercase tracking-tighter leading-none">
                    Radar <span className="text-gradient">V8.0</span>
                  </h2>
                  <p className="text-slate-400 max-w-5xl mx-auto mb-32 font-medium text-2xl md:text-4xl leading-relaxed opacity-80 tracking-tight px-8 italic">
                    Tecnologia de ponta para localização de comunidades exclusivas.
                  </p>
                  <div className="flex flex-col md:flex-row justify-center gap-20 md:gap-56 opacity-40 group-hover:opacity-100 transition-all duration-1000 grayscale group-hover:grayscale-0">
                    <div className="text-center">
                      <div className="text-8xl font-black text-white tracking-tighter italic font-mono-tech">0.05s</div>
                      <div className="text-[14px] uppercase font-black tracking-[0.7em] mt-6 text-green-500">Nucleo Latency</div>
                    </div>
                    <div className="text-center">
                      <div className="text-8xl font-black text-white tracking-tighter italic font-mono-tech">Deep</div>
                      <div className="text-[14px] uppercase font-black tracking-[0.7em] mt-6 text-green-500">Scan Level</div>
                    </div>
                    <div className="text-center">
                      <div className="text-8xl font-black text-white tracking-tighter italic font-mono-tech">100%</div>
                      <div className="text-[14px] uppercase font-black tracking-[0.7em] mt-6 text-green-500">AI Connect</div>
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

      <footer className="py-40 border-t border-white/5 text-center mt-auto bg-black/70 backdrop-blur-[50px]">
        <div className="container mx-auto max-w-7xl px-12">
            <div className="w-32 h-[1px] bg-green-500/30 mx-auto mb-16"></div>
            <p className="text-[16px] text-slate-500 font-black uppercase tracking-[1.4em] mb-16 animate-pulse-subtle italic">To-Ligado Global Intelligence</p>
            <div className="flex justify-center gap-24 mb-24 opacity-30 hover:opacity-100 transition-opacity duration-1000 grayscale hover:grayscale-0">
               <i className="fab fa-whatsapp text-6xl"></i>
               <i className="fas fa-microchip text-6xl"></i>
               <i className="fas fa-brain text-6xl"></i>
               <i className="fas fa-satellite text-6xl"></i>
            </div>
            <p className="text-[13px] text-slate-700 font-bold max-w-4xl mx-auto leading-loose uppercase tracking-[0.4em] italic mb-16 px-6">
              O Caçador To-Ligado é um indexador neural de dados públicos. Respeitamos a privacidade e as políticas de uso da plataforma WhatsApp. O conteúdo dos grupos é de total responsabilidade de seus administradores.
            </p>
            <div className="text-[12px] text-slate-800 font-black uppercase tracking-[0.8em] font-mono-tech border-t border-white/5 pt-12">© 2024-2025 TO-LIGADO.COM - ALL SYSTEMS NOMINAL [STABLE]</div>
        </div>
      </footer>
    </div>
  );
};

export default App;