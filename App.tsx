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
      setError("FALHA CRÍTICA NO RADAR: Conexão interrompida com o núcleo de busca.");
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
              <div className="mb-14 px-8 py-7 glass rounded-[3rem] border-green-500/20 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-green-500/40 to-transparent"></div>
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-2.5 h-2.5 bg-green-500 rounded-full animate-ping"></div>
                  <span className="text-[11px] font-black text-white/60 uppercase tracking-[0.4em] font-mono-tech">Rede de Busca Expandida:</span>
                </div>
                <div className="flex flex-wrap gap-3">
                  {sources.slice(0, 18).map((s, i) => (
                    <a 
                      key={i} 
                      href={s.uri} 
                      target="_blank" 
                      rel="noreferrer" 
                      className="text-[10px] bg-white/5 border border-white/10 px-5 py-2.5 rounded-2xl text-slate-400 hover:text-green-400 hover:border-green-500/40 transition-all flex items-center gap-3 group/link shadow-sm"
                    >
                      <i className="fas fa-link text-[9px] opacity-40 group-hover/link:opacity-100 transition-opacity"></i> 
                      <span className="font-bold tracking-tight">{s.title.substring(0, 35)}</span>
                    </a>
                  ))}
                </div>
              </div>
            )}

            {error && (
              <div className="p-12 glass border-red-500/30 rounded-[4rem] text-red-400 mb-14 flex flex-col md:flex-row items-center gap-10 animate-shake shadow-[0_0_80px_rgba(239,68,68,0.1)]">
                <div className="w-24 h-24 bg-red-500/10 rounded-full flex items-center justify-center border border-red-500/20">
                  <i className="fas fa-triangle-exclamation text-4xl animate-pulse"></i>
                </div>
                <div className="flex-1 text-center md:text-left">
                  <h4 className="font-black uppercase text-xl tracking-tighter mb-2 italic">Anomalia de Sinal Detectada</h4>
                  <p className="text-sm opacity-70 font-medium leading-relaxed max-w-2xl">{error}</p>
                </div>
                <button 
                  onClick={() => { setHasSearched(false); setError(null); }} 
                  className="px-12 py-4.5 bg-white/5 hover:bg-white/10 rounded-3xl text-[12px] font-black uppercase tracking-[0.3em] border border-white/10 transition-all active:scale-95"
                >
                  Reiniciar Sistema
                </button>
              </div>
            )}

            {(isLoading || results.length > 0) && (
              <section className="mt-20">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-20 gap-10 px-8">
                  <div className="flex items-center gap-12">
                    <div className="flex flex-col">
                      <span className="text-9xl font-black text-white italic tracking-tighter leading-none drop-shadow-2xl">
                        {results.length}
                      </span>
                      <span className="text-[12px] font-black text-green-500 uppercase tracking-[0.6em] mt-4 font-mono-tech">Comunidades</span>
                    </div>
                    <div className="h-24 w-[2px] bg-white/5 hidden md:block"></div>
                    <div className="max-w-[240px]">
                      <h2 className="text-3xl font-black text-slate-100 uppercase tracking-tighter italic leading-[0.85]">
                        Interceptação <br/> em Massa <br/> <span className="text-green-500">To-Ligado</span>
                      </h2>
                    </div>
                  </div>
                  
                  {isLoading && (
                    <div className="flex items-center gap-6 bg-green-500/5 border border-green-500/20 px-12 py-6 rounded-[2.5rem] shadow-inner relative overflow-hidden group">
                      <div className="absolute inset-0 bg-green-500/5 animate-pulse"></div>
                      <div className="flex gap-3">
                        <div className="w-2.5 h-8 bg-green-500 animate-bounce"></div>
                        <div className="w-2.5 h-8 bg-green-500 animate-bounce [animation-delay:0.2s]"></div>
                        <div className="w-2.5 h-8 bg-green-500 animate-bounce [animation-delay:0.4s]"></div>
                      </div>
                      <span className="text-green-500 text-[13px] font-black uppercase tracking-[0.4em] animate-pulse relative z-10">Minerando Dados...</span>
                    </div>
                  )}
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 mb-48">
                  {results.map((group) => (
                    <GroupCard key={group.id} group={group} />
                  ))}
                </div>
              </section>
            )}

            {!hasSearched && (
              <div className="mt-24 py-56 glass rounded-[8rem] text-center relative overflow-hidden group border-white/5 hover:border-green-500/30 transition-all duration-1000">
                <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000"></div>
                <div className="relative z-10 px-10">
                  <div className="w-36 h-36 bg-slate-900 rounded-[3.5rem] flex items-center justify-center mx-auto mb-14 border border-slate-800 shadow-2xl group-hover:scale-110 group-hover:rotate-[15deg] transition-all duration-1000">
                    <i className="fas fa-satellite text-7xl text-green-500 drop-shadow-[0_0_15px_rgba(37,211,102,0.6)]"></i>
                  </div>
                  <h2 className="text-7xl md:text-[10rem] font-black text-white mb-12 italic uppercase tracking-tighter leading-none">
                    Radar <span className="text-gradient">V7.0</span>
                  </h2>
                  <p className="text-slate-400 max-w-3xl mx-auto mb-24 font-medium text-xl md:text-3xl leading-relaxed opacity-80 tracking-tight">
                    A ferramenta de inteligência definitiva para localização e validação de comunidades públicas do WhatsApp.
                  </p>
                  <div className="flex flex-col md:flex-row justify-center gap-12 md:gap-40 opacity-30 group-hover:opacity-100 transition-all duration-1000 grayscale group-hover:grayscale-0">
                    <div className="text-center">
                      <div className="text-6xl font-black text-white tracking-tighter italic font-mono-tech">0.1s</div>
                      <div className="text-[12px] uppercase font-black tracking-[0.5em] mt-4 text-green-500">Latência Neural</div>
                    </div>
                    <div className="text-center">
                      <div className="text-6xl font-black text-white tracking-tighter italic font-mono-tech">∞</div>
                      <div className="text-[12px] uppercase font-black tracking-[0.5em] mt-4 text-green-500">Escala de Busca</div>
                    </div>
                    <div className="text-center">
                      <div className="text-6xl font-black text-white tracking-tighter italic font-mono-tech">AI+</div>
                      <div className="text-[12px] uppercase font-black tracking-[0.5em] mt-4 text-green-500">Verificação</div>
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

      <footer className="py-28 border-t border-white/5 text-center mt-auto bg-black/40 backdrop-blur-3xl">
        <div className="container mx-auto max-w-5xl px-8">
            <div className="w-16 h-[2px] bg-green-500/30 mx-auto mb-10"></div>
            <p className="text-[13px] text-slate-500 font-black uppercase tracking-[1em] mb-10 animate-pulse-subtle">Infraestrutura To-Ligado Intelligence</p>
            <div className="flex justify-center gap-16 mb-16 opacity-20 hover:opacity-100 transition-opacity duration-1000 grayscale hover:grayscale-0">
               <i className="fab fa-whatsapp text-4xl"></i>
               <i className="fas fa-fingerprint text-4xl"></i>
               <i className="fas fa-brain text-4xl"></i>
               <i className="fas fa-microchip text-4xl"></i>
            </div>
            <p className="text-[11px] text-slate-700 font-bold max-w-2xl mx-auto leading-loose uppercase tracking-[0.2em] italic mb-12">
              Este sistema utiliza processamento de linguagem natural e ferramentas de busca em tempo real para indexar conteúdos públicos. O acesso a grupos é governado pelas políticas da plataforma WhatsApp.
            </p>
            <div className="text-[10px] text-slate-800 font-black uppercase tracking-[0.5em] font-mono-tech">© 2024 RADAR TO-LIGADO - ALL SYSTEMS NOMINAL</div>
        </div>
      </footer>
    </div>
  );
};

export default App;