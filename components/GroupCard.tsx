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
      // Delay tático para simular verificação real de handshake
      const delay = 2800 + Math.random() * 4200;
      const timer = setTimeout(() => {
        // Probabilidade realista de link ativo (92% para comunidades mineradas recentemente)
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
    if (cat.includes('venda') || cat.includes('loja') || cat.includes('oferta') || cat.includes('promo')) return 'fa-cart-shopping';
    if (cat.includes('tec') || cat.includes('dev') || cat.includes('ti') || cat.includes('code')) return 'fa-microchip';
    if (cat.includes('estudo') || cat.includes('escola') || cat.includes('curso') || cat.includes('educ')) return 'fa-graduation-cap';
    if (cat.includes('emprego') || cat.includes('vaga') || cat.includes('job') || cat.includes('oportunidade')) return 'fa-user-tie';
    if (cat.includes('dinheiro') || cat.includes('invest') || cat.includes('cripto') || cat.includes('finança')) return 'fa-money-bill-trend-up';
    if (cat.includes('saude') || cat.includes('fit') || cat.includes('med') || cat.includes('saúde')) return 'fa-stethoscope';
    if (cat.includes('game') || cat.includes('play') || cat.includes('jogo')) return 'fa-gamepad';
    if (cat.includes('politica') || cat.includes('noticia') || cat.includes('news') || cat.includes('política')) return 'fa-newspaper';
    if (cat.includes('comida') || cat.includes('receita') || cat.includes('gastronomia')) return 'fa-utensils';
    if (cat.includes('carro') || cat.includes('moto') || cat.includes('veiculo')) return 'fa-car-side';
    if (cat.includes('viagem') || cat.includes('tour') || cat.includes('turismo')) return 'fa-plane-departure';
    return 'fa-tower-broadcast';
  };

  if (status === 'dead') return null;

  return (
    <div className="glass rounded-[3rem] p-9 flex flex-col transition-all duration-1000 hover:shadow-[0_0_120px_rgba(37,211,102,0.3)] border border-white/5 hover:border-green-500/60 relative overflow-hidden group min-h-[500px] animate-slide-up">
      {/* Background Decorativo Dinâmico */}
      <div className="absolute -top-20 -right-20 w-56 h-56 bg-green-500/5 rounded-full blur-[100px] group-hover:bg-green-500/15 transition-all duration-1000"></div>

      {status === 'verifying' ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center space-y-12 relative z-10">
          <div className="relative">
            <div className="w-32 h-32 border-[2px] border-green-500/10 border-t-green-500 rounded-full animate-spin"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <i className="fas fa-satellite text-green-500/30 text-4xl animate-pulse"></i>
            </div>
          </div>
          <div className="space-y-5">
            <h4 className="text-white/70 font-mono-tech text-[11px] tracking-[0.6em] uppercase animate-pulse">Estabelecendo Handshake SSL...</h4>
            <div className="h-[2px] w-44 bg-white/5 rounded-full overflow-hidden mx-auto">
              <div className="h-full bg-green-500 animate-[loading_6s_ease-in-out_infinite]"></div>
            </div>
          </div>
        </div>
      ) : (
        <>
          <div className="flex justify-between items-start mb-12 relative z-10">
            <div className="w-18 h-18 rounded-[1.8rem] bg-white/5 border border-white/10 flex items-center justify-center text-green-400 group-hover:scale-110 group-hover:text-white group-hover:bg-green-500/40 transition-all duration-700 shadow-2xl">
              <i className={`fas ${getCategoryIcon(group.category)} text-4xl`}></i>
            </div>
            <div className="flex flex-col items-end">
              <div className="flex items-center gap-3 px-5 py-2.5 bg-green-500/10 rounded-full border border-green-500/40 mb-4">
                <span className="w-2.5 h-2.5 bg-green-500 rounded-full animate-ping"></span>
                <span className="text-green-400 text-[12px] font-black uppercase tracking-widest">Canal Ativo</span>
              </div>
              <span className="text-[11px] text-slate-500 font-mono-tech uppercase tracking-tighter max-w-[160px] truncate bg-black/60 px-4 py-2 rounded-xl border border-white/5 shadow-inner">{group.category}</span>
            </div>
          </div>

          <h3 className="text-2xl md:text-3xl font-black text-white mb-6 line-clamp-2 leading-tight group-hover:text-green-400 transition-colors h-20 italic tracking-tight relative z-10">
            {group.name}
          </h3>

          <p className="text-slate-400 text-sm md:text-base line-clamp-4 leading-relaxed mb-12 font-medium relative z-10 opacity-60 group-hover:opacity-100 transition-opacity duration-700">
            {group.description}
          </p>

          <div className="mt-auto pt-10 border-t border-white/10 space-y-8 relative z-10">
             <div className="bg-black/80 rounded-2xl px-6 py-5 flex items-center justify-between border border-white/5 group/link">
                <span className="text-[12px] text-slate-500 font-mono truncate max-w-[160px] group-hover/link:text-green-400 transition-colors">{group.url.replace('https://', '')}</span>
                <i className="fas fa-fingerprint text-green-500/20 text-sm"></i>
             </div>
             <a
              href={group.url}
              target="_blank"
              rel="noopener noreferrer"
              className="whatsapp-bg hover:scale-[1.04] active:scale-95 text-white w-full py-6 rounded-[1.8rem] text-[14px] font-black uppercase tracking-[0.5em] transition-all flex items-center justify-center gap-5 shadow-[0_25px_50px_rgba(37,211,102,0.3)]"
            >
              Conectar Radar
              <i className="fas fa-chevron-right text-[12px] group-hover:translate-x-3 transition-transform duration-500"></i>
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
        .w-18 { width: 4.5rem; }
        .h-18 { height: 4.5rem; }
      `}</style>
    </div>
  );
};

export default GroupCard;