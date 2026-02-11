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
        // Simulação de ping tático
        const isValid = Math.random() > 0.08; 
        
        if (isValid) {
          setStatus('active');
          if (onVerified) onVerified(group.id, true);
        } else {
          setStatus('dead');
          if (onVerified) onVerified(group.id, false);
        }
      }, 1500 + Math.random() * 2000);
      return () => clearTimeout(timer);
    }
  }, [status, group.id, onVerified]);

  const getCategoryIcon = (category: string) => {
    const cat = category.toLowerCase();
    if (cat.includes('venda') || cat.includes('loja')) return 'fa-cart-shopping';
    if (cat.includes('tec') || cat.includes('dev')) return 'fa-microchip';
    if (cat.includes('educ') || cat.includes('estudo')) return 'fa-graduation-cap';
    if (cat.includes('job') || cat.includes('vaga')) return 'fa-user-tie';
    if (cat.includes('invest') || cat.includes('dinheiro')) return 'fa-chart-line';
    return 'fa-users-viewfinder';
  };

  if (status === 'dead') return null;

  return (
    <div className="glass rounded-[2rem] p-6 flex flex-col transition-all duration-500 hover:shadow-[0_0_60px_rgba(37,211,102,0.15)] border border-white/5 hover:border-green-500/40 relative overflow-hidden group min-h-[440px]">
      <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
        <i className={`fas ${getCategoryIcon(group.category)} text-6xl rotate-12`}></i>
      </div>

      {status === 'verifying' ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center space-y-6">
          <div className="relative">
            <div className="w-20 h-20 border-[3px] border-green-500/10 border-t-green-500 rounded-full animate-spin"></div>
            <i className="fas fa-radar absolute inset-0 flex items-center justify-center text-green-500 text-2xl animate-pulse"></i>
          </div>
          <div className="space-y-2">
            <h4 className="text-white font-black uppercase tracking-[0.2em] text-[10px]">Ping de Verificação...</h4>
            <div className="h-1 w-24 bg-slate-800 rounded-full overflow-hidden mx-auto">
              <div className="h-full bg-green-500 animate-[shimmer_2s_infinite]"></div>
            </div>
          </div>
        </div>
      ) : (
        <>
          <div className="flex justify-between items-start mb-6">
            <div className="w-12 h-12 rounded-2xl bg-green-500/10 border border-green-500/20 flex items-center justify-center text-green-400">
              <i className={`fas ${getCategoryIcon(group.category)} text-xl`}></i>
            </div>
            <div className="flex flex-col items-end">
              <div className="flex items-center gap-1.5 px-3 py-1 bg-green-500/10 rounded-full border border-green-500/20 mb-1">
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
                <span className="text-green-500 text-[8px] font-black uppercase tracking-widest">Ativo</span>
              </div>
              <span className="text-[9px] text-slate-500 font-bold uppercase tracking-tighter truncate max-w-[100px]">{group.category}</span>
            </div>
          </div>

          <h3 className="text-xl font-black text-white mb-4 line-clamp-2 leading-tight group-hover:text-green-400 transition-colors h-14 italic tracking-tight">
            {group.name}
          </h3>

          <p className="text-slate-400 text-xs line-clamp-4 leading-relaxed mb-6 font-medium">
            {group.description}
          </p>

          <div className="mt-auto pt-6 border-t border-white/5 space-y-4">
             <div className="bg-black/40 rounded-xl px-4 py-2.5 flex items-center justify-between border border-white/5">
                <span className="text-[10px] text-slate-500 font-mono truncate max-w-[150px]">{group.url.replace('https://', '')}</span>
                <i className="fas fa-link text-green-500/50 text-[10px]"></i>
             </div>
             <a
              href={group.url}
              target="_blank"
              rel="noopener noreferrer"
              className="whatsapp-bg hover:scale-[1.02] text-white w-full py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3 active:scale-95 shadow-lg shadow-green-500/10"
            >
              Entrar Agora
              <i className="fas fa-chevron-right text-[8px]"></i>
            </a>
          </div>
        </>
      )}
      
      <style>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(200%); }
        }
      `}</style>
    </div>
  );
};

export default GroupCard;