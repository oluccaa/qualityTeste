
import React from 'react';
import { Layout } from '../../components/layout/MainLayout.tsx';
import { FolderTree, Database, ShieldCheck } from 'lucide-react';
import { FileExplorerView } from '../../components/features/quality/views/FileExplorerView.tsx';

const QualityExplorer: React.FC = () => {
  return (
    <Layout title="Cloud Industrial Aços Vital">
      <div className="flex flex-col h-[calc(100vh-140px)] animate-in fade-in duration-700">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0 mb-6">
            <div className="flex items-center gap-4">
                <div className="p-3 bg-white text-[#b23c0e] rounded-2xl shadow-sm border border-slate-200">
                    <FolderTree size={24} />
                </div>
                <div>
                    <h1 className="text-2xl font-black text-slate-800 tracking-tight uppercase">Repositório Global</h1>
                    <p className="text-slate-500 text-sm font-medium">Navegue pela infraestrutura técnica da Vital.</p>
                </div>
            </div>
            <div className="flex items-center gap-4">
                <div className="hidden lg:flex items-center gap-3 px-5 py-2.5 bg-[#081437] text-white rounded-xl shadow-lg border border-white/10">
                    <ShieldCheck size={18} className="text-emerald-500" />
                    <span className="text-[10px] font-black uppercase tracking-[2px]">Ambiente Criptografado</span>
                </div>
            </div>
        </header>

        {/* Container do Explorador preenchendo a altura disponível */}
        <div className="flex-1 min-h-0 relative">
            <FileExplorerView orgId="global" />
        </div>
      </div>
    </Layout>
  );
};

export default QualityExplorer;
