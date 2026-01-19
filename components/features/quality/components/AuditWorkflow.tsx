
import React, { useState } from 'react';
import { 
  Check, Send, RefreshCcw, ShieldCheck, 
  AlertTriangle, Plus, X, MessageSquare, Clock, FileCheck
} from 'lucide-react';
import { SteelBatchMetadata, QualityStatus, UserRole } from '../../../../types/index.ts';

interface AuditWorkflowProps {
  metadata: SteelBatchMetadata | undefined;
  userRole: UserRole;
  userName: string;
  fileId: string;
  onUpdate: (updatedMetadata: Partial<SteelBatchMetadata>) => Promise<void>;
}

export const AuditWorkflow: React.FC<AuditWorkflowProps> = ({ metadata, userRole, userName, onUpdate }) => {
  const [newFlag, setNewFlag] = useState('');
  const [customFlags, setCustomFlags] = useState<string[]>(metadata?.customFlags || [
    "Divergência Química", "Dureza Fora de Norma", "Erro de Identificação", "Laudo Ilegível"
  ]);

  const isAnalyst = userRole === UserRole.QUALITY || userRole === UserRole.ADMIN;
  const isClient = userRole === UserRole.CLIENT;
  const currentStep = metadata?.currentStep || 1;

  const handleAddFlag = () => {
    if (!newFlag.trim()) return;
    const updated = [...customFlags, newFlag.trim()];
    setCustomFlags(updated);
    onUpdate({ customFlags: updated });
    setNewFlag('');
  };

  const toggleClientFlag = (flag: string) => {
    if (!isClient || currentStep !== 2) return;
    const currentFlags = metadata?.documentalFlags || [];
    const updated = currentFlags.includes(flag) 
      ? currentFlags.filter(f => f !== flag) 
      : [...currentFlags, flag];
    onUpdate({ documentalFlags: updated });
  };

  return (
    <div className="space-y-12 relative">
      <div className="absolute left-[19px] top-4 bottom-4 w-px bg-slate-100" />
      
      {/* STEP 1: PREPARAÇÃO VITAL */}
      <StepCard 
        number={1} 
        title="Liberação Técnica Vital" 
        status={metadata?.releasedAt ? 'done' : 'active'}
        description="Verificação primária de integridade dos dados metalúrgicos."
      >
        {!metadata?.releasedAt ? (
          isAnalyst ? (
            <button 
              onClick={() => onUpdate({ releasedAt: new Date().toISOString(), releasedBy: userName, currentStep: 2, status: QualityStatus.SENT })}
              className="w-full py-4 bg-[#081437] text-white rounded-2xl font-black text-[10px] uppercase tracking-[4px] shadow-2xl shadow-blue-900/20 hover:bg-blue-900 transition-all flex items-center justify-center gap-3 active:scale-95"
            >
              <Send size={14} className="text-blue-400" /> Autorizar Auditoria B2B
            </button>
          ) : (
            <div className="flex items-center gap-3 text-slate-400 italic text-xs py-2">
                <Clock size={14} /> Aguardando liberação da Aços Vital...
            </div>
          )
        ) : (
          <StepBadge user={metadata.releasedBy} date={metadata.releasedAt} />
        )}
      </StepCard>

      {/* STEP 2: AUDITORIA DO CLIENTE */}
      <StepCard 
        number={2} 
        title="Auditoria de Recebimento" 
        status={currentStep === 2 ? 'active' : currentStep > 2 ? 'done' : 'locked'}
        description="O parceiro valida o certificado contra o material físico entregue."
      >
        <div className="space-y-6">
           <div className="space-y-3">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                Motivos de Rejeição (Divergências)
              </label>
              <div className="flex flex-wrap gap-2">
                {customFlags.map(f => (
                  <button 
                    key={f}
                    onClick={() => toggleClientFlag(f)}
                    disabled={currentStep !== 2 || !isClient}
                    className={`px-4 py-2 rounded-xl text-[10px] font-bold border transition-all ${
                      metadata?.documentalFlags?.includes(f) 
                        ? 'bg-red-50 border-red-200 text-red-600 shadow-sm' 
                        : 'bg-white border-slate-100 text-slate-400 hover:border-slate-200'
                    }`}
                  >
                    {f}
                  </button>
                ))}
                {isAnalyst && (
                  <div className="flex items-center gap-2">
                    <input 
                      value={newFlag}
                      onChange={e => setNewFlag(e.target.value)}
                      placeholder="Nova Flag..."
                      className="px-3 py-1.5 bg-slate-50 border border-dashed border-slate-200 rounded-lg text-[10px] outline-none w-28 focus:bg-white focus:border-blue-400 transition-all"
                    />
                    <button onClick={handleAddFlag} className="p-1.5 bg-white border border-slate-200 rounded-lg text-slate-400 hover:text-blue-500 transition-colors"><Plus size={14}/></button>
                  </div>
                )}
              </div>
           </div>

           {isClient && currentStep === 2 && (
             <div className="flex gap-4 pt-2">
                <button 
                  onClick={() => onUpdate({ currentStep: 5, status: QualityStatus.APPROVED, finalVerdictAt: new Date().toISOString() })}
                  className="flex-1 py-4 bg-emerald-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-[2px] shadow-lg hover:bg-emerald-700 transition-all"
                >
                  Conforme (Aceitar)
                </button>
                <button 
                  onClick={() => onUpdate({ currentStep: 3, status: QualityStatus.REJECTED })}
                  className="px-8 py-4 bg-red-50 text-red-600 rounded-2xl font-black text-[10px] uppercase tracking-[2px] border border-red-100 hover:bg-red-100 transition-all"
                >
                  Rejeitar / Contestar
                </button>
             </div>
           )}
        </div>
      </StepCard>

      {/* STEP 3: CONTESTAÇÃO TÉCNICA */}
      <StepCard 
        number={3} 
        title="Mediação Técnica Vital" 
        status={currentStep === 3 ? 'active' : currentStep > 3 ? 'done' : 'locked'}
        description="Resposta técnica da Vital às divergências apontadas pelo parceiro."
      >
        {currentStep === 3 ? (
          <div className="space-y-4">
             <textarea 
               placeholder="Descreva os argumentos técnicos para mediação..."
               className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium min-h-[100px] outline-none focus:ring-4 focus:ring-blue-500/10 focus:bg-white transition-all"
               onChange={e => onUpdate({ contestObservations: e.target.value })}
             />
             <button 
               onClick={() => onUpdate({ currentStep: 4, isContested: true, contestedAt: new Date().toISOString(), contestedBy: userName })}
               className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-[3px] shadow-xl hover:bg-blue-700 transition-all flex items-center justify-center gap-3"
             >
               <RefreshCcw size={16} /> Enviar Parecer de Mediação
             </button>
          </div>
        ) : metadata?.contestedAt ? (
          <StepBadge user={metadata.contestedBy} date={metadata.contestedAt} notes={metadata.contestObservations} />
        ) : null}
      </StepCard>

      {/* STEP 4: VEREDITO CLIENTE */}
      <StepCard 
        number={4} 
        title="Veredito do Parceiro" 
        status={currentStep === 4 ? 'active' : currentStep > 4 ? 'done' : 'locked'}
        description="Decisão final do cliente após avaliação dos argumentos técnicos."
      >
        {isClient && currentStep === 4 ? (
          <div className="grid grid-cols-2 gap-4">
             <button onClick={() => onUpdate({ currentStep: 5, status: QualityStatus.APPROVED, finalClientVerdict: QualityStatus.APPROVED, finalVerdictAt: new Date().toISOString() })} className="py-4 bg-emerald-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-[2px] shadow-lg">Aceitar Material</button>
             <button onClick={() => onUpdate({ currentStep: 5, status: QualityStatus.REJECTED, finalClientVerdict: QualityStatus.REJECTED, finalVerdictAt: new Date().toISOString() })} className="py-4 bg-red-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-[2px] shadow-lg">Manter Rejeição</button>
          </div>
        ) : null}
      </StepCard>

      {/* STEP 5: ENCERRAMENTO */}
      <StepCard 
        number={5} 
        title="Protocolo Finalizado" 
        status={currentStep === 5 ? 'done' : 'locked'}
        description="Ciclo de vida do certificado técnico concluído."
      >
        {currentStep === 5 && (
           <div className={`p-6 rounded-3xl border-2 flex items-center justify-between ${metadata?.status === 'APPROVED' ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-red-50 border-red-100 text-red-700'}`}>
              <div className="flex items-center gap-5">
                 <div className={`p-3 rounded-2xl ${metadata?.status === 'APPROVED' ? 'bg-emerald-600' : 'bg-red-600'} text-white shadow-xl`}>
                    {metadata?.status === 'APPROVED' ? <ShieldCheck size={24} /> : <AlertTriangle size={24} />}
                 </div>
                 <div>
                    <h4 className="font-black text-sm uppercase tracking-tight">Status: {metadata?.status}</h4>
                    <p className="text-[9px] font-bold opacity-60 uppercase tracking-widest">Encerramento: {new Date(metadata?.finalVerdictAt || '').toLocaleDateString()}</p>
                 </div>
              </div>
              <FileCheck size={24} className="opacity-20" />
           </div>
        )}
      </StepCard>
    </div>
  );
};

const StepCard = ({ number, title, status, description, children }: any) => {
  const isActive = status === 'active';
  const isDone = status === 'done';
  const isLocked = status === 'locked';

  return (
    <div className={`relative pl-14 transition-all duration-700 ${isLocked ? 'opacity-30 blur-[0.5px] grayscale' : 'opacity-100'}`}>
      <div className={`absolute left-0 top-0 w-10 h-10 rounded-2xl flex items-center justify-center font-black text-xs border-2 z-10 transition-all ${
        isActive ? 'bg-[#b23c0e] border-[#b23c0e] text-white scale-110 shadow-2xl shadow-orange-500/20' :
        isDone ? 'bg-emerald-500 border-emerald-500 text-white' :
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

const StepBadge = ({ user, date, notes }: any) => (
  <div className="bg-slate-50 border border-slate-100 rounded-3xl p-5 flex flex-col gap-3">
     <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
           <div className="w-8 h-8 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-[10px] font-black text-slate-700 shadow-sm">{user?.charAt(0) || 'S'}</div>
           <p className="text-[10px] font-black text-slate-700 uppercase tracking-widest">{user || 'Sistema'}</p>
        </div>
        <span className="text-[9px] font-mono text-slate-400">{date ? new Date(date).toLocaleDateString() : '--'}</span>
     </div>
     {notes && (
       <p className="text-xs text-slate-600 italic font-medium leading-relaxed bg-white/50 p-4 rounded-2xl border border-slate-100">"{notes}"</p>
     )}
  </div>
);
