import React, { useState } from 'react';
import { useQualityPortfolio } from '../hooks/useQualityPortfolio.ts';
import { 
  Building2, ClipboardCheck, ArrowRight, ChevronRight, AlertCircle, 
  MessageSquare, Trash2, ShieldCheck, Plus, UserPlus, Loader2 
} from 'lucide-react';
import { PageLoader } from '../../../common/PageLoader.tsx';
import { useNavigate } from 'react-router-dom';
import { QualityStatus } from '../../../../types/index.ts';
import { ClientModal } from '../../admin/components/AdminModals.tsx';
import { useQualityClientManagement } from '../hooks/useQualityClientManagement.ts';
import { ProcessingOverlay } from '../components/ViewStates.tsx';

export const QualityPortfolioView: React.FC = () => {
  const navigate = useNavigate();
  const { clients, pendingFiles, rejectedFiles, isLoading, refresh } = useQualityPortfolio();
  
  // Hook de gestão de clientes adaptado para reuso na view de qualidade
  const {
    isProcessing,
    qualityAnalysts,
    clientModal
  } = useQualityClientManagement(0);

  if (isLoading) return <PageLoader message="Sincronizando Carteira de Auditoria..." />;

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-20">
      {/* Modais de Ação */}
      <ClientModal
        isOpen={clientModal.isOpen}
        onClose={() => clientModal.setOpen(false)}
        onSave={async (e, email, pass) => {
          await clientModal.save(e, email, pass);
          refresh(); // Atualiza a lista local após salvar
        }}
        editingClient={clientModal.editing}
        clientFormData={clientModal.data}
        setClientFormData={clientModal.setData}
        qualityAnalysts={qualityAnalysts}
        requiresConfirmation={false}
        isSaving={isProcessing}
      />

      {isProcessing && <ProcessingOverlay message="Efetivando registro no ledger..." />}

      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="h-10 w-2 bg-[#b23c0e] rounded-full" />
          <h2 className="text-2xl font-black text-slate-800 tracking-tight uppercase">Monitor de Carteira</h2>
        </div>
        
        <button 
          onClick={() => clientModal.open()}
          className="flex items-center gap-3 bg-[#081437] hover:bg-slate-800 text-white px-8 py-4 rounded-2xl font-black text-[11px] uppercase tracking-[2px] shadow-xl shadow-slate-900/20 transition-all active:scale-95"
        >
          <Plus size={18} className="text-orange-500" /> Cadastrar Novo Cliente
        </button>
      </header>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        <div className="xl:col-span-2 space-y-10">
          
          {/* SEÇÃO DE REJEIÇÕES (Substituições Urgentes) */}
          <section className="space-y-6">
            <h3 className="text-[10px] font-black uppercase tracking-[3px] text-red-500 flex items-center gap-2">
                <AlertCircle size={14} /> Contestados pelo Cliente ({rejectedFiles.length})
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {rejectedFiles.map(file => (
                <div 
                  key={file.id} 
                  onClick={() => navigate(`/quality/inspection/${file.id}`)}
                  className="bg-white p-6 rounded-3xl border-2 border-red-100 hover:border-red-500 transition-all group cursor-pointer relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 p-4 opacity-5 text-red-600"><MessageSquare size={48} /></div>
                  <div className="flex items-center gap-2 mb-2">
                      <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full ${
                          file.metadata?.status === QualityStatus.TO_DELETE ? 'bg-slate-900 text-white' : 'bg-red-600 text-white'
                      }`}>
                        {file.metadata?.status === QualityStatus.TO_DELETE ? 'Substituir (Apagar)' : 'Ajustar Laudo'}
                      </span>
                  </div>
                  <h4 className="text-sm font-black text-slate-800 mb-4 truncate">{file.name}</h4>
                  <p className="text-[10px] text-slate-500 font-medium line-clamp-2 mb-4 italic">
                    "{file.metadata?.clientObservations || 'Sem observações detalhadas'}"
                  </p>
                  <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Ação Necessária</span>
                    <ArrowRight size={14} className="text-red-500 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              ))}
              {rejectedFiles.length === 0 && (
                <div className="col-span-full py-8 bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl flex flex-col items-center justify-center text-slate-400 italic">
                  <ShieldCheck size={24} className="mb-2 opacity-20" />
                  Nenhuma contestação pendente.
                </div>
              )}
            </div>
          </section>

          {/* Backlog de Trabalho (Inspeções Pendentes) */}
          <section className="space-y-6">
            <h3 className="text-[10px] font-black uppercase tracking-[3px] text-slate-400">Novas Pendências ({pendingFiles.length})</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {pendingFiles.map(file => (
                <div 
                  key={file.id} 
                  onClick={() => navigate(`/quality/inspection/${file.id}`)}
                  className="bg-white p-6 rounded-3xl border border-slate-200 hover:border-blue-500/20 shadow-sm transition-all group cursor-pointer"
                >
                  <p className="text-[10px] font-black text-orange-500 uppercase tracking-widest mb-1">Aguardando Auditoria</p>
                  <h4 className="text-sm font-black text-slate-800 mb-4">{file.name}</h4>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-1 rounded-lg font-bold">{file.size}</span>
                    <div className="flex items-center gap-2 text-blue-600 font-bold text-[10px] uppercase tracking-widest">
                      Analisar <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Lista de Empresas Side Rail */}
        <div className="space-y-6">
          <h3 className="text-[10px] font-black uppercase tracking-[3px] text-slate-400">Portfólio Industrial</h3>
          <div className="bg-white rounded-[2.5rem] border border-slate-200 p-4 shadow-sm divide-y divide-slate-50 overflow-hidden">
            
            {/* Card de Adição Rápida na Lista */}
            <button 
              onClick={() => clientModal.open()}
              className="w-full p-4 flex items-center gap-4 hover:bg-orange-50 rounded-2xl transition-all border-2 border-dashed border-transparent hover:border-orange-200 group mb-2"
            >
              <div className="w-10 h-10 bg-orange-100 text-orange-600 rounded-xl flex items-center justify-center font-black shadow-sm group-hover:scale-110 transition-transform">
                <Plus size={20} />
              </div>
              <div className="text-left">
                <p className="text-sm font-black text-slate-800 uppercase tracking-tighter">Novo Cadastro</p>
                <p className="text-[9px] text-orange-600 font-bold uppercase tracking-widest">Adicionar Organização</p>
              </div>
            </button>

            {clients.map(client => (
              <div 
                key={client.id} 
                onClick={() => navigate(`/quality/portfolio?orgId=${client.id}`)}
                className="p-4 flex items-center gap-4 hover:bg-slate-50 rounded-2xl transition-colors cursor-pointer group"
              >
                <div className="w-10 h-10 bg-[#081437] text-white rounded-xl flex items-center justify-center font-black shadow-lg">
                  {client.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-slate-800 truncate">{client.name}</p>
                  <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">{client.cnpj}</p>
                </div>
                <ChevronRight size={16} className="text-slate-200 group-hover:text-blue-500 transition-colors" />
              </div>
            ))}

            {clients.length === 0 && !isLoading && (
              <div className="p-10 text-center text-slate-400">
                  <Building2 size={32} className="mx-auto mb-2 opacity-20" />
                  <p className="text-xs font-medium">Nenhum cliente na carteira.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};