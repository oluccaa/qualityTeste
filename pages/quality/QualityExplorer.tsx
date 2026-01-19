import React from 'react';
import { Layout } from '../../components/layout/MainLayout.tsx';
import { FolderTree, Info, Database } from 'lucide-react';
import { FileExplorerView } from '../../components/features/quality/views/FileExplorerView.tsx';

const QualityExplorer: React.FC = () => {
  return (
    <Layout title="Cloud Industrial Aços Vital">
      <div className="space-y-6 animate-in fade-in duration-700 h-[calc(100vh-180px)] flex flex-col">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0 mb-4">
            <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-600 text-white rounded-2xl shadow-xl">
                    <FolderTree size={24} />
                </div>
                <div>
                    <h1 className="text-2xl font-black text-slate-800 tracking-tight uppercase">Repositório Global</h1>
                    <p className="text-slate-500 text-sm font-medium">Navegue por toda a infraestrutura de certificados e documentação técnica da Vital.</p>
                </div>
            </div>
            <div className="flex items-center gap-4">
                <div className="hidden lg:flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-xl shadow-lg border border-white/5">
                    <Database size={16} className="text-blue-400" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Sincronizado com Cluster</span>
                </div>
            </div>
        </header>

        <div className="flex-1 min-h-0 bg-white rounded-3xl border border-slate-200 shadow-inner overflow-hidden">
            <FileExplorerView orgId="global" />
        </div>
      </div>
    </Layout>
  );
};

export default QualityExplorer;