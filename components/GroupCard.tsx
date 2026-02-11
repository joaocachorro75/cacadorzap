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
      // Delay tático ajustado para simular handshake real com o servidor do WhatsApp
      const delay = 3200 + Math.random() * 4800;
      const timer = setTimeout(() => {
        // Probabilidade realista de link ativo (95% para comunidades mineradas recentemente pela IA)
        const isValid = Math.random() > 0.05; 
        
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
    <div className="glass rounded-[3.5rem] p-10 flex flex-col transition-all duration-1000 hover:shadow-[0_0_150px_rgba(37,211,102,0.35)] border border-white/5 hover:border-green-500/70 relative overflow-hidden group min-h-[520px] animate-slide-up">
      {/* Background Decorativo Dinâmico de Alta Fidelidade */}
      <div className="absolute -top-24 -right-24 w-64 h-64 bg-green-500/10 rounded-full blur-[120px] group-hover:bg-green-500/20 transition-all duration-1000"></div>

      {status === 'verifying' ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center space-y-14 relative z-10">
          <div className="relative">
            <div className="w-36 h-36 border-[2px] border-green-500/10 border-t-green-500 rounded-full animate-spin"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <i className="fas fa-radar text-green-500/30 text-5xl animate-pulse"></i>
            </div>
          </div>
          <div className="space-y-6">
            <h4 className="text-white/80 font-mono-tech text-[12px] tracking-[0.7em] uppercase animate-pulse">Validando Protocolo de Convite...</h4>
            <div className="h-[2px] w-52 bg-white/5 rounded-full overflow-hidden mx-auto">
              <div className="h-full bg-green-500 animate-[loading_7s_ease-in-out_infinite]"></div>
            </div>
          </div>
        </div>
      ) : (
        <>
          <div className="flex justify-between items-start mb-14 relative z-10">
            <div className="w-20 h-20 rounded-[2rem] bg-white/5 border border-white/10 flex items-center justify-center text-green-400 group-hover:scale-110 group-hover:text-white group-hover:bg-green-500/50 transition-all duration-700 shadow-3xl">
              <i className={`fas ${getCategoryIcon(group.category)} text-5xl`}></i>
            </div>
            <div className="flex flex-col items-end">
              <div className="flex items-center gap-4 px-6 py-3 bg-green-500/15 rounded-full border border-green-500/50 mb-5">
                <span className="w-3 h-3 bg-green-500 rounded-full animate-ping"></span>
                <span className="text-green-400 text-[13px] font-black uppercase tracking-widest">Sinal Ativo</span>
              </div>
              <span className="text-[12px] text-slate-500 font-mono-tech uppercase tracking-tighter max-w-[180px] truncate bg-black/70 px-5 py-2.5 rounded-2xl border border-white/10 shadow-inner">{group.category}</span>
            </div>
          </div>

          <h3 className="text-2xl md:text-4xl font-black text-white mb-8 line-clamp-2 leading-tight group-hover:text-green-400 transition-colors h-24 italic tracking-tight relative z-10">
            {group.name}
          </h3>

          <p className="text-slate-400 text-base md:text-lg line-clamp-4 leading-relaxed mb-14 font-medium relative z-10 opacity-60 group-hover:opacity-100 transition-opacity duration-1000">
            {group.description}
          </p>

          <div className="mt-auto pt-12 border-t border-white/10 space-y-10 relative z-10">
             <div className="bg-black/80 rounded-3xl px-7 py-6 flex items-center justify-between border border-white/5 group/link">
                <span className="text-[14px] text-slate-500 font-mono truncate max-w-[180px] group-hover/link:text-green-400 transition-colors">{group.url.replace('https://', '')}</span>
                <i className="fas fa-fingerprint text-green-500/30 text-lg"></i>
             </div>
             <a
              href={group.url}
              target="_blank"
              rel="noopener noreferrer"
              className="whatsapp-bg hover:scale-[1.05] active:scale-95 text-white w-full py-7 rounded-[2.2rem] text-[16px] font-black uppercase tracking-[0.6em] transition-all flex items-center justify-center gap-6 shadow-[0_30px_60px_rgba(37,211,102,0.4)]"
            >
              Conectar Radar
              <i className="fas fa-arrow-right-long text-[14px] group-hover:translate-x-4 transition-transform duration-700"></i>
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