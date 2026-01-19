
import { IPartnerService, PaginatedResponse, DashboardStatsData } from './interfaces.ts';
import { supabase } from '../supabaseClient.ts';
import { FileNode, QualityStatus, FileType, User } from '../../types/index.ts';
import { logAction } from './loggingService.ts';

const toDomainFile = (row: any): FileNode => ({
  id: row.id,
  parentId: row.parent_id,
  name: row.name,
  type: row.type as FileType,
  size: row.size,
  updatedAt: row.updated_at,
  ownerId: row.owner_id,
  storagePath: row.storage_path,
  isFavorite: !!row.is_favorite,
  metadata: row.metadata || { status: 'PENDING' }
});

export const SupabasePartnerService: IPartnerService = {
  getCertificates: async (orgId, folderId, search) => {
    if (!orgId) throw new Error("ID da Organização ausente no perfil do usuário.");

    // Busca bruta na tabela files filtrando pela organização do cliente
    let query = supabase
      .from('files')
      .select('*', { count: 'exact' })
      .eq('owner_id', orgId);

    if (search) {
      query = query.ilike('name', `%${search}%`);
    } else {
      // Se não tem folderId, busca o que está na "raiz" da empresa (parent_id nulo)
      if (folderId) {
        query = query.eq('parent_id', folderId);
      } else {
        query = query.is('parent_id', null);
      }
    }

    const { data, count, error } = await query
      .order('type', { ascending: false }) // Pastas primeiro
      .order('name', { ascending: true });

    if (error) {
      console.error("Erro Supabase getCertificates:", error.message);
      throw error;
    }

    return {
      items: (data || []).map(toDomainFile),
      total: count || 0,
      hasMore: false
    };
  },

  getComplianceOverview: async (orgId) => {
    if (!orgId) return { approvedCount: 0, rejectedCount: 0, unviewedCount: 0, lastAnalysis: new Date().toISOString() };

    const { data: stats, error } = await supabase
      .from('files')
      .select('metadata->status')
      .eq('owner_id', orgId)
      .neq('type', 'FOLDER');

    if (error) return { approvedCount: 0, rejectedCount: 0, unviewedCount: 0, lastAnalysis: new Date().toISOString() };

    return {
      approvedCount: stats.filter(s => s.status === QualityStatus.APPROVED).length,
      rejectedCount: stats.filter(s => s.status === QualityStatus.REJECTED).length,
      unviewedCount: stats.filter(s => !s.viewedAt).length,
      lastAnalysis: new Date().toISOString()
    } as any;
  },

  getRecentActivity: async (orgId) => {
    if (!orgId) return [];
    const { data, error } = await supabase
      .from('files')
      .select('*')
      .eq('owner_id', orgId)
      .neq('type', 'FOLDER')
      .order('updated_at', { ascending: false })
      .limit(5);
    
    return (data || []).map(toDomainFile);
  },

  getPartnerDashboardStats: async (orgId): Promise<DashboardStatsData> => {
    if (!orgId) {
      return { mainValue: 0, subValue: 0, pendingValue: 0, status: 'REGULAR', mainLabel: 'Certificados', subLabel: 'Aprovados' };
    }

    const { data, error } = await supabase
      .from('files')
      .select('id, type, metadata')
      .eq('owner_id', orgId);

    if (error || !data) {
       return { mainValue: 0, subValue: 0, pendingValue: 0, status: 'REGULAR', mainLabel: 'Certificados', subLabel: 'Aprovados' };
    }

    const filesOnly = data.filter(f => f.type !== 'FOLDER');
    const approved = filesOnly.filter(f => f.metadata?.status === QualityStatus.APPROVED).length;
    const pending = filesOnly.filter(f => f.metadata?.status === QualityStatus.PENDING || !f.metadata?.status).length;

    return {
      mainValue: filesOnly.length,
      subValue: approved,
      pendingValue: pending,
      status: pending > 0 ? 'PENDING' : 'REGULAR',
      mainLabel: 'Certificados Totais',
      subLabel: 'Validados'
    };
  },

  logFileView: async (user, file) => {
    await logAction(user, 'CLIENT_FILE_VIEW', file.name, 'DATA', 'INFO', 'SUCCESS', { fileId: file.id });
  },

  submitClientFeedback: async (user, file, status, observations, flags, annotations) => {
    const { error } = await supabase.from('file_reviews').insert({
      file_id: file.id,
      author_id: user.id,
      status: status,
      annotations: {
        observations: observations || "",
        flags: flags || [],
        drawings: annotations || [],
        client_name: user.name,
        timestamp: new Date().toISOString()
      }
    });

    if (error) throw error;
    await logAction(user, `REVIEW_SUBMITTED_${status}`, file.name, 'DATA', 'INFO', 'SUCCESS');
  }
};
