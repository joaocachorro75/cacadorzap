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
        // Simulação de ping To-Ligado
        const isValid = Math.random() > 0.05; // 95% de precisão esperada
        
        if (isValid) {
          setStatus('active');
          if (onVerified) onVerified(group.id, true);
        } else {
          setStatus('dead');
          if (onVerified) onVerified(group.id, false);
        }
      }, 1200 + Math.random() * 1800);
      return () => clearTimeout(timer);
    }
  }, [status, group.id, onVerified]);

  const getCategoryIcon = (category: string) => {
    const cat = category.toLowerCase();
    if (cat.includes('venda') || cat.includes('loja') || cat.includes('comérc')) return 'fa-cart-shopping';
    if (cat.includes('tec') || cat.includes('dev') || cat.includes('informát')) return 'fa-microchip';
    if (cat.includes('educ') || cat.includes('estudo') || cat.includes('curso')) return 'fa-graduation-cap';
    if (cat.includes('job') || cat.includes('vaga') || cat.includes('emprego')) return 'fa-user-tie';
    if (cat.includes('invest') || cat.includes('dinheiro') || cat.includes('finança')) return 'fa-chart-line';
    if (cat.includes('servi')) return 'fa-screwdriver-wrench';
    return 'fa-users-viewfinder';
  };

  if (status === 'dead') return null;

  return (
    <div className="glass rounded-[2.5rem] p-6 min-h-[420px] flex flex-col transition-all duration-500 hover:shadow-[0_0_50px_rgba(37,211,102,0.2)] border border-white/5 hover:border-green-500/30 relative overflow-hidden group">
      {status === 'verifying' ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center space-y-8 py-10">
          <div className="relative">
            <div className="w-16 h-16 border-[5px] border-green-500/10 border-t-green-500 rounded-full animate-spin"></div>
            <i className="fas fa-bolt absolute inset-0 flex items-center justify-center text-green-500 text-xl animate-pulse"></i>
          </div>
          <div className="space-y-3 px-4">
            <h4 className="text-white font-black uppercase tracking-[0.3em] text-[10px]">Verificando Link...</h4>
            <div className="h-1.5 w-32 bg-slate-800 rounded-full overflow-hidden mx-auto">
              <div className="h-full bg-green-500 animate-[shimmer_1.5s_infinite]"></div>
            </div>
            <p className="text-slate-600 text-[8px] font-mono opacity-50 uppercase tracking-tighter">SIG: {group.id}</p>
          </div>
        </div>
      ) : (
        <>
          <div className="flex justify-between items-start mb-6">
            <div className="w-12 h-12 rounded-2xl bg-green-500/10 border border-green-500/20 flex items-center justify-center text-green-400 group-hover:scale-110 transition-transform">
              <i className={`fas ${getCategoryIcon(group.category)} text-xl`}></i>
            </div>
            <div className="flex flex-col items-end gap-1.5">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-green-500/10 border border-green-500/20 rounded-full">
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
                <span className="text-green-500 text-[8px] font-black uppercase tracking-[0.2em]">Interceptado</span>
              </div>
              <span className="text-[9px] text-slate-500 font-black uppercase tracking-widest truncate max-w-[100px]">{group.category}</span>
            </div>
          </div>

          <h3 className="text-xl font-black text-white mb-4 line-clamp-2 leading-tight group-hover:text-green-400 transition-colors h-14 italic tracking-tight">
            {group.name}
          </h3>

          <p className="text-slate-400 text-xs line-clamp-4 leading-relaxed flex-grow mb-6 font-medium">
            {group.description}
          </p>

          <div className="mt-auto pt-6 border-t border-white/5 space-y-5">
             <div className="bg-black/40 rounded-2xl px-4 py-3 flex items-center justify-between border border-white/5">
                <span className="text-[9px] text-slate-500 font-mono tracking-tighter truncate max-w-[140px]">chat.whatsapp.com/ID_VERIFIED</span>
                <i className="fas fa-check-double text-green-500 text-xs"></i>
             </div>
             <a
              href={group.url}
              target="_blank"
              rel="noopener noreferrer"
              className="whatsapp-bg hover:brightness-110 text-white w-full py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] transition-all flex items-center justify-center gap-3 active:scale-95 shadow-xl shadow-green-500/20"
            >
              Acessar Grupo
              <i className="fas fa-arrow-right text-[10px] group-hover:translate-x-1 transition-transform"></i>
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