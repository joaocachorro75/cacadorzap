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
      setError("FALHA DE COMUNICAÇÃO: O motor de busca To-Ligado perdeu sincronia com a infraestrutura global de dados.");
      setIsLoading(false);
      document.body.classList.remove('scanning');
    }
  }, []);

  return (
    <div className="min-h-screen flex flex-col w-full selection:bg-green-500/40">
      <div className="scanner-line"></div>
      
      <div className="flex-grow container mx-auto max-w-7xl px-4 py-16">
        <Header />
        
        {view === 'public' ? (
          <div className="animate-slide-up">
            <SearchBar onSearch={handleSearch} isLoading={isLoading && results.length === 0} />

            {sources.length > 0 && (
              <div className="mb-20 px-12 py-10 glass rounded-[4rem] border-green-500/40 relative overflow-hidden group shadow-2xl">
                <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-green-500 to-transparent"></div>
                <div className="flex items-center gap-5 mb-10">
                  <div className="w-4 h-4 bg-green-500 rounded-full animate-ping"></div>
                  <span className="text-[14px] font-black text-white/90 uppercase tracking-[0.6em] font-mono-tech italic">Varredura de Sinais em Tempo Real:</span>
                </div>
                <div className="flex flex-wrap gap-5">
                  {sources.slice(0, 15).map((s, i) => (
                    <a 
                      key={i} 
                      href={s.uri} 
                      target="_blank" 
                      rel="noreferrer" 
                      className="text-[12px] bg-black/50 border border-white/10 px-8 py-4 rounded-2xl text-slate-400 hover:text-green-400 hover:border-green-500/70 transition-all flex items-center gap-4 group/link hover:shadow-[0_15px_40px_rgba(37,211,102,0.15)] shadow-xl"
                    >
                      <i className="fas fa-satellite text-[11px] opacity-40 group-hover/link:opacity-100 group-hover/link:animate-pulse"></i> 
                      <span className="font-bold tracking-tight">{s.title.substring(0, 40)}</span>
                    </a>
                  ))}
                </div>
              </div>
            )}

            {error && (
              <div className="p-16 glass border-red-500/50 rounded-[6rem] text-red-400 mb-20 flex flex-col md:flex-row items-center gap-16 animate-shake shadow-[0_0_120px_rgba(239,68,68,0.25)]">
                <div className="w-32 h-32 bg-red-500/10 rounded-full flex items-center justify-center border border-red-500/20 shadow-2xl scale-110">
                  <i className="fas fa-radiation text-6xl animate-pulse"></i>
                </div>
                <div className="flex-1 text-center md:text-left">
                  <h4 className="font-black uppercase text-4xl tracking-tighter mb-4 italic">Interferência de Rede</h4>
                  <p className="text-lg md:text-xl opacity-80 font-medium leading-relaxed max-w-4xl">{error}</p>
                </div>
                <button 
                  onClick={() => { setHasSearched(false); setError(null); }} 
                  className="px-16 py-7 bg-white/5 hover:bg-white/10 rounded-[2.5rem] text-[15px] font-black uppercase tracking-[0.5em] border border-white/10 transition-all active:scale-95 shadow-2xl"
                >
                  Reiniciar Radar
                </button>
              </div>
            )}

            {(isLoading || results.length > 0) && (
              <section className="mt-28">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-28 gap-14 px-12">
                  <div className="flex items-center gap-20">
                    <div className="flex flex-col">
                      <span className="text-[12rem] font-black text-white italic tracking-tighter leading-none drop-shadow-[0_40px_40px_rgba(0,0,0,0.7)]">
                        {results.length}
                      </span>
                      <span className="text-[16px] font-black text-green-500 uppercase tracking-[1em] mt-8 font-mono-tech">Grupos</span>
                    </div>
                    <div className="h-40 w-[2px] bg-white/10 hidden md:block"></div>
                    <div className="max-w-[360px]">
                      <h2 className="text-5xl md:text-6xl font-black text-slate-100 uppercase tracking-tighter italic leading-[0.75]">
                        Sinais <br/> Interceptados <br/> <span className="text-green-500">Live</span>
                      </h2>
                    </div>
                  </div>
                  
                  {isLoading && (
                    <div className="flex items-center gap-10 bg-green-500/10 border border-green-500/20 px-20 py-10 rounded-[5rem] shadow-2xl relative overflow-hidden">
                      <div className="absolute inset-0 bg-green-500/5 animate-pulse"></div>
                      <div className="flex gap-5">
                        <div className="w-4 h-14 bg-green-500 animate-[bounce_1.2s_infinite]"></div>
                        <div className="w-4 h-14 bg-green-500 animate-[bounce_1.2s_infinite_0.3s]"></div>
                        <div className="w-4 h-14 bg-green-500 animate-[bounce_1.2s_infinite_0.6s]"></div>
                      </div>
                      <span className="text-green-500 text-[18px] font-black uppercase tracking-[0.7em] animate-pulse relative z-10">Escaneando...</span>
                    </div>
                  )}
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-16 mb-72">
                  {results.map((group) => (
                    <GroupCard key={group.id} group={group} />
                  ))}
                </div>
              </section>
            )}

            {!hasSearched && (
              <div className="mt-32 py-80 glass rounded-[12rem] text-center relative overflow-hidden group border-white/5 hover:border-green-500/50 transition-all duration-1000 shadow-[0_50px_120px_rgba(0,0,0,0.7)]">
                <div className="absolute inset-0 bg-gradient-to-br from-green-500/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000"></div>
                <div className="relative z-10 px-16">
                  <div className="w-56 h-56 bg-slate-900 rounded-[6rem] flex items-center justify-center mx-auto mb-24 border border-slate-800 shadow-[0_50px_80px_-25px_rgba(0,0,0,0.9)] group-hover:scale-110 group-hover:rotate-[25deg] transition-all duration-1000">
                    <i className="fas fa-radar text-9xl text-green-500 drop-shadow-[0_0_30px_rgba(37,211,102,0.9)] animate-pulse"></i>
                  </div>
                  <h2 className="text-9xl md:text-[15rem] font-black text-white mb-20 italic uppercase tracking-tighter leading-none">
                    Radar <span className="text-gradient">V8.5</span>
                  </h2>
                  <p className="text-slate-400 max-w-6xl mx-auto mb-40 font-medium text-3xl md:text-5xl leading-relaxed opacity-80 tracking-tight px-10 italic">
                    Engenharia de busca neural para localização de comunidades exclusivas em tempo real.
                  </p>
                  <div className="flex flex-col md:flex-row justify-center gap-24 md:gap-64 opacity-40 group-hover:opacity-100 transition-all duration-1000 grayscale group-hover:grayscale-0">
                    <div className="text-center">
                      <div className="text-9xl font-black text-white tracking-tighter italic font-mono-tech">0.03s</div>
                      <div className="text-[16px] uppercase font-black tracking-[0.8em] mt-8 text-green-500">Nucleo Latency</div>
                    </div>
                    <div className="text-center">
                      <div className="text-9xl font-black text-white tracking-tighter italic font-mono-tech">Ultra</div>
                      <div className="text-[16px] uppercase font-black tracking-[0.8em] mt-8 text-green-500">Scan Level</div>
                    </div>
                    <div className="text-center">
                      <div className="text-9xl font-black text-white tracking-tighter italic font-mono-tech">100%</div>
                      <div className="text-[16px] uppercase font-black tracking-[0.8em] mt-8 text-green-500">AI Verified</div>
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

      <footer className="py-48 border-t border-white/5 text-center mt-auto bg-black/80 backdrop-blur-[60px]">
        <div className="container mx-auto max-w-[90rem] px-16">
            <div className="w-40 h-[1px] bg-green-500/30 mx-auto mb-20"></div>
            <p className="text-[18px] text-slate-500 font-black uppercase tracking-[1.6em] mb-20 animate-pulse-subtle italic">To-Ligado Global Intelligence Framework</p>
            <div className="flex justify-center gap-32 mb-32 opacity-30 hover:opacity-100 transition-opacity duration-1000 grayscale hover:grayscale-0">
               <i className="fab fa-whatsapp text-7xl"></i>
               <i className="fas fa-microchip text-7xl"></i>
               <i className="fas fa-dna text-7xl"></i>
               <i className="fas fa-satellite text-7xl"></i>
            </div>
            <p className="text-[14px] text-slate-700 font-bold max-w-5xl mx-auto leading-loose uppercase tracking-[0.5em] italic mb-20 px-10">
              O Caçador To-Ligado v8.5 opera como um indexador neural de dados públicos agregados da web. Não possuímos vínculo administrativo com as comunidades indexadas. O uso desta ferramenta deve respeitar os termos de serviço das plataformas proprietárias.
            </p>
            <div className="text-[14px] text-slate-800 font-black uppercase tracking-[1em] font-mono-tech border-t border-white/5 pt-16">© 2024-2025 TO-LIGADO.COM - SYSTEM STATUS: NOMINAL [STABLE V8.5]</div>
        </div>
      </footer>
    </div>
  );
};

export default App;