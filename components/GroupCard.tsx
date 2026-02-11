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
        // Simulação de verificação - Alta fidelidade
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
    if (cat.includes('venda') || cat.includes('loja') || cat.includes('oferta')) return 'fa-cart-shopping';
    if (cat.includes('tec') || cat.includes('dev') || cat.includes('ti')) return 'fa-microchip';
    if (cat.includes('estudo') || cat.includes('escola') || cat.includes('curso')) return 'fa-graduation-cap';
    if (cat.includes('emprego') || cat.includes('vaga') || cat.includes('job')) return 'fa-user-tie';
    if (cat.includes('dinheiro') || cat.includes('invest') || cat.includes('cripto')) return 'fa-money-bill-trend-up';
    if (cat.includes('saude') || cat.includes('fit') || cat.includes('med')) return 'fa-stethoscope';
    if (cat.includes('game') || cat.includes('play')) return 'fa-gamepad';
    if (cat.includes('politica') || cat.includes('noticia')) return 'fa-landmark-flag';
    if (cat.includes('comida') || cat.includes('receita')) return 'fa-utensils';
    if (cat.includes('carro') || cat.includes('moto')) return 'fa-car-side';
    return 'fa-tower-broadcast';
  };

  if (status === 'dead') return null;

  return (
    <div className="glass rounded-[2.5rem] p-8 flex flex-col transition-all duration-700 hover:shadow-[0_0_80px_rgba(37,211,102,0.25)] border border-white/5 hover:border-green-500/50 relative overflow-hidden group min-h-[480px] animate-slide-up">
      {/* Detalhe de fundo dinâmico */}
      <div className="absolute -top-16 -right-16 w-48 h-48 bg-green-500/10 rounded-full blur-[90px] group-hover:bg-green-500/20 transition-all duration-1000"></div>

      {status === 'verifying' ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center space-y-10 relative z-10">
          <div className="relative">
            <div className="w-28 h-28 border-[1px] border-green-500/20 border-t-green-500 rounded-full animate-spin"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <i className="fas fa-radar text-green-500/40 text-3xl animate-pulse"></i>
            </div>
          </div>
          <div className="space-y-4">
            <h4 className="text-white/80 font-mono-tech text-[10px] tracking-[0.5em] uppercase animate-pulse">Validação Protocolo SSL...</h4>
            <div className="h-[2px] w-40 bg-white/5 rounded-full overflow-hidden mx-auto">
              <div className="h-full bg-green-500 animate-[loading_5s_ease-in-out_infinite]"></div>
            </div>
          </div>
        </div>
      ) : (
        <>
          <div className="flex justify-between items-start mb-10 relative z-10">
            <div className="w-16 h-16 rounded-[1.5rem] bg-white/5 border border-white/10 flex items-center justify-center text-green-400 group-hover:scale-110 group-hover:text-white group-hover:bg-green-500/30 transition-all duration-500 shadow-xl">
              <i className={`fas ${getCategoryIcon(group.category)} text-3xl`}></i>
            </div>
            <div className="flex flex-col items-end">
              <div className="flex items-center gap-2.5 px-4 py-2 bg-green-500/10 rounded-full border border-green-500/30 mb-3">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-ping"></span>
                <span className="text-green-400 text-[11px] font-black uppercase tracking-widest">Ativo</span>
              </div>
              <span className="text-[10px] text-slate-500 font-mono-tech uppercase tracking-tighter max-w-[140px] truncate bg-black/50 px-3 py-1.5 rounded-lg border border-white/5">{group.category}</span>
            </div>
          </div>

          <h3 className="text-2xl font-black text-white mb-5 line-clamp-2 leading-tight group-hover:text-green-400 transition-colors h-16 italic tracking-tight relative z-10">
            {group.name}
          </h3>

          <p className="text-slate-400 text-sm line-clamp-4 leading-relaxed mb-10 font-medium relative z-10 opacity-70 group-hover:opacity-100 transition-opacity">
            {group.description}
          </p>

          <div className="mt-auto pt-8 border-t border-white/10 space-y-6 relative z-10">
             <div className="bg-black/60 rounded-2xl px-5 py-4 flex items-center justify-between border border-white/5 group/link">
                <span className="text-[11px] text-slate-500 font-mono truncate max-w-[150px] group-hover/link:text-green-400 transition-colors">{group.url.replace('https://', '')}</span>
                <i className="fas fa-link text-green-500/20 text-[12px]"></i>
             </div>
             <a
              href={group.url}
              target="_blank"
              rel="noopener noreferrer"
              className="whatsapp-bg hover:scale-[1.03] active:scale-95 text-white w-full py-5 rounded-2xl text-[13px] font-black uppercase tracking-[0.4em] transition-all flex items-center justify-center gap-4 shadow-[0_20px_40px_rgba(37,211,102,0.25)]"
            >
              Conectar Radar
              <i className="fas fa-arrow-right text-[11px] group-hover:translate-x-2 transition-transform"></i>
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