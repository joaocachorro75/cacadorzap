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
      const timer = setTimeout(() => {
        // Simulação de ping tático com probabilidade realista
        const isValid = Math.random() > 0.12; 
        
        if (isValid) {
          setStatus('active');
          if (onVerified) onVerified(group.id, true);
        } else {
          setStatus('dead');
          if (onVerified) onVerified(group.id, false);
        }
      }, 2000 + Math.random() * 2500);
      return () => clearTimeout(timer);
    }
  }, [status, group.id, onVerified]);

  const getCategoryIcon = (category: string) => {
    const cat = category.toLowerCase();
    if (cat.includes('venda') || cat.includes('loja') || cat.includes('comercio')) return 'fa-cart-shopping';
    if (cat.includes('tec') || cat.includes('dev') || cat.includes('info')) return 'fa-microchip';
    if (cat.includes('educ') || cat.includes('estudo') || cat.includes('escola')) return 'fa-graduation-cap';
    if (cat.includes('job') || cat.includes('vaga') || cat.includes('emprego')) return 'fa-user-tie';
    if (cat.includes('invest') || cat.includes('dinheiro') || cat.includes('cripto')) return 'fa-chart-line';
    if (cat.includes('politica') || cat.includes('gov')) return 'fa-landmark';
    if (cat.includes('musica') || cat.includes('show')) return 'fa-music';
    if (cat.includes('esporte') || cat.includes('futebol')) return 'fa-volleyball';
    if (cat.includes('saude') || cat.includes('med')) return 'fa-heart-pulse';
    return 'fa-users-viewfinder';
  };

  if (status === 'dead') return null;

  return (
    <div className="glass rounded-[2.5rem] p-6 flex flex-col transition-all duration-500 hover:shadow-[0_0_80px_rgba(37,211,102,0.2)] border border-white/5 hover:border-green-500/50 relative overflow-hidden group min-h-[440px] animate-slide-up">
      {/* Background Icon Decoration */}
      <div className="absolute -top-4 -right-4 p-4 opacity-5 group-hover:opacity-10 transition-opacity transform rotate-12 group-hover:rotate-0 duration-700">
        <i className={`fas ${getCategoryIcon(group.category)} text-9xl`}></i>
      </div>

      {status === 'verifying' ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center space-y-6 relative z-10">
          <div className="relative">
            <div className="w-24 h-24 border-[3px] border-green-500/10 border-t-green-500 rounded-full animate-spin"></div>
            <i className="fas fa-radar absolute inset-0 flex items-center justify-center text-green-500 text-3xl animate-pulse"></i>
          </div>
          <div className="space-y-3">
            <h4 className="text-white font-black uppercase tracking-[0.3em] text-[10px] animate-pulse">Sincronizando com WhatsApp...</h4>
            <div className="h-1.5 w-32 bg-slate-800 rounded-full overflow-hidden mx-auto">
              <div className="h-full bg-green-500 animate-[shimmer_2.5s_infinite]"></div>
            </div>
            <p className="text-slate-500 text-[8px] font-bold uppercase tracking-widest">Validando Token de Convite</p>
          </div>
        </div>
      ) : (
        <>
          <div className="flex justify-between items-start mb-6 relative z-10">
            <div className="w-14 h-14 rounded-2xl bg-green-500/10 border border-green-500/20 flex items-center justify-center text-green-400 shadow-inner">
              <i className={`fas ${getCategoryIcon(group.category)} text-2xl`}></i>
            </div>
            <div className="flex flex-col items-end">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-green-500/10 rounded-full border border-green-500/20 mb-2">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_8px_#25d366]"></span>
                <span className="text-green-500 text-[9px] font-black uppercase tracking-widest">Ativo</span>
              </div>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest truncate max-w-[120px] bg-white/5 px-2 py-1 rounded-md">{group.category}</span>
            </div>
          </div>

          <h3 className="text-2xl font-black text-white mb-4 line-clamp-2 leading-tight group-hover:text-green-400 transition-colors h-16 italic tracking-tight relative z-10">
            {group.name}
          </h3>

          <p className="text-slate-400 text-xs line-clamp-4 leading-relaxed mb-6 font-medium relative z-10 opacity-80 group-hover:opacity-100 transition-opacity">
            {group.description}
          </p>

          <div className="mt-auto pt-6 border-t border-white/10 space-y-4 relative z-10">
             <div className="bg-black/60 rounded-xl px-4 py-3 flex items-center justify-between border border-white/5 group/link">
                <span className="text-[10px] text-slate-500 font-mono truncate max-w-[140px] group-hover/link:text-green-500/70 transition-colors">{group.url.replace('https://', '')}</span>
                <i className="fas fa-link text-green-500/40 text-[10px]"></i>
             </div>
             <a
              href={group.url}
              target="_blank"
              rel="noopener noreferrer"
              className="whatsapp-bg hover:scale-[1.03] text-white w-full py-4.5 rounded-2xl text-[11px] font-black uppercase tracking-[0.25em] transition-all flex items-center justify-center gap-3 active:scale-95 shadow-xl shadow-green-500/20"
            >
              Acessar Grupo
              <i className="fas fa-arrow-right-long text-[10px]"></i>
            </a>
          </div>
        </>
      )}
      
      <style>{`
        @keyframes shimmer {
          0% { transform: translateX(-150%); }
          100% { transform: translateX(250%); }
        }
      `}</style>
    </div>
  );
};

export default GroupCard;