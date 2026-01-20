
import React, { useState } from 'react';
import { 
  Check, User, Key, MessageSquare, Send, 
  ClipboardCheck, Activity, Search, FlaskConical,
  Clock, ShieldAlert, FileText, ShieldCheck
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

  const handleAction = async (step: number, status: 'APPROVED' | 'REJECTED', updates: Partial<SteelBatchMetadata>) => {
    setIsSyncing(true);
    try {
      const sigKey = `step${step}_signature` as any;
      const nextStep = status === 'APPROVED' ? step + 1 : 4; 
      
      const newSignatures = { 
        ...metadata?.signatures, 
        [sigKey]: createSignature(`${status}_STEP_${step}`) 
      };
      
      await onUpdate({
        ...updates,
        currentStep: nextStep,
        signatures: newSignatures as any,
        status: nextStep === 7 ? QualityStatus.APPROVED : (status === 'REJECTED' ? QualityStatus.REJECTED : metadata?.status)
      });
      showToast(`Etapa ${step} finalizada.`, "success");
    } catch (e) {
      showToast("Erro na sincronização.", "error");
    } finally {
      setIsSyncing(false);
      setContestationInput('');
    }
  };

  return (
    <div className="space-y-4 pb-20">
        <StepCard 
          step={1} 
          title="Liberação Técnica" 
          desc="Protocolo inicial: Validação da integridade documental."
          active={currentStep === 1}
          completed={currentStep > 1}
          signature={metadata?.signatures?.step1_release}
        >
          {isAnalyst && currentStep === 1 && (
            <button 
              disabled={isSyncing}
              onClick={() => handleAction(1, 'APPROVED', { status: QualityStatus.SENT })}
              className="px-6 py-3 bg-[#081437] text-white rounded-lg font-black text-[9px] uppercase tracking-[2px] shadow-lg hover:bg-blue-900 transition-all flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50"
            >
              {isSyncing ? <Activity className="animate-spin" size={14}/> : <><Key size={14} className="text-blue-400" /> Iniciar Liberação</>}
            </button>
          )}
        </StepCard>

        <StepCard 
          step={2} 
          title="Consistência de Dados" 
          desc="Conferência de normas e especificações pelo parceiro."
          active={currentStep === 2}
          completed={currentStep > 2}
          status={metadata?.documentalStatus}
          signature={metadata?.signatures?.step2_documental}
        >
          {isClient && currentStep === 2 && (
            <div className="flex gap-3 animate-in slide-in-from-bottom-2">
               <button onClick={() => handleAction(2, 'APPROVED', { documentalStatus: 'APPROVED' })} className="px-6 py-2.5 bg-emerald-600 text-white rounded-lg font-black text-[9px] uppercase tracking-widest hover:bg-emerald-700 active:scale-95">Aprovar</button>
               <button onClick={() => handleAction(2, 'REJECTED', { documentalStatus: 'REJECTED' })} className="px-6 py-2.5 bg-red-600 text-white rounded-lg font-black text-[9px] uppercase tracking-widest hover:bg-red-700 active:scale-95">Rejeitar</button>
            </div>
          )}
          {!isClient && currentStep === 2 && <WaitBadge label="Aguardando Parceiro" />}
        </StepCard>

        <StepCard 
          step={3} 
          title="Verificação de Lote" 
          desc="Inspeção física e integridade do material no recebimento."
          active={currentStep === 3}
          completed={currentStep > 3}
          status={metadata?.physicalStatus}
          signature={metadata?.signatures?.step3_physical}
        >
          {isClient && currentStep === 3 && (
            <div className="flex gap-3 animate-in slide-in-from-bottom-2">
               <button onClick={() => handleAction(3, 'APPROVED', { physicalStatus: 'APPROVED' })} className="px-6 py-2.5 bg-emerald-600 text-white rounded-lg font-black text-[9px] uppercase tracking-widest">Aprovar</button>
               <button onClick={() => handleAction(3, 'REJECTED', { physicalStatus: 'REJECTED' })} className="px-6 py-2.5 bg-red-600 text-white rounded-lg font-black text-[9px] uppercase tracking-widest">Rejeitar</button>
            </div>
          )}
          {!isClient && currentStep === 3 && <WaitBadge label="Aguardando Parceiro" />}
        </StepCard>

        <StepCard 
          step={4} 
          title="Arbitragem Técnica" 
          desc="Análise e mediação de divergências técnicas."
          active={currentStep === 4}
          completed={currentStep > 4}
          signature={metadata?.signatures?.step4_contestation}
        >
          {isAnalyst && currentStep === 4 && (
            <div className="space-y-4 animate-in slide-in-from-bottom-2 max-w-xl">
               <textarea 
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs min-h-[100px] outline-none focus:border-blue-400 transition-all font-medium"
                  placeholder="Justificativa técnica..."
                  value={contestationInput}
                  onChange={e => setContestationInput(e.target.value)}
               />
               <button 
                  disabled={!contestationInput.trim() || isSyncing}
                  onClick={() => handleAction(4, 'APPROVED', { analystContestationNote: contestationInput })}
                  className="px-8 py-3 bg-orange-600 text-white rounded-lg font-black text-[9px] uppercase tracking-widest shadow-lg hover:bg-orange-700 transition-all active:scale-95 disabled:opacity-50"
               >
                  Enviar Mediação
               </button>
            </div>
          )}
          {!isAnalyst && currentStep === 4 && <WaitBadge label="Em Elaboração Técnica" icon={Activity} />}
        </StepCard>

        <StepCard 
          step={5} 
          title="Veredito de Mediação" 
          desc="Parecer final do parceiro sobre a arbitragem."
          active={currentStep === 5}
          completed={currentStep > 5}
          signature={metadata?.signatures?.step5_mediation_review}
        >
          {metadata?.analystContestationNote && (
              <div className="mb-4 p-4 bg-blue-50/50 rounded-xl border border-blue-100 italic text-xs text-blue-800 shadow-inner max-w-xl">
                  <p className="font-black uppercase mb-1 not-italic text-blue-900 text-[9px] tracking-widest">Parecer Vital:</p>
                  "{metadata.analystContestationNote}"
              </div>
          )}
          {isClient && currentStep === 5 && (
            <div className="flex gap-3 animate-in slide-in-from-bottom-2">
               <button onClick={() => handleAction(5, 'APPROVED', { mediationStatus: 'APPROVED' })} className="px-6 py-2.5 bg-emerald-600 text-white rounded-lg font-black text-[9px] uppercase tracking-widest hover:bg-emerald-700">Aceitar</button>
               <button onClick={() => handleAction(5, 'REJECTED', { mediationStatus: 'REJECTED', status: QualityStatus.REJECTED })} className="px-6 py-2.5 bg-red-600 text-white rounded-lg font-black text-[9px] uppercase tracking-widest hover:bg-red-700">Manter Recusa</button>
            </div>
          )}
        </StepCard>

        <StepCard 
          step={6} 
          title="Registro Forense" 
          desc="Assinatura digital e consolidação de logs imutáveis."
          active={currentStep === 6}
          completed={currentStep > 6}
          signature={metadata?.signatures?.step6_system_log}
        >
          {isAnalyst && currentStep === 6 && (
            <button onClick={() => handleAction(6, 'APPROVED', {})} className="px-8 py-3 bg-[#081437] text-white rounded-lg font-black text-[9px] uppercase tracking-widest shadow-lg active:scale-95 transition-all">Consolidar Registro</button>
          )}
        </StepCard>

        <StepCard 
          step={7} 
          title="Encerramento" 
          desc="Arquivamento técnico e integração ao SGQ Central."
          active={currentStep === 7}
          completed={currentStep > 7}
          signature={metadata?.signatures?.step7_final_verdict}
        >
          {currentStep === 7 && (
              <div className="p-6 bg-emerald-50 text-emerald-700 rounded-2xl border border-emerald-100 flex items-center gap-6 shadow-inner max-w-xl">
                  <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-emerald-500 shadow-sm border border-emerald-100">
                    <ShieldCheck size={28} />
                  </div>
                  <div>
                    <p className="text-sm font-black uppercase tracking-tight">Dossier Certificado</p>
                    <p className="text-[9px] font-bold opacity-60 uppercase tracking-widest mt-0.5">Operação Finalizada com Sucesso</p>
                  </div>
              </div>
          )}
        </StepCard>
    </div>
  );
};

