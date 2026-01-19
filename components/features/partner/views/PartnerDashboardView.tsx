
import React from 'react';
import { usePartnerDashboard } from '../hooks/usePartnerDashboard.ts';
import { ShieldCheck, FileText, Clock, FileWarning, ArrowRight, Loader2 } from 'lucide-react';
import { FileStatusBadge } from '../../files/components/FileStatusBadge.tsx';
import { useSearchParams } from 'react-router-dom';

export const PartnerDashboardView: React.FC = () => {
  const { stats, recentFiles, isLoading } = usePartnerDashboard();
  const [, setSearchParams] = useSearchParams();

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 bg-white rounded-[2.5rem] border border-dashed border-slate-200">
        <Loader2 className="animate-spin text-blue-500 mb-4" size={40} />
        <p className="text-[10px] font-black uppercase tracking-[4px] text-slate-400">Sincronizando Ativos Vital...</p>
      </div>
    );
  }

  // Se após carregar não temos stats, mostramos um estado vazio amigável
  if (!stats) {
    return (
      <div className="p-12 text-center bg-white rounded-[2.5rem] border border-slate-200 shadow-sm">
        <ShieldCheck size={48} className="mx-auto text-slate-200 mb-4" />
        <h3 className="text-slate-800 font-bold">Sem dados vinculados</h3>
        <p className="text-slate-500 text-sm mt-2">Nenhum certificado foi emitido para sua conta ainda.</p>
      </div>
    );
  }

  const totalActions = stats.pendingValue || 0;
  const hasActions = totalActions > 0;

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-[2.5rem] border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center border border-emerald-100">
              <ShieldCheck size={20} />
            </div>
            <h3 className="text-[10px] font-black uppercase tracking-[2px] text-slate-400">Conformidade</h3>
          </div>
          <div>
            <p className="text-4xl font-black text-slate-800 tracking-tighter">{stats.subValue}</p>
            <p className="text-[10px] text-emerald-600 font-bold uppercase mt-1">Auditados com Sucesso</p>
          </div>
        </div>

        <div className={`p-6 rounded-[2.5rem] border shadow-sm flex flex-col justify-between transition-all ${
          hasActions ? 'bg-red-50 border-red-200' : 'bg-white border-slate-200'
        }`}>
          <div className="flex items-center gap-4 mb-4">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${
              hasActions ? 'bg-red-600 text-white animate-pulse' : 'bg-slate-50 text-slate-400'
            }`}>
              <FileWarning size={20} />
            </div>
            <h3 className="text-[10px] font-black uppercase tracking-[2px] text-slate-400">Pendente</h3>
          </div>
          <div>
            <p className={`text-4xl font-black tracking-tighter ${hasActions ? 'text-red-600' : 'text-slate-800'}`}>
              {totalActions}
            </p>
            <p className={`text-[10px] font-bold uppercase ${hasActions ? 'text-red-500' : 'text-slate-400'}`}>
              {hasActions ? 'Aguardando sua conferência' : 'Nenhuma Pendência'}
            </p>
          </div>
        </div>

        <div className="bg-[#081437] p-6 rounded-[2.5rem] text-white flex flex-col justify-between shadow-xl">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-10 h-10 bg-white/10 text-blue-400 rounded-xl flex items-center justify-center">
              <Clock size={20} />
            </div>
            <h3 className="text-[10px] font-black uppercase tracking-[2px] text-slate-500">Última Atualização</h3>
          </div>
          <div>
            <p className="text-xl font-bold">{stats.lastAnalysis ? new Date(stats.lastAnalysis).toLocaleDateString() : '--/--/----'}</p>
            <p className="text-[10px] text-slate-400 font-bold uppercase mt-1 tracking-widest">Base de Dados Vital</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] border border-slate-200 overflow-hidden shadow-sm">
        <header className="px-8 py-6 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
          <h4 className="text-xs font-black text-slate-800 uppercase tracking-[3px]">Arquivos Recentes</h4>
          <button 
            onClick={() => setSearchParams({ view: 'library' })}
            className="text-[9px] font-black text-blue-600 uppercase tracking-widest hover:underline"
          >
            Ver Biblioteca Completa
          </button>
        </header>
        <div className="divide-y divide-slate-50">
          {recentFiles.map(file => (
            <div 
              key={file.id} 
              onClick={() => setSearchParams({ view: 'library', folderId: file.parentId || '' })}
              className="flex items-center justify-between p-6 hover:bg-slate-50 transition-all group cursor-pointer"
            >
              <div className="flex items-center gap-4">
                <div className="p-3 bg-slate-50 text-slate-400 rounded-xl group-hover:bg-blue-600 group-hover:text-white transition-all">
                  <FileText size={20} />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-800 leading-tight">{file.name}</p>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className="text-[10px] text-slate-400 font-mono">{file.size}</span>
                    <FileStatusBadge status={file.metadata?.status} />
                  </div>
                </div>
              </div>
              <ArrowRight size={18} className="text-slate-200 group-hover:text-blue-500" />
            </div>
          ))}
          {recentFiles.length === 0 && (
            <div className="py-20 text-center text-slate-400 italic text-sm">
              Nenhum certificado identificado nesta conta.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
