
import React from 'react';
import { Layout } from '../../components/layout/MainLayout.tsx';
import { QualityPortfolioView } from '../../components/features/quality/views/QualityPortfolioView.tsx';
import { FileExplorerView } from '../../components/features/quality/views/FileExplorerView.tsx';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, ScanEye, Briefcase } from 'lucide-react';

const QualityPortfolio: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const orgId = searchParams.get('orgId');

  return (
    <Layout title={orgId ? "Inspeção de Portfólio" : "Gestão de Carteira"}>
      <div className="flex flex-col h-full animate-in fade-in duration-500 overflow-hidden">
        {!orgId ? (
          <div className="flex flex-col h-full">
            <header className="flex items-center gap-4 mb-6 shrink-0">
                <div className="p-3 bg-[#b23c0e] text-white rounded-2xl shadow-lg">
                    <Briefcase size={24} />
                </div>
                <div>
                    <h1 className="text-2xl font-black text-slate-800 tracking-tight uppercase">Carteira de Clientes</h1>
                    <p className="text-slate-500 text-sm font-medium">Auditoria de ativos e laudos técnicos.</p>
                </div>
            </header>
            <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar">
              <QualityPortfolioView />
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
                <div className="p-3 bg-blue-600 text-white rounded-2xl shadow-lg">
                    <ScanEye size={20} />
                </div>
                <div>
                    <h1 className="text-xl font-black text-slate-800 uppercase tracking-tight">Cofre Organizacional</h1>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[4px]">Analisando integridade de dados</p>
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
