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
      setError("FALHA DE SINCRONIA: O radar To-Ligado perdeu conexão com a infraestrutura neural global. Tente reestabelecer a busca.");
      setIsLoading(false);
      document.body.classList.remove('scanning');
    }
  }, []);

  return (
    <div className="min-h-screen flex flex-col w-full selection:bg-green-500/40">
      <div className="scanner-line"></div>
      
      <div className="flex-grow container mx-auto max-w-7xl px-4 py-24 md:py-32">
        <Header />
        
        {view === 'public' ? (
          <div className="animate-slide-up">
            <SearchBar onSearch={handleSearch} isLoading={isLoading && results.length === 0} />

            {sources.length > 0 && (
              <div className="mb-28 px-20 py-16 glass rounded-[6rem] border-green-500/50 relative overflow-hidden group shadow-4xl">
                <div className="absolute top-0 left-0 w-full h-[4px] bg-gradient-to-r from-transparent via-green-500 to-transparent"></div>
                <div className="flex items-center gap-8 mb-16">
                  <div className="w-6 h-6 bg-green-500 rounded-full animate-ping"></div>
                  <span className="text-[18px] font-black text-white/90 uppercase tracking-[0.8em] font-mono-tech italic">Rede de Indexação Ativa:</span>
                </div>
                <div className="flex flex-wrap gap-8">
                  {sources.slice(0, 15).map((s, i) => (
                    <a 
                      key={i} 
                      href={s.uri} 
                      target="_blank" 
                      rel="noreferrer" 
                      className="text-[14px] bg-black/80 border border-white/10 px-12 py-6 rounded-3xl text-slate-400 hover:text-green-400 hover:border-green-500/90 transition-all flex items-center gap-6 group/link hover:shadow-[0_25px_60px_rgba(37,211,102,0.25)] shadow-3xl"
                    >
                      <i className="fas fa-satellite text-[14px] opacity-40 group-hover/link:opacity-100 group-hover/link:animate-pulse"></i> 
                      <span className="font-bold tracking-tight">{s.title.substring(0, 50)}</span>
                    </a>
                  ))}
                </div>
              </div>
            )}

            {error && (
              <div className="p-24 glass border-red-500/70 rounded-[10rem] text-red-400 mb-28 flex flex-col md:flex-row items-center gap-24 animate-shake shadow-[0_0_200px_rgba(239,68,68,0.4)]">
                <div className="w-48 h-48 bg-red-500/15 rounded-full flex items-center justify-center border border-red-500/30 shadow-4xl scale-125">
                  <i className="fas fa-radiation text-8xl animate-pulse"></i>
                </div>
                <div className="flex-1 text-center md:text-left">
                  <h4 className="font-black uppercase text-6xl tracking-tighter mb-8 italic">Sinal Interrompido</h4>
                  <p className="text-2xl md:text-3xl opacity-80 font-medium leading-relaxed max-w-6xl">{error}</p>
                </div>
                <button 
                  onClick={() => { setHasSearched(false); setError(null); }} 
                  className="px-24 py-10 bg-white/5 hover:bg-white/10 rounded-[4rem] text-[20px] font-black uppercase tracking-[0.7em] border border-white/10 transition-all active:scale-95 shadow-4xl"
                >
                  Recuperar Sinal
                </button>
              </div>
            )}

            {(isLoading || results.length > 0) && (
              <section className="mt-40">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-40 gap-24 px-20">
                  <div className="flex items-center gap-28">
                    <div className="flex flex-col">
                      <span className="text-[16rem] font-black text-white italic tracking-tighter leading-none drop-shadow-[0_60px_60px_rgba(0,0,0,0.9)]">
                        {results.length}
                      </span>
                      <span className="text-[20px] font-black text-green-500 uppercase tracking-[1.4em] mt-12 font-mono-tech">Sinais</span>
                    </div>
                    <div className="h-64 w-[4px] bg-white/10 hidden md:block"></div>
                    <div className="max-w-[480px]">
                      <h2 className="text-7xl md:text-8xl font-black text-slate-100 uppercase tracking-tighter italic leading-[0.65]">
                        Varredura <br/> Neural <br/> <span className="text-green-500">Live</span>
                      </h2>
                    </div>
                  </div>
                  
                  {isLoading && (
                    <div className="flex items-center gap-14 bg-green-500/10 border border-green-500/20 px-28 py-14 rounded-[7rem] shadow-4xl relative overflow-hidden">
                      <div className="absolute inset-0 bg-green-500/15 animate-pulse"></div>
                      <div className="flex gap-8">
                        <div className="w-6 h-22 bg-green-500 animate-[bounce_1.6s_infinite]"></div>
                        <div className="w-6 h-22 bg-green-500 animate-[bounce_1.6s_infinite_0.4s]"></div>
                        <div className="w-6 h-22 bg-green-500 animate-[bounce_1.6s_infinite_0.8s]"></div>
                      </div>
                      <span className="text-green-500 text-[24px] font-black uppercase tracking-[1em] animate-pulse relative z-10">Minerando...</span>
                    </div>
                  )}
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-24 mb-96">
                  {results.map((group) => (
                    <GroupCard key={group.id} group={group} />
                  ))}
                </div>
              </section>
            )}

            {!hasSearched && (
              <div className="mt-48 py-[25rem] glass rounded-[16rem] text-center relative overflow-hidden group border-white/5 hover:border-green-500/70 transition-all duration-1000 shadow-[0_80px_200px_rgba(0,0,0,0.9)]">
                <div className="absolute inset-0 bg-gradient-to-br from-green-500/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000"></div>
                <div className="relative z-10 px-24">
                  <div className="w-72 h-72 bg-slate-900 rounded-[8rem] flex items-center justify-center mx-auto mb-32 border border-slate-800 shadow-[0_70px_120px_-40px_rgba(0,0,0,1)] group-hover:scale-110 group-hover:rotate-[35deg] transition-all duration-1000">
                    <i className="fas fa-radar text-[140px] text-green-500 drop-shadow-[0_0_50px_rgba(37,211,102,1)] animate-pulse"></i>
                  </div>
                  <h2 className="text-[140px] md:text-[22rem] font-black text-white mb-28 italic uppercase tracking-tighter leading-none">
                    Radar <span className="text-gradient">V10.0</span>
                  </h2>
                  <p className="text-slate-400 max-w-7xl mx-auto mb-56 font-medium text-5xl md:text-7xl leading-relaxed opacity-80 tracking-tight px-16 italic">
                    Tecnologia neural de elite para localização e interceptação de comunidades estratégicas.
                  </p>
                  <div className="flex flex-col md:flex-row justify-center gap-40 md:gap-96 opacity-40 group-hover:opacity-100 transition-all duration-1000 grayscale group-hover:grayscale-0">
                    <div className="text-center">
                      <div className="text-[140px] font-black text-white tracking-tighter italic font-mono-tech">0.01s</div>
                      <div className="text-[24px] uppercase font-black tracking-[1.2em] mt-12 text-green-500">Latency</div>
                    </div>
                    <div className="text-center">
                      <div className="text-[140px] font-black text-white tracking-tighter italic font-mono-tech">Ultra</div>
                      <div className="text-[24px] uppercase font-black tracking-[1.2em] mt-12 text-green-500">Scan</div>
                    </div>
                    <div className="text-center">
                      <div className="text-[140px] font-black text-white tracking-tighter italic font-mono-tech">100%</div>
                      <div className="text-[24px] uppercase font-black tracking-[1.2em] mt-12 text-green-500">Sync</div>
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

      <footer className="py-80 border-t border-white/5 text-center mt-auto bg-black/95 backdrop-blur-[100px]">
        <div className="container mx-auto max-w-[110rem] px-24">
            <div className="w-64 h-[2px] bg-green-500/40 mx-auto mb-32"></div>
            <p className="text-[26px] text-slate-500 font-black uppercase tracking-[2.4em] mb-32 animate-pulse-subtle italic">To-Ligado Global Intelligence Framework v10.0</p>
            <div className="flex justify-center gap-48 mb-48 opacity-30 hover:opacity-100 transition-opacity duration-1000 grayscale hover:grayscale-0">
               <i className="fab fa-whatsapp text-9xl"></i>
               <i className="fas fa-microchip text-9xl"></i>
               <i className="fas fa-shield-halved text-9xl"></i>
               <i className="fas fa-satellite text-9xl"></i>
            </div>
            <p className="text-[18px] text-slate-700 font-bold max-w-7xl mx-auto leading-loose uppercase tracking-[0.7em] italic mb-32 px-16">
              O Caçador To-Ligado v10.0 opera como um motor de busca de dados públicos descentralizados. Respeitamos os termos de serviço das plataformas de mensageria. O conteúdo interceptado é de inteira responsabilidade de seus administradores.
            </p>
            <div className="text-[18px] text-slate-800 font-black uppercase tracking-[1.4em] font-mono-tech border-t border-white/5 pt-28">© 2024-2025 TO-LIGADO.COM - OPERATIONAL STATUS: NOMINAL [V10.0]</div>
        </div>
      </footer>
    </div>
  );
};

export default App;