
import React from 'react';
import { Layout } from '../../../layout/MainLayout.tsx';
import { AuditWorkflow } from '../components/AuditWorkflow.tsx';
import { ProcessingOverlay, QualityLoadingState } from '../components/ViewStates.tsx';
import { useFileInspection } from '../hooks/useFileInspection.ts';
import { ArrowLeft, AlertCircle, ShieldCheck, Database, ExternalLink, FileText, Info } from 'lucide-react';
import { QualityStatus, UserRole } from '../../../../types/index.ts';

/**
 * FileInspection - Terminal de Auditoria Técnica (Enterprise View)
 * Design otimizado para alta densidade de informação e sobriedade corporativa.
 * Removido rótulos redundantes para uma estética mais limpa.
 */
export const FileInspection: React.FC = () => {
  const {
    inspectorFile, loadingFile, isProcessing,
    mainPreviewUrl, handleInspectAction, handleBackToClientFiles,
    user
  } = useFileInspection();

  if (loadingFile) {
    return <QualityLoadingState message="Sincronizando protocolos..." />;
  }

  if (!inspectorFile) {
    return (
      <Layout title="Erro de Carga">
        <div className="flex-1 flex flex-col items-center justify-center text-slate-400 gap-4 h-full bg-slate-50" role="alert">
          <AlertCircle size={48} className="opacity-20" />
          <p className="font-bold uppercase tracking-widest text-[10px]">Dossier não localizado no cluster</p>
          <button onClick={handleBackToClientFiles} className="px-6 py-2 bg-slate-900 text-white rounded-lg font-bold text-[10px] uppercase transition-all">Voltar</button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title={`Inspeção: ${inspectorFile.name}`}>
      <div className="flex-1 flex flex-col min-h-0 bg-white border border-slate-200 rounded-[2rem] overflow-hidden shadow-sm animate-in fade-in duration-500">
        {isProcessing && <ProcessingOverlay message="Gravando Ledger..." />}

        {/* Header da Estação - Slim & Sophisticated */}
        <header className="px-8 py-5 bg-[#081437] text-white flex items-center justify-between shrink-0 relative overflow-hidden border-b border-white/10">
          <div className="flex items-center gap-6 relative z-10">
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <h1 className="text-lg font-black uppercase tracking-tight">Estação de Auditoria</h1>
                <div className="flex items-center gap-1.5 px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 rounded text-[8px] font-black text-emerald-400 uppercase tracking-widest">
                   <div className="w-1 h-1 rounded-full bg-emerald-400 animate-pulse" /> Live
                </div>
              </div>
              <p className="text-[9px] font-medium text-slate-400 uppercase tracking-widest opacity-80">Sistema de Gestão Vital SGQ • Registro {inspectorFile.id.split('-')[0].toUpperCase()}</p>
            </div>
          </div>

          <div className="flex items-center gap-4 relative z-10">
             <div className="bg-white/5 border border-white/10 px-4 py-2 rounded-xl flex items-center gap-3">
                <FileText size={16} className="text-blue-400" />
                <div className="min-w-0">
                  <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest leading-none mb-0.5">Ativo em Análise</p>
                  <p className="text-[11px] font-bold text-white truncate max-w-[200px] uppercase tracking-tight">{inspectorFile.name}</p>
                </div>
             </div>
             
             {mainPreviewUrl && (
                <button 
                  onClick={() => window.open(mainPreviewUrl!, '_blank')} 
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-[9px] font-black uppercase tracking-widest transition-all shadow-lg active:scale-95 border border-blue-400/20"
                >
                  <ExternalLink size={12} /> Abrir PDF
                </button>
             )}
          </div>
        </header>

        {/* Conteúdo Principal em Grid Técnico */}
        <div className="flex-1 flex overflow-hidden">
          
          {/* Aside de Rastreabilidade (Esquerda) */}
          <aside className="w-60 border-r border-slate-100 bg-slate-50/50 hidden lg:flex flex-col shrink-0 p-6 space-y-6 overflow-y-auto custom-scrollbar">
            <section className="space-y-3">
              <h3 className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <Database size={12} /> Metadados Ledger
              </h3>
              <div className="space-y-2.5">
                <TechnicalInfo label="Protocolo" value={inspectorFile.id.split('-')[0].toUpperCase()} />
                <TechnicalInfo label="Versão" value={`v${inspectorFile.versionNumber || 1}.0`} />
                <TechnicalInfo label="Última Sinc." value={new Date(inspectorFile.updatedAt).toLocaleDateString()} />
              </div>
            </section>

            <section className="space-y-3">
              <h3 className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <ShieldCheck size={12} /> Auditor Responsável
              </h3>
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                <p className="text-[11px] font-black text-slate-800 uppercase truncate tracking-tight">{user?.name}</p>
              </div>
            </section>

            <div className="pt-4 mt-auto opacity-20 text-center">
              <img src="https://wtydnzqianhahiiasows.supabase.co/storage/v1/object/public/public_assets/hero/isotipo.png" className="h-5 mx-auto grayscale" alt="Vital" />
              <p className="text-[7px] font-bold mt-2 text-slate-400 uppercase tracking-[4px] font-mono">CORE v4.2</p>
            </div>
          </aside>

          {/* Área Central de Workflow */}
          <main className="flex-1 overflow-y-auto custom-scrollbar bg-white">
            <div className="max-w-4xl mx-auto p-10">
              <header className="mb-8 flex items-end justify-between border-b border-slate-100 pb-5">
                <div>
                  <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight leading-none">Fluxo de Conformidade</h2>
                  <p className="text-[11px] font-medium text-slate-500 mt-1.5">Validação imutável do dossier em 7 etapas.</p>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-black text-blue-600 font-mono tracking-tighter">
                    {Math.round(((inspectorFile.metadata?.currentStep || 1) - 1) / 7 * 100)}%
                  </span>
                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Processo</p>
                </div>
              </header>

              <AuditWorkflow 
                metadata={inspectorFile.metadata} 
                userRole={user?.role as UserRole} 
                userName={user?.name || ''}
                userEmail={user?.email || ''}
                fileId={inspectorFile.id}
                onUpdate={async (updates) => {
                    const targetStatus = updates.status || inspectorFile.metadata?.status as QualityStatus;
                    await handleInspectAction(targetStatus, updates.rejectionReason);
                }}
              />
            </div>
          </main>
        </div>
      </div>
    </Layout>
  );
};

const TechnicalInfo = ({ label, value }: { label: string; value: string }) => (
  <div className="flex flex-col gap-0.5">
    <span className="text-[8px] font-black text-slate-400 uppercase tracking-wider">{label}</span>
    <span className="text-[10px] font-bold text-slate-700 font-mono">{value}</span>
  </div>
);
