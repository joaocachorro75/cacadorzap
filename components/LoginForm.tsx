
import React, { useState } from 'react';

interface LoginFormProps {
  onLogin: (user: string, pass: string) => void;
  onCancel: () => void;
}

const LoginForm: React.FC<LoginFormProps> = ({ onLogin, onCancel }) => {
  const [user, setUser] = useState('');
  const [pass, setPass] = useState('');
  const [error, setError] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Validação de Admin (Credenciais padrão solicitadas anteriormente)
    if (user.toLowerCase() === 'admin' && pass === 'admin123') {
      onLogin(user, pass);
    } else {
      setError(true);
      setTimeout(() => setError(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-xl animate-fade-in">
      <div className={`glass max-w-sm w-full p-8 rounded-[32px] border-slate-700/50 transition-all ${error ? 'border-red-500/50 shake' : ''}`}>
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-slate-900 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-slate-800 shadow-inner">
            <i className="fas fa-shield-halved text-2xl text-green-500"></i>
          </div>
          <h2 className="text-xl font-black text-white uppercase tracking-tighter italic">Área do Administrador</h2>
          <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mt-1">Console To-Ligado.com</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-[9px] font-black text-slate-500 uppercase ml-2">Usuário</label>
            <input
              type="text"
              autoFocus
              value={user}
              onChange={(e) => setUser(e.target.value)}
              className="w-full bg-black/40 border border-slate-800 rounded-xl px-4 py-3.5 text-sm text-white outline-none focus:border-green-500 focus:ring-4 focus:ring-green-500/5 transition-all"
              placeholder="Digite o usuário"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[9px] font-black text-slate-500 uppercase ml-2">Senha</label>
            <input
              type="password"
              value={pass}
              onChange={(e) => setPass(e.target.value)}
              className="w-full bg-black/40 border border-slate-800 rounded-xl px-4 py-3.5 text-sm text-white outline-none focus:border-green-500 focus:ring-4 focus:ring-green-500/5 transition-all"
              placeholder="••••••••"
            />
          </div>
          
          {error && (
            <p className="text-red-400 text-[9px] font-black uppercase tracking-widest text-center animate-pulse">
              Acesso Negado: Credenciais Inválidas
            </p>
          )}

          <button
            type="submit"
            className="w-full whatsapp-bg text-white font-black py-4 rounded-xl hover:brightness-110 transition-all active:scale-95 text-[10px] uppercase tracking-[0.2em] shadow-lg shadow-green-500/10"
          >
            Autenticar no Sistema
          </button>
          
          <button
            type="button"
            onClick={onCancel}
            className="w-full text-slate-500 text-[9px] font-black uppercase hover:text-white transition-colors tracking-widest pt-2"
          >
            Cancelar e Voltar
          </button>
        </form>
      </div>
      <style>{`
        .shake { animation: shake 0.5s cubic-bezier(.36,.07,.19,.97) both; }
        @keyframes shake {
          10%, 90% { transform: translate3d(-1px, 0, 0); }
          20%, 80% { transform: translate3d(2px, 0, 0); }
          30%, 50%, 70% { transform: translate3d(-4px, 0, 0); }
          40%, 60% { transform: translate3d(4px, 0, 0); }
        }
      `}</style>
    </div>
  );
};

export default LoginForm;
