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
      setError("FALHA DE COMUNICAÇÃO: O Radar To-Ligado perdeu contato com o núcleo de busca.");
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
              <div className="mb-12 px-6 md:px-10 py-6 glass rounded-[3rem] border-green-500/30 relative overflow-hidden group">
                <div className="absolute top-0 left-0 w-1 h-full bg-green-500 animate-pulse"></div>
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-2.5 h-2.5 bg-green-500 rounded-full animate-ping"></div>
                  <span className="text-[11px] font-black text-slate-200 uppercase tracking-[0.3em]">Varredura em Redes e Satélites:</span>
                </div>
                <div className="flex flex-wrap gap-3">
                  {sources.slice(0, 15).map((s, i) => (
                    <a 
                      key={i} 
                      href={s.uri} 
                      target="_blank" 
                      rel="noreferrer" 
                      className="text-[10px] bg-black/40 border border-white/10 px-5 py-2.5 rounded-2xl text-slate-400 hover:text-green-400 hover:border-green-500/40 transition-all flex items-center gap-3 group/link hover:shadow-lg hover:shadow-green-500/5"
                    >
                      <i className="fas fa-satellite-dish text-[9px] text-green-500/50 group-hover/link:animate-spin"></i> 
                      <span className="font-semibold">{s.title.substring(0, 30)}</span>
                    </a>
                  ))}
                </div>
              </div>
            )}

            {error && (
              <div className="p-10 glass border-red-500/40 rounded-[3.5rem] text-red-400 mb-12 flex flex-col md:flex-row items-center gap-8 animate-shake shadow-[0_0_50px_rgba(239,68,68,0.1)]">
                <div className="w-20 h-20 bg-red-500/10 rounded-3xl flex items-center justify-center border border-red-500/20">
                  <i className="fas fa-radiation-alt text-3xl animate-pulse"></i>
                </div>
                <div className="flex-1 text-center md:text-left">
                  <h4 className="font-black uppercase text-lg tracking-widest mb-2 italic">Alerta de Interferência</h4>
                  <p className="text-sm opacity-80 font-medium leading-relaxed max-w-xl">{error}</p>
                </div>
                <button 
                  onClick={() => { setHasSearched(false); setError(null); }} 
                  className="px-10 py-4 bg-white/5 hover:bg-white/10 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] border border-white/10 transition-all active:scale-95"
                >
                  Resetar Radar
                </button>
              </div>
            )}

            {(isLoading || results.length > 0) && (
              <section className="mt-16">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-16 gap-8 px-6">
                  <div className="flex items-center gap-10">
                    <div className="flex flex-col">
                      <span className="text-8xl font-black text-white italic tracking-tighter leading-none drop-shadow-2xl">
                        {results.length}
                      </span>
                      <span className="text-[11px] font-black text-green-500 uppercase tracking-[0.5em] mt-3">Links Encontrados</span>
                    </div>
                    <div className="h-20 w-px bg-slate-800 hidden md:block opacity-50"></div>
                    <div className="max-w-[200px]">
                      <h2 className="text-2xl font-black text-slate-100 uppercase tracking-tighter italic leading-[0.9]">
                        Mineração <br/> em Tempo <br/> Real
                      </h2>
                    </div>
                  </div>
                  
                  {isLoading && (
                    <div className="flex items-center gap-5 bg-green-500/10 border border-green-500/20 px-10 py-5 rounded-[2rem] shadow-inner">
                      <div className="flex gap-2.5">
                        <div className="w-2 h-7 bg-green-500 animate-[bounce_1s_infinite]"></div>
                        <div className="w-2 h-7 bg-green-500 animate-[bounce_1s_infinite_0.2s]"></div>
                        <div className="w-2 h-7 bg-green-500 animate-[bounce_1s_infinite_0.4s]"></div>
                      </div>
                      <span className="text-green-500 text-[12px] font-black uppercase tracking-[0.3em] animate-pulse">Varrendo Frequências...</span>
                    </div>
                  )}
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-40">
                  {results.map((group) => (
                    <GroupCard key={group.id} group={group} />
                  ))}
                </div>
              </section>
            )}

            {!hasSearched && (
              <div className="mt-20 py-48 glass rounded-[7rem] text-center relative overflow-hidden group border-white/5 hover:border-green-500/20 transition-all duration-1000">
                <div className="absolute inset-0 bg-gradient-to-b from-green-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000"></div>
                <div className="relative z-10 px-8">
                  <div className="w-32 h-32 bg-slate-900 rounded-[3rem] flex items-center justify-center mx-auto mb-12 border border-slate-800 shadow-[0_0_50px_rgba(0,0,0,0.5)] group-hover:scale-110 group-hover:rotate-12 transition-all duration-1000">
                    <i className="fas fa-satellite-dish text-6xl text-green-500 drop-shadow-[0_0_10px_rgba(37,211,102,0.5)]"></i>
                  </div>
                  <h2 className="text-6xl md:text-9xl font-black text-white mb-10 italic uppercase tracking-tighter">
                    Radar <span className="text-gradient">V6.0</span>
                  </h2>
                  <p className="text-slate-400 max-w-2xl mx-auto mb-20 font-medium text-lg md:text-2xl leading-relaxed opacity-90 tracking-tight">
                    O caçador inteligente To-Ligado.com intercepta comunidades ativas usando infraestrutura de IA de última geração.
                  </p>
                  <div className="flex flex-col md:flex-row justify-center gap-10 md:gap-32 opacity-40 group-hover:opacity-80 transition-opacity duration-1000">
                    <div className="text-center">
                      <div className="text-5xl font-black text-white tracking-tighter italic">0.2s</div>
                      <div className="text-[11px] uppercase font-black tracking-[0.4em] mt-3 text-green-500">Delay de Rede</div>
                    </div>
                    <div className="text-center">
                      <div className="text-5xl font-black text-white tracking-tighter italic">100%</div>
                      <div className="text-[11px] uppercase font-black tracking-[0.4em] mt-3 text-green-500">Neural Search</div>
                    </div>
                    <div className="text-center">
                      <div className="text-5xl font-black text-white tracking-tighter italic">PRO</div>
                      <div className="text-[11px] uppercase font-black tracking-[0.4em] mt-3 text-green-500">Intelligence</div>
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

      <footer className="py-24 border-t border-white/5 text-center mt-auto bg-black/40 backdrop-blur-md">
        <div className="container mx-auto max-w-4xl px-8">
            <p className="text-[12px] text-slate-500 font-black uppercase tracking-[0.8em] mb-8 animate-pulse-subtle">Sistemas de Inteligência To-Ligado</p>
            <div className="flex justify-center gap-12 mb-12 opacity-30 hover:opacity-100 transition-opacity duration-700 grayscale hover:grayscale-0">
               <i className="fab fa-whatsapp text-3xl"></i>
               <i className="fas fa-shield-virus text-3xl"></i>
               <i className="fas fa-dna text-3xl"></i>
               <i className="fas fa-microchip text-3xl"></i>
            </div>
            <p className="text-[10px] text-slate-700 font-bold max-w-xl mx-auto leading-loose uppercase tracking-widest italic">
              Este radar é uma ferramenta de indexação pública baseada em IA. Não somos responsáveis pelo conteúdo das comunidades interceptadas. Use com responsabilidade.
            </p>
            <div className="mt-12 text-[9px] text-slate-800 font-black uppercase tracking-[0.4em]">© 2024-2025 All Rights Reserved</div>
        </div>
      </footer>
    </div>
  );
};

export default App;