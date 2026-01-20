
import React, { useState } from 'react';
import { 
  Check, ShieldCheck, Clock, Lock, FileText, Ruler, 
  AlertCircle, FileCheck, Database, Key, ArrowRight,
  RefreshCcw, Upload, History, User, BadgeCheck, FileWarning
} from 'lucide-react';
import { SteelBatchMetadata, QualityStatus, UserRole, AuditSignature } from '../../../../types/index.ts';
import { useToast } from '../../../../context/notificationContext.tsx';

interface AuditWorkflowProps {
  metadata: SteelBatchMetadata | undefined;
  userRole: UserRole;
  userName: string;
  userEmail: string;
  fileId: string;
  onUpdate: (updatedMetadata: Partial<SteelBatchMetadata>) => Promise<void>;
  onUploadReplacement?: () => void;
}

export const AuditWorkflow: React.FC<AuditWorkflowProps> = ({ 
    metadata, userRole, userName, fileId, onUpdate, onUploadReplacement 
}) => {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<'workflow' | 'history' | 'remediation'>('workflow');
  const [isSyncing, setIsSyncing] = useState(false);
  
  const currentStep = metadata?.currentStep || 0;
  const isAnalyst = userRole === UserRole.QUALITY || userRole === UserRole.ADMIN;
  const isClient = userRole === UserRole.CLIENT;

  const createSignature = (action: string): AuditSignature => ({
    userId: 'system', // No app real viria do user.id
    userName: userName,
    userRole: userRole,
    timestamp: new Date().toISOString(),
    action: action
  });

  const handleStepAction = async (step: number, updates: Partial<SteelBatchMetadata>, actionName: string) => {
    setIsSyncing(true);
    try {
      const sigKey = `step${step}_signature` as any;
      const newSignatures = { ...metadata?.signatures, [sigKey]: createSignature(actionName) };
      
      await onUpdate({
        ...updates,
        currentStep: step + 1,
        signatures: newSignatures as any
      });
      showToast(`Etapa ${step} concluída e assinada digitalmente.`, "success");
    } catch (e) {
      showToast("Falha ao autenticar assinatura no ledger.", "error");
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white font-sans">
      {/* Tab Navigation - Premium Design */}
      <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-2xl mb-8 shrink-0">
         <TabButton active={activeTab === 'workflow'} onClick={() => setActiveTab('workflow')} icon={ShieldCheck} label="Workflow" />
         <TabButton active={activeTab === 'remediation'} onClick={() => setActiveTab('remediation')} icon={FileWarning} label="RNC / Guias" />
         <TabButton active={activeTab === 'history'} onClick={() => setActiveTab('history')} icon={History} label="Versões" />
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar pr-2">
        {activeTab === 'workflow' && (
          <div className="space-y-10 pb-10">
            {/* Step 1: Liberação */}
            <StepConnector active={currentStep >= 1} />
            <StepItem 
              step={1} 
              title="Liberação Técnica Vital" 
              desc="Validação inicial do laudo pelo laboratório Aços Vital."
              signature={metadata?.signatures?.step1_release}
              status={currentStep > 1 ? 'completed' : currentStep === 1 ? 'active' : 'pending'}
            >
              {currentStep === 1 && isAnalyst && (
                <button 
                  onClick={() => handleStepAction(1, { status: QualityStatus.SENT }, "LIBERAÇÃO_TECNICA")}
                  className="w-full py-4 bg-[#081437] text-white rounded-xl font-black text-[10px] uppercase tracking-[3px] shadow-xl hover:bg-blue-900 transition-all flex items-center justify-center gap-3"
                >
                  <Key size={14} className="text-blue-400" /> Assinar Digitalmente
                </button>
              )}
            </StepItem>

            {/* Step 2: Conferência Cliente */}
            <StepConnector active={currentStep >= 2} />
            <StepItem 
              step={2} 
              title="Conferência de Recebimento" 
              desc="O parceiro deve validar a integridade documental e física."
              signature={metadata?.signatures?.step2_client_check}
              status={currentStep > 2 ? 'completed' : currentStep === 2 ? 'active' : 'pending'}
            >
              {currentStep === 2 && isClient && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                     <button onClick={() => handleStepAction(2, { status: QualityStatus.APPROVED }, "ACEITE_CLIENTE")} className="py-4 bg-emerald-600 text-white rounded-xl font-black text-[9px] uppercase tracking-widest">Aprovar Lote</button>
                     <button onClick={() => { handleStepAction(2, { status: QualityStatus.REJECTED, currentStep: 3 }, "REJEIÇÃO_PARCEIRO"); setActiveTab('remediation'); }} className="py-4 bg-red-600 text-white rounded-xl font-black text-[9px] uppercase tracking-widest">Rejeitar / Abrir RNC</button>
                  </div>
                </div>
              )}
            </StepItem>

            {/* Step 3: Mediação (Condicional) */}
            {(metadata?.status === QualityStatus.REJECTED || currentStep >= 3) && (
              <>
                <StepConnector active={currentStep >= 3} />
                <StepItem 
                  step={3} 
                  title="Mediação e Retificação" 
                  desc="Ajustes técnicos e resposta às contestações do parceiro."
                  signature={metadata?.signatures?.step3_remediation}
                  status={currentStep > 3 ? 'completed' : currentStep === 3 ? 'active' : 'pending'}
                >
                  {currentStep === 3 && isAnalyst && (
                    <div className="space-y-4">
                       <button 
                         onClick={onUploadReplacement}
                         className="w-full py-4 border-2 border-dashed border-blue-200 text-blue-600 rounded-xl font-black text-[9px] uppercase tracking-widest hover:bg-blue-50 transition-all flex items-center justify-center gap-2"
                       >
                         <Upload size={14} /> Subir Documento Substituto
                       </button>
                       <button onClick={() => handleStepAction(3, { currentStep: 4 }, "MEDIAÇÃO_CONCLUIDA")} className="w-full py-4 bg-[#081437] text-white rounded-xl font-black text-[9px] uppercase tracking-widest">Finalizar Retificação</button>
                    </div>
                  )}
                </StepItem>
              </>
            )}

            {/* Final Step */}
            <StepConnector active={currentStep >= 4} />
            <StepItem 
              step={4} 
              title="Veredito Final" 
              desc="Encerramento do dossier com aceite irrevogável."
              signature={metadata?.signatures?.step4_final_verdict}
              status={currentStep >= 4 ? 'active' : 'pending'}
            />
          </div>
        )}

        {activeTab === 'remediation' && (
          <div className="space-y-6 animate-in fade-in duration-500">
             <div className="p-6 bg-orange-50 border-2 border-orange-100 rounded-[2rem] space-y-4">
                <div className="flex items-center gap-3 text-orange-700">
                   <FileWarning size={24} />
                   <h4 className="text-sm font-black uppercase tracking-tight">Guia de Tratamento de Rejeição</h4>
                </div>
                <p className="text-xs text-orange-800 font-medium leading-relaxed">
                   Este laudo foi contestado. Para resolver esta Não-Conformidade, siga os protocolos abaixo:
                </p>
                <ul className="space-y-2">
                   <GuideStep icon={RefreshCcw} label="1. Verificar divergência química" />
                   <GuideStep icon={Ruler} label="2. Validar dimensões físicas no pátio" />
                   <GuideStep icon={Upload} label="3. Emitir novo certificado (vNext)" />
                </ul>
             </div>
             
             {isAnalyst && (
               <div className="space-y-4 pt-4 border-t border-slate-100">
                  <h5 className="text-[10px] font-black uppercase text-slate-400 tracking-[3px]">Ações de Qualidade</h5>
                  <button onClick={onUploadReplacement} className="w-full flex items-center justify-between p-5 bg-white border border-slate-200 rounded-2xl hover:border-blue-500 hover:shadow-lg transition-all group">
                     <div className="flex items-center gap-4">
                        <div className="p-3 bg-blue-50 text-blue-600 rounded-xl group-hover:bg-blue-600 group-hover:text-white transition-all"><Upload size={20}/></div>
                        <div className="text-left">
                           <p className="text-sm font-black text-slate-800 uppercase tracking-tight">Novo Laudo Substituto</p>
                           <p className="text-[9px] text-slate-400 font-bold uppercase">Invalidar versão atual e subir v{ (metadata?.currentVersion || 1) + 1 }</p>
                        </div>
                     </div>
                     <ArrowRight size={18} className="text-slate-300 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
                  </button>
               </div>
             )}
          </div>
        )}

        {activeTab === 'history' && (
          <div className="space-y-4 animate-in fade-in duration-500">
             <div className="flex items-center justify-between px-2">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[3px]">Histórico de Versões</h4>
                <span className="text-[9px] font-black bg-blue-600 text-white px-2 py-0.5 rounded-full">v{metadata?.currentVersion || 1} Atual</span>
             </div>
             <div className="bg-slate-50 rounded-3xl p-6 border border-slate-100 text-center">
                <History size={32} className="mx-auto text-slate-300 mb-4" />
                <p className="text-xs text-slate-500 font-medium italic">O versionamento garante que nenhuma informação técnica seja perdida durante o ciclo de correção.</p>
             </div>
          </div>
        )}
      </div>
    </div>
  );
};

