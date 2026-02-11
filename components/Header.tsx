
import React from 'react';

const Header: React.FC = () => {
  return (
    <header className="py-10 md:py-16 text-center animate-fade-in px-4">
      <div className="flex flex-col items-center mb-6">
        <a 
          href="https://to-ligado.com" 
          target="_blank" 
          rel="noopener noreferrer"
          className="relative mb-8 group block"
        >
          <div className="absolute -inset-1 bg-gradient-to-r from-green-500 to-emerald-600 rounded-3xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
          <div className="relative w-16 h-16 md:w-20 md:h-20 bg-slate-900 rounded-2xl md:rounded-3xl flex items-center justify-center border border-slate-800 shadow-2xl rotate-3 hover:rotate-0 transition-all duration-500">
            <i className="fab fa-whatsapp text-green-500 text-3xl md:text-4xl group-hover:scale-110 transition-transform"></i>
          </div>
          <div className="absolute -bottom-2 -right-2 bg-green-500 text-white text-[9px] md:text-[10px] font-black px-2 py-1 rounded-lg shadow-xl shadow-green-500/20 uppercase tracking-tighter">
            PRO
          </div>
        </a>
        
        <div className="text-center w-full max-w-3xl">
          <h1 className="text-3xl sm:text-4xl md:text-6xl font-black tracking-tight md:tracking-[-0.05em] uppercase italic leading-none">
            <span className="text-white block sm:inline">Caçador de </span>
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-green-400 via-emerald-400 to-green-500 block sm:inline">Grupos</span>
            <span className="text-white block sm:inline sm:ml-2">WhatsApp</span>
          </h1>
          <a 
            href="https://to-ligado.com" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 md:gap-3 mt-4 md:mt-6 hover:opacity-70 transition-opacity"
          >
            <div className="h-px w-6 md:w-8 bg-slate-800"></div>
            <p className="text-slate-500 text-[9px] md:text-[11px] font-black uppercase tracking-[0.2em] md:tracking-[0.3em]">
              Motor de Busca <span className="text-green-500">To-Ligado.com</span>
            </p>
            <div className="h-px w-6 md:w-8 bg-slate-800"></div>
          </a>
        </div>
      </div>
    </header>
  );
};

export default Header;
