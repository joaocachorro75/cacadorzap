import React, { useState, useEffect } from 'react';
import { WhatsAppGroup } from '../types';

interface GroupCardProps {
  group: WhatsAppGroup;
  onVerified?: (id: string, isValid: boolean) => void;
}

const GroupCard: React.FC<GroupCardProps> = ({ group, onVerified }) => {
  const [status, setStatus] = useState<'verifying' | 'active' | 'dead'>(group.status === 'active' ? 'active' : 'verifying');

  useEffect(() => {
    if (status === 'verifying') {
      const delay = 1800 + Math.random() * 3000;
      const timer = setTimeout(() => {
        // Simulação de ping tático - Alta taxa de sucesso para grupos recentes
        const isValid = Math.random() > 0.08; 
        
        if (isValid) {
          setStatus('active');
          if (onVerified) onVerified(group.id, true);
        } else {
          setStatus('dead');
          if (onVerified) onVerified(group.id, false);
        }
      }, delay);
      return () => clearTimeout(timer);
    }
  }, [status, group.id, onVerified]);

  const getCategoryIcon = (category: string) => {
    const cat = category.toLowerCase();
    if (cat.includes('venda') || cat.includes('loja') || cat.includes('promo')) return 'fa-tags';
    if (cat.includes('tec') || cat.includes('dev') || cat.includes('code')) return 'fa-terminal';
    if (cat.includes('educ') || cat.includes('estudo') || cat.includes('curso')) return 'fa-book-open-reader';
    if (cat.includes('job') || cat.includes('vaga') || cat.includes('trampo')) return 'fa-briefcase';
    if (cat.includes('invest') || cat.includes('dinheiro') || cat.includes('bolsa')) return 'fa-sack-dollar';
    if (cat.includes('saude') || cat.includes('gym') || cat.includes('fit')) return 'fa-heart-pulse';
    if (cat.includes('games') || cat.includes('jogo')) return 'fa-gamepad';
    return 'fa-tower-broadcast';
  };

  if (status === 'dead') return null;

  return (
    <div className="glass rounded-[2rem] p-7 flex flex-col transition-all duration-700 hover:shadow-[0_0_100px_rgba(37,211,102,0.15)] border border-white/5 hover:border-green-500/40 relative overflow-hidden group min-h-[460px] animate-slide-up">
      {/* Elemento Decorativo de Background */}
      <div className="absolute -top-10 -right-10 w-40 h-40 bg-green-500/5 rounded-full blur-3xl group-hover:bg-green-500/10 transition-colors duration-700"></div>

      {status === 'verifying' ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center space-y-8 relative z-10">
          <div className="relative">
            <div className="w-28 h-28 border-[1px] border-green-500/20 border-t-green-500 rounded-full animate-spin"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <i className="fas fa-radar text-green-500 text-3xl animate-pulse"></i>
            </div>
          </div>
          <div className="space-y-4">
            <h4 className="text-white/90 font-mono-tech text-[10px] tracking-[0.4em] uppercase animate-pulse">Ping em Comunidade...</h4>
            <div className="h-1 w-32 bg-white/5 rounded-full overflow-hidden mx-auto">
              <div className="h-full bg-green-500 animate-[loading_3s_ease-in-out_infinite]"></div>
            </div>
          </div>
        </div>
      ) : (
        <>
          <div className="flex justify-between items-start mb-8 relative z-10">
            <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-green-400 group-hover:text-white group-hover:bg-green-500/20 transition-all duration-500">
              <i className={`fas ${getCategoryIcon(group.category)} text-2xl`}></i>
            </div>
            <div className="flex flex-col items-end">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-green-500/10 rounded-full border border-green-500/30 mb-2">
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-ping"></span>
                <span className="text-green-400 text-[10px] font-black uppercase tracking-widest">Ativo</span>
              </div>
              <span className="text-[10px] text-slate-500 font-mono-tech uppercase tracking-tighter max-w-[120px] truncate">{group.category}</span>
            </div>
          </div>

          <h3 className="text-2xl font-black text-white mb-4 line-clamp-2 leading-tight group-hover:text-green-400 transition-colors h-16 italic tracking-tight relative z-10">
            {group.name}
          </h3>

          <p className="text-slate-400 text-sm line-clamp-4 leading-relaxed mb-8 font-medium relative z-10 opacity-70 group-hover:opacity-100 transition-opacity">
            {group.description}
          </p>

          <div className="mt-auto pt-6 border-t border-white/10 space-y-5 relative z-10">
             <div className="bg-black/40 rounded-xl px-4 py-3 flex items-center justify-between border border-white/5 group/link">
                <span className="text-[10px] text-slate-500 font-mono truncate max-w-[140px] group-hover/link:text-green-500 transition-colors">{group.url.replace('https://', '')}</span>
                <i className="fas fa-link text-green-500/30 text-[11px]"></i>
             </div>
             <a
              href={group.url}
              target="_blank"
              rel="noopener noreferrer"
              className="whatsapp-bg hover:scale-[1.02] active:scale-95 text-white w-full py-4.5 rounded-2xl text-[12px] font-black uppercase tracking-[0.3em] transition-all flex items-center justify-center gap-3 shadow-2xl shadow-green-500/10"
            >
              Conectar Agora
              <i className="fas fa-chevron-right text-[9px] translate-x-0 group-hover:translate-x-1 transition-transform"></i>
            </a>
          </div>
        </>
      )}
      
      <style>{`
        @keyframes loading {
          0% { transform: translateX(-100%); }
          50% { transform: translateX(0%); }
          100% { transform: translateX(100%); }
        }
      `}</style>
    </div>
  );
};

export default GroupCard;