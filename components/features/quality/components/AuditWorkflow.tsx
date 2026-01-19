
import React, { useState } from 'react';
import { 
  Check, Send, RefreshCcw, ShieldCheck, 
  AlertTriangle, Plus, X, MessageSquare, Clock, FileCheck, Mail, Info, UserX
} from 'lucide-react';
import { SteelBatchMetadata, QualityStatus, UserRole } from '../../../../types/index.ts';

interface AuditWorkflowProps {
  metadata: SteelBatchMetadata | undefined;
  userRole: UserRole;
  userName: string;
  userEmail: string;
  fileId: string;
  onUpdate: (updatedMetadata: Partial<SteelBatchMetadata>) => Promise<void>;
}

export const AuditWorkflow: React.FC<AuditWorkflowProps> = ({ metadata, userRole, userName, userEmail, onUpdate }) => {
  const [localRemediation, setLocalRemediation] = useState('');
  const [localObservations, setLocalObservations] = useState('');

  const isAnalyst = userRole === UserRole.QUALITY || userRole === UserRole.ADMIN;
  const isClient = userRole === UserRole.CLIENT;
  const currentStep = metadata?.currentStep || 1;

  // Lógica de parsing para o contato do cliente
  const lastInteraction = metadata?.lastClientInteractionBy || '';
  const [clientName, clientEmail] = lastInteraction.includes(' | ') 
    ? lastInteraction.split(' | ') 
    : [lastInteraction, ''];

  // Lógica de Finalização das Conferências (Passo 2 e 3)
  const handleClientConferences = async (docStatus: QualityStatus, physStatus: QualityStatus) => {
    if (!isClient) return;

    const isFullyApproved = docStatus === QualityStatus.APPROVED && physStatus === QualityStatus.APPROVED;
    
    const payload: Partial<SteelBatchMetadata> = {
      documentalStatus: docStatus,
      physicalStatus: physStatus,
      clientObservations: localObservations,
      lastClientInteractionAt: new Date().toISOString(),
      // Salva o contato combinado para rastreabilidade
      lastClientInteractionBy: `${userName} | ${userEmail}`,
      currentStep: isFullyApproved ? 7 : 4,
      status: isFullyApproved ? QualityStatus.APPROVED : QualityStatus.REJECTED
    };

    await onUpdate(payload);
  };

  const handlePartnerVerdict = async (verdict: QualityStatus) => {
    if (!isClient) return;
    
    const targetStep = verdict === QualityStatus.APPROVED ? 7 : 6;
    
    await onUpdate({ 
      currentStep: targetStep, 
      status: verdict, 
      finalPartnerVerdict: verdict, 
      finalVerdictAt: new Date().toISOString(), 
      lastClientInteractionBy: `${userName} | ${userEmail}`,
      lastClientInteractionAt: new Date().toISOString()
    });
  };

  return (
    <div className="space-y-12 relative">
      <div className="absolute left-[19px] top-4 bottom-4 w-px bg-slate-100" />
      
      {/* ETAPA 1: LIBERAÇÃO TÉCNICA VITAL */}
      <StepCard 
        number={1} 
        title="Liberação Técnica Vital" 
        status={metadata?.releasedAt ? 'done' : 'active'}
        description="Analista Vital autoriza o envio do certificado para conferência do parceiro."
      >
        {!metadata?.releasedAt ? (
          isAnalyst ? (
            <button 
              onClick={() => onUpdate({ releasedAt: new Date().toISOString(), releasedBy: userName, currentStep: 2, status: QualityStatus.SENT })}
              className="w-full py-4 bg-[#081437] text-white rounded-2xl font-black text-[10px] uppercase tracking-[4px] shadow-2xl shadow-blue-900/20 hover:bg-blue-900 transition-all flex items-center justify-center gap-3 active:scale-95"
            >
              <Send size={14} className="text-blue-400" /> Autorizar Envio ao Parceiro
            </button>
          ) : (
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-center gap-3 text-slate-500">
               <Clock size={16} className="text-orange-500" />
               <p className="text-[10px] font-black uppercase tracking-widest">Aguardando Liberação da Qualidade Vital</p>
            </div>
          )
        ) : (
          <StepBadge user={metadata.releasedBy} date={metadata.releasedAt} label="Liberado para o cliente" />
        )}
      </StepCard>

      {/* ETAPA 2: CONFERÊNCIA DE RECEBIMENTO */}
      <StepCard 
        number={2} 
        title="Conferência de Recebimento" 
        status={currentStep === 2 ? 'active' : currentStep > 2 ? 'done' : 'locked'}
        description="O parceiro valida a documentação e a integridade física do material."
      >
        <div className="space-y-6">
           {currentStep === 2 ? (
             isClient ? (
               <div className="space-y-6 animate-in slide-in-from-bottom-2 duration-500">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                          <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">A) Conferência Documental</label>
                          <select 
                            className="w-full p-3 bg-white border border-slate-200 rounded-xl text-xs font-bold"
                            value={metadata?.documentalStatus || ''}
                            onChange={(e) => onUpdate({ documentalStatus: e.target.value as QualityStatus })}
                          >
                              <option value="">Selecionar...</option>
                              <option value={QualityStatus.APPROVED}>Conforme</option>
                              <option value={QualityStatus.REJECTED}>Divergente</option>
                          </select>
                      </div>
                      <div className="space-y-2">
                          <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">B) Conferência Física</label>
                          <select 
                            className="w-full p-3 bg-white border border-slate-200 rounded-xl text-xs font-bold"
                            value={metadata?.physicalStatus || ''}
                            onChange={(e) => onUpdate({ physicalStatus: e.target.value as QualityStatus })}
                          >
                              <option value="">Selecionar...</option>
                              <option value={QualityStatus.APPROVED}>Conforme</option>
                              <option value={QualityStatus.REJECTED}>Divergente</option>
                          </select>
                      </div>
                  </div>

                  <div className="space-y-2">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Observações do Recebimento</label>
                      <textarea 
                          className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium outline-none focus:bg-white"
                          placeholder="Caso haja divergência, descreva aqui..."
                          value={localObservations}
                          onChange={(e) => setLocalObservations(e.target.value)}
                      />
                  </div>

                  <button 
                    onClick={() => handleClientConferences(metadata?.documentalStatus || QualityStatus.APPROVED, metadata?.physicalStatus || QualityStatus.APPROVED)}
                    className="w-full py-4 bg-[#b23c0e] text-white rounded-2xl font-black text-[10px] uppercase tracking-[3px] shadow-xl shadow-orange-900/20"
                  >
                    Finalizar Conferência
                  </button>
               </div>
             ) : (
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-center gap-3 text-slate-500">
                    <Clock size={16} className="text-orange-500" />
                    <p className="text-[10px] font-black uppercase tracking-widest">Aguardando conferência do cliente</p>
                </div>
             )
           ) : (
             <div className="space-y-3">
                <StatusRow label="Documentação" status={metadata?.documentalStatus} />
                <StatusRow label="Material Físico" status={metadata?.physicalStatus} />
                {metadata?.clientObservations && (
                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 text-xs italic text-slate-600">
                        "{metadata.clientObservations}"
                    </div>
                )}
             </div>
           )}
        </div>
      </StepCard>

      {/* ETAPA 3: MEDIAÇÃO TÉCNICA VITAL */}
      <StepCard 
        number={3} 
        title="Mediação Técnica Vital" 
        status={currentStep === 4 ? 'active' : currentStep > 4 ? 'done' : 'locked'}
        description="Resposta da Vital para divergências apontadas no recebimento."
      >
        {currentStep === 4 ? (
          isAnalyst ? (
            <div className="space-y-4">
               <textarea 
                 placeholder="Argumentação técnica para resolver a divergência..."
                 className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium min-h-[100px] outline-none focus:ring-4 focus:ring-blue-500/10 focus:bg-white transition-all"
                 value={localRemediation}
                 onChange={e => setLocalRemediation(e.target.value)}
               />
               <button 
                 onClick={() => onUpdate({ remediationReply: localRemediation, currentStep: 5, remediatedAt: new Date().toISOString(), remediatedBy: userName })}
                 className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-[3px] shadow-xl hover:bg-blue-700 transition-all flex items-center justify-center gap-3"
               >
                 <RefreshCcw size={16} /> Enviar Parecer de Mediação
               </button>
            </div>
          ) : (
            <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl flex items-center gap-3 text-blue-700">
                <Info size={16} />
                <p className="text-[10px] font-black uppercase tracking-widest">Aguardando Parecer Técnico Vital</p>
            </div>
          )
        ) : metadata?.remediatedAt ? (
          <StepBadge user={metadata.remediatedBy} date={metadata.remediatedAt} label="Mediação técnica enviada" notes={metadata.remediationReply} />
        ) : null}
      </StepCard>

      {/* ETAPA 4: VEREDITO DO PARCEIRO */}
      <StepCard 
        number={4} 
        title="Veredito do Parceiro" 
        status={currentStep === 5 ? 'active' : currentStep > 5 ? 'done' : 'locked'}
        description="Decisão final do cliente após análise da mediação técnica."
      >
        {currentStep === 5 ? (
          isClient ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in zoom-in-95 duration-500">
               <button 
                  onClick={() => handlePartnerVerdict(QualityStatus.APPROVED)} 
                  className="py-4 bg-emerald-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-[2px] shadow-lg hover:bg-emerald-700 transition-all"
               >
                  Aceitar Mediação
               </button>
               <button 
                  onClick={() => handlePartnerVerdict(QualityStatus.REJECTED)} 
                  className="py-4 bg-red-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-[2px] shadow-lg hover:bg-red-700 transition-all"
               >
                  Manter Rejeição
               </button>
            </div>
          ) : (
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-center gap-3 text-slate-500">
                <Clock size={16} className="text-orange-500" />
                <p className="text-[10px] font-black uppercase tracking-widest">Aguardando veredito final do parceiro</p>
            </div>
          )
        ) : metadata?.finalVerdictAt ? (
           <StepBadge 
              user={clientName || 'Parceiro'} 
              date={metadata.finalVerdictAt} 
              label="Veredito Final" 
              notes={metadata.finalPartnerVerdict === QualityStatus.APPROVED ? "Mediação aceita pelo parceiro." : "O parceiro manteve a divergência técnica."}
              isPositive={metadata.finalPartnerVerdict === QualityStatus.APPROVED}
            />
        ) : null}
      </StepCard>

      {/* ETAPA 5: CONTATO DE EMERGÊNCIA / IMPASSE TÉCNICO */}
      {currentStep === 6 && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-1000">
            <div className="bg-red-50/50 border-2 border-red-100 rounded-[2.5rem] p-10 space-y-6 relative overflow-hidden shadow-sm">
                <div className="absolute top-0 right-0 p-12 opacity-5 text-red-600 rotate-12 pointer-events-none">
                    <AlertTriangle size={140} />
                </div>
                
                <div className="flex items-center gap-5 relative z-10">
                    <div className="p-4 bg-red-600 text-white rounded-[1.4rem] shadow-xl shadow-red-500/20">
                        {isClient ? <Mail size={32} /> : <UserX size={32} />}
                    </div>
                    <div>
                        <h4 className="text-xl font-black text-red-900 uppercase tracking-tighter">
                            {isClient ? 'Ação Requerida' : 'Parecer Recusado pelo Cliente'}
                        </h4>
                        <p className="text-[10px] font-black text-red-700 uppercase tracking-[3px]">
                            {isClient ? 'Impasses na Conformidade B2B' : 'Contestação de Mediação'}
                        </p>
                    </div>
                </div>

                <div className="relative z-10 space-y-6">
                  {isClient ? (
                    <>
                      <p className="text-sm text-red-800 font-medium leading-relaxed max-w-lg">
                        O parecer técnico não foi aceito. Para garantir a continuidade operacional, entre em contato direto com nosso departamento de qualidade para escalonamento.
                      </p>
                      <a 
                          href="mailto:qualidade@acosvital.com.br"
                          className="inline-flex items-center gap-3 px-10 py-4 bg-red-600 text-white rounded-2xl font-black text-[11px] uppercase tracking-[3px] shadow-2xl shadow-red-600/30 hover:bg-red-700 transition-all active:scale-95"
                      >
                          Falar com Supervisor <RefreshCcw size={16} />
                      </a>
                    </>
                  ) : (
                    <>
                      <div className="space-y-4">
                         <p className="text-base text-red-900 font-medium leading-relaxed">
                           O parecer técnico não foi aceito pelo cliente e ele irá entrar em contato conosco.
                         </p>
                         
                         <div className="py-6 border-y border-red-100 space-y-4">
                            <div className="flex items-center gap-3">
                               <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center text-red-600 font-black text-xs">P</div>
                               <p className="text-sm font-bold text-red-900">
                                 Pessoa: <span className="font-black underline">{clientName || 'Representante'}</span>
                               </p>
                            </div>
                            <div className="flex items-center gap-3">
                               <Mail size={20} className="text-red-400" />
                               <p className="text-sm font-bold text-red-900">
                                 Email: <span className="font-black underline">{clientEmail || 'acesso@cliente.com'}</span>
                               </p>
                            </div>
                         </div>
                      </div>
                      
                      <p className="text-[11px] font-black text-red-600 uppercase tracking-[3px] text-center pt-2">
                        AGUARDANDO CONTATO ATIVO DO CLIENTE OU INTERVENÇÃO DA GERÊNCIA.
                      </p>
                    </>
                  )}
                </div>
            </div>
        </div>
      )}

      {/* STATUS FINAL: PROTOCOLO ENCERRADO */}
      {currentStep === 7 && (
        <div className="animate-in slide-in-from-bottom-4 duration-1000">
           <div className="p-8 bg-emerald-50 border-2 border-emerald-100 rounded-[2.5rem] flex items-center justify-between">
              <div className="flex items-center gap-6">
                 <div className="p-4 bg-emerald-600 text-white rounded-3xl shadow-xl">
                    <FileCheck size={32} />
                 </div>
                 <div>
                    <h4 className="text-xl font-black text-emerald-900 uppercase tracking-tight leading-none mb-1">Conformidade Ativa</h4>
                    <p className="text-[10px] font-black text-emerald-600 uppercase tracking-[4px]">Protocolo SGQ Vital Finalizado</p>
                 </div>
              </div>
              <ShieldCheck size={48} className="text-emerald-200" />
           </div>
        </div>
      )}
    </div>
  );
};

