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
      setError("ERRO DE SINCRONIA: O motor de busca neural To-Ligado perdeu conexão com os satélites de dados globais. Tente restabelecer o radar.");
      setIsLoading(false);
      document.body.classList.remove('scanning');
    }
  }, []);

  return (
    <div className="min-h-screen flex flex-col w-full selection:bg-green-500/40">
      <div className="scanner-line"></div>
      
      <div className="flex-grow container mx-auto max-w-7xl px-4 py-20 md:py-24">
        <Header />
        
        {view === 'public' ? (
          <div className="animate-slide-up">
            <SearchBar onSearch={handleSearch} isLoading={isLoading && results.length === 0} />

            {sources.length > 0 && (
              <div className="mb-24 px-16 py-12 glass rounded-[5rem] border-green-500/50 relative overflow-hidden group shadow-3xl">
                <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-transparent via-green-500 to-transparent"></div>
                <div className="flex items-center gap-6 mb-12">
                  <div className="w-5 h-5 bg-green-500 rounded-full animate-ping"></div>
                  <span className="text-[16px] font-black text-white/90 uppercase tracking-[0.7em] font-mono-tech italic">Satélites de Dados Ativos:</span>
                </div>
                <div className="flex flex-wrap gap-6">
                  {sources.slice(0, 15).map((s, i) => (
                    <a 
                      key={i} 
                      href={s.uri} 
                      target="_blank" 
                      rel="noreferrer" 
                      className="text-[13px] bg-black/60 border border-white/10 px-10 py-5 rounded-3xl text-slate-400 hover:text-green-400 hover:border-green-500/80 transition-all flex items-center gap-5 group/link hover:shadow-[0_20px_50px_rgba(37,211,102,0.2)] shadow-2xl"
                    >
                      <i className="fas fa-radar text-[12px] opacity-40 group-hover/link:opacity-100 group-hover/link:animate-pulse"></i> 
                      <span className="font-bold tracking-tight">{s.title.substring(0, 45)}</span>
                    </a>
                  ))}
                </div>
              </div>
            )}

            {error && (
              <div className="p-20 glass border-red-500/60 rounded-[8rem] text-red-400 mb-24 flex flex-col md:flex-row items-center gap-20 animate-shake shadow-[0_0_150px_rgba(239,68,68,0.3)]">
                <div className="w-40 h-40 bg-red-500/15 rounded-full flex items-center justify-center border border-red-500/30 shadow-3xl scale-125">
                  <i className="fas fa-radiation text-7xl animate-pulse"></i>
                </div>
                <div className="flex-1 text-center md:text-left">
                  <h4 className="font-black uppercase text-5xl tracking-tighter mb-6 italic">Protocolo de Erro 404-AI</h4>
                  <p className="text-xl md:text-2xl opacity-80 font-medium leading-relaxed max-w-5xl">{error}</p>
                </div>
                <button 
                  onClick={() => { setHasSearched(false); setError(null); }} 
                  className="px-20 py-8 bg-white/5 hover:bg-white/10 rounded-[3rem] text-[18px] font-black uppercase tracking-[0.6em] border border-white/10 transition-all active:scale-95 shadow-3xl"
                >
                  Recuperar Sinal
                </button>
              </div>
            )}

            {(isLoading || results.length > 0) && (
              <section className="mt-36">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-36 gap-20 px-16">
                  <div className="flex items-center gap-24">
                    <div className="flex flex-col">
                      <span className="text-[14rem] font-black text-white italic tracking-tighter leading-none drop-shadow-[0_50px_50px_rgba(0,0,0,0.8)]">
                        {results.length}
                      </span>
                      <span className="text-[18px] font-black text-green-500 uppercase tracking-[1.2em] mt-10 font-mono-tech">Unidades</span>
                    </div>
                    <div className="h-56 w-[3px] bg-white/10 hidden md:block"></div>
                    <div className="max-w-[420px]">
                      <h2 className="text-6xl md:text-7xl font-black text-slate-100 uppercase tracking-tighter italic leading-[0.7]">
                        Interceptação <br/> Neural <br/> <span className="text-green-500">To-Ligado</span>
                      </h2>
                    </div>
                  </div>
                  
                  {isLoading && (
                    <div className="flex items-center gap-12 bg-green-500/10 border border-green-500/20 px-24 py-12 rounded-[6rem] shadow-3xl relative overflow-hidden">
                      <div className="absolute inset-0 bg-green-500/10 animate-pulse"></div>
                      <div className="flex gap-7">
                        <div className="w-5 h-18 bg-green-500 animate-[bounce_1.4s_infinite]"></div>
                        <div className="w-5 h-18 bg-green-500 animate-[bounce_1.4s_infinite_0.4s]"></div>
                        <div className="w-5 h-18 bg-green-500 animate-[bounce_1.4s_infinite_0.8s]"></div>
                      </div>
                      <span className="text-green-500 text-[20px] font-black uppercase tracking-[0.8em] animate-pulse relative z-10">Minerando...</span>
                    </div>
                  )}
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-20 mb-80">
                  {results.map((group) => (
                    <GroupCard key={group.id} group={group} />
                  ))}
                </div>
              </section>
            )}

            {!hasSearched && (
              <div className="mt-40 py-96 glass rounded-[14rem] text-center relative overflow-hidden group border-white/5 hover:border-green-500/60 transition-all duration-1000 shadow-[0_60px_150px_rgba(0,0,0,0.8)]">
                <div className="absolute inset-0 bg-gradient-to-br from-green-500/25 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000"></div>
                <div className="relative z-10 px-20">
                  <div className="w-64 h-64 bg-slate-900 rounded-[7rem] flex items-center justify-center mx-auto mb-28 border border-slate-800 shadow-[0_60px_100px_-30px_rgba(0,0,0,0.95)] group-hover:scale-110 group-hover:rotate-[30deg] transition-all duration-1000">
                    <i className="fas fa-radar text-[120px] text-green-500 drop-shadow-[0_0_40px_rgba(37,211,102,1)] animate-pulse"></i>
                  </div>
                  <h2 className="text-[120px] md:text-[18rem] font-black text-white mb-24 italic uppercase tracking-tighter leading-none">
                    Radar <span className="text-gradient">V9.0</span>
                  </h2>
                  <p className="text-slate-400 max-w-7xl mx-auto mb-48 font-medium text-4xl md:text-6xl leading-relaxed opacity-80 tracking-tight px-12 italic">
                    Engenharia neural avançada para localização de comunidades estratégicas.
                  </p>
                  <div className="flex flex-col md:flex-row justify-center gap-32 md:gap-80 opacity-40 group-hover:opacity-100 transition-all duration-1000 grayscale group-hover:grayscale-0">
                    <div className="text-center">
                      <div className="text-[120px] font-black text-white tracking-tighter italic font-mono-tech">0.02s</div>
                      <div className="text-[20px] uppercase font-black tracking-[1em] mt-10 text-green-500">Nucleo Latency</div>
                    </div>
                    <div className="text-center">
                      <div className="text-[120px] font-black text-white tracking-tighter italic font-mono-tech">Elite</div>
                      <div className="text-[20px] uppercase font-black tracking-[1em] mt-10 text-green-500">Scan Level</div>
                    </div>
                    <div className="text-center">
                      <div className="text-[120px] font-black text-white tracking-tighter italic font-mono-tech">100%</div>
                      <div className="text-[20px] uppercase font-black tracking-[1em] mt-10 text-green-500">Neural Sync</div>
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

      <footer className="py-64 border-t border-white/5 text-center mt-auto bg-black/90 backdrop-blur-[80px]">
        <div className="container mx-auto max-w-[100rem] px-20">
            <div className="w-56 h-[1px] bg-green-500/40 mx-auto mb-24"></div>
            <p className="text-[22px] text-slate-500 font-black uppercase tracking-[2em] mb-24 animate-pulse-subtle italic">To-Ligado Global Intelligence Framework v9.0</p>
            <div className="flex justify-center gap-40 mb-40 opacity-30 hover:opacity-100 transition-opacity duration-1000 grayscale hover:grayscale-0">
               <i className="fab fa-whatsapp text-8xl"></i>
               <i className="fas fa-microchip text-8xl"></i>
               <i className="fas fa-fingerprint text-8xl"></i>
               <i className="fas fa-satellite text-8xl"></i>
            </div>
            <p className="text-[16px] text-slate-700 font-bold max-w-6xl mx-auto leading-loose uppercase tracking-[0.6em] italic mb-24 px-12">
              O Caçador To-Ligado v9.0 é um indexador de dados públicos descentralizados. Não possuímos controle sobre as políticas internas das comunidades interceptadas. O acesso a grupos de terceiros é de responsabilidade única do usuário.
            </p>
            <div className="text-[16px] text-slate-800 font-black uppercase tracking-[1.2em] font-mono-tech border-t border-white/5 pt-20">© 2024-2025 TO-LIGADO.COM - RADAR STATUS: NOMINAL [STABLE]</div>
        </div>
      </footer>
    </div>
  );
};

export default App;