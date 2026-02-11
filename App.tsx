
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
  const [verifiedCount, setVerifiedCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [systemReady, setSystemReady] = useState<boolean | null>(null);
  
  const [stats, setStats] = useState<AppStats>({
    totalSearches: 0,
    groupsFound: 0,
    estimatedCost: 0
  });

  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash;
      if (hash === '#admin') {
        setView('admin-login');
      } else if (hash === '#dashboard') {
        const isAdmin = localStorage.getItem('is_admin') === 'true';
        if (isAdmin) {
          setView('admin-panel');
        } else {
          window.location.hash = '#admin';
        }
      } else {
        setView('public');
      }
    };

    window.addEventListener('hashchange', handleHash);
    handleHash();

    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  useEffect(() => {
    setSystemReady(!!process.env.API_KEY);
    const saved = localStorage.getItem('cacador-stats');
    if (saved) setStats(JSON.parse(saved));
  }, []);

  const handleSearch = useCallback(async (keyword: string) => {
    setIsLoading(true);
    setError(null);
    setResults([]);
    setVerifiedCount(0);
    setHasSearched(true);

    setStats(prev => {
      const newStats = {
        ...prev,
        totalSearches: prev.totalSearches + 1,
        estimatedCost: prev.estimatedCost + 0.05
      };
      localStorage.setItem('cacador-stats', JSON.stringify(newStats));
      return newStats;
    });

    try {
      await huntGroupsStream(keyword, (update: StreamUpdate) => {
        if (update.error) setError(update.error);
        if (update.group) {
          setResults(prev => [...prev, update.group as WhatsAppGroup]);
          setStats(s => {
            const ns = { ...s, groupsFound: s.groupsFound + 1 };
            localStorage.setItem('cacador-stats', JSON.stringify(ns));
            return ns;
          });
        }
        if (update.done) setIsLoading(false);
      });
    } catch (err) {
      setError("Falha na conexão com o Radar To-Ligado.");
      setIsLoading(false);
    }
  }, []);

  const handleLoginSuccess = () => {
    localStorage.setItem('is_admin', 'true');
    window.location.hash = '#dashboard';
  };

  const handleLogout = () => {
    localStorage.removeItem('is_admin');
    window.location.hash = '';
  };

  return (
    <div className="min-h-screen flex flex-col w-full overflow-x-hidden selection:bg-green-500/30">
      <div className="flex-grow container mx-auto max-w-7xl px-4 md:px-8 py-6 md:py-12">
        <Header />
        
        {view === 'public' ? (
          <div className="animate-slide-up w-full">
            <SearchBar onSearch={handleSearch} isLoading={isLoading && results.length === 0} />

            {error && (
              <div className="max-w-xl mx-auto mb-10 p-5 glass border-red-500/20 rounded-2xl text-red-400 flex items-center gap-4">
                <i className="fas fa-triangle-exclamation text-lg shrink-0"></i>
                <p className="text-[10px] md:text-xs font-bold uppercase tracking-widest leading-relaxed">{error}</p>
              </div>
            )}

            {(isLoading || results.length > 0) && (
              <section className="mt-8 md:mt-16 w-full">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8 md:mb-12 px-2">
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <span className="text-3xl md:text-4xl font-black text-white italic">{verifiedCount}</span>
                      <h2 className="text-lg md:text-xl font-bold text-slate-300 uppercase tracking-tighter">Grupos Verificados</h2>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
                      <p className="text-[9px] md:text-[10px] text-slate-500 font-bold uppercase tracking-[0.2em]">Radar Ativo To-Ligado.com</p>
                    </div>
                  </div>
                  
                  {isLoading && (
                    <div className="flex items-center gap-3 px-4 py-2 glass rounded-full border-green-500/20 w-fit">
                      <i className="fas fa-radar fa-spin text-green-500 text-[10px]"></i>
                      <span className="text-[8px] md:text-[9px] font-black text-green-500 uppercase tracking-widest">Minerando Redes...</span>
                    </div>
                  )}
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6 px-2">
                  {results.map((group) => (
                    <GroupCard 
                      key={group.id}
                      group={group} 
                      onVerified={(id, valid) => valid && setVerifiedCount(v => v + 1)} 
                    />
                  ))}
                </div>
              </section>
            )}

            {!hasSearched && (
              <div className="mt-12 md:mt-20 py-12 md:py-24 glass rounded-[2rem] md:rounded-[4rem] text-center relative overflow-hidden group mx-2">
                <div className="absolute inset-0 bg-gradient-to-b from-green-500/[0.03] to-transparent"></div>
                <div className="relative z-10 px-6">
                  <h2 className="text-3xl md:text-7xl font-black text-white mb-6 tracking-tighter italic uppercase leading-none">
                    Radar <span className="text-gradient">To-Ligado</span>
                  </h2>
                  <p className="text-slate-400 text-sm md:text-xl max-w-2xl mx-auto mb-10 md:mb-12 font-medium leading-relaxed">
                    Localize comunidades exclusivas em tempo real. Nossa tecnologia de IA verifica cada link instantaneamente para garantir apenas grupos ativos.
                  </p>
                  <div className="flex flex-wrap justify-center gap-6 md:gap-10 opacity-60">
                    <div className="flex flex-col">
                      <span className="text-lg md:text-2xl font-bold text-white">2026</span>
                      <span className="text-[8px] md:text-[9px] uppercase tracking-widest font-black text-slate-500">Pronto</span>
                    </div>
                    <div className="w-px h-8 md:h-10 bg-white/10 hidden sm:block"></div>
                    <div className="flex flex-col">
                      <span className="text-lg md:text-2xl font-bold text-white">LIVE</span>
                      <span className="text-[8px] md:text-[9px] uppercase tracking-widest font-black text-slate-500">Scan</span>
                    </div>
                    <div className="w-px h-8 md:h-10 bg-white/10 hidden sm:block"></div>
                    <div className="flex flex-col">
                      <span className="text-lg md:text-2xl font-bold text-white">100%</span>
                      <span className="text-[8px] md:text-[9px] uppercase tracking-widest font-black text-slate-500">Ativos</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : view === 'admin-login' ? (
          <LoginForm onLogin={handleLoginSuccess} onCancel={() => { window.location.hash = ''; }} />
        ) : (
          <AdminPanel stats={stats} onLogout={handleLogout} systemReady={systemReady} />
        )}
      </div>

      <footer className="py-8 md:py-12 border-t border-white/5 bg-black/20 mt-auto">
        <div className="container mx-auto px-6 flex flex-col items-center gap-5">
          <a 
            href="https://to-ligado.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-lg md:text-xl font-black text-white italic tracking-tighter hover:text-green-500 transition-all flex items-center gap-2"
          >
            TO-LIGADO<span className="text-green-500">.COM</span>
          </a>
          <p className="text-[8px] md:text-[10px] text-slate-600 font-bold uppercase tracking-[0.2em] md:tracking-[0.3em] text-center max-w-lg leading-relaxed px-4">
            O Caçador de Grupos utiliza tecnologia de IA generativa para localizar diretórios públicos. Não nos responsabilizamos pelo conteúdo dos grupos.
          </p>
          <button 
            onClick={() => { window.location.hash = '#admin'; }}
            className="text-[7px] md:text-[8px] text-slate-800 hover:text-slate-500 font-black uppercase tracking-[0.4em] transition-colors mt-2 opacity-50 hover:opacity-100"
          >
            Acesso Restrito
          </button>
        </div>
      </footer>
    </div>
  );
};

export default App;
