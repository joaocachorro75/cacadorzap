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
    
    // Incrementa buscas totais nas estatísticas
    setStats(prev => ({ ...prev, totalSearches: prev.totalSearches + 1 }));

    try {
      await huntGroupsStream(keyword, (update: StreamUpdate) => {
        if (update.error) {
          setError(update.error);
          setIsLoading(false);
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
        }
      });
    } catch (err) {
      setError("Falha na conexão com o Radar To-Ligado.");
      setIsLoading(false);
    }
  }, []);

  return (
    <div className="min-h-screen flex flex-col w-full selection:bg-green-500/30">
      <div className="flex-grow container mx-auto max-w-7xl px-4 py-8">
        <Header />
        
        {view === 'public' ? (
          <div className="animate-slide-up">
            <SearchBar onSearch={handleSearch} isLoading={isLoading && results.length === 0} />

            {sources.length > 0 && (
              <div className="mb-8 px-6 py-4 glass rounded-[2rem] border-green-500/20">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Fontes de Pesquisa Localizadas:</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {sources.map((s, i) => (
                    <a 
                      key={i} 
                      href={s.uri} 
                      target="_blank" 
                      rel="noreferrer" 
                      className="text-[10px] bg-white/5 border border-white/10 px-3 py-1.5 rounded-full text-slate-400 hover:text-green-400 hover:border-green-500/30 transition-all flex items-center gap-2"
                    >
                      <i className="fas fa-globe text-[8px]"></i> {s.title.substring(0, 30)}...
                    </a>
                  ))}
                </div>
              </div>
            )}

            {error && (
              <div className="p-6 glass border-red-500/40 rounded-3xl text-red-400 mb-8 flex items-center gap-4">
                <i className="fas fa-satellite-dish text-2xl animate-bounce"></i>
                <div>
                  <h4 className="font-bold uppercase text-xs">Interferência no Radar</h4>
                  <p className="text-[10px] opacity-70">{error}</p>
                </div>
              </div>
            )}

            {(isLoading || results.length > 0) && (
              <section className="mt-8">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 gap-4 px-2">
                  <div className="flex items-center gap-6">
                    <div className="flex flex-col">
                      <span className="text-5xl font-black text-white italic tracking-tighter leading-none">
                        {results.length}
                      </span>
                      <span className="text-[10px] font-black text-green-500 uppercase tracking-widest mt-1">Grupos Capturados</span>
                    </div>
                    <div className="h-12 w-px bg-slate-800 hidden md:block"></div>
                    <h2 className="text-xl font-black text-slate-200 uppercase tracking-tight italic">
                      Resultados em Tempo Real
                    </h2>
                  </div>
                  
                  {isLoading && (
                    <div className="flex items-center gap-3 bg-green-500/10 border border-green-500/20 px-4 py-2 rounded-2xl">
                      <div className="flex gap-1">
                        <div className="w-1 h-3 bg-green-500 animate-bounce"></div>
                        <div className="w-1 h-3 bg-green-500 animate-bounce [animation-delay:0.2s]"></div>
                        <div className="w-1 h-3 bg-green-500 animate-bounce [animation-delay:0.4s]"></div>
                      </div>
                      <span className="text-green-500 text-[9px] font-black uppercase tracking-tighter">Sincronizando Radar...</span>
                    </div>
                  )}
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                  {results.map((group) => (
                    <GroupCard key={group.id} group={group} />
                  ))}
                </div>
              </section>
            )}

            {!hasSearched && (
              <div className="mt-20 py-32 glass rounded-[4rem] text-center relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-b from-green-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000"></div>
                <i className="fas fa-radar text-7xl text-green-500/20 mb-8 block animate-pulse"></i>
                <h2 className="text-6xl font-black text-white mb-6 italic uppercase tracking-tighter">
                  Radar <span className="text-gradient">To-Ligado</span>
                </h2>
                <p className="text-slate-400 max-w-xl mx-auto mb-10 font-medium px-4 leading-relaxed">
                  Busca exaustiva em indexadores globais para encontrar comunidades ativas e exclusivas. Digite uma palavra-chave para iniciar a varredura.
                </p>
                <div className="flex justify-center gap-12 opacity-30">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-white tracking-tighter">2025</div>
                    <div className="text-[9px] uppercase font-black tracking-widest">Dataset</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-white tracking-tighter">100%</div>
                    <div className="text-[9px] uppercase font-black tracking-widest">Real-time</div>
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
      <footer className="py-12 border-t border-white/5 text-center mt-auto bg-black/20">
        <p className="text-[10px] text-slate-600 font-bold uppercase tracking-[0.4em] mb-2">Powered by To-Ligado Intelligence</p>
        <p className="text-[9px] text-slate-800 font-medium px-4">Esta aplicação utiliza IA avançada para mineração de dados em tempo real em fontes públicas.</p>
      </footer>
    </div>
  );
};

export default App;