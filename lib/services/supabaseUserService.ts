import { User } from '../../types/auth.ts';
import { UserRole, AccountStatus } from '../../types/enums.ts';
import { IUserService } from './interfaces.ts';
import { supabase } from '../supabaseClient.ts';
import { logAction } from './loggingService.ts';
import { normalizeRole } from '../mappers/roleMapper.ts';

// Fix: AuthError might not be exported from @supabase/supabase-js in some environments
const normalizeAuthError = (error: any): string => {
  const msg = error.message?.toLowerCase() || "";
  if (msg.includes("invalid login credentials")) return "auth.errors.invalidCredentials";
  if (msg.includes("too many requests")) return "auth.errors.tooManyRequests";
  if (msg.includes("user already registered")) return "auth.errors.alreadyRegistered";
  return "auth.errors.unexpected";
};

const toDomainUser = (row: any, sessionUser?: any): User | null => {
  if (!row && sessionUser) {
    return {
      id: sessionUser.id,
      name: sessionUser.user_metadata?.full_name || 'Usuário Vital',
      email: sessionUser.email || '',
      role: normalizeRole(sessionUser.user_metadata?.role),
      organizationId: sessionUser.user_metadata?.organization_id,
      organizationName: 'Aços Vital (Sincronizando...)',
      status: AccountStatus.ACTIVE,
      department: sessionUser.user_metadata?.user_type || 'CLIENT_INTERNAL',
      isPendingDeletion: false
    };
  }

  if (!row) return null;

  const orgData = Array.isArray(row.organizations) ? row.organizations[0] : row.organizations;
  const isPendingDeletion = row.department === 'PENDING_DELETION';

  return {
    id: row.id,
    name: row.full_name || 'Usuário Sem Nome',
    email: row.email || '',
    role: normalizeRole(row.role),
    organizationId: row.organization_id || undefined,
    organizationName: orgData?.name || 'Aços Vital (Sede Interna)',
    status: (row.status as AccountStatus) || AccountStatus.ACTIVE,
    department: row.department || 'CLIENT_INTERNAL',
    lastLogin: row.last_login || undefined,
    isPendingDeletion
  };
};

export const SupabaseUserService: IUserService = {
  authenticate: async (email, password) => {
    try {
      // Fix: Use 'as any' to bypass type errors for signInWithPassword
      const { data, error } = await (supabase.auth as any).signInWithPassword({
        email: email.trim().toLowerCase(),
        password
      });
      if (error) return { success: false, error: normalizeAuthError(error) };
      
      // Update last login
      if (data.user) {
        await supabase.from('profiles').update({ last_login: new Date().toISOString() }).eq('id', data.user.id);
      }
      
      return { success: true };
    } catch (err) {
      return { success: false, error: "auth.errors.unexpected" };
    }
  },

  signUp: async (email, password, fullName, organizationId, userType, role = UserRole.CLIENT) => {
    const emailClean = email.trim().toLowerCase();
    const validOrgId = (organizationId && organizationId !== "null") ? organizationId : null;

    // Fix: Use 'as any' to bypass type errors for signUp
    const { data, error: authError } = await (supabase.auth as any).signUp({
      email: emailClean,
      password,
      options: {
        data: {
          full_name: fullName,
          user_type: userType,
          role: role,
          organization_id: validOrgId
        }
      }
    });

    if (authError) throw authError;

    const { error: profileError } = await supabase.from('profiles').insert({
      id: data.user!.id,
      full_name: fullName,
      email: emailClean,
      role: role,
      organization_id: validOrgId,
      department: userType,
      status: 'ACTIVE'
    });

    if (profileError) throw profileError;

    await logAction(null, 'USER_REGISTERED', emailClean, 'AUTH', 'INFO', 'SUCCESS', { role, organizationId: validOrgId });
  },

  getCurrentUser: async () => {
    // Fix: Use 'as any' to bypass type errors for getSession
    const { data: { session } } = await (supabase.auth as any).getSession();
    if (!session?.user) return null;

    const { data: profile } = await supabase
      .from('profiles')
      .select('*, organizations!organization_id(name)')
      .eq('id', session.user.id)
      .maybeSingle();

    return toDomainUser(profile, session.user);
  },

  getUsers: async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*, organizations!organization_id(name)')
      .order('full_name');

    if (error) throw error;
    return (data || []).map(p => toDomainUser(p));
  },

  saveUser: async (u) => {
    const { error } = await supabase.from('profiles').update({
      full_name: u.name,
      role: u.role,
      organization_id: u.organizationId || null,
      department: u.department,
      status: u.status,
      updated_at: new Date().toISOString()
    }).eq('id', u.id);

    if (error) throw error;
    await logAction(null, 'USER_UPDATED', u.email, 'DATA', 'INFO', 'SUCCESS', { id: u.id });
  },

  flagUserForDeletion: async (userId, adminUser) => {
    const { error } = await supabase.from('profiles').update({
      status: 'INACTIVE',
      department: 'PENDING_DELETION'
    }).eq('id', userId);

    if (error) throw error;
    await logAction(adminUser, 'USER_FLAGGED_DELETION', userId, 'SECURITY', 'WARNING', 'SUCCESS');
  },

  logout: async () => {
    // Fix: Use 'as any' to bypass type errors for signOut
    await (supabase.auth as any).signOut();
    localStorage.clear();
  },

  getUsersByRole: async (role) => {
    const { data, error } = await supabase.from('profiles').select('*, organizations!organization_id(name)').eq('role', role);
    if (error) throw error;
    return (data || []).map(p => toDomainUser(p));
  },

  changePassword: async (userId, current, newPass) => {
    // Fix: Use 'as any' to bypass type errors for updateUser
    const { error } = await (supabase.auth as any).updateUser({ password: newPass });
    if (error) throw error;
    return true;
  },

  deleteUser: async (userId) => {
    // Apenas sinaliza ou deleta perfil se política permitir
    const { error } = await supabase.from('profiles').delete().eq('id', userId);
    if (error) throw error;
  },

  getUserStats: async () => {
    const [total, active] = await Promise.all([
      supabase.from('profiles').select('*', { count: 'exact', head: true }),
      supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('status', 'ACTIVE')
    ]);
    return { total: total.count || 0, active: active.count || 0, clients: 0 };
  }
};