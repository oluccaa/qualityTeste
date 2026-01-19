import React from 'react';
import { Layout } from '../../components/layout/MainLayout.tsx';
import { QualityPortfolioView } from '../../components/features/quality/views/QualityPortfolioView.tsx';
import { ClientList } from '../../components/features/quality/views/ClientList.tsx';
import { FileExplorerView } from '../../components/features/quality/views/FileExplorerView.tsx';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Building2, ArrowLeft, ScanEye, Briefcase } from 'lucide-react';

const QualityPortfolio: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const orgId = searchParams.get('orgId');

  return (
    <Layout title={orgId ? "Inspeção de Portfólio" : "Gestão de Carteira"}>
      <div className="space-y-6 animate-in fade-in duration-500">
        {!orgId ? (
          <>
            <header className="flex items-center gap-4 mb-8">
                <div className="p-3 bg-[#b23c0e] text-white rounded-2xl shadow-lg">
                    <Briefcase size={24} />
                </div>
                <div>
                    <h1 className="text-2xl font-black text-slate-800 tracking-tight uppercase">Carteira de Clientes</h1>
                    <p className="text-slate-500 text-sm font-medium">Selecione uma organização parceira para auditar ativos e laudos técnicos.</p>
                </div>
            </header>
            <QualityPortfolioView />
          </>
        ) : (
          <div className="space-y-6">
            <header className="flex items-center gap-4 mb-4">
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
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[4px]">Analisando integridade de dados do parceiro</p>
                </div>
            </header>
            
            <FileExplorerView orgId={orgId} />
          </div>
        )}
      </div>
    </Layout>
  );
};

export default QualityPortfolio;