
import React, { useState } from 'react';
import { Layout } from '../../components/layout/MainLayout.tsx';
import { ClientList } from '../../components/features/quality/views/ClientList.tsx';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, ScanEye, Building2, UserPlus } from 'lucide-react';
import { FileExplorerView } from '../../components/features/quality/views/FileExplorerView.tsx';
import { ClientModal } from '../../components/features/admin/components/AdminModals.tsx';
import { useQualityClientManagement } from '../../components/features/quality/hooks/useQualityClientManagement.ts';
import { ProcessingOverlay } from '../../components/features/quality/components/ViewStates.tsx';

const QualityPortfolio: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const orgId = searchParams.get('orgId');
  
  const {
    isProcessing,
    qualityAnalysts,
    clientModal
  } = useQualityClientManagement(0);

  return (
    <Layout title={orgId ? "Explorar Cliente" : "Gestão de Clientes"}>
      <div className="flex flex-col h-full animate-in fade-in duration-500 overflow-hidden">
        {isProcessing && <ProcessingOverlay message="Sincronizando protocolos..." />}
        
        <ClientModal
          isOpen={clientModal.isOpen}
          onClose={() => clientModal.setOpen(false)}
          onSave={clientModal.save}
          editingClient={clientModal.editing}
          clientFormData={clientModal.data}
          setClientFormData={clientModal.setData}
          qualityAnalysts={qualityAnalysts}
          requiresConfirmation={true}
        />

        {!orgId ? (
          <div className="flex flex-col h-full space-y-6">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-white text-[#b23c0e] rounded-2xl shadow-sm border border-slate-200">
                        <Building2 size={24} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black text-slate-800 tracking-tight uppercase">Base de Parceiros</h1>
                        <p className="text-slate-500 text-sm font-medium">Gestão cadastral e níveis de serviço organizacional.</p>
                    </div>
                </div>
                <button 
                  onClick={() => clientModal.open()}
                  className="bg-[#b23c0e] hover:bg-[#8a2f0b] text-white px-8 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-[2px] flex items-center gap-3 shadow-xl active:scale-95 transition-all"
                >
                  <UserPlus size={18} /> Novo Cadastro
                </button>
            </header>

            <div className="flex-1 min-h-0">
              <ClientList onSelectClient={(c) => navigate(`/quality/portfolio?orgId=${c.id}`)} />
            </div>
          </div>
        ) : (
          <div className="flex flex-col h-full">
            <header className="flex items-center gap-4 mb-4 shrink-0">
                <button 
                  onClick={() => navigate('/quality/portfolio')}
                  className="p-3 bg-white border border-slate-200 rounded-2xl hover:text-[#b23c0e] transition-all shadow-sm group"
                >
                  <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
                </button>
                <div className="p-3 bg-white text-[#b23c0e] rounded-2xl shadow-sm border border-slate-200">
                    <ScanEye size={20} />
                </div>
                <div>
                    <h1 className="text-xl font-black text-slate-800 uppercase tracking-tight">Repositório B2B</h1>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[4px]">Auditando registros organizacionais</p>
                </div>
            </header>
            
            <div className="flex-1 min-h-0">
              <FileExplorerView orgId={orgId} />
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default QualityPortfolio;
