
import React, { useState, useMemo } from 'react';
import { 
  Check, Send, ShieldCheck, 
  Clock, Lock, Unlock,
  FileText, Ruler, X, Camera,
  Key, FileWarning, Loader2, Save,
  AlertCircle, ChevronRight, FileCheck, Database,
  ArrowRight
} from 'lucide-react';
import { SteelBatchMetadata, QualityStatus, UserRole } from '../../../../types/index.ts';
import { useToast } from '../../../../context/notificationContext.tsx';

interface AuditWorkflowProps {
  metadata: SteelBatchMetadata | undefined;
  userRole: UserRole;
  userName: string;
  userEmail: string;
  fileId: string;
  onUpdate: (updatedMetadata: Partial<SteelBatchMetadata>) => Promise<void>;
}

export const AuditWorkflow: React.FC<AuditWorkflowProps> = ({ 
    metadata, userRole, userName, userEmail, fileId, onUpdate 
}) => {
  const { showToast } = useToast();
  const [isSyncing, setIsSyncing] = useState(false);
  
  const currentStep = metadata?.currentStep || 0;
  const isAnalyst = userRole === UserRole.QUALITY || userRole === UserRole.ADMIN;
  const isClient = userRole === UserRole.CLIENT;

  const handleNextStep = async (updates: Partial<SteelBatchMetadata>) => {
    setIsSyncing(true);
    try {
      await onUpdate({
        ...updates,
        lastInteractionAt: new Date().toISOString(),
        lastInteractionBy: userName
      });
      showToast("Protocolo sincronizado com sucesso.", "success");
    } catch (e) {
      showToast("Falha na sincronização do ledger.", "error");
    } finally {
      setIsSyncing(false);
    }
  };

  // 0. Portão de Iniciação
  if (currentStep === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center space-y-8 animate-in fade-in zoom-in-95 duration-700">
         <div className="w-24 h-24 bg-slate-50 rounded-[2rem] flex items-center justify-center shadow-inner border border-slate-100">
            <Database size={40} className="text-slate-300" />
         </div>
         <div className="text-center space-y-2">
            <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Auditoria Estática</h3>
            <p className="text-sm text-slate-400 font-medium max-w-xs mx-auto">Este documento ainda não possui um histórico de conferência ativa no SGQ.</p>
         </div>
         {isAnalyst ? (
            <button 
                onClick={() => handleNextStep({ currentStep: 1, status: QualityStatus.PENDING })}
                className="group relative px-10 py-5 bg-[#081437] text-white rounded-2xl font-black text-xs uppercase tracking-[4px] shadow-2xl hover:bg-blue-900 transition-all active:scale-95 overflow-hidden"
            >
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600/0 via-white/10 to-blue-600/0 -translate-x-full group-hover:animate-[shimmer_2s_infinite] pointer-events-none" />
                Iniciar Protocolo de Auditoria
            </button>
         ) : (
            <div className="px-6 py-3 bg-slate-100 rounded-xl text-[10px] font-black uppercase text-slate-400 tracking-widest border border-slate-200">
                Aguardando Inicialização Vital
            </div>
         )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-10">
      {/* Indicador de Progresso Industrial */}
      <div className="flex items-center justify-between px-2">
         {[1, 2, 3, 4].map(s => (
            <div key={s} className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-[10px] font-black border-2 transition-all ${
                    currentStep === s ? 'bg-[#b23c0e] border-[#b23c0e] text-white scale-110 shadow-lg' : 
                    currentStep > s ? 'bg-emerald-500 border-emerald-500 text-white' : 'bg-white border-slate-200 text-slate-300'
                }`}>
                    {currentStep > s ? <Check size={14} strokeWidth={4} /> : s}
                </div>
                {s < 4 && <div className={`w-8 h-0.5 rounded-full ${currentStep > s ? 'bg-emerald-500' : 'bg-slate-100'}`} />}
            </div>
         ))}
      </div>

      {/* Áreas Dinâmicas por Etapa */}
      <div className="space-y-8 min-h-[400px]">
        {currentStep === 1 && (
            <StepCard 
                title="1. Liberação Técnica Vital" 
                desc="O analista de qualidade deve validar o laudo para disponibilização ao parceiro."
                icon={ShieldCheck}
                isActive={isAnalyst}
            >
                {isAnalyst ? (
                    <button 
                        onClick={() => handleNextStep({ currentStep: 2, status: QualityStatus.SENT, releasedAt: new Date().toISOString(), releasedBy: userName })}
                        className="w-full py-5 bg-[#081437] text-white rounded-2xl font-black text-[10px] uppercase tracking-[4px] shadow-xl hover:bg-slate-800 transition-all flex items-center justify-center gap-3"
                    >
                        <Key size={16} className="text-blue-400" /> Assinar e Liberar para Cliente
                    </button>
                ) : (
                    <StatusWaiting label="Aguardando liberação do setor de qualidade Aços Vital." />
                )}
            </StepCard>
        )}

        {currentStep === 2 && (
            <StepCard 
                title="2. Conferências de Recebimento" 
                desc="Validação documental e inspeção física dos materiais recebidos."
                icon={FileText}
                isActive={isClient}
            >
                <div className="space-y-6">
                    <ReceiptSubCard 
                        title="2.A - Auditoria Documental" 
                        statusLabel="Status dos Certificados / NF"
                        value={metadata?.documentalStatus}
                        notes={metadata?.documentalNotes}
                        onAction={(status, notes) => handleNextStep({ documentalStatus: status, documentalNotes: notes })}
                        canEdit={isClient}
                        icon={FileText}
                        color="blue"
                    />
                    <ReceiptSubCard 
                        title="2.B - Auditoria Física" 
                        statusLabel="Estado Físico do Material"
                        value={metadata?.physicalStatus}
                        notes={metadata?.physicalNotes}
                        onAction={(status, notes) => handleNextStep({ physicalStatus: status, physicalNotes: notes })}
                        canEdit={isClient}
                        icon={Ruler}
                        color="orange"
                    />

                    {isClient && (
                        <button 
                            disabled={!metadata?.documentalStatus || !metadata?.physicalStatus}
                            onClick={() => {
                                const hasRejection = metadata?.documentalStatus === QualityStatus.REJECTED || metadata?.physicalStatus === QualityStatus.REJECTED;
                                handleNextStep({ currentStep: hasRejection ? 3 : 4 });
                            }}
                            className="w-full py-5 bg-emerald-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-[4px] shadow-xl hover:bg-emerald-700 transition-all disabled:opacity-30 disabled:grayscale"
                        >
                            Finalizar Ambas Conferências
                        </button>
                    )}
                </div>
            </StepCard>
        )}

        {currentStep === 3 && (
            <StepCard 
                title="3. Mediação Técnica" 
                desc="Análise Vital sobre as divergências identificadas pelo parceiro."
                icon={AlertCircle}
                isActive={isAnalyst}
            >
                <div className="p-5 bg-red-50 border border-red-100 rounded-2xl space-y-4 mb-6">
                    <div className="flex items-center gap-3 text-red-600">
                        <FileWarning size={20} />
                        <span className="text-[10px] font-black uppercase tracking-widest">Ocorrência Protocolada</span>
                    </div>
                    <p className="text-xs text-red-800 font-medium italic leading-relaxed">
                        "Documental: {metadata?.documentalNotes || 'Sem notas'}"<br/>
                        "Físico: {metadata?.physicalNotes || 'Sem notas'}"
                    </p>
                </div>

                {isAnalyst ? (
                    <div className="space-y-4">
                        <textarea 
                            className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl text-xs font-bold text-slate-800 outline-none focus:border-blue-500 transition-all min-h-[120px]"
                            placeholder="Descreva a solução técnica ou justificativa..."
                            value={metadata?.remediationReply}
                            onChange={(e) => onUpdate({ remediationReply: e.target.value })}
                        />
                        <button 
                            onClick={() => handleNextStep({ currentStep: 4, remediatedAt: new Date().toISOString(), remediatedBy: userName })}
                            className="w-full py-5 bg-[#081437] text-white rounded-2xl font-black text-[10px] uppercase tracking-[4px] shadow-xl hover:bg-slate-800 transition-all"
                        >
                            Enviar Mediação para o Parceiro
                        </button>
                    </div>
                ) : (
                    <StatusWaiting label="Aguardando resposta técnica da Aços Vital." />
                )}
            </StepCard>
        )}

        {currentStep === 4 && (
            <StepCard 
                title="4. Veredito do Parceiro" 
                desc="Aceite final do lote e encerramento do dossier eletrônico."
                icon={FileCheck}
                isActive={isClient}
            >
                {metadata?.remediationReply && (
                    <div className="p-5 bg-blue-50 border border-blue-100 rounded-2xl space-y-2 mb-6">
                        <span className="text-[9px] font-black text-blue-600 uppercase tracking-widest">Mediação Vital:</span>
                        <p className="text-xs text-blue-800 font-bold leading-relaxed">{metadata.remediationReply}</p>
                    </div>
                )}

                {isClient ? (
                    <div className="grid grid-cols-2 gap-4">
                        <button 
                            onClick={() => handleNextStep({ status: QualityStatus.APPROVED, finalPartnerVerdict: QualityStatus.APPROVED, currentStep: 7 })}
                            className="py-5 bg-emerald-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl hover:bg-emerald-700 transition-all"
                        >
                            Aceitar Material
                        </button>
                        <button 
                            onClick={() => handleNextStep({ status: QualityStatus.REJECTED, finalPartnerVerdict: QualityStatus.REJECTED, currentStep: 7 })}
                            className="py-5 bg-red-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl hover:bg-red-700 transition-all"
                        >
                            Rejeitar Final
                        </button>
                    </div>
                ) : (
                   <StatusWaiting label="Aguardando veredito final do parceiro." />
                )}
            </StepCard>
        )}

        {currentStep === 7 && (
            <div className="flex flex-col items-center justify-center space-y-6 py-12 animate-in fade-in duration-700">
                <div className={`w-20 h-20 rounded-[2rem] flex items-center justify-center shadow-xl ${
                    metadata?.status === QualityStatus.APPROVED ? 'bg-emerald-500' : 'bg-red-600'
                } text-white`}>
                    <ShieldCheck size={40} />
                </div>
                <div className="text-center">
                    <h4 className="text-lg font-black text-slate-800 uppercase tracking-tight">Protocolo Encerrado</h4>
                    <p className={`text-[10px] font-black uppercase tracking-widest mt-1 ${
                        metadata?.status === QualityStatus.APPROVED ? 'text-emerald-600' : 'text-red-600'
                    }`}>
                        Ativo com Veredito de {metadata?.status}
                    </p>
                </div>
                <div className="w-full bg-slate-50 border border-slate-100 p-6 rounded-3xl space-y-3">
                    <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        <span>Encerrado em</span>
                        <span>{new Date(metadata?.lastInteractionAt || '').toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        <span>Responsável</span>
                        <span>{metadata?.lastInteractionBy}</span>
                    </div>
                </div>
            </div>
        )}
      </div>

      {isSyncing && (
        <div className="fixed bottom-24 right-12 bg-[#081437] text-blue-400 px-4 py-2 rounded-full shadow-2xl flex items-center gap-3 text-[9px] font-black uppercase tracking-widest animate-in fade-in">
           <Loader2 size={12} className="animate-spin" /> Persistindo Alterações...
        </div>
      )}
    </div>
  );
};

/* --- Componentes Internos de UI (SRP) --- */

const StepCard = ({ title, desc, icon: Icon, children, isActive }: any) => (
  <div className={`space-y-6 animate-in slide-in-from-right-4 duration-500 ${!isActive ? 'opacity-60 grayscale-[0.5]' : ''}`}>
    <div className="flex items-center gap-4">
        <div className="p-3 bg-slate-100 text-[#081437] rounded-xl"><Icon size={24} /></div>
        <div>
            <h4 className="text-sm font-black text-[#081437] uppercase tracking-[3px] leading-tight">{title}</h4>
            <p className="text-[10px] font-medium text-slate-400 mt-1 leading-relaxed">{desc}</p>
        </div>
    </div>
    <div className="bg-white/50 rounded-[2rem] border border-slate-200/50 p-1 transition-all">
        <div className="bg-white rounded-[1.8rem] border border-slate-100 p-8 shadow-sm">
            {children}
        </div>
    </div>
  </div>
);

const ReceiptSubCard = ({ title, statusLabel, value, notes, onAction, canEdit, icon: Icon, color }: any) => {
    const [localNotes, setLocalNotes] = useState(notes || '');
    const colorClasses = color === 'blue' ? 'bg-blue-50 border-blue-100 text-blue-600' : 'bg-orange-50 border-orange-100 text-orange-600';

    return (
        <div className="bg-slate-50/50 border border-slate-100 rounded-3xl p-6 space-y-5">
            <div className="flex items-center gap-4">
                <div className={`p-2 rounded-xl ${colorClasses}`}><Icon size={18} /></div>
                <h5 className="text-[11px] font-black text-slate-800 uppercase tracking-widest">{title}</h5>
            </div>

            <div className="space-y-4">
                <div className="space-y-2">
                    <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest ml-1">{statusLabel}</label>
                    <div className="flex gap-2">
                        {([QualityStatus.APPROVED, QualityStatus.REJECTED] as const).map(s => (
                            <button 
                                key={s}
                                disabled={!canEdit}
                                onClick={() => onAction(s, localNotes)}
                                className={`flex-1 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${
                                    value === s 
                                    ? (s === QualityStatus.APPROVED ? 'bg-emerald-600 text-white shadow-lg' : 'bg-red-600 text-white shadow-lg') 
                                    : 'bg-white border border-slate-200 text-slate-400 hover:border-slate-400'
                                }`}
                            >
                                {s === QualityStatus.APPROVED ? 'Conforme' : 'Não Conforme'}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest ml-1">Observações Técnicas</label>
                    <textarea 
                        disabled={!canEdit}
                        className="w-full p-4 bg-white border border-slate-200 rounded-2xl text-[11px] font-bold text-slate-800 outline-none focus:border-blue-500 transition-all min-h-[80px] resize-none"
                        placeholder="Descreva detalhes ou anomalias..."
                        value={localNotes}
                        onChange={e => setLocalNotes(e.target.value)}
                        onBlur={() => value && onAction(value, localNotes)}
                    />
                </div>
            </div>
        </div>
    );
};

const StatusWaiting = ({ label }: { label: string }) => (
    <div className="p-8 bg-slate-50 border border-dashed border-slate-200 rounded-3xl flex flex-col items-center justify-center text-center space-y-4">
        <div className="relative">
            <Clock size={32} className="text-slate-300" />
            <div className="absolute inset-0 bg-blue-500/10 blur-xl rounded-full" />
        </div>
        <p className="text-xs font-black text-slate-400 uppercase tracking-widest leading-loose px-4">{label}</p>
    </div>
);