const WaitBadge = ({ label, icon: Icon = Clock }: { label: string; icon?: any }) => (
    <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-400 w-fit">
        <Icon size={12} className="animate-pulse" />
        <p className="text-[8px] font-black uppercase tracking-widest">{label}</p>
    </div>
);

const StepCard = ({ step, title, desc, active, completed, signature, status, children }: any) => {
  const isRejected = status === 'REJECTED' || (step === 5 && status === 'REJECTED');

  return (
    <div className={`p-6 rounded-2xl border transition-all duration-500 relative overflow-hidden group
      ${active ? 'bg-white border-blue-400 shadow-md ring-1 ring-blue-400/10' : 
        completed ? 'bg-white border-slate-100 opacity-80' : 'bg-transparent border-slate-100 opacity-30'}`}>
      
      <div className="flex items-start gap-6 relative z-10">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border transition-all duration-700
          ${completed ? 'bg-emerald-500 border-emerald-400 text-white shadow-sm' : 
            active ? 'bg-[#081437] border-slate-800 text-white shadow-lg' : 
            'bg-slate-100 border-slate-200 text-slate-400'}`}>
          {completed ? <Check size={24} strokeWidth={4} /> : <span className="font-black text-sm font-mono">{step}</span>}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-4">
            <h4 className={`text-base font-black uppercase tracking-tight truncate ${active ? 'text-slate-900' : 'text-slate-400'}`}>
              {title}
            </h4>
            {isRejected && <span className="text-[8px] font-black bg-red-600 text-white px-2 py-0.5 rounded-full animate-pulse tracking-widest shadow-sm">REPROVADO</span>}
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5 font-medium leading-relaxed max-w-xl">{desc}</p>

          {signature && (
            <div className="mt-4 flex items-center gap-3 text-[8px] font-black text-emerald-600 bg-emerald-50/50 border border-emerald-100 w-fit px-3 py-1.5 rounded-lg">
                <ClipboardCheck size={12} /> 
                <span className="uppercase tracking-widest">{signature.userName} • {new Date(signature.timestamp).toLocaleDateString()} {new Date(signature.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
            </div>
          )}

          {children && <div className="mt-5 animate-in fade-in slide-in-from-bottom-2 duration-700">{children}</div>}
        </div>
      </div>

      <div className="absolute -right-6 -bottom-6 opacity-[0.015] text-slate-950 pointer-events-none transition-all duration-1000 group-hover:scale-110">
         {step === 1 && <Key size={120} />}
         {step === 2 && <FileText size={120} />}
         {step === 3 && <FlaskConical size={120} />}
         {step === 4 && <Activity size={120} />}
         {step === 5 && <Search size={120} />}
         {step === 6 && <Activity size={120} />}
         {step === 7 && <ClipboardCheck size={120} />}
      </div>
    </div>
  );
};
