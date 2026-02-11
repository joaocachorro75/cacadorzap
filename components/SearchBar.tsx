
import React, { useState } from 'react';

interface SearchBarProps {
  onSearch: (keyword: string) => void;
  isLoading: boolean;
}

const SearchBar: React.FC<SearchBarProps> = ({ onSearch, isLoading }) => {
  const [keyword, setKeyword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (keyword.trim()) {
      onSearch(keyword.trim());
    }
  };

  return (
    <div className="max-w-4xl mx-auto mb-12 md:mb-16 px-2">
      <form onSubmit={handleSubmit} className="relative group flex items-center">
        <div className="relative w-full">
          <input
            type="text"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="Ex: Marketing, Vendas, Cidades..."
            className="w-full bg-slate-800/40 border border-slate-700/50 focus:border-green-500 text-white rounded-2xl md:rounded-3xl py-5 md:py-6 pl-12 md:pl-16 pr-[110px] sm:pr-[150px] md:pr-[190px] outline-none transition-all shadow-2xl focus:ring-8 focus:ring-green-500/5 placeholder-slate-600 text-sm md:text-lg font-medium"
            disabled={isLoading}
          />
          <div className="absolute left-4 md:left-6 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-green-500 transition-colors">
            <i className="fas fa-radar text-lg md:text-2xl animate-pulse"></i>
          </div>
          
          <button
            type="submit"
            disabled={isLoading || !keyword.trim()}
            className="absolute right-2 md:right-3 top-1/2 -translate-y-1/2 whatsapp-bg hover:brightness-110 disabled:opacity-30 disabled:grayscale text-white px-4 md:px-8 py-2.5 md:py-3.5 rounded-xl md:rounded-2xl font-black transition-all shadow-xl active:scale-95 flex items-center gap-2 uppercase tracking-tighter text-[9px] md:text-xs"
          >
            {isLoading ? (
              <i className="fas fa-circle-notch fa-spin"></i>
            ) : (
              <>
                <span className="hidden sm:inline">Buscar Grupos</span>
                <span className="sm:hidden">Buscar</span>
                <i className="fas fa-search text-[10px]"></i>
              </>
            )}
          </button>
        </div>
      </form>
      
      <div className="mt-6 flex flex-wrap justify-center items-center gap-4 md:gap-8">
         <div className="flex items-center gap-2">
           <div className="w-1 h-1 md:w-1.5 md:h-1.5 rounded-full bg-green-500 animate-pulse"></div>
           <span className="text-[8px] md:text-[10px] text-slate-600 font-bold uppercase tracking-widest">Ativos 2024-2026</span>
         </div>
         <div className="flex items-center gap-2">
           <div className="w-1 h-1 md:w-1.5 md:h-1.5 rounded-full bg-blue-500"></div>
           <span className="text-[8px] md:text-[10px] text-slate-600 font-bold uppercase tracking-widest">Verificação IA</span>
         </div>
         <div className="flex items-center gap-2">
           <div className="w-1 h-1 md:w-1.5 md:h-1.5 rounded-full bg-purple-500"></div>
           <span className="text-[8px] md:text-[10px] text-slate-600 font-bold uppercase tracking-widest">To-Ligado Engine</span>
         </div>
      </div>
    </div>
  );
};

export default SearchBar;
