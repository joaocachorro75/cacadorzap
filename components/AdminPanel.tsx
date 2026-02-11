
import React from 'react';
import { AppStats } from '../types';

interface AdminPanelProps {
  stats: AppStats;
  onLogout: () => void;
  systemReady: boolean | null;
}

const AdminPanel: React.FC<AdminPanelProps> = ({ stats, onLogout, systemReady }) => {
  return (
    <div className="animate-fade-in space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black text-white tracking-tighter uppercase italic">Console Admin</h2>
          <p className="text-slate-500 text-sm">Gerenciamento de Custos e Infraestrutura</p>
        </div>
        <button 
          onClick={onLogout}
          className="px-6 py-2 bg-slate-800 hover:bg-red-500/20 text-slate-400 hover:text-red-400 rounded-xl text-[10px] font-black uppercase tracking-widest border border-slate-700 transition-all"
        >
          Encerrar Sessão
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass p-6 rounded-3xl border-slate-700/50">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center text-green-500">
              <i className="fas fa-search"></i>
            </div>
            <span className="text-xs font-bold text-slate-400 uppercase">Buscas Totais</span>
          </div>
          <div className="text-4xl font-black text-white">{stats.totalSearches}</div>
          <div className="mt-2 text-[10px] text-slate-600 font-bold uppercase tracking-widest">Desde o último deploy</div>
        </div>

        <div className="glass p-6 rounded-3xl border-slate-700/50">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500">
              <i className="fas fa-dollar-sign"></i>
            </div>
            <span className="text-xs font-bold text-slate-400 uppercase">Custo Estimado</span>
          </div>
          <div className="text-4xl font-black text-white">
            ${stats.estimatedCost.toFixed(4)}
          </div>
          <div className="mt-2 text-[10px] text-slate-600 font-bold uppercase tracking-widest">Baseado em tokens Flash</div>
        </div>

        <div className="glass p-6 rounded-3xl border-slate-700/50">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-500">
              <i className="fas fa-server"></i>
            </div>
            <span className="text-xs font-bold text-slate-400 uppercase">Status do Sistema</span>
          </div>
          <div className={`text-xl font-black flex items-center gap-2 ${systemReady ? 'text-green-500' : 'text-red-500'}`}>
            <div className={`w-3 h-3 rounded-full ${systemReady ? 'bg-green-500' : 'bg-red-500'} animate-pulse`}></div>
            {systemReady ? 'OPERACIONAL' : 'DESCONECTADO'}
          </div>
          <div className="mt-2 text-[10px] text-slate-600 font-bold uppercase tracking-widest">Easypanel Connect: OK</div>
        </div>
      </div>

      <div className="glass p-8 rounded-[40px] border-slate-700/50">
        <h3 className="text-xl font-bold text-white mb-6">Configuração da API</h3>
        <div className="space-y-6">
          <div className="p-4 bg-slate-900/80 rounded-2xl border border-slate-800">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">Chave de API (Injectada)</label>
            <div className="flex items-center justify-between">
              <span className="text-sm font-mono text-slate-300">••••••••••••••••••••••••••••••••</span>
              <span className="text-[9px] bg-green-500/10 text-green-500 px-2 py-1 rounded border border-green-500/20 font-bold">ATIVA</span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-slate-900/80 rounded-2xl border border-slate-800">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">Modelo Principal</label>
              <span className="text-sm font-bold text-white">Gemini 3 Flash</span>
            </div>
            <div className="p-4 bg-slate-900/80 rounded-2xl border border-slate-800">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">Grounding Tool</label>
              <span className="text-sm font-bold text-white">Google Search Enabled</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;
