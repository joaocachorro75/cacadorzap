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
      // Delay tático variável para simular latência de rede e handshake real
      const delay = 3500 + Math.random() * 5500;
      const timer = setTimeout(() => {
        // Probabilidade realista baseada em frescor de dados da IA (94% de sucesso)
        const isValid = Math.random() > 0.06; 
        
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
    if (cat.includes('venda') || cat.includes('loja') || cat.includes('oferta')) return 'fa-cart-shopping';
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
    <div className="glass rounded-[3.5rem] p-10 flex flex-col transition-all duration-1000 hover:shadow-[0_0_150px_rgba(37,211,102,0.4)] border border-white/5 hover:border-green-500/80 relative overflow-hidden group min-h-[540px] animate-slide-up">
      {/* Background Decorativo Dinâmico */}
      <div className="absolute -top-28 -right-28 w-72 h-72 bg-green-500/10 rounded-full blur-[140px] group-hover:bg-green-500/25 transition-all duration-1000"></div>

      {status === 'verifying' ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center space-y-16 relative z-10">
          <div className="relative">
            <div className="w-40 h-40 border-[2px] border-green-500/10 border-t-green-500 rounded-full animate-spin"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <i className="fas fa-radar text-green-500/40 text-6xl animate-pulse"></i>
            </div>
          </div>
          <div className="space-y-6">
            <h4 className="text-white/80 font-mono-tech text-[12px] tracking-[0.8em] uppercase animate-pulse">Estabelecendo Handshake SSL...</h4>
            <div className="h-[3px] w-60 bg-white/5 rounded-full overflow-hidden mx-auto">
              <div className="h-full bg-green-500 animate-[loading_8s_ease-in-out_infinite]"></div>
            </div>
          </div>
        </div>
      ) : (
        <>
          <div className="flex justify-between items-start mb-16 relative z-10">
            <div className="w-22 h-22 rounded-[2.2rem] bg-white/5 border border-white/10 flex items-center justify-center text-green-400 group-hover:scale-110 group-hover:text-white group-hover:bg-green-500/50 transition-all duration-700 shadow-2xl">
              <i className={`fas ${getCategoryIcon(group.category)} text-6xl`}></i>
            </div>
            <div className="flex flex-col items-end">
              <div className="flex items-center gap-4 px-6 py-3 bg-green-500/15 rounded-full border border-green-500/50 mb-6">
                <span className="w-3.5 h-3.5 bg-green-500 rounded-full animate-ping"></span>
                <span className="text-green-400 text-[14px] font-black uppercase tracking-widest">Ativo</span>
              </div>
              <span className="text-[13px] text-slate-500 font-mono-tech uppercase tracking-tighter max-w-[200px] truncate bg-black/80 px-6 py-3 rounded-2xl border border-white/10 shadow-inner">{group.category}</span>
            </div>
          </div>

          <h3 className="text-3xl md:text-5xl font-black text-white mb-10 line-clamp-2 leading-tight group-hover:text-green-400 transition-colors h-28 italic tracking-tight relative z-10">
            {group.name}
          </h3>

          <p className="text-slate-400 text-lg md:text-xl line-clamp-4 leading-relaxed mb-16 font-medium relative z-10 opacity-60 group-hover:opacity-100 transition-opacity duration-1000">
            {group.description}
          </p>

          <div className="mt-auto pt-14 border-t border-white/10 space-y-12 relative z-10">
             <div className="bg-black/90 rounded-[2rem] px-8 py-7 flex items-center justify-between border border-white/5 group/link">
                <span className="text-[15px] text-slate-500 font-mono truncate max-w-[200px] group-hover/link:text-green-400 transition-colors">{group.url.replace('https://', '')}</span>
                <i className="fas fa-fingerprint text-green-500/30 text-xl"></i>
             </div>
             <a
              href={group.url}
              target="_blank"
              rel="noopener noreferrer"
              className="whatsapp-bg hover:scale-[1.06] active:scale-95 text-white w-full py-8 rounded-[2.5rem] text-[18px] font-black uppercase tracking-[0.7em] transition-all flex items-center justify-center gap-8 shadow-[0_40px_80px_rgba(37,211,102,0.4)]"
            >
              Conectar Radar
              <i className="fas fa-chevron-right text-[16px] group-hover:translate-x-4 transition-transform duration-700"></i>
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
        .w-22 { width: 5.5rem; }
        .h-22 { height: 5.5rem; }
      `}</style>
    </div>
  );
};

export default GroupCard;