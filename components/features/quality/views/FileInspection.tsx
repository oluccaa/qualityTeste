
import React from 'react';
import { Layout } from '../../../layout/MainLayout.tsx';
import { AuditWorkflow } from '../components/AuditWorkflow.tsx';
import { ProcessingOverlay, QualityLoadingState } from '../components/ViewStates.tsx';
import { useFileInspection } from '../hooks/useFileInspection.ts';
import { ArrowLeft, AlertCircle, ShieldCheck, Database, ExternalLink, FileText, Info, Building2, Terminal, ClipboardList } from 'lucide-react';
import { QualityStatus, UserRole, normalizeRole } from '../../../../types/index.ts';

export const FileInspection: React.FC = () => {
  const {
    inspectorFile, loadingFile, isProcessing,
    mainPreviewUrl, handleInspectAction, handleBackToClientFiles,
    user
  } = useFileInspection();

  const role = normalizeRole(user?.role);
  const isQuality = role === UserRole.QUALITY || role === UserRole.ADMIN;
  const isClient = role === UserRole.CLIENT;

  if (loadingFile) {
    return <QualityLoadingState message="Sincronizando protocolos..." />;
  }

  if (!inspectorFile) {
    return (
      <Layout title="Erro de Carga">
        <div className="flex-1 flex flex-col items-center justify-center text-slate-400 gap-4 h-full bg-slate-50" role="alert">
          <AlertCircle size={48} className="opacity-20" />
          <p className="font-bold uppercase tracking-widest text-[10px]">Ativo não localizado</p>
          <button onClick={handleBackToClientFiles} className="px-6 py-2 bg-slate-900 text-white rounded-lg font-bold text-[10px] uppercase">Voltar</button>
        </div>
      </Layout>
    );
  }

  // Definição de Tema por Role
  const theme = {
    headerBg: isQuality ? 'bg-[#132659]' : 'bg-slate-100',
    headerText: isQuality ? 'text-white' : 'text-slate-900',
    headerBorder: isQuality ? 'border-white/10' : 'border-slate-200',
    asideBg: isQuality ? 'bg-slate-50/50' : 'bg-white',
    accentColor: isQuality ? 'text-blue-500' : 'text-emerald-600',
    accentBg: isQuality ? 'bg-blue-500/10' : 'bg-emerald-500/10'
  };

  return (
    <Layout title={isQuality ? "Painel de Auditoria" : "Central de Conformidade"}>
      <div className={`flex-1 flex flex-col min-h-0 bg-white border border-slate-200 rounded-[2rem] overflow-hidden shadow-sm animate-in fade-in duration-500`}>
        {isProcessing && <ProcessingOverlay message="Atualizando Ledger Vital..." />}

        {/* Dynamic Header based on Role */}
        <header className={`px-8 py-5 ${theme.headerBg} ${theme.headerText} flex items-center justify-between shrink-0 border-b ${theme.headerBorder}`}>
          <div className="flex items-center gap-6">
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <div className={`p-1.5 rounded-lg ${theme.accentBg} ${theme.accentColor}`}>
                   {isQuality ? <Terminal size={18} /> : <ClipboardList size={18} />}
                </div>
                <h1 className="text-lg font-black uppercase tracking-tight">
                  {isQuality ? "Terminal Técnico de Auditoria" : "Portal de Verificação de Ativos"}
                </h1>
              </div>
              <p className={`text-[9px] font-bold uppercase tracking-widest opacity-60`}>
                {isQuality ? `Protocolo SGQ • ID: ${inspectorFile.id.split('-')[0]}` : `Empresa: ${user?.organizationName}`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
             <div className={`${isQuality ? 'bg-white/5 border-white/10' : 'bg-slate-200/50 border-slate-300'} border px-4 py-2 rounded-xl flex items-center gap-3`}>
                <FileText size={16} className={theme.accentColor} />
                <div className="min-w-0">
                  <p className={`text-[8px] font-black uppercase tracking-widest leading-none mb-0.5 ${isQuality ? 'text-slate-500' : 'text-slate-400'}`}>Dossier Selecionado</p>
                  <p className={`text-[11px] font-bold truncate max-w-[180px] uppercase tracking-tight ${isQuality ? 'text-white' : 'text-slate-700'}`}>{inspectorFile.name}</p>
                </div>
             </div>
             
             {mainPreviewUrl && (
                <button 
                  onClick={() => window.open(mainPreviewUrl!, '_blank')} 
                  className={`flex items-center gap-2 px-4 py-2 ${isQuality ? 'bg-blue-600 hover:bg-blue-500' : 'bg-[#132659] hover:bg-slate-800'} text-white rounded-lg text-[9px] font-black uppercase tracking-widest transition-all shadow-lg active:scale-95`}
                >
                  <ExternalLink size={12} /> Visualizar Laudo
                </button>
             )}
          </div>
        </header>

        <div className="flex-1 flex overflow-hidden">
          <aside className={`w-64 border-r border-slate-100 ${theme.asideBg} hidden lg:flex flex-col shrink-0 p-6 space-y-6 overflow-y-auto custom-scrollbar`}>
            {isQuality ? (
              <>
                <section className="space-y-4">
                    <h3 className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                        <Database size={12} /> Rastreabilidade Ledger
                    </h3>
                    <div className="space-y-3">
                        <TechnicalInfo label="Cluster ID" value={inspectorFile.id.split('-')[0].toUpperCase()} />
                        <TechnicalInfo label="Versão do Ativo" value={`v${inspectorFile.versionNumber || 1}.0`} />
                        <TechnicalInfo label="Org. Proprietária" value={inspectorFile.ownerId?.split('-')[0].toUpperCase() || 'ROOT'} />
                    </div>
                </section>
                <section className="space-y-4">
                    <h3 className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                        <ShieldCheck size={12} /> Status Global
                    </h3>
                    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                        <p className="text-[11px] font-black text-blue-600 uppercase">{inspectorFile.metadata?.status || 'PENDING'}</p>
                        <p className="text-[8px] font-bold text-slate-400 uppercase mt-1">Auditado por Vital Core</p>
                    </div>
                </section>
              </>
            ) : (
              <>
                <section className="space-y-4">
                    <h3 className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                        <Building2 size={12} /> Dados da Unidade
                    </h3>
                    <div className="space-y-3">
                        <TechnicalInfo label="Organização" value={user?.organizationName || 'N/A'} />
                        <TechnicalInfo label="Responsável" value={user?.name || 'N/A'} />
                    </div>
                </section>
                <section className="space-y-4">
                    <h3 className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                        <Info size={12} /> Guia de Conferência
                    </h3>
                    <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                        <p className="text-[10px] font-bold text-blue-800 leading-relaxed uppercase">
                          Valide as informações documentais e físicas deste lote para concluir a aceitação técnica.
                        </p>
                    </div>
                </section>
              </>
            )}

            <div className="pt-4 mt-auto opacity-20 text-center">
              <img src="https://wtydnzqianhahiiasows.supabase.co/storage/v1/object/public/public_assets/hero/isotipo.png" className="h-5 mx-auto grayscale" alt="Vital" />
              <p className="text-[7px] font-bold mt-2 text-slate-400 uppercase tracking-[4px]">VITAL ENGINE</p>
            </div>
          </aside>

          <main className="flex-1 overflow-y-auto custom-scrollbar bg-white">
            <div className="max-w-4xl mx-auto p-10">
              <header className="mb-8 flex items-end justify-between border-b border-slate-100 pb-5">
                <div>
                  <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight">
                    {isQuality ? "Fluxo de Auditoria Técnica" : "Conformidade do Ativo"}
                  </h2>
                  <p className="text-[11px] font-medium text-slate-500 mt-1.5">
                    {isQuality ? "Controle de transmissão e arbitragem de laudos." : "Verificação e aceite de certificados de qualidade."}
                  </p>
                </div>
                <div className="text-right">
                  <span className={`text-2xl font-black font-mono tracking-tighter ${isQuality ? 'text-blue-600' : 'text-emerald-600'}`}>
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
                    await handleInspectAction(updates);
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
    <span className="text-[10px] font-bold text-slate-700 font-mono truncate">{value}</span>
  </div>
);
