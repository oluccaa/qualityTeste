
import React, { useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ClientLayout } from '../../components/layout/ClientLayout.tsx';
import ClientDashboard from '../dashboards/ClientDashboard.tsx';
import { PartnerLibraryView } from '../../components/features/partner/views/PartnerLibraryView.tsx';

const ClientPortal: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeView = searchParams.get('view') || 'home';

  const handleViewChange = useCallback((viewId: string) => {
    setSearchParams(prev => {
      prev.set('view', viewId);
      if (viewId !== 'library') prev.delete('folderId');
      return prev;
    }, { replace: true });
  }, [setSearchParams]);

  const pageTitle = activeView === 'home' ? "Portal do Parceiro" : "Biblioteca de Ativos";

  return (
    <ClientLayout 
      title={pageTitle} 
      activeView={activeView} 
      onViewChange={handleViewChange}
    >
      <main className="flex-1 flex flex-col min-h-0 animate-in fade-in slide-in-from-bottom-3 duration-700">
        {activeView === 'home' ? <ClientDashboard /> : <PartnerLibraryView />}
      </main>
    </ClientLayout>
  );
};

export default ClientPortal;
