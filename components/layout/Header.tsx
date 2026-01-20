
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom';
import { Bell, ArrowLeft } from 'lucide-react'; 
import { User, UserRole } from '../../types/index.ts';
import { LanguageSelector } from '../features/auth/login/LanguageSelector.tsx'; 
import { NotificationsDropdown } from '../features/notifications/NotificationsDropdown.tsx';

interface HeaderProps {
  title: string;
  user: User | null;
  role: UserRole;
  unreadCount: number;
  onLogout: () => void;
  onOpenMobileMenu: () => void; 
  onNavigateBack: () => void; 
}

const LOGO_URL = "https://wtydnzqianhahiiasows.supabase.co/storage/v1/object/public/public_assets/hero/logo.png";
const CORPORATE_BLUE_FILTER = "brightness(0) saturate(100%) invert(8%) sepia(35%) saturate(5833%) hue-rotate(222deg) brightness(95%) contrast(106%)";

export const Header: React.FC<HeaderProps> = ({ 
  title, user, role, unreadCount, onOpenMobileMenu, onNavigateBack
}) => {
  const { t } = useTranslation();
  const location = useLocation();
  const [isNotificationsDropdownOpen, setIsNotificationsDropdownOpen] = useState(false);

  const isDashboard = ['/admin/dashboard', '/quality/dashboard', '/client/portal'].includes(location.pathname.split('?')[0]);

  return (
    <>
      <header className="hidden md:flex h-20 bg-white border-b border-slate-200 items-center justify-between px-8 shrink-0 z-50">
        <div className="flex items-center gap-6">
          <div className="space-y-0.5">
            <h2 className="text-lg font-bold text-slate-800 tracking-tight">{title}</h2>
            <div className="flex items-center gap-2 text-[10px] text-slate-400 font-bold uppercase tracking-widest">
              <span className="text-blue-600">{t(`roles.${role}`)}</span>
              <span className="opacity-30">|</span>
              <span className="text-slate-500 font-medium">{user?.organizationName}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-8">
          <LanguageSelector />
          
          <div className="flex items-center gap-3 relative">
            <NotificationTrigger 
              count={unreadCount} 
              className="text-slate-400 hover:text-slate-900 transition-colors" 
              onClick={() => setIsNotificationsDropdownOpen(!isNotificationsDropdownOpen)}
            />
            <NotificationsDropdown 
              isOpen={isNotificationsDropdownOpen} 
              onClose={() => setIsNotificationsDropdownOpen(false)} 
            />
          </div>
        </div>
      </header>

      {/* Mobile Header */}
      <header className="md:hidden h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 z-40 shrink-0">
        {!isDashboard ? ( 
          <button onClick={onNavigateBack} className="p-2 text-slate-600"><ArrowLeft size={20} /></button>
        ) : (
          <img src={LOGO_URL} alt="Aços Vital" className="h-8" style={{ filter: CORPORATE_BLUE_FILTER }} />
        )}

        <div className="flex items-center gap-1">
            <NotificationTrigger count={unreadCount} className="text-slate-600" onClick={() => setIsNotificationsDropdownOpen(true)} />
            <NotificationsDropdown isOpen={isNotificationsDropdownOpen} onClose={() => setIsNotificationsDropdownOpen(false)} />
        </div>
      </header>
    </>
  );
};

const NotificationTrigger = ({ count, className, onClick }: any) => (
  <button onClick={onClick} className={`p-2 relative ${className}`}>
    <Bell size={20} strokeWidth={2} />
    {count > 0 && (
      <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[8px] font-bold rounded-full border border-white flex items-center justify-center">
        {count > 9 ? '9+' : count}
      </span>
    )}
  </button>
);
