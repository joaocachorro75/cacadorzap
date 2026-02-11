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
      setError("FALHA CRÍTICA NO SISTEMA: Perda de sincronia com a rede de busca neural.");
      setIsLoading(false);
      document.body.classList.remove('scanning');
    }
  }, []);

  return (
    <div className="min-h-screen flex flex-col w-full selection:bg-green-500/40">
      <div className="scanner-line"></div>
      
      <div className="flex-grow container mx-auto max-w-7xl px-4 py-8">
        <Header />
        
        {view === 'public' ? (
          <div className="animate-slide-up">
            <SearchBar onSearch={handleSearch} isLoading={isLoading && results.length === 0} />

            {sources.length > 0 && (
              <div className="mb-14 px-8 py-7 glass rounded-[3rem] border-green-500/20 relative overflow-hidden group">
                <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-green-500/60 to-transparent"></div>
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-2.5 h-2.5 bg-green-500 rounded-full animate-ping"></div>
                  <span className="text-[11px] font-black text-white/70 uppercase tracking-[0.5em] font-mono-tech">Rede de Indexação Ativa:</span>
                </div>
                <div className="flex flex-wrap gap-3">
                  {sources.slice(0, 15).map((s, i) => (
                    <a 
                      key={i} 
                      href={s.uri} 
                      target="_blank" 
                      rel="noreferrer" 
                      className="text-[10px] bg-black/40 border border-white/10 px-5 py-2.5 rounded-2xl text-slate-400 hover:text-green-400 hover:border-green-500/50 transition-all flex items-center gap-3 group/link hover:shadow-2xl hover:shadow-green-500/10"
                    >
                      <i className="fas fa-radar text-[9px] opacity-40 group-hover/link:opacity-100 group-hover/link:animate-pulse transition-opacity"></i> 
                      <span className="font-bold tracking-tight">{s.title.substring(0, 35)}</span>
                    </a>
                  ))}
                </div>
              </div>
            )}

            {error && (
              <div className="p-12 glass border-red-500/40 rounded-[4rem] text-red-400 mb-14 flex flex-col md:flex-row items-center gap-10 animate-shake shadow-[0_0_80px_rgba(239,68,68,0.15)]">
                <div className="w-24 h-24 bg-red-500/10 rounded-full flex items-center justify-center border border-red-500/20 shadow-inner">
                  <i className="fas fa-bolt text-4xl animate-pulse"></i>
                </div>
                <div className="flex-1 text-center md:text-left">
                  <h4 className="font-black uppercase text-2xl tracking-tighter mb-2 italic">Alerta de Anomalia</h4>
                  <p className="text-sm md:text-base opacity-70 font-medium leading-relaxed max-w-2xl">{error}</p>
                </div>
                <button 
                  onClick={() => { setHasSearched(false); setError(null); }} 
                  className="px-12 py-5 bg-white/5 hover:bg-white/10 rounded-3xl text-[12px] font-black uppercase tracking-[0.4em] border border-white/10 transition-all active:scale-95 shadow-xl"
                >
                  Recuperar Sinal
                </button>
              </div>
            )}

            {(isLoading || results.length > 0) && (
              <section className="mt-20">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-20 gap-10 px-8">
                  <div className="flex items-center gap-14">
                    <div className="flex flex-col">
                      <span className="text-9xl font-black text-white italic tracking-tighter leading-none drop-shadow-[0_25px_25px_rgba(0,0,0,0.5)]">
                        {results.length}
                      </span>
                      <span className="text-[13px] font-black text-green-500 uppercase tracking-[0.8em] mt-5 font-mono-tech">Registros</span>
                    </div>
                    <div className="h-28 w-[1px] bg-white/10 hidden md:block"></div>
                    <div className="max-w-[260px]">
                      <h2 className="text-3xl md:text-4xl font-black text-slate-100 uppercase tracking-tighter italic leading-[0.85]">
                        Dados <br/> Interceptados <br/> <span className="text-green-500">Live</span>
                      </h2>
                    </div>
                  </div>
                  
                  {isLoading && (
                    <div className="flex items-center gap-7 bg-green-500/10 border border-green-500/20 px-14 py-7 rounded-[3rem] shadow-2xl relative overflow-hidden">
                      <div className="absolute inset-0 bg-green-500/5 animate-pulse"></div>
                      <div className="flex gap-3.5">
                        <div className="w-3 h-10 bg-green-500 animate-[bounce_1s_infinite]"></div>
                        <div className="w-3 h-10 bg-green-500 animate-[bounce_1s_infinite_0.2s]"></div>
                        <div className="w-3 h-10 bg-green-500 animate-[bounce_1s_infinite_0.4s]"></div>
                      </div>
                      <span className="text-green-500 text-[14px] font-black uppercase tracking-[0.5em] animate-pulse relative z-10">Escaneando...</span>
                    </div>
                  )}
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-12 mb-56">
                  {results.map((group) => (
                    <GroupCard key={group.id} group={group} />
                  ))}
                </div>
              </section>
            )}

            {!hasSearched && (
              <div className="mt-24 py-64 glass rounded-[9rem] text-center relative overflow-hidden group border-white/5 hover:border-green-500/30 transition-all duration-1000 shadow-2xl">
                <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000"></div>
                <div className="relative z-10 px-10">
                  <div className="w-40 h-40 bg-slate-900 rounded-[4rem] flex items-center justify-center mx-auto mb-16 border border-slate-800 shadow-[0_35px_60px_-15px_rgba(0,0,0,0.6)] group-hover:scale-110 group-hover:rotate-[15deg] transition-all duration-1000">
                    <i className="fas fa-radar text-7xl text-green-500 drop-shadow-[0_0_20px_rgba(37,211,102,0.8)] animate-pulse"></i>
                  </div>
                  <h2 className="text-7xl md:text-[11rem] font-black text-white mb-14 italic uppercase tracking-tighter leading-none">
                    Radar <span className="text-gradient">V7.5</span>
                  </h2>
                  <p className="text-slate-400 max-w-4xl mx-auto mb-28 font-medium text-xl md:text-3xl leading-relaxed opacity-80 tracking-tight px-6">
                    O motor de inteligência mais potente para localização e validação de comunidades públicas em escala global.
                  </p>
                  <div className="flex flex-col md:flex-row justify-center gap-16 md:gap-48 opacity-40 group-hover:opacity-100 transition-all duration-1000 grayscale group-hover:grayscale-0">
                    <div className="text-center">
                      <div className="text-7xl font-black text-white tracking-tighter italic font-mono-tech">0.08s</div>
                      <div className="text-[13px] uppercase font-black tracking-[0.6em] mt-5 text-green-500">Delay de Núcleo</div>
                    </div>
                    <div className="text-center">
                      <div className="text-7xl font-black text-white tracking-tighter italic font-mono-tech">GLOBAL</div>
                      <div className="text-[13px] uppercase font-black tracking-[0.6em] mt-5 text-green-500">Range de Varredura</div>
                    </div>
                    <div className="text-center">
                      <div className="text-7xl font-black text-white tracking-tighter italic font-mono-tech">100%</div>
                      <div className="text-[13px] uppercase font-black tracking-[0.6em] mt-5 text-green-500">Neural Connect</div>
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

      <footer className="py-32 border-t border-white/5 text-center mt-auto bg-black/60 backdrop-blur-3xl">
        <div className="container mx-auto max-w-6xl px-10">
            <div className="w-24 h-[1px] bg-green-500/20 mx-auto mb-12"></div>
            <p className="text-[14px] text-slate-500 font-black uppercase tracking-[1.2em] mb-12 animate-pulse-subtle">Sistemas Radar To-Ligado Intelligence</p>
            <div className="flex justify-center gap-20 mb-20 opacity-20 hover:opacity-100 transition-opacity duration-1000 grayscale hover:grayscale-0">
               <i className="fab fa-whatsapp text-5xl"></i>
               <i className="fas fa-microchip text-5xl"></i>
               <i className="fas fa-brain text-5xl"></i>
               <i className="fas fa-satellite text-5xl"></i>
            </div>
            <p className="text-[12px] text-slate-700 font-bold max-w-3xl mx-auto leading-loose uppercase tracking-[0.3em] italic mb-14">
              O Caçador To-Ligado é uma plataforma de pesquisa automatizada. Não possuímos vínculo com os administradores das comunidades indexadas. Todas as conexões são de responsabilidade do usuário final.
            </p>
            <div className="text-[11px] text-slate-800 font-black uppercase tracking-[0.6em] font-mono-tech border-t border-white/5 pt-10">© 2024-2025 RADAR TO-LIGADO - ALL SYSTEMS NOMINAL</div>
        </div>
      </footer>
    </div>
  );
};

export default App;