/* --- Componentes de UI Localizados (SRP) --- */

const StepCard = ({ number, title, status, description, children }: any) => {
  const isActive = status === 'active';
  const isDone = status === 'done';
  const isLocked = status === 'locked';

  return (
    <div className={`relative pl-14 transition-all duration-700 ${isLocked ? 'opacity-30 blur-[0.5px] grayscale pointer-events-none' : 'opacity-100'}`}>
      <div className={`absolute left-0 top-0 w-10 h-10 rounded-2xl flex items-center justify-center font-black text-xs border-2 z-10 transition-all ${
        isActive ? 'bg-[#b23c0e] border-[#b23c0e] text-white scale-110 shadow-2xl shadow-orange-500/20' :
        isDone ? 'bg-emerald-50 border-emerald-500 text-white' :
        'bg-white border-slate-200 text-slate-300'
      }`}>
        {isDone ? <Check size={18} strokeWidth={4} /> : number}
      </div>

      <div className="space-y-4">
         <div className="space-y-1">
            <h3 className={`text-[11px] font-black uppercase tracking-[4px] ${isActive ? 'text-[#b23c0e]' : isDone ? 'text-emerald-700' : 'text-slate-400'}`}>
              {title}
            </h3>
            <p className="text-xs text-slate-500 font-medium leading-relaxed">{description}</p>
         </div>
         <div className="animate-in slide-in-from-bottom-2 duration-500">
            {children}
         </div>
      </div>
    </div>
  );
};

const StepBadge = ({ user, date, label, notes, isPositive }: any) => (
  <div className={`border rounded-3xl p-5 flex flex-col gap-3 ${isPositive === false ? 'bg-red-50 border-red-100' : isPositive === true ? 'bg-emerald-50 border-emerald-100' : 'bg-slate-50 border-slate-100'}`}>
     <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
           <div className="w-8 h-8 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-[10px] font-black text-slate-700 shadow-sm">{user?.charAt(0) || 'P'}</div>
           <div>
              <p className="text-[10px] font-black text-slate-800 uppercase tracking-widest">{user || 'Parceiro'}</p>
              <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">{label}</p>
           </div>
        </div>
        <span className="text-[9px] font-mono text-slate-400">{date ? new Date(date).toLocaleDateString() : '--'}</span>
     </div>
     {notes && (
       <p className={`text-xs italic font-medium leading-relaxed p-4 rounded-2xl border ${isPositive === false ? 'bg-white/80 text-red-700 border-red-100' : isPositive === true ? 'bg-white/80 text-emerald-700 border-emerald-100' : 'bg-white/50 text-slate-600 border-slate-100'}`}>"{notes}"</p>
     )}
  </div>
);

const StatusRow = ({ label, status }: { label: string, status?: QualityStatus }) => (
    <div className="flex items-center justify-between p-3 bg-white border border-slate-100 rounded-xl">
        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{label}</span>
        <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase border ${
            status === QualityStatus.APPROVED ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 
            status === QualityStatus.REJECTED ? 'bg-red-50 text-red-600 border-red-100' :
            'bg-slate-50 text-slate-400 border-slate-100'
        }`}>
            {status || 'Pendente'}
        </span>
    </div>
);
