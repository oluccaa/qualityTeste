
import React from 'react';
import { useQualityPortfolio } from '../hooks/useQualityPortfolio.ts';
import { 
  ArrowRight, AlertCircle, 
  MessageSquare, ShieldCheck, Clock 
} from 'lucide-react';
import { PageLoader } from '../../../common/PageLoader.tsx';
import { useNavigate } from 'react-router-dom';
import { QualityStatus } from '../../../../types/index.ts';

export const QualityPortfolioView: React.FC = () => {
  const navigate = useNavigate();
  const { pendingFiles, rejectedFiles, isLoading } = useQualityPortfolio();
  
  if (isLoading) return <PageLoader message="Sincronizando Backlog Técnico..." />;

  return (
    <div className="space-y-12 animate-in fade-in duration-700 pb-10">
      {/* SEÇÃO DE REJEIÇÕES (Monitor de Contestação) */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-[10px] font-black uppercase tracking-[3px] text-red-500 flex items-center gap-2">
              <AlertCircle size={14} /> Contestados pelo Cliente ({rejectedFiles.length})
          </h3>
          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Prioridade Crítica</span>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {rejectedFiles.map(file => (
            <div 
              key={file.id} 
              onClick={() => navigate(`/quality/inspection/${file.id}`)}
              className="bg-white p-6 rounded-[2rem] border-2 border-red-100 hover:border-red-500 transition-all group cursor-pointer relative overflow-hidden shadow-sm hover:shadow-xl"
            >
              <div className="absolute top-0 right-0 p-4 opacity-5 text-red-600"><MessageSquare size={48} /></div>
              <div className="flex items-center gap-2 mb-3">
                  <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full ${
                      file.metadata?.status === QualityStatus.TO_DELETE ? 'bg-slate-900 text-white' : 'bg-red-600 text-white'
                  }`}>
                    {file.metadata?.status === QualityStatus.TO_DELETE ? 'Substituição Crítica' : 'Ajustar Laudo'}
                  </span>
                  <span className="text-[9px] font-bold text-slate-400 uppercase truncate max-w-[120px]">
                    {file.ownerId?.split('-')[0]}
                  </span>
              </div>
              <h4 className="text-sm font-black text-slate-800 mb-4 truncate uppercase tracking-tight">{file.name}</h4>
              <p className="text-[10px] text-slate-500 font-medium line-clamp-2 mb-6 italic min-h-[30px]">
                "{file.metadata?.clientObservations || 'O parceiro solicitou revisão sem nota detalhada.'}"
              </p>
              <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Revisar Protocolo</span>
                <ArrowRight size={14} className="text-red-500 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          ))}
          {rejectedFiles.length === 0 && (
            <div className="col-span-full py-16 bg-slate-50 border-2 border-dashed border-slate-200 rounded-[2.5rem] flex flex-col items-center justify-center text-slate-400 italic">
              <ShieldCheck size={32} className="mb-3 opacity-20" />
              <p className="text-xs font-bold uppercase tracking-widest">Nenhuma contestação pendente no fluxo.</p>
            </div>
          )}
        </div>
      </section>

      {/* Backlog de Trabalho (Inspeções Pendentes) */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-[10px] font-black uppercase tracking-[3px] text-slate-400 flex items-center gap-2">
              <Clock size={14} /> Novas Pendências de Triagem ({pendingFiles.length})
          </h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {pendingFiles.map(file => (
            <div 
              key={file.id} 
              onClick={() => navigate(`/quality/inspection/${file.id}`)}
              className="bg-white p-6 rounded-[2rem] border border-slate-200 hover:border-blue-500/30 shadow-sm hover:shadow-xl transition-all group cursor-pointer"
            >
              <p className="text-[10px] font-black text-orange-500 uppercase tracking-widest mb-1">Aguardando Auditoria</p>
              <h4 className="text-sm font-black text-slate-800 mb-6 uppercase truncate tracking-tight">{file.name}</h4>
              <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-1 rounded-lg font-bold font-mono">{file.size}</span>
                <div className="flex items-center gap-2 text-blue-600 font-bold text-[10px] uppercase tracking-widest">
                  Analisar <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </div>
          ))}
          {pendingFiles.length === 0 && (
            <div className="col-span-full py-16 bg-white border border-slate-200 rounded-[2.5rem] flex flex-col items-center justify-center text-slate-300">
               <ShieldCheck size={40} className="mb-4 opacity-10" />
               <p className="text-xs font-black uppercase tracking-widest">Fila de triagem vazia</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};
