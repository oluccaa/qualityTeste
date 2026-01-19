
import { IQualityService, PaginatedResponse } from './interfaces.ts';
import { supabase } from '../supabaseClient.ts';
import { QualityStatus, FileNode, ClientOrganization, AuditLog, User, FileType } from '../../types/index.ts';
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
  isFavorite: false,
  metadata: row.metadata || {},
  authorName: row.profiles?.full_name || 'Sistema'
});

export const SupabaseQualityService: IQualityService = {
  getManagedPortfolio: async (analystId) => {
    try {
      // FIX: Especificamos !organizations_quality_analyst_id_fkey
      const { data, error } = await supabase
        .from('organizations')
        .select('*, profiles!organizations_quality_analyst_id_fkey(full_name)')
        .order('name');
        
      if (error) throw error;
      
      return data.map(org => {
        const profileData = Array.isArray(org.profiles) ? org.profiles[0] : org.profiles;
        return {
          id: org.id,
          name: org.name,
          cnpj: org.cnpj,
          status: org.status,
          contractDate: org.contract_date,
          qualityAnalystId: org.quality_analyst_id,
          qualityAnalystName: profileData?.full_name || 'Não Atribuído'
        };
      });
    } catch (err) {
      console.error("[QualityService] Erro ao carregar portfólio global:", err);
      throw new Error("Falha na sincronização do portfólio industrial.");
    }
  },

  getPendingInspections: async (analystId) => {
    const { data, error } = await supabase
      .from('files')
      .select('*, profiles:uploaded_by(full_name)')
      .eq('metadata->>status', QualityStatus.PENDING)
      .neq('type', 'FOLDER');
    
    if (error) throw error;
    return (data || []).map(toDomainFile);
  },

  submitTechnicalVeredict: async (analystId, fileId, status, metadata) => {
    const { error } = await supabase
      .from('files')
      .update({
        metadata: {
          ...metadata,
          status,
          inspectedAt: new Date().toISOString(),
          inspectedBy: analystId
        },
        updated_at: new Date().toISOString()
      })
      .eq('id', fileId);
    
    if (error) throw error;
  },

  getTechnicalAuditLogs: async (analystId, filters) => {
    let query = supabase.from('audit_logs').select('*');
    if (analystId) query = query.eq('user_id', analystId);
    if (filters?.search) query = query.or(`action.ilike.%${filters.search}%,target.ilike.%${filters.search}%`);
    if (filters?.severity && filters.severity !== 'ALL') query = query.eq('severity', filters.severity);
    const { data, error } = await query.order('created_at', { ascending: false }).limit(100);
    if (error) throw error;
    return (data || []).map(l => ({ id: l.id, timestamp: l.created_at, userId: l.user_id, userName: l.metadata?.userName || 'Operador', userRole: l.metadata?.userRole || 'UNKNOWN', action: l.action, category: l.category as any, target: l.target || 'N/A', severity: l.severity as any, status: 'SUCCESS', ip: l.ip || '0.0.0.0', location: 'Brasil', userAgent: l.user_agent || '', metadata: l.metadata || {}, requestId: l.id.split('-')[0] }));
  },

  getPortfolioFileExplorer: async (analystId, folderId) => {
    let query = supabase.from('files').select('*, profiles:uploaded_by(full_name)', { count: 'exact' });
    if (folderId) query = query.eq('parent_id', folderId);
    else query = query.is('parent_id', null);
    const { data, count, error } = await query.order('type', { ascending: false }).order('name');
    if (error) throw error;
    return { items: (data || []).map(toDomainFile), total: count || 0, hasMore: false };
  },

  getManagedClients: async (analystId, filters, page = 1) => {
    // FIX: Especificamos !organizations_quality_analyst_id_fkey
    let query = supabase
      .from('organizations')
      .select('*, profiles!organizations_quality_analyst_id_fkey(full_name)', { count: 'exact' });

    if (filters.search) query = query.ilike('name', `%${filters.search}%`);
    if (filters.status && filters.status !== 'ALL') query = query.eq('status', filters.status);

    const pageSize = 20;
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    const { data, count, error } = await query.range(from, to).order('name');
    if (error) throw error;

    return {
      items: (data || []).map(org => {
        const profileData = Array.isArray(org.profiles) ? org.profiles[0] : org.profiles;
        return {
          id: org.id,
          name: org.name,
          cnpj: org.cnpj,
          status: org.status,
          contractDate: org.contract_date,
          qualityAnalystId: org.quality_analyst_id,
          qualityAnalystName: profileData?.full_name || 'Não Atribuído'
        };
      }),
      total: count || 0,
      hasMore: (count || 0) > to + 1
    };
  },

  submitVeredict: async (user, file, status, reason) => {
    const isNewRejection = status === QualityStatus.REJECTED;
    const newMetadata = { ...file.metadata, status, rejectionReason: reason, lastInteractionAt: new Date().toISOString(), lastInteractionBy: user.name, currentStep: status === QualityStatus.APPROVED ? 5 : file.metadata?.currentStep };
    const { error } = await supabase.from('files').update({ metadata: newMetadata, updated_at: new Date().toISOString() }).eq('id', file.id);
    if (error) throw error;
    await logAction(user, isNewRejection ? 'QUALITY_VEREDICT_REJECTED' : 'QUALITY_VEREDICT_APPROVED', file.name, 'DATA', isNewRejection ? 'WARNING' : 'INFO');
  }
};