/* --- Sub-components Puros --- */

const TabButton = ({ active, onClick, icon: Icon, label }: any) => (
  <button 
    onClick={onClick}
    className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${
        active ? 'bg-white text-[#081437] shadow-sm' : 'text-slate-500 hover:text-slate-700'
    }`}
  >
    <Icon size={14} className={active ? 'text-blue-600' : ''} /> {label}
  </button>
);

const StepItem = ({ step, title, desc, signature, status, children }: any) => {
  const isCompleted = status === 'completed';
  const isActive = status === 'active';

  return (
    <div className={`relative pl-4 transition-all duration-500 ${!isActive && !isCompleted ? 'opacity-40 grayscale' : ''}`}>
      <div className="flex items-start gap-5">
        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 z-10 border-2 transition-all ${
          isCompleted ? 'bg-emerald-500 border-emerald-500 text-white' : 
          isActive ? 'bg-[#b23c0e] border-[#b23c0e] text-white shadow-xl shadow-orange-500/20 scale-110' : 
          'bg-white border-slate-200 text-slate-300'
        }`}>
          {isCompleted ? <Check size={20} strokeWidth={4} /> : <span className="font-black text-sm">{step}</span>}
        </div>
        
        <div className="flex-1 space-y-3">
          <div>
            <h4 className="text-sm font-black text-slate-900 uppercase tracking-tight">{title}</h4>
            <p className="text-[10px] text-slate-500 font-medium leading-relaxed">{desc}</p>
          </div>

          {signature && (
            <div className="bg-emerald-50/50 border border-emerald-100 rounded-2xl p-3 flex items-center justify-between animate-in zoom-in-95">
               <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-white rounded-xl flex items-center justify-center text-emerald-600 shadow-sm"><BadgeCheck size={18} /></div>
                  <div>
                    <p className="text-[9px] font-black text-emerald-800 uppercase tracking-widest">Assinado por {signature.userName}</p>
                    <p className="text-[8px] font-bold text-emerald-600 uppercase opacity-70">{signature.userRole} • Vital ID Secure</p>
                  </div>
               </div>
               <div className="text-right">
                  <p className="text-[9px] font-mono text-emerald-700 font-bold">{new Date(signature.timestamp).toLocaleDateString()}</p>
                  <p className="text-[8px] font-mono text-emerald-500">{new Date(signature.timestamp).toLocaleTimeString()}</p>
               </div>
            </div>
          )}

          {children && <div className="pt-2 animate-in slide-in-from-top-2">{children}</div>}
        </div>
      </div>
    </div>
  );
};

const StepConnector = ({ active }: { active: boolean }) => (
  <div className={`ml-5 h-8 w-0.5 rounded-full transition-all duration-700 ${active ? 'bg-emerald-500' : 'bg-slate-100'}`} />
);

const GuideStep = ({ icon: Icon, label }: any) => (
  <li className="flex items-center gap-3 text-[10px] font-black text-orange-900 uppercase tracking-widest opacity-80">
    <Icon size={12} className="shrink-0" /> {label}
  </li>
);
