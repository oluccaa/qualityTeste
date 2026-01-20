
import React, { Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Loader2, RefreshCw } from 'lucide-react';

import { AuthMiddleware } from './middlewares/AuthMiddleware.tsx';
import { RoleMiddleware } from './middlewares/RoleMiddleware.tsx';
import { MaintenanceMiddleware } from './middlewares/MaintenanceMiddleware.tsx';
import { useAuth } from './context/authContext.tsx';
import { UserRole, normalizeRole } from './types/index.ts';

// --- LAZY PAGES ---
const ClientLoginPage = React.lazy(() => import('./pages/auth/ClientLoginPage.tsx'));
const StaffLoginPage = React.lazy(() => import('./pages/auth/StaffLoginPage.tsx'));
const AdminDashboard = React.lazy(() => import('./pages/admin/AdminDashboard.tsx'));
const AdminConsole = React.lazy(() => import('./pages/admin/AdminConsole.tsx'));
const QualityDashboard = React.lazy(() => import('./pages/quality/QualityDashboard.tsx'));
const QualityPortfolio = React.lazy(() => import('./pages/quality/QualityPortfolio.tsx'));
const QualityMonitor = React.lazy(() => import('./pages/quality/QualityMonitor.tsx'));
const QualityAuditHistory = React.lazy(() => import('./pages/quality/QualityAuditHistory.tsx'));
const QualityUserManagement = React.lazy(() => import('./pages/quality/QualityUserManagement.tsx'));
const QualityExplorer = React.lazy(() => import('./pages/quality/QualityExplorer.tsx'));
const FileInspection = React.lazy(() => import('./components/features/quality/views/FileInspection.tsx').then(m => ({ default: m.FileInspection })));
const FilePreviewPage = React.lazy(() => import('./pages/shared/FilePreviewPage.tsx'));
const ClientPortal = React.lazy(() => import('./pages/client/ClientPortal.tsx'));
const SettingsPage = React.lazy(() => import('./pages/shared/SettingsPage.tsx'));
const NotFoundPage = React.lazy(() => import('./pages/shared/NotFoundPage.tsx'));

const PageLoader = ({ message = "Carregando...", onRetry }: { message?: string; onRetry?: () => void }) => (
  <div className="h-screen w-screen bg-[#132659] flex flex-col items-center justify-center text-white font-sans">
      <div className="relative mb-8">
        <Loader2 size={48} className="animate-spin text-blue-500" />
        <div className="absolute inset-0 bg-blue-500/20 blur-2xl rounded-full animate-pulse" />
      </div>
      <p className="text-[10px] font-black text-slate-400 tracking-[6px] uppercase animate-pulse mb-4 text-center px-6">{message}</p>
      {onRetry && (
        <button onClick={onRetry} className="flex items-center gap-2 px-6 py-3 bg-white text-[#132659] rounded-xl text-xs font-black uppercase tracking-widest hover:bg-slate-200 transition-all active:scale-95 shadow-lg">
          <RefreshCw size={16} /> Tentar Novamente
        </button>
      )}
  </div>
);

const InitialAuthRedirect = () => {
    const { user, isLoading, error, isInitialSyncComplete, retryInitialSync } = useAuth();
    if (isLoading || !isInitialSyncComplete) return <PageLoader message="Sincronizando Protocolos" />;
    if (error) return <PageLoader message="Falha na Sincronização" onRetry={retryInitialSync} />;
    if (user) {
        const role = normalizeRole(user.role);
        if (role === UserRole.ADMIN) return <Navigate to="/admin/dashboard" replace />;
        if (role === UserRole.QUALITY) return <Navigate to="/quality/dashboard" replace />;
        if (role === UserRole.CLIENT) return <Navigate to="/client/portal" replace />;
    }
    return <Navigate to="/login" replace />;
};

export const AppRoutes: React.FC = () => {
  return (
    <Suspense fallback={<PageLoader message="Preparando Interface Vital..." />}>
      <Routes>
        <Route path="/" element={<InitialAuthRedirect />} />
        <Route path="/login" element={<ClientLoginPage />} />
        <Route path="/staff/login" element={<StaffLoginPage />} />

        <Route element={<MaintenanceMiddleware />}> 
            <Route element={<AuthMiddleware />}>
                <Route path="/settings" element={<SettingsPage />} /> 
                <Route path="/preview/:fileId" element={<FilePreviewPage />} />
                
                {/* Rota de Inspeção Compartilhada (Auditoria) */}
                <Route element={<RoleMiddleware allowedRoles={[UserRole.QUALITY, UserRole.CLIENT]} />}>
                    <Route path="/quality/inspection/:fileId" element={<FileInspection />} />
                </Route>

                {/* ADMIN EXCLUSIVE */}
                <Route element={<RoleMiddleware allowedRoles={[UserRole.ADMIN]} />}>
                    <Route path="/admin/dashboard" element={<AdminDashboard />} />
                    <Route path="/admin/console" element={<AdminConsole />} /> 
                </Route>

                {/* QUALITY & ADMIN */}
                <Route element={<RoleMiddleware allowedRoles={[UserRole.QUALITY]} />}>
                    <Route path="/quality/dashboard" element={<QualityDashboard />} />
                    <Route path="/quality/monitor" element={<QualityMonitor />} />
                    <Route path="/quality/portfolio" element={<QualityPortfolio />} />
                    <Route path="/quality/users" element={<QualityUserManagement />} />
                    <Route path="/quality/explorer" element={<QualityExplorer />} />
                    <Route path="/quality/audit" element={<QualityAuditHistory />} />
                </Route>

                {/* CLIENT EXCLUSIVE */}
                <Route element={<RoleMiddleware allowedRoles={[UserRole.CLIENT]} />}>
                    <Route path="/client/portal" element={<ClientPortal />} />
                </Route>
            </Route>
        </Route>

        <Route path="/404" element={<NotFoundPage />} />
        <Route path="*" element={<Navigate to="/404" replace />} />
      </Routes>
    </Suspense>
  );
};
