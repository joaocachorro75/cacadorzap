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
    
    // Inicia o efeito visual do scanner
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
      setError("ERRO DE CONEXÃO: Sincronização com o Radar falhou. Tente novamente.");
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
              <div className="mb-8 px-6 py-4 glass rounded-[2rem] border-green-500/20">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Ativos Sincronizados:</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {sources.slice(0, 15).map((s, i) => (
                    <a 
                      key={i} 
                      href={s.uri} 
                      target="_blank" 
                      rel="noreferrer" 
                      className="text-[10px] bg-white/5 border border-white/10 px-3 py-1.5 rounded-full text-slate-400 hover:text-green-400 hover:border-green-500/30 transition-all flex items-center gap-2"
                    >
                      <i className="fas fa-satellite text-[8px]"></i> {s.title.substring(0, 30)}...
                    </a>
                  ))}
                </div>
              </div>
            )}

            {error && (
              <div className="p-8 glass border-red-500/40 rounded-[2.5rem] text-red-400 mb-8 flex flex-col sm:flex-row items-center gap-6 animate-shake">
                <i className="fas fa-radiation text-4xl animate-bounce"></i>
                <div className="flex-1 text-center sm:text-left">
                  <h4 className="font-black uppercase text-sm tracking-widest mb-1">Alerta do Radar To-Ligado</h4>
                  <p className="text-[11px] opacity-70 font-medium leading-relaxed">{error}</p>
                </div>
                <button onClick={() => { setHasSearched(false); setError(null); }} className="px-6 py-3 bg-white/5 hover:bg-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest border border-white/10 transition-all">Limpar Canal</button>
              </div>
            )}

            {(isLoading || results.length > 0) && (
              <section className="mt-8">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 gap-6 px-2">
                  <div className="flex items-center gap-8">
                    <div className="flex flex-col">
                      <span className="text-6xl font-black text-white italic tracking-tighter leading-none">
                        {results.length}
                      </span>
                      <span className="text-[10px] font-black text-green-500 uppercase tracking-[0.3em] mt-2">Interceptações</span>
                    </div>
                    <div className="h-16 w-px bg-slate-800 hidden md:block"></div>
                    <div>
                      <h2 className="text-xl font-black text-slate-200 uppercase tracking-tight italic">
                        Fluxo de Dados ao Vivo
                      </h2>
                      <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Varredura em tempo real por IA</p>
                    </div>
                  </div>
                  
                  {isLoading && (
                    <div className="flex items-center gap-4 bg-green-500/10 border border-green-500/20 px-6 py-3 rounded-2xl">
                      <div className="flex gap-1.5">
                        <div className="w-1.5 h-4 bg-green-500 animate-bounce"></div>
                        <div className="w-1.5 h-4 bg-green-500 animate-bounce [animation-delay:0.2s]"></div>
                        <div className="w-1.5 h-4 bg-green-500 animate-bounce [animation-delay:0.4s]"></div>
                      </div>
                      <span className="text-green-500 text-[10px] font-black uppercase tracking-[0.2em] animate-pulse">Sincronizando Satélites...</span>
                    </div>
                  )}
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-24">
                  {results.map((group) => (
                    <GroupCard key={group.id} group={group} />
                  ))}
                </div>
              </section>
            )}

            {!hasSearched && (
              <div className="mt-20 py-40 glass rounded-[5rem] text-center relative overflow-hidden group border-white/5">
                <div className="absolute inset-0 bg-gradient-to-b from-green-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000"></div>
                <div className="relative z-10">
                  <div className="w-24 h-24 bg-slate-900 rounded-full flex items-center justify-center mx-auto mb-10 border border-slate-800 shadow-2xl group-hover:scale-110 transition-transform duration-500">
                    <i className="fas fa-radar text-4xl text-green-500 animate-pulse"></i>
                  </div>
                  <h2 className="text-5xl md:text-7xl font-black text-white mb-8 italic uppercase tracking-tighter">
                    Radar <span className="text-gradient">To-Ligado</span>
                  </h2>
                  <p className="text-slate-400 max-w-2xl mx-auto mb-14 font-medium px-6 text-sm md:text-lg leading-relaxed opacity-80">
                    O mais avançado motor de busca de comunidades do Brasil. Utilizamos inteligência artificial para minerar e verificar links de convite ativos em toda a web.
                  </p>
                  <div className="flex justify-center gap-16 md:gap-24 opacity-40">
                    <div className="text-center">
                      <div className="text-3xl font-black text-white tracking-tighter">2025.1</div>
                      <div className="text-[10px] uppercase font-black tracking-[0.3em] mt-1">Engine v3</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-black text-white tracking-tighter">0.1s</div>
                      <div className="text-[10px] uppercase font-black tracking-[0.3em] mt-1">Latency</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-black text-white tracking-tighter">100%</div>
                      <div className="text-[10px] uppercase font-black tracking-[0.3em] mt-1">Verificado</div>
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
      <footer className="py-16 border-t border-white/5 text-center mt-auto bg-black/40">
        <p className="text-[11px] text-slate-500 font-black uppercase tracking-[0.5em] mb-4">Powered by To-Ligado.com | Intelligence Division</p>
        <div className="flex justify-center gap-6 opacity-30 grayscale hover:grayscale-0 transition-all duration-500">
           <i className="fab fa-whatsapp text-xl"></i>
           <i className="fas fa-satellite-dish text-xl"></i>
           <i className="fas fa-shield-halved text-xl"></i>
        </div>
        <p className="text-[9px] text-slate-800 font-medium px-8 mt-6">Varredura profunda autorizada para fins de indexação pública de dados abertos.</p>
      </footer>
    </div>
  );
};

export default App;