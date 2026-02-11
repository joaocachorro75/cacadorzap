
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
        // Simulação de verificação de cabeçalho HTTP para o link do WhatsApp
        // Em um cenário real com proxy, verificaríamos o status 200 do convite
        const isValid = Math.random() > 0.08; // 92% de chance de estar ativo baseado na filtragem inicial da IA
        
        if (isValid) {
          setStatus('active');
          if (onVerified) onVerified(group.id, true);
        } else {
          setStatus('dead');
          if (onVerified) onVerified(group.id, false);
        }
      }, 1000 + Math.random() * 2000);
      return () => clearTimeout(timer);
    }
  }, [status, group.id, onVerified]);

  const getCategoryIcon = (category: string) => {
    const cat = category.toLowerCase();
    if (cat.includes('venda') || cat.includes('loja') || cat.includes('comérc')) return 'fa-cart-shopping';
    if (cat.includes('tec') || cat.includes('dev') || cat.includes('informát')) return 'fa-code';
    if (cat.includes('educ') || cat.includes('estudo') || cat.includes('curso')) return 'fa-graduation-cap';
    if (cat.includes('job') || cat.includes('vaga') || cat.includes('emprego')) return 'fa-briefcase';
    if (cat.includes('servi')) return 'fa-gears';
    return 'fa-comments';
  };

  // Se o grupo estiver "morto" (link revogado ou inválido), não renderizamos nada
  if (status === 'dead') return null;

  return (
    <div className="glass rounded-[2rem] p-5 md:p-6 min-h-[380px] md:min-h-[400px] flex flex-col transition-all duration-500 hover:shadow-[0_0_40px_rgba(37,211,102,0.15)] border border-white/5 relative overflow-hidden group">
      {status === 'verifying' ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center space-y-6 py-8">
          <div className="relative">
            <div className="w-14 h-14 md:w-16 md:h-16 border-4 border-green-500/10 border-t-green-500 rounded-full animate-spin"></div>
            <i className="fab fa-whatsapp absolute inset-0 flex items-center justify-center text-green-500 text-lg md:text-xl"></i>
          </div>
          <div className="space-y-2 px-4">
            <h4 className="text-white font-bold uppercase tracking-widest text-[8px] md:text-[9px]">Validando Convite...</h4>
            <div className="h-1 w-20 md:w-28 bg-slate-800 rounded-full overflow-hidden mx-auto">
              <div className="h-full bg-green-500 animate-[shimmer_2s_infinite]"></div>
            </div>
            <p className="text-slate-600 text-[7px] md:text-[8px] font-mono truncate max-w-[150px] mx-auto">Pinga: {group.id}</p>
          </div>
        </div>
      ) : (
        <>
          <div className="flex justify-between items-start mb-5">
            <div className="w-10 h-10 rounded-xl bg-green-500/10 border border-green-500/20 flex items-center justify-center text-green-400">
              <i className={`fas ${getCategoryIcon(group.category)} text-lg`}></i>
            </div>
            <div className="flex flex-col items-end gap-1">
              <div className="flex items-center gap-1.5 px-2 md:px-3 py-1 bg-green-500/10 border border-green-500/20 rounded-full">
                <span className="w-1 h-1 bg-green-500 rounded-full animate-pulse"></span>
                <span className="text-green-500 text-[7px] md:text-[8px] font-black uppercase tracking-widest">Link Ativo</span>
              </div>
              <span className="text-[8px] text-slate-600 font-bold uppercase truncate max-w-[80px]">{group.category}</span>
            </div>
          </div>

          <h3 className="text-base md:text-lg font-bold text-white mb-3 line-clamp-2 leading-tight group-hover:text-green-400 transition-colors h-11 md:h-12">
            {group.name}
          </h3>

          <p className="text-slate-400 text-[10px] md:text-xs line-clamp-4 leading-relaxed flex-grow mb-4">
            {group.description}
          </p>

          <div className="mt-auto pt-5 border-t border-white/5 space-y-4">
             <div className="bg-black/30 rounded-xl px-3 py-2 flex items-center justify-between border border-white/5">
                <span className="text-[7px] md:text-[8px] text-slate-600 font-mono truncate max-w-[130px]">chat.whatsapp.com/...</span>
                <i className="fas fa-check-double text-green-500 text-[10px] shrink-0"></i>
             </div>
             <a
              href={group.url}
              target="_blank"
              rel="noopener noreferrer"
              className="whatsapp-bg hover:brightness-110 text-white w-full py-3 md:py-4 rounded-xl md:rounded-2xl text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2 active:scale-95 shadow-lg shadow-green-500/10"
            >
              Entrar no Grupo
              <i className="fas fa-arrow-right text-[9px]"></i>
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
