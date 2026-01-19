
import React from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/authContext.tsx';
import { SidebarQuality } from './SidebarQuality.tsx';
import { SidebarAdmin } from './SidebarAdmin.tsx';
import { Header } from './Header.tsx';
import { MobileNavigation } from './MobileNavigation.tsx';
import { CookieBanner } from '../common/CookieBanner.tsx';
import { MaintenanceBanner } from '../common/MaintenanceBanner.tsx';
import { useLayoutState } from './hooks/useLayoutState.ts';
import { useSystemSync } from './hooks/useSystemSync.ts';
import { UserRole, normalizeRole } from '../../types/index.ts';

interface LayoutProps {
  children: React.ReactNode;
  title: string;
}

/**
 * MainLayout (Internal Viewport) - Versão Ultra-Full Height
 * Focada em dashboards industriais de alta densidade.
 */
export const Layout: React.FC<LayoutProps> = ({ children, title }) => {
  const { user, logout, systemStatus: authSystemStatus } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const role = normalizeRole(user?.role);

  const layout = useLayoutState();
  const system = useSystemSync(user, authSystemStatus);

  const handleNavigateBack = () => {
    navigate(-1);
  };

  const handleNavigateToSettingsPage = () => {
    navigate('/settings');
  };

  const commonSidebarProps = {
    user,
    role,
    isCollapsed: layout.sidebarCollapsed,
    onToggle: layout.toggleSidebar,
    onLogout: logout,
    onNavigateToSettings: handleNavigateToSettingsPage,
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
      <CookieBanner />

      {role === UserRole.ADMIN ? (
        <SidebarAdmin {...commonSidebarProps} />
      ) : (
        <SidebarQuality {...commonSidebarProps} />
      )}

      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <MaintenanceBanner status={system.status} isAdmin={role === UserRole.ADMIN} />
        
        <Header 
          title={title} 
          user={user} 
          role={role} 
          unreadCount={system.unreadCount} 
          onLogout={logout}
          onOpenMobileMenu={layout.openMobileMenu} 
          onNavigateBack={handleNavigateBack}
        />

        <main className="flex-1 flex flex-col min-h-0 bg-slate-50 p-4 md:p-6 relative">
          <div className="w-full h-full mx-auto animate-in fade-in slide-in-from-bottom-2 duration-500 flex flex-col min-h-0">
            {children}
          </div>
        </main>

        <MobileNavigation 
          user={user}
          userRole={role}
          isMenuOpen={layout.mobileMenuOpen}
          onCloseMenu={layout.closeMobileMenu}
          onLogout={logout}
          onNavigateToSettings={handleNavigateToSettingsPage} 
        />
      </div>
    </div>
  );
};
