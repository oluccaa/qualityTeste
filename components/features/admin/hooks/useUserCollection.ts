
import { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '../../../../context/authContext.tsx';
import { useToast } from '../../../../context/notificationContext.tsx';
import { User, UserRole, normalizeRole } from '../../../../types/index.ts';
import { userService } from '../../../../lib/services/index.ts';

export const useUserCollection = (restrictedToRole?: UserRole) => {
  const { user: currentUser } = useAuth();
  const { showToast } = useToast();

  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<UserRole | 'ALL'>(restrictedToRole || 'ALL');
  const [viewMode, setViewMode] = useState<'ACTIVE' | 'ARCHIVED'>('ACTIVE');

  const loadUsers = useCallback(async () => {
    if (!currentUser) return;
    setLoading(true);
    try {
      const data = await userService.getUsers();
      setUsers(data);
    } catch (err) {
      showToast("Falha na sincronização do diretório.", 'error');
    } finally {
      setLoading(false);
    }
  }, [currentUser, showToast]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const filteredUsers = useMemo(() => {
    const search = searchTerm.toLowerCase();
    return users.filter(u => {
      const isArchived = u.department === 'PENDING_DELETION';
      if (viewMode === 'ACTIVE' && isArchived) return false;
      if (viewMode === 'ARCHIVED' && !isArchived) return false;

      const uRole = normalizeRole(u.role);
      const targetRole = restrictedToRole || roleFilter;
      const matchesRole = targetRole === 'ALL' || uRole === normalizeRole(targetRole);
      if (!matchesRole) return false;

      return u.name.toLowerCase().includes(search) || u.email.toLowerCase().includes(search);
    });
  }, [users, searchTerm, roleFilter, viewMode, restrictedToRole]);

  return { filteredUsers, loading, searchTerm, setSearchTerm, roleFilter, setRoleFilter, viewMode, setViewMode, refresh: loadUsers };
};
