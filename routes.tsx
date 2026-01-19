import React, { Suspense } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Loader2, RefreshCw } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { AuthMiddleware } from './middlewares/AuthMiddleware.tsx';
import { RoleMiddleware } from './middlewares/RoleMiddleware.tsx';
import { MaintenanceMiddleware } from './middlewares/MaintenanceMiddleware.tsx';
import { useAuth } from './context/authContext.tsx';
import { UserRole, normalizeRole } from './types/index.ts';

// --- AUTH PAGES ---
const ClientLoginPage = React.lazy(() => import('./pages/auth/ClientLoginPage.tsx'));
const StaffLoginPage = React.lazy(() => import('./pages/auth/StaffLoginPage.tsx'));

// --- ADMIN PAGES ---
const AdminDashboard = React.lazy(() => import('./pages/admin/AdminDashboard.tsx'));
const AdminConsole = React.lazy(() => import('./pages/admin/AdminConsole.tsx'));

// --- QUALITY PAGES ---
const QualityDashboard = React.lazy(() => import('./pages/quality/QualityDashboard.tsx'));
const QualityPortfolio = React.lazy(() => import('./pages/quality/QualityPortfolio.tsx'));
const QualityAuditHistory = React.lazy(() => import('./pages/quality/QualityAuditHistory.tsx'));
const QualityUserManagement = React.lazy(() => import('./pages/quality/QualityUserManagement.tsx'));
const QualityExplorer = React.lazy(() => import('./pages/quality/QualityExplorer.tsx'));
const FileInspection = React.lazy(() => import('./components/features/quality/views/FileInspection.tsx').then(m => ({ default: m.FileInspection })));

// --- CLIENT PAGES ---
const ClientPortal = React.lazy(() => import('./pages/client/ClientPortal.tsx'));

// --- SHARED PAGES ---
const SettingsPage = React.lazy(() => import('./pages/shared/SettingsPage.tsx'));
const NotFoundPage = React.lazy(() => import('./pages/shared/NotFoundPage.tsx'));

const PageLoader = ({ message = "Carregando...", onRetry }: { message?: string; onRetry?: () => void }) => (
  <div className="h-screen w-screen bg-[#081437] flex flex-col items-center justify-center text-white">
      <div className="relative mb-8">
        <Loader2 size={48} className="animate-spin text-blue-500" />
        <div className="absolute inset-0 bg-blue-500/20 blur-2xl rounded-full animate-pulse" />
      </div>
      <p className="text-[10px] font-black text-slate-400 tracking-[6px] uppercase animate-pulse mb-4 text-center px-6">{message}</p>
      {onRetry && (
        <button onClick={onRetry} className="flex items-center gap-2 px-6 py-3 bg-white text-[#081437] rounded-xl text-xs font-black uppercase tracking-widest hover:bg-slate-200 transition-all active:scale-95 shadow-lg">
          <RefreshCw size={16} /> Tentar Novamente
        </button>
      )}
  </div>
);

const InitialAuthRedirect = () => {
    const { user, isLoading, error, isInitialSyncComplete, retryInitialSync } = useAuth();

    if (isLoading) return <PageLoader message="Sincronizando Identidade Vital" />;
    
    if (isInitialSyncComplete && error) {
      return <PageLoader message="Erro de Conexão com Gateway de Segurança" onRetry={retryInitialSync} />;
    }
    
    if (user) {
        const role = normalizeRole(user.role);
        const roleRoutes: Record<UserRole, string> = {
            [UserRole.ADMIN]: '/admin/dashboard',
            [UserRole.QUALITY]: '/quality/dashboard',
            [UserRole.CLIENT]: '/client/portal'
        };
        const target = roleRoutes[role] || '/404';
        return <Navigate to={target} replace />;
    }

    return <Navigate to="/login" replace />;
};

export const AppRoutes: React.FC = () => {
  return (
    <Suspense fallback={<PageLoader message="Preparando Interface..." />}>
      <Routes>
        <Route path="/" element={<InitialAuthRedirect />} />
        
        {/* PUBLIC AUTH ROUTES */}
        <Route path="/login" element={<ClientLoginPage />} />
        <Route path="/staff/login" element={<StaffLoginPage />} />

        {/* PROTECTED ROUTES UNDER MAINTENANCE CONTROL */}
        <Route element={<MaintenanceMiddleware />}> 
            <Route element={<AuthMiddleware />}>
                <Route path="/settings" element={<SettingsPage />} /> 

                {/* ADMIN DOMAIN */}
                <Route element={<RoleMiddleware allowedRoles={[UserRole.ADMIN]} />}>
                    <Route path="/admin/dashboard" element={<AdminDashboard />} />
                    <Route path="/admin/console" element={<AdminConsole />} /> 
                    <Route path="/admin" element={<Navigate to="/admin/console" replace />} />
                </Route>

                {/* QUALITY ANALYST DOMAIN */}
                <Route element={<RoleMiddleware allowedRoles={[UserRole.QUALITY, UserRole.ADMIN]} />}>
                    <Route path="/quality/dashboard" element={<QualityDashboard />} />
                    <Route path="/quality/portfolio" element={<QualityPortfolio />} />
                    <Route path="/quality/users" element={<QualityUserManagement />} />
                    <Route path="/quality/explorer" element={<QualityExplorer />} />
                    <Route path="/quality/audit" element={<QualityAuditHistory />} />
                    <Route path="/quality/inspection/:fileId" element={<FileInspection />} />
                    <Route path="/quality" element={<Navigate to="/quality/dashboard" replace />} />
                </Route>

                {/* CLIENT DOMAIN */}
                <Route element={<RoleMiddleware allowedRoles={[UserRole.CLIENT, UserRole.ADMIN]} />}>
                    <Route path="/client/portal" element={<ClientPortal />} />
                    <Route path="/client/dashboard" element={<Navigate to="/client/portal" replace />} />
                </Route>
            </Route>
        </Route>

        <Route path="/404" element={<NotFoundPage />} />
        <Route path="*" element={<Navigate to="/404" replace />} />
      </Routes>
    </Suspense>
  );
};