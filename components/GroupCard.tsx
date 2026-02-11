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
      const delay = 2500 + Math.random() * 3500;
      const timer = setTimeout(() => {
        const isValid = Math.random() > 0.07; 
        
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
    if (cat.includes('venda') || cat.includes('loja') || cat.includes('oferta') || cat.includes('promo')) return 'fa-cart-shopping';
    if (cat.includes('tec') || cat.includes('dev') || cat.includes('code')) return 'fa-microchip';
    if (cat.includes('estudo') || cat.includes('curso') || cat.includes('educ')) return 'fa-graduation-cap';
    if (cat.includes('emprego') || cat.includes('vaga') || cat.includes('job')) return 'fa-user-tie';
    if (cat.includes('dinheiro') || cat.includes('invest') || cat.includes('finança')) return 'fa-money-bill-trend-up';
    if (cat.includes('saude') || cat.includes('fit') || cat.includes('med')) return 'fa-heart-pulse';
    if (cat.includes('game') || cat.includes('play')) return 'fa-gamepad';
    if (cat.includes('noticia') || cat.includes('news')) return 'fa-newspaper';
    return 'fa-tower-broadcast';
  };

  if (status === 'dead') return null;

  return (
    <div className="glass rounded-[1.5rem] p-6 flex flex-col transition-all duration-500 hover:shadow-[0_0_80px_rgba(37,211,102,0.2)] border border-white/5 hover:border-green-500/50 relative overflow-hidden group min-h-[480px] animate-slide-up">
      {/* HUD Corners */}
      <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-green-500/30 rounded-tl-xl"></div>
      <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-green-500/30 rounded-tr-xl"></div>
      <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-green-500/30 rounded-bl-xl"></div>
      <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-green-500/30 rounded-br-xl"></div>

      {/* Subtle Glow on Hover */}
      <div className="absolute -top-24 -right-24 w-64 h-64 bg-green-500/5 rounded-full blur-[100px] group-hover:bg-green-500/10 transition-all duration-1000"></div>

      {status === 'verifying' ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center space-y-8 relative z-10">
          <div className="relative">
            <div className="w-20 h-20 border-2 border-green-500/10 border-t-green-500 rounded-full animate-spin"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <i className="fas fa-radar text-green-500/30 text-lg animate-pulse"></i>
            </div>
          </div>
          <div className="space-y-3">
            <h4 className="text-white/50 font-mono-tech text-[10px] tracking-[0.4em] uppercase animate-pulse">Analise Espectral...</h4>
            <div className="h-[2px] w-32 bg-white/5 rounded-full overflow-hidden mx-auto">
              <div className="h-full bg-green-500 animate-[loading_4s_ease-in-out_infinite]"></div>
            </div>
          </div>
        </div>
      ) : (
        <>
          <div className="flex justify-between items-start mb-8 relative z-10">
            <div className="w-16 h-16 rounded-2xl bg-slate-900/50 border border-white/10 flex items-center justify-center text-green-500 group-hover:bg-green-500/20 group-hover:text-white transition-all duration-500 shadow-xl">
              <i className={`fas ${getCategoryIcon(group.category)} text-3xl`}></i>
            </div>
            <div className="flex flex-col items-end">
              <div className="flex items-center gap-2 px-3 py-1 bg-green-500/20 rounded-lg border border-green-500/30 mb-2">
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-ping"></span>
                <span className="text-green-400 text-[10px] font-black uppercase tracking-widest">Ativo</span>
              </div>
              <span className="text-[10px] text-slate-400 font-mono-tech uppercase tracking-tighter bg-black/50 px-3 py-1.5 rounded-lg border border-white/10">{group.category}</span>
            </div>
          </div>

          <h3 className="text-xl md:text-2xl font-black text-white mb-4 line-clamp-2 leading-tight group-hover:text-green-400 transition-colors h-16 italic tracking-tight relative z-10">
            {group.name}
          </h3>

          <p className="text-slate-400 text-sm line-clamp-4 leading-relaxed mb-10 font-medium relative z-10 opacity-70 group-hover:opacity-100 transition-opacity">
            {group.description}
          </p>

          <div className="mt-auto pt-8 border-t border-white/10 space-y-6 relative z-10">
             <div className="bg-black/60 rounded-xl px-5 py-4 flex items-center justify-between border border-white/5 group/link">
                <span className="text-[11px] text-slate-500 font-mono truncate max-w-[150px] group-hover/link:text-green-400 transition-colors">{group.url.replace('https://', '')}</span>
                <i className="fas fa-satellite text-green-500/20 text-xs"></i>
             </div>
             <a
              href={group.url}
              target="_blank"
              rel="noopener noreferrer"
              className="whatsapp-bg hover:scale-[1.03] active:scale-95 text-white w-full py-5 rounded-2xl text-[12px] font-black uppercase tracking-[0.4em] transition-all flex items-center justify-center gap-4 shadow-2xl shadow-green-500/20 border border-white/10"
            >
              Interceptar Convite
              <i className="fas fa-crosshairs text-[12px] group-hover:rotate-45 transition-transform"></i>
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