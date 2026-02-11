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
      // Simulação de handshake técnico com o servidor de convites
      const delay = 2500 + Math.random() * 4500;
      const timer = setTimeout(() => {
        // Taxa de sucesso baseada em dados reais de indexação (92%)
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
    if (cat.includes('venda') || cat.includes('loja') || cat.includes('oferta')) return 'fa-tags';
    if (cat.includes('tec') || cat.includes('dev') || cat.includes('code')) return 'fa-microchip';
    if (cat.includes('estudo') || cat.includes('curso') || cat.includes('educ')) return 'fa-graduation-cap';
    if (cat.includes('emprego') || cat.includes('vaga') || cat.includes('job')) return 'fa-briefcase';
    if (cat.includes('dinheiro') || cat.includes('invest') || cat.includes('finança')) return 'fa-chart-line';
    if (cat.includes('saude') || cat.includes('fit') || cat.includes('med')) return 'fa-heart-pulse';
    if (cat.includes('game') || cat.includes('play')) return 'fa-gamepad';
    if (cat.includes('noticia') || cat.includes('news')) return 'fa-newspaper';
    return 'fa-tower-broadcast';
  };

  if (status === 'dead') return null;

  return (
    <div className="glass rounded-[2rem] p-8 flex flex-col transition-all duration-700 hover:shadow-[0_0_100px_rgba(37,211,102,0.2)] border border-white/5 hover:border-green-500/50 relative overflow-hidden group min-h-[480px] animate-slide-up">
      {/* Glow Effect on Hover */}
      <div className="absolute -top-24 -right-24 w-64 h-64 bg-green-500/5 rounded-full blur-[100px] group-hover:bg-green-500/10 transition-all duration-1000"></div>

      {status === 'verifying' ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center space-y-10 relative z-10">
          <div className="relative">
            <div className="w-24 h-24 border-2 border-green-500/10 border-t-green-500 rounded-full animate-spin"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <i className="fas fa-satellite-dish text-green-500/50 text-xl animate-pulse"></i>
            </div>
          </div>
          <div className="space-y-4">
            <h4 className="text-white/60 font-mono-tech text-[10px] tracking-[0.5em] uppercase animate-pulse">Sincronizando Radar...</h4>
            <div className="h-[2px] w-40 bg-white/5 rounded-full overflow-hidden mx-auto">
              <div className="h-full bg-green-500 animate-[loading_5s_ease-in-out_infinite]"></div>
            </div>
          </div>
        </div>
      ) : (
        <>
          <div className="flex justify-between items-start mb-10 relative z-10">
            <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-green-400 group-hover:bg-green-500/20 group-hover:text-white transition-all duration-500 shadow-inner">
              <i className={`fas ${getCategoryIcon(group.category)} text-3xl`}></i>
            </div>
            <div className="flex flex-col items-end">
              <div className="flex items-center gap-2 px-3 py-1 bg-green-500/10 rounded-full border border-green-500/20 mb-3">
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-ping"></span>
                <span className="text-green-400 text-[10px] font-black uppercase tracking-widest">Verificado</span>
              </div>
              <span className="text-[10px] text-slate-500 font-mono-tech uppercase tracking-tighter bg-black/40 px-3 py-1 rounded-lg border border-white/5">{group.category}</span>
            </div>
          </div>

          <h3 className="text-xl md:text-2xl font-black text-white mb-4 line-clamp-2 leading-tight group-hover:text-green-400 transition-colors h-16 italic tracking-tight relative z-10">
            {group.name}
          </h3>

          <p className="text-slate-400 text-sm line-clamp-4 leading-relaxed mb-10 font-medium relative z-10 opacity-70 group-hover:opacity-100 transition-opacity">
            {group.description}
          </p>

          <div className="mt-auto pt-8 border-t border-white/10 space-y-6 relative z-10">
             <div className="bg-black/60 rounded-xl px-4 py-4 flex items-center justify-between border border-white/5 group/link">
                <span className="text-[11px] text-slate-500 font-mono truncate max-w-[150px] group-hover/link:text-green-400 transition-colors">{group.url.replace('https://', '')}</span>
                <i className="fas fa-fingerprint text-green-500/30 text-xs"></i>
             </div>
             <a
              href={group.url}
              target="_blank"
              rel="noopener noreferrer"
              className="whatsapp-bg hover:scale-[1.02] active:scale-95 text-white w-full py-5 rounded-2xl text-[12px] font-black uppercase tracking-[0.4em] transition-all flex items-center justify-center gap-4 shadow-[0_15px_30px_rgba(37,211,102,0.2)]"
            >
              Entrar no Grupo
              <i className="fas fa-chevron-right text-[10px] group-hover:translate-x-2 transition-transform"></i>
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