import { 
  User, 
  ClientOrganization,
  FileNode, 
  AuditLog, 
  SystemStatus, 
  MaintenanceEvent, 
  AppNotification,
  QualityStatus,
  BreadcrumbItem,
  UserRole,
  AccountStatus,
  SteelBatchMetadata,
  PaginatedResponse,
  ISO8601Date
} from '../../types/index.ts';

/**
 * DASHBOARD STATS DATA
 */
export interface DashboardStatsData {
  mainValue: number;
  subValue: number;
  pendingValue: number;
  status: 'REGULAR' | 'PENDING' | 'CRITICAL';
  mainLabel: string;
  subLabel: string;
  lastAnalysis?: string;
}

/**
 * ADMIN STATS DATA
 */
export interface AdminStatsData {
  totalUsers: number;
  activeUsers: number;
  activeClients: number;
  logsLast24h: number;
  systemHealthStatus: 'HEALTHY' | 'WARNING' | 'CRITICAL';
  cpuUsage: number;
  memoryUsage: number;
  dbConnections: number;
  dbMaxConnections: number;
}

/**
 * RAW CLIENT ORGANIZATION (DB JOIN HELPER)
 */
export interface RawClientOrganization {
  id: string;
  name: string;
  cnpj: string;
  status: AccountStatus;
  contract_date: string;
  quality_analyst_id: string | null;
  profiles: any; // Joining profiles for analyst name
}

/**
 * USER SERVICE INTERFACE
 */
export interface IUserService {
  authenticate: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signUp: (email: string, password: string, fullName: string, organizationId?: string | null, userType?: string, role?: UserRole) => Promise<void>;
  getCurrentUser: () => Promise<User | null>;
  getUsers: () => Promise<User[]>;
  saveUser: (user: User) => Promise<void>;
  flagUserForDeletion: (userId: string, adminUser: User) => Promise<void>;
  logout: () => Promise<void>;
  getUsersByRole: (role: UserRole) => Promise<User[]>;
  changePassword: (userId: string, current: string, newPass: string) => Promise<boolean>;
  deleteUser: (userId: string) => Promise<void>;
  getUserStats: () => Promise<{ total: number; active: number; clients: number }>;
}

/**
 * FILE SERVICE INTERFACE
 */
export interface IFileService {
  getRawFiles: (folderId: string | null, page?: number, pageSize?: number, searchTerm?: string, ownerId?: string, filters?: any) => Promise<PaginatedResponse<FileNode>>;
  getFiles: (user: User, folderId: string | null, page?: number, pageSize?: number, searchTerm?: string) => Promise<PaginatedResponse<FileNode>>;
  createFolder: (user: User, parentId: string | null, name: string, ownerId?: string) => Promise<FileNode>;
  uploadFile: (user: User, fileData: any, ownerId: string) => Promise<FileNode>;
  updateFileMetadata: (fileId: string, metadata: Partial<SteelBatchMetadata>) => Promise<void>;
  deleteFile: (user: User, fileIds: string[]) => Promise<void>;
  deleteFiles: (ids: string[]) => Promise<void>;
  renameFile: (user: User, fileId: string, newName: string) => Promise<void>;
  getBreadcrumbs: (user: User, currentFolderId: string | null) => Promise<BreadcrumbItem[]>;
  getSignedUrl: (path: string) => Promise<string>;
  getFileSignedUrl: (user: User, fileId: string) => Promise<string>;
  getAuditLogs: (user: User) => Promise<AuditLog[]>;
  getDashboardStats: (user: User) => Promise<DashboardStatsData>;
  uploadRaw: (user: User, blob: Blob, name: string, path: string) => Promise<string>;
  deleteRaw: (paths: string[]) => Promise<void>;
}

/**
 * ADMIN SERVICE INTERFACE
 */
export interface IAdminService {
  getSystemStatus: () => Promise<SystemStatus>;
  updateSystemStatus: (user: User, newStatus: Partial<SystemStatus>) => Promise<SystemStatus>;
  updateGatewayMode: (user: User, mode: 'ONLINE' | 'MAINTENANCE' | 'SCHEDULED') => Promise<void>;
  subscribeToSystemStatus: (listener: (status: SystemStatus) => void) => () => void;
  getAdminStats: () => Promise<AdminStatsData>;
  getClients: (filters?: any, page?: number, pageSize?: number) => Promise<PaginatedResponse<ClientOrganization>>;
  saveClient: (user: User, data: Partial<ClientOrganization>) => Promise<ClientOrganization>;
  deleteClient: (user: User, id: string) => Promise<void>;
  scheduleMaintenance: (user: User, event: any) => Promise<MaintenanceEvent>;
  getGlobalAuditLogs: () => Promise<AuditLog[]>;
  manageUserAccess: (admin: User, targetUser: Partial<User>) => Promise<void>;
  getAllClients: () => Promise<ClientOrganization[]>;
  generateSystemBackup: (user: User) => Promise<{ blob: Blob; fileName: string }>;
}

/**
 * NOTIFICATION SERVICE INTERFACE
 */
export interface INotificationService {
  subscribeToNotifications: (listener: () => void) => () => void;
  getNotifications: (user: User) => Promise<AppNotification[]>;
  getUnreadCount: (user: User) => Promise<number>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: (user: User) => Promise<void>;
  addNotification: (userId: string | null, title: string, message: string, type: string, link?: string) => Promise<void>;
}

/**
 * QUALITY SERVICE INTERFACE
 */
export interface IQualityService {
  getManagedPortfolio: (analystId: string) => Promise<ClientOrganization[]>;
  getPendingInspections: (analystId: string) => Promise<FileNode[]>;
  submitTechnicalVeredict: (analystId: string, fileId: string, status: QualityStatus, metadata: any) => Promise<void>;
  getTechnicalAuditLogs: (analystId: string, filters?: any) => Promise<AuditLog[]>;
  getPortfolioFileExplorer: (analystId: string, folderId: string | null) => Promise<PaginatedResponse<FileNode>>;
  getManagedClients: (analystId: string, filters: any, page?: number) => Promise<PaginatedResponse<ClientOrganization>>;
  submitVeredict: (user: User, file: FileNode, status: QualityStatus, reason?: string) => Promise<void>;
}

/**
 * PARTNER SERVICE INTERFACE
 */
export interface IPartnerService {
  getCertificates: (orgId: string, folderId: string | null, search?: string) => Promise<PaginatedResponse<FileNode>>;
  getComplianceOverview: (orgId: string) => Promise<{ approvedCount: number; rejectedCount: number; unviewedCount: number; lastAnalysis: string }>;
  getRecentActivity: (orgId: string) => Promise<FileNode[]>;
  getPartnerDashboardStats: (orgId: string) => Promise<DashboardStatsData>;
  logFileView: (user: User, file: FileNode) => Promise<void>;
  submitClientFeedback: (user: User, file: FileNode, status: QualityStatus, observations?: string, flags?: string[], annotations?: any[]) => Promise<void>;
  submitVersionedReview: (params: {
    user: User,
    file: FileNode,
    status: QualityStatus,
    description?: string,
    reasonCode?: string,
    snapshotUrl: string,
    pageCount?: number
  }) => Promise<void>;
}
