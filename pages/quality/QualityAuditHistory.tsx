
import React from 'react';
import { Layout } from '../../components/layout/MainLayout.tsx';
import { QualityAuditLog } from '../../components/features/quality/views/QualityAuditLog.tsx';
import { History, ShieldCheck } from 'lucide-react';

const QualityAuditHistory: React.FC = () => {
  return (
    <Layout title="Logs de Auditoria B2B">
      <div className="space-y-6 animate-in fade-in duration-500">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div className="flex items-center gap-4">
                <div className="p-3 bg-white text-slate-700 rounded-2xl shadow-sm border border-slate-200">
                    <History size={24} />
                </div>
                <div>
                    <h1 className="text-2xl font-black text-slate-800 tracking-tight uppercase">Histórico Técnico</h1>
                    <p className="text-slate-500 text-sm font-medium">Rastreabilidade forense de todas as aprovações e recusas de certificados.</p>
                </div>
            </div>
            <div className="px-6 py-2.5 bg-blue-50 text-blue-700 border border-blue-100 rounded-xl flex items-center gap-3">
                <ShieldCheck size={18} />
                <span className="text-[10px] font-black uppercase tracking-widest text-blue-900">Ledger Inviolável</span>
            </div>
        </header>
        <QualityAuditLog />
      </div>
    </Layout>
  );
};

export default QualityAuditHistory;
