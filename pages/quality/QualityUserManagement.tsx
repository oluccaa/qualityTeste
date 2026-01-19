import React, { useState } from 'react';
import { Layout } from '../../components/layout/MainLayout.tsx';
import { AdminUsers } from '../../components/features/admin/views/AdminUsers.tsx';
import { UserCheck, Loader2, Info } from 'lucide-react';
import { UserRole } from '../../types/index.ts';

const QualityUserManagement: React.FC = () => {
  const [isSaving, setIsSaving] = useState(false);

  return (
    <Layout title="Gestão de Parceiros">
      <div className="flex flex-col h-[calc(100vh-140px)] animate-in fade-in duration-700">
        {isSaving && (
          <div className="fixed top-24 right-1/2 translate-x-1/2 z-[110] bg-[#081437] text-white px-6 py-2.5 rounded-full shadow-2xl flex items-center gap-3 text-[10px] font-black uppercase tracking-widest animate-in fade-in duration-300">
            <Loader2 size={14} className="animate-spin text-blue-400" /> Sincronizando...
          </div>
        )}

        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 shrink-0">
            <div className="flex items-center gap-4">
                <div className="p-3 bg-[#081437] text-blue-400 rounded-2xl shadow-xl">
                    <UserCheck size={24} />
                </div>
                <div>
                    <h1 className="text-2xl font-black text-slate-800 tracking-tight uppercase">Credenciais de Clientes</h1>
                    <p className="text-slate-500 text-sm font-medium">Gerencie o acesso dos técnicos e compradores das empresas parceiras.</p>
                </div>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-slate-100 rounded-xl text-slate-500 border border-slate-200">
                <Info size={14} />
                <span className="text-[9px] font-black uppercase tracking-[2px]">Apenas Perfis CLIENT</span>
            </div>
        </header>

        <div className="flex-1 min-h-0 flex flex-col">
            <AdminUsers setIsSaving={setIsSaving} restrictedToRole={UserRole.CLIENT} />
        </div>
      </div>
    </Layout>
  );
};

export default QualityUserManagement;