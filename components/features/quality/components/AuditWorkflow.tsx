
import React, { useState } from 'react';
import { 
  Check, Send, RefreshCcw, ShieldCheck, 
  AlertTriangle, X, Clock, FileCheck, Mail, Info, UserX, Lock, Unlock, Loader2, Camera, FileSearch
} from 'lucide-react';
import { SteelBatchMetadata, QualityStatus, UserRole } from '../../../../types/index.ts';
import { userService, partnerService } from '../../../../lib/services/index.ts';

interface AuditWorkflowProps {
  metadata: SteelBatchMetadata | undefined;
  userRole: UserRole;
  userName: string;
  userEmail: string;
  fileId: string;
  onUpdate: (updatedMetadata: Partial<SteelBatchMetadata>) => Promise<void>;
}

export const AuditWorkflow: React.FC<AuditWorkflowProps> = ({ metadata, userRole, userName, userEmail, fileId, onUpdate }) => {
  const [localObservations, setLocalObservations] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState<{ type: 'documental' | 'physical' } | null>(null);
  const [authForm, setAuthForm] = useState({ email: '', password: '' });
  const [authError, setAuthError] = useState('');

  const isStaff = userRole === UserRole.QUALITY || userRole === UserRole.ADMIN;
  const isClient = userRole === UserRole.CLIENT;
  const currentStep = metadata?.currentStep || 1;

  const handleReopenAction = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setAuthLoading(true);
    
    try {
      const result = await userService.authenticate(authForm.email, authForm.password);
      if (result.success) {
        const update: Partial<SteelBatchMetadata> = showAuthModal?.type === 'documental' 
          ? { documentalStatus: QualityStatus.PENDING, documentalUnlockedAt: new Date().toISOString(), documentalUnlockedBy: authForm.email }
          : { physicalStatus: QualityStatus.PENDING, physicalUnlockedAt: new Date().toISOString(), physicalUnlockedBy: authForm.email };
        
        await onUpdate({ ...update, status: QualityStatus.PENDING });
        setShowAuthModal(null);
        setAuthForm({ email: '', password: '' });
      } else {
        setAuthError('Credenciais de supervisão inválidas.');
      }
    } catch {
      setAuthError('Erro na conexão com o gateway.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleConference = async (type: 'documental' | 'physical', status: QualityStatus) => {
    if (!isClient) return;

    const isDoc = type === 'documental';
    const currentDocStatus = isDoc ? status : (metadata?.documentalStatus || QualityStatus.PENDING);
    const currentPhysStatus = !isDoc ? status : (metadata?.physicalStatus || QualityStatus.PENDING);

    const isFullyApproved = currentDocStatus === QualityStatus.APPROVED && currentPhysStatus === QualityStatus.APPROVED;
    
    const baseUpdate: Partial<SteelBatchMetadata> = {
      [isDoc ? 'documentalStatus' : 'physicalStatus']: status,
      clientObservations: localObservations,
      lastClientInteractionAt: new Date().toISOString(),
      lastClientInteractionBy: `${userName} | ${userEmail}`,
    };

    if (isFullyApproved) {
      await onUpdate({ ...baseUpdate, currentStep: 7, status: QualityStatus.APPROVED });
    } else if (status === QualityStatus.REJECTED) {
      await onUpdate({ ...baseUpdate, currentStep: 4, status: QualityStatus.REJECTED });
    } else {
      await onUpdate(baseUpdate);
    }

    // Persiste no histórico imutável
    await partnerService.submitVersionedReview({
        user: { id: '', name: userName, email: userEmail, role: userRole, status: 'ACTIVE' } as any,
        file: { id: fileId, name: 'Certificado', storagePath: '' } as any,
        status: status,
        description: localObservations,
        reasonCode: isDoc ? 'DOCUMENTAL_CHECK' : 'PHYSICAL_CHECK',
        snapshotUrl: ''
    });
  };

  return (
    <div className="space-y-12 relative">
      <div className="absolute left-[19px] top-4 bottom-4 w-px bg-slate-100" />
      
      {/* ETAPA 1: LIBERAÇÃO TÉCNICA VITAL */}
      <StepCard number={1} title="Liberação Técnica Vital" status={metadata?.releasedAt ? 'done' : 'active'}>
        {!metadata?.releasedAt ? (
          isStaff ? (
            <button onClick={() => onUpdate({ releasedAt: new Date().toISOString(), releasedBy: userName, currentStep: 2, status: QualityStatus.SENT })}
              className="w-full py-4 bg-[#081437] text-white rounded-2xl font-black text-[10px] uppercase tracking-[4px] shadow-xl hover:bg-blue-900 transition-all flex items-center justify-center gap-3">
              <Send size={14} className="text-blue-400" /> Autorizar Fluxo B2B
            </button>
          ) : <WaitingBadge label="Aguardando liberação da Vital" />
        ) : <StepBadge user={metadata.releasedBy} date={metadata.releasedAt} label="Fluxo Autorizado" />}
      </StepCard>

      {/* ETAPA 2: CONFERÊNCIA DOCUMENTAL (A) */}
      <StepCard number={2} title="Conferência Documental" status={metadata?.documentalStatus === QualityStatus.APPROVED ? 'done' : metadata?.releasedAt ? 'active' : 'locked'}>
        <div className="space-y-4">
          {metadata?.documentalStatus === QualityStatus.REJECTED ? (
            <div className="space-y-4">
              <div className="p-4 bg-red-50 border border-red-100 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-3 text-red-700">
                    <AlertTriangle size={18} />
                    <p className="text-[10px] font-black uppercase">Documentação Divergente</p>
                </div>
                <button onClick={() => setShowAuthModal({ type: 'documental' })} className="px-3 py-1.5 bg-white text-slate-700 border border-slate-200 rounded-lg text-[9px] font-black uppercase hover:bg-slate-50 transition-all flex items-center gap-2">
                    <Unlock size={12} /> Reabrir com Senha
                </button>
              </div>
            </div>
          ) : (metadata?.documentalStatus === QualityStatus.APPROVED) ? (
            <StatusRow label="Status" status={QualityStatus.APPROVED} />
          ) : isClient ? (
            <ConferenceActions onSelect={(s) => handleConference('documental', s)} icon={FileSearch} />
          ) : <WaitingBadge label="Aguardando validação do parceiro" />}
        </div>
      </StepCard>

      {/* ETAPA 3: CONFERÊNCIA FÍSICA (B) */}
      <StepCard number={3} title="Conferência Física" status={metadata?.physicalStatus === QualityStatus.APPROVED ? 'done' : (metadata?.documentalStatus === QualityStatus.APPROVED || metadata?.documentalStatus === QualityStatus.REJECTED) ? 'active' : 'locked'}>
        <div className="space-y-4">
          {metadata?.physicalStatus === QualityStatus.REJECTED ? (
            <div className="p-4 bg-red-50 border border-red-100 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-3 text-red-700">
                  <Camera size={18} />
                  <p className="text-[10px] font-black uppercase">Material Divergente</p>
              </div>
              <button onClick={() => setShowAuthModal({ type: 'physical' })} className="px-3 py-1.5 bg-white text-slate-700 border border-slate-200 rounded-lg text-[9px] font-black uppercase hover:bg-slate-50 transition-all flex items-center gap-2">
                  <Unlock size={12} /> Reabrir com Senha
              </button>
            </div>
          ) : (metadata?.physicalStatus === QualityStatus.APPROVED) ? (
            <StatusRow label="Status" status={QualityStatus.APPROVED} />
          ) : isClient ? (
            <ConferenceActions onSelect={(s) => handleConference('physical', s)} icon={Camera} />
          ) : <WaitingBadge label="Aguardando inspeção física" />}
        </div>
      </StepCard>

      {/* ETAPA FINAL: CONFORMIDADE ATIVA */}
      {currentStep === 7 && (
        <div className="p-8 bg-emerald-50 border-2 border-emerald-100 rounded-[2.5rem] flex items-center justify-between animate-in zoom-in-95 duration-700">
          <div className="flex items-center gap-6">
             <div className="p-4 bg-emerald-600 text-white rounded-3xl shadow-xl"><FileCheck size={32} /></div>
             <div>
                <h4 className="text-xl font-black text-emerald-900 uppercase tracking-tight">Conformidade Ativa</h4>
                <p className="text-[10px] font-black text-emerald-600 uppercase tracking-[4px]">Lote Validado SGQ Vital</p>
             </div>
          </div>
          <ShieldCheck size={48} className="text-emerald-200" />
        </div>
      )}

      {/* MODAL DE AUTENTICAÇÃO DE SUPERVISÃO */}
      {showAuthModal && (
        <div className="fixed inset-0 z-[400] flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur-md animate-in fade-in">
          <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95">
            <div className="p-8 space-y-6">
              <div className="text-center space-y-2">
                <div className="w-16 h-16 bg-blue-50 text-[#b23c0e] rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-inner">
                    <Lock size={32} />
                </div>
                <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">Liberação de Supervisão</h3>
                <p className="text-xs text-slate-500 font-medium">Insira credenciais técnicas para reabrir a conferência {showAuthModal.type}.</p>
              </div>
              <form onSubmit={handleReopenAction} className="space-y-4">
                <input type="email" required placeholder="E-mail do Supervisor" className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-xl text-xs font-bold" value={authForm.email} onChange={e => setAuthForm({...authForm, email: e.target.value})} />
                <input type="password" required placeholder="Senha de Segurança" className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-xl text-xs font-bold" value={authForm.password} onChange={e => setAuthForm({...authForm, password: e.target.value})} />
                {authError && <p className="text-[10px] font-bold text-red-600 text-center">{authError}</p>}
                <div className="flex gap-2 pt-2">
                  <button type="button" onClick={() => setShowAuthModal(null)} className="flex-1 py-3 text-[10px] font-black uppercase text-slate-400">Cancelar</button>
                  <button type="submit" disabled={authLoading} className="flex-1 py-3 bg-[#081437] text-white rounded-xl font-black text-[10px] uppercase flex items-center justify-center gap-2">
                    {authLoading ? <Loader2 size={14} className="animate-spin" /> : <><Unlock size={14} /> Desbloquear</>}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/* --- Componentes Internos --- */

const StepCard = ({ number, title, status, children }: any) => {
  const isActive = status === 'active';
  const isDone = status === 'done';
  const isLocked = status === 'locked';

  return (
    <div className={`relative pl-14 transition-all duration-700 ${isLocked ? 'opacity-30 blur-[0.5px] grayscale pointer-events-none' : 'opacity-100'}`}>
      <div className={`absolute left-0 top-0 w-10 h-10 rounded-2xl flex items-center justify-center font-black text-xs border-2 z-10 transition-all ${
        isActive ? 'bg-[#b23c0e] border-[#b23c0e] text-white scale-110 shadow-2xl shadow-orange-500/20' :
        isDone ? 'bg-emerald-500 border-emerald-500 text-white' : 'bg-white border-slate-200 text-slate-300'
      }`}>
        {isDone ? <Check size={18} strokeWidth={4} /> : number}
      </div>
      <div className="space-y-4">
         <h3 className={`text-[11px] font-black uppercase tracking-[4px] ${isActive ? 'text-[#b23c0e]' : isDone ? 'text-emerald-700' : 'text-slate-400'}`}>{title}</h3>
         <div className="animate-in slide-in-from-bottom-2 duration-500">{children}</div>
      </div>
    </div>
  );
};

const ConferenceActions = ({ onSelect, icon: Icon }: any) => (
  <div className="grid grid-cols-2 gap-3">
    <button onClick={() => onSelect(QualityStatus.APPROVED)} className="flex items-center justify-center gap-2 py-3 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-xl font-black text-[9px] uppercase tracking-widest hover:bg-emerald-100 transition-all">
       <Icon size={14} /> Conforme
    </button>
    <button onClick={() => onSelect(QualityStatus.REJECTED)} className="flex items-center justify-center gap-2 py-3 bg-red-50 text-red-700 border border-red-100 rounded-xl font-black text-[9px] uppercase tracking-widest hover:bg-red-100 transition-all">
       <X size={14} /> Divergente
    </button>
  </div>
);

const WaitingBadge = ({ label }: { label: string }) => (
  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center gap-3 text-slate-400 italic">
     <Clock size={14} />
     <p className="text-[9px] font-bold uppercase tracking-widest">{label}</p>
  </div>
);

const StatusRow = ({ label, status }: { label: string, status?: QualityStatus }) => (
    <div className="flex items-center justify-between p-3 bg-white border border-slate-100 rounded-xl">
        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{label}</span>
        <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase border ${
            status === QualityStatus.APPROVED ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-red-50 text-red-600 border-red-100'
        }`}>{status}</span>
    </div>
);

const StepBadge = ({ user, date, label }: any) => (
  <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 flex items-center justify-between">
     <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-[10px] font-black text-slate-700">{user?.charAt(0)}</div>
        <div>
           <p className="text-[10px] font-black text-slate-800 uppercase tracking-widest">{user}</p>
           <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">{label}</p>
        </div>
     </div>
     <span className="text-[9px] font-mono text-slate-400">{new Date(date).toLocaleDateString()}</span>
  </div>
);
