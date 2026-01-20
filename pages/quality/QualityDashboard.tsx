
import React from 'react';
import { Layout } from '../../components/layout/MainLayout.tsx';
import { QualityOverview } from '../../components/features/quality/views/QualityOverview.tsx';
import { useTranslation } from 'react-i18next';
import { Zap, ShieldCheck } from 'lucide-react';

const QualityDashboard: React.FC = () => {
  const { t } = useTranslation();

  return (
    <Layout title="Centro de Operações Técnicas">
      <div className="space-y-8 animate-in fade-in duration-700">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white text-blue-600 rounded-2xl shadow-sm border border-slate-200">
                  <Zap size={24} />
              </div>
              <div>
                  <h1 className="text-2xl font-black text-slate-800 tracking-tight uppercase">Painel de Comando Vital</h1>
                  <p className="text-slate-500 text-sm font-medium tracking-tight italic">Operando sob protocolo Aços Vital SGQ v4.0.</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2 px-6 py-3 bg-emerald-50 text-emerald-700 rounded-2xl border border-emerald-100 shadow-sm shrink-0">
               <ShieldCheck size={20} />
               <span className="text-[10px] font-black uppercase tracking-widest">Sessão Técnica Autorizada</span>
            </div>
        </header>
        
        <QualityOverview />
      </div>
    </Layout>
  );
};

export default QualityDashboard;
