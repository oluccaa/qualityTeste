
import React, { useState } from 'react';
import { 
  Check, User, Key, MessageSquare, 
  ClipboardCheck, Activity, Clock, ShieldCheck, ShieldAlert
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
    metadata, userRole, userName, onUpdate 
}) => {
  const { showToast } = useToast();
  const [isSyncing, setIsSyncing] = useState(false);
  const [contestationInput, setContestationInput] = useState('');
  
  const currentStep = metadata?.currentStep || 1;
  const isAnalyst = userRole === UserRole.QUALITY || userRole === UserRole.ADMIN;
  const isClient = userRole === UserRole.CLIENT;

  const createSignature = (action: string): AuditSignature => ({
    userId: 'system_protocol',
    userName: userName,
    userRole: userRole,
    timestamp: new Date().toISOString(),
    action: action
  });

  const handleAction = async (step: number, status: 'APPROVED' | 'REJECTED', stepUpdates: Partial<SteelBatchMetadata>) => {
    setIsSyncing(true);
    try {
      const sigMap: Record<number, keyof SteelBatchMetadata['signatures']> = {
        1: 'step1_release',
        2: 'step2_documental',
        3: 'step3_physical',
        4: 'step4_contestation',
        5: 'step5_mediation_review',
        6: 'step6_system_log',
        7: 'step7_final_verdict'
      };

      const sigKey = sigMap[step];
      let nextStep = currentStep;
      let nextGlobalStatus = metadata?.status || QualityStatus.PENDING;

      // MÁQUINA DE ESTADOS INDEPENDENTE AÇOS VITAL
      switch(step) {
        case 1: // Liberação Qualidade -> Vai para Passo 2
          if (status === 'APPROVED') {
            nextStep = 2;
            nextGlobalStatus = QualityStatus.SENT;
          }
          break;

        case 2: // Conferência de Dados (Cliente) -> Vai OBRIGATORIAMENTE para Passo 3
          if (status === 'APPROVED') {
            nextStep = 3; 
          } else {
            nextStep = 4; // Arbitragem se houver divergência documental
          }
          break;

        case 3: // Vistoria de Carga (Cliente) -> Se OK, vai para Consolidação (Passo 6)
          if (status === 'APPROVED') {
            nextStep = 6; 
          } else {
            nextStep = 4; // Arbitragem se houver avaria física
          }
          break;

        case 4: // Arbitragem Técnica (Analista) -> Vai para Veredito do Parceiro
          nextStep = 5;
          break;

        case 5: // Veredito do Parceiro (Cliente) -> Se aceitar arbitragem, vai para Passo 6
          if (status === 'APPROVED') {
            nextStep = 6;
          } else {
            nextGlobalStatus = QualityStatus.REJECTED;
            nextStep = 7; // Encerra como Reprovado
          }
          break;

        case 6: // Consolidação Final (Cliente) -> Conclui Protocolo
          nextStep = 7;
          nextGlobalStatus = QualityStatus.APPROVED;
          break;
      }

      const newSignatures = { 
        ...metadata?.signatures, 
        [sigKey]: createSignature(`${status}_STEP_${step}`) 
      };
      
      await onUpdate({
        ...stepUpdates,
        currentStep: nextStep,
        signatures: newSignatures as any,
        status: nextGlobalStatus
      });

      showToast(`Passo ${step} concluído. Avançando para: ${nextStep}`, "success");
    } catch (e) {
      showToast("Erro ao sincronizar Ledger Vital.", "error");
    } finally {
      setIsSyncing(false);
      setContestationInput('');
    }
  };

  return (
    <div className="space-y-4 pb-20">
        <StepCard 
          step={1} 
          title="1. Liberação Vital (SGQ)" 
          desc="Autorização técnica para início da conferência externa."
          active={currentStep === 1}
          completed={currentStep > 1}
          signature={metadata?.signatures?.step1_release}
        >
          {isAnalyst && currentStep === 1 && (
            <button 
              disabled={isSyncing}
              onClick={() => handleAction(1, 'APPROVED', {})}
              className="px-6 py-3 bg-[#132659] text-white rounded-lg font-black text-[9px] uppercase tracking-[2px] shadow-lg hover:bg-blue-900 transition-all flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50"
            >
              {isSyncing ? <Activity className="animate-spin" size={14}/> : <><Key size={14} className="text-blue-400" /> Liberar para o Cliente</>}
            </button>
          )}
          {isClient && currentStep === 1 && <WaitBadge label="Aguardando Triagem Vital" />}
        </StepCard>

        <StepCard 
          step={2} 
          title="2. Conferência de Dados" 
          desc="Validação das propriedades técnicas e dimensionais do aço."
          active={currentStep === 2}
          completed={currentStep > 2 && !!metadata?.documentalStatus}
          status={metadata?.documentalStatus}
          signature={metadata?.signatures?.step2_documental}
        >
          {isClient && currentStep === 2 && (
            <div className="flex gap-3 animate-in slide-in-from-bottom-2">
               <button onClick={() => handleAction(2, 'APPROVED', { documentalStatus: 'APPROVED' })} className="px-6 py-2.5 bg-emerald-600 text-white rounded-lg font-black text-[9px] uppercase tracking-widest hover:bg-emerald-700 active:scale-95 transition-all shadow-md">Dados Estão Corretos</button>
               <button onClick={() => handleAction(2, 'REJECTED', { documentalStatus: 'REJECTED' })} className="px-6 py-2.5 bg-red-600 text-white rounded-lg font-black text-[9px] uppercase tracking-widest hover:bg-red-700 active:scale-95 transition-all shadow-md">Divergência nos Dados</button>
            </div>
          )}
          {isAnalyst && currentStep === 2 && <WaitBadge label="Aguardando Conferência Documental" />}
        </StepCard>

        <StepCard 
          step={3} 
          title="3. Vistoria de Carga" 
          desc="Inspeção física do material e etiquetas no recebimento."
          active={currentStep === 3}
          completed={currentStep > 3 && !!metadata?.physicalStatus}
          status={metadata?.physicalStatus}
          signature={metadata?.signatures?.step3_physical}
        >
          {isClient && currentStep === 3 && (
            <div className="flex gap-3 animate-in slide-in-from-bottom-2">
               <button onClick={() => handleAction(3, 'APPROVED', { physicalStatus: 'APPROVED' })} className="px-6 py-2.5 bg-emerald-600 text-white rounded-lg font-black text-[9px] uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-md">Carga Recebida OK</button>
               <button onClick={() => handleAction(3, 'REJECTED', { physicalStatus: 'REJECTED' })} className="px-6 py-2.5 bg-red-600 text-white rounded-lg font-black text-[9px] uppercase tracking-widest hover:bg-red-700 active:scale-95 transition-all shadow-md">Material com Avaria/Erro</button>
            </div>
          )}
          {isAnalyst && currentStep === 3 && <WaitBadge label="Aguardando Vistoria de Carga" />}
          {currentStep < 3 && <WaitBadge label="Bloqueado: Pendente passo anterior" icon={ShieldAlert} />}
        </StepCard>

        <StepCard 
          step={4} 
          title="4. Arbitragem Técnica" 
          desc="Análise Vital sobre as divergências apontadas pelo parceiro."
          active={currentStep === 4}
          completed={currentStep > 4}
          signature={metadata?.signatures?.step4_contestation}
        >
          {isAnalyst && currentStep === 4 && (
            <div className="space-y-4 animate-in slide-in-from-bottom-2 max-w-xl">
               <textarea 
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs min-h-[100px] outline-none focus:border-blue-400 transition-all font-medium"
                  placeholder="Justificativa ou solução para as divergências..."
                  value={contestationInput}
                  onChange={e => setContestationInput(e.target.value)}
               />
               <button 
                  disabled={!contestationInput.trim() || isSyncing}
                  onClick={() => handleAction(4, 'APPROVED', { analystContestationNote: contestationInput })}
                  className="px-8 py-3 bg-orange-600 text-white rounded-lg font-black text-[9px] uppercase tracking-widest shadow-lg hover:bg-orange-700 transition-all active:scale-95 disabled:opacity-50"
               >
                  Enviar Parecer Técnico
               </button>
            </div>
          )}
          {isClient && currentStep === 4 && <WaitBadge label="Em análise técnica pela Qualidade Vital" icon={Activity} />}
        </StepCard>

        <StepCard 
          step={5} 
          title="5. Veredito do Parceiro" 
          desc="Aceite ou recusa final da mediação técnica."
          active={currentStep === 5}
          completed={currentStep > 5}
          signature={metadata?.signatures?.step5_mediation_review}
        >
          {metadata?.analystContestationNote && (
              <div className="mb-4 p-4 bg-blue-50/50 rounded-xl border border-blue-100 italic text-xs text-blue-800 shadow-inner max-w-xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-2 opacity-5 text-blue-900"><MessageSquare size={40} /></div>
                  <p className="font-black uppercase mb-1 not-italic text-blue-900 text-[9px] tracking-widest">Nota da Qualidade:</p>
                  "{metadata.analystContestationNote}"
              </div>
          )}
          {isClient && currentStep === 5 && (
            <div className="flex gap-3 animate-in slide-in-from-bottom-2">
               <button onClick={() => handleAction(5, 'APPROVED', { mediationStatus: 'APPROVED' })} className="px-6 py-2.5 bg-emerald-600 text-white rounded-lg font-black text-[9px] uppercase tracking-widest hover:bg-emerald-700 shadow-md">Aceitar Mediação</button>
               <button onClick={() => handleAction(5, 'REJECTED', { mediationStatus: 'REJECTED' })} className="px-6 py-2.5 bg-red-600 text-white rounded-lg font-black text-[9px] uppercase tracking-widest hover:bg-red-700 shadow-md">Recusar e Encerrar</button>
            </div>
          )}
        </StepCard>

        <StepCard 
          step={6} 
          title="6. Consolidação Digital" 
          desc="Assinatura eletrônica de encerramento do processo."
          active={currentStep === 6}
          completed={currentStep > 6}
          signature={metadata?.signatures?.step6_system_log}
        >
          {isClient && currentStep === 6 && (
            <button onClick={() => handleAction(6, 'APPROVED', {})} className="px-8 py-3 bg-[#132659] text-white rounded-lg font-black text-[9px] uppercase tracking-widest shadow-lg active:scale-95 transition-all">Consolidar Dossier</button>
          )}
          {isAnalyst && currentStep === 6 && <WaitBadge label="Aguardando Assinatura Final" />}
        </StepCard>

        <StepCard 
          step={7} 
          title="7. Protocolo Vital Certificado" 
          desc="Processo auditado e arquivado no cluster de segurança."
          active={currentStep === 7}
          completed={currentStep > 7}
          signature={metadata?.signatures?.step7_final_verdict}
        >
          {metadata?.status === QualityStatus.APPROVED && (
              <div className="p-6 bg-emerald-50 text-emerald-700 border-emerald-100 rounded-2xl border flex items-center gap-6 shadow-inner max-w-xl animate-in zoom-in-95">
                  <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-emerald-500 shadow-sm">
                    <ShieldCheck size={28} />
                  </div>
                  <div>
                    <p className="text-sm font-black uppercase tracking-tight">Qualidade Validada</p>
                    <p className="text-[9px] font-bold opacity-60 uppercase tracking-widest mt-0.5">Certificado v4.0 Ativo</p>
                  </div>
              </div>
          )}
          {metadata?.status === QualityStatus.REJECTED && (
              <div className="p-6 bg-red-50 text-red-700 border-red-100 rounded-2xl border flex items-center gap-6 shadow-inner max-w-xl animate-in zoom-in-95">
                  <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-red-500 shadow-sm">
                    <ShieldAlert size={28} />
                  </div>
                  <div>
                    <p className="text-sm font-black uppercase tracking-tight">Protocolo Reprovado</p>
                    <p className="text-[9px] font-bold opacity-60 uppercase tracking-widest mt-0.5">Encerrado sem conformidade</p>
                  </div>
              </div>
          )}
        </StepCard>
    </div>
  );
};

const WaitBadge = ({ label, icon: Icon = Clock }: { label: string; icon?: any }) => (
    <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-400 w-fit animate-in fade-in slide-in-from-left-2">
        <Icon size={12} className="animate-pulse" />
        <p className="text-[8px] font-black uppercase tracking-widest leading-tight">{label}</p>
    </div>
);

const StepCard = ({ step, title, desc, active, completed, signature, status, children }: any) => {
  const isRejected = status === 'REJECTED';

  return (
    <div className={`p-6 rounded-2xl border transition-all duration-500 relative overflow-hidden group
      ${active ? 'bg-white border-blue-400 shadow-md ring-1 ring-blue-400/5' : 
        completed ? 'bg-white border-slate-100 opacity-80' : 'bg-transparent border-slate-100 opacity-30'}`}>
      
      <div className="flex items-start gap-6 relative z-10">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border transition-all duration-700
          ${completed ? 'bg-emerald-500 border-emerald-400 text-white shadow-sm' : 
            active ? 'bg-[#132659] border-slate-800 text-white shadow-lg' : 
            'bg-slate-100 border-slate-200 text-slate-400'}`}>
          {completed ? <Check size={24} strokeWidth={4} /> : <span className="font-black text-sm font-mono">{step}</span>}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-4">
            <h4 className={`text-base font-black uppercase tracking-tight truncate ${active ? 'text-slate-900' : 'text-slate-400'}`}>
              {title}
            </h4>
            {isRejected && <span className="text-[8px] font-black bg-red-600 text-white px-2 py-0.5 rounded-full animate-pulse tracking-widest shadow-sm">DIVERGÊNCIA</span>}
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5 font-medium leading-relaxed max-w-xl">{desc}</p>

          {signature && (
            <div className="mt-4 flex items-center gap-3 text-[8px] font-black text-emerald-600 bg-emerald-50/50 border border-emerald-100 w-fit px-3 py-1.5 rounded-lg">
                <ClipboardCheck size={12} /> 
                <span className="uppercase tracking-widest">{signature.userName} • {new Date(signature.timestamp).toLocaleDateString()}</span>
            </div>
          )}

          {children && <div className="mt-5 animate-in fade-in slide-in-from-bottom-2 duration-700">{children}</div>}
        </div>
      </div>
    </div>
  );
};
