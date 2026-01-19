
import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../../../../context/authContext.tsx';
import { fileService } from '../../../../lib/services/index.ts';
import { useToast } from '../../../../context/notificationContext.tsx';
import { useTranslation } from 'react-i18next';
import { FileNode, BreadcrumbItem, UserRole } from '../../../../types/index.ts';
import { SupabaseFileService } from '../../../../lib/services/supabaseFileService.ts';

interface FileCollectionOptions {
  currentFolderId: string | null;
  searchTerm: string;
  ownerId?: string | null;
}

/**
 * useFileCollection (Read-Only)
 * Responsabilidade: Gerenciar a busca, paginação e breadcrumbs da biblioteca.
 */
export const useFileCollection = (options: FileCollectionOptions) => {
  const { user } = useAuth();
  const { t } = useTranslation();
  const { showToast } = useToast();
  
  const [files, setFiles] = useState<FileNode[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [breadcrumbs, setBreadcrumbs] = useState<BreadcrumbItem[]>([]);
  const [page, setPage] = useState(1);

  const fetchIdRef = useRef(0);

  const fetchFiles = useCallback(async (reset = false) => {
    if (!user) return;
    const currentFetchId = ++fetchIdRef.current;
    const targetPage = reset ? 1 : page;

    setLoading(true);
    if (reset) setFiles([]);

    try {
      let result;
      // Contexto de consulta: Global (Admin/Quality) vs Parceiro Específico
      if (user.role !== UserRole.CLIENT && options.ownerId && options.ownerId !== 'global') {
        result = await SupabaseFileService.getRawFiles(options.currentFolderId, targetPage, 100, options.searchTerm, options.ownerId);
      } else {
        result = await fileService.getFiles(user, options.currentFolderId, targetPage, 100, options.searchTerm);
      }

      const crumbs = await fileService.getBreadcrumbs(user, options.currentFolderId);

      if (currentFetchId !== fetchIdRef.current) return;

      setFiles(prev => reset ? result.items : [...prev, ...result.items]);
      setHasMore(result.hasMore);
      setBreadcrumbs(crumbs);
      setPage(targetPage);
    } catch (err: any) {
      if (currentFetchId === fetchIdRef.current) {
        showToast(t('files.errorLoadingFiles'), 'error');
      }
    } finally {
      if (currentFetchId === fetchIdRef.current) setLoading(false);
    }
  }, [user, options.currentFolderId, options.searchTerm, options.ownerId, page, showToast, t]);

  useEffect(() => {
    const timer = setTimeout(() => fetchFiles(true), 150);
    return () => clearTimeout(timer);
  }, [options.currentFolderId, options.searchTerm, options.ownerId]);

  return { files, loading, hasMore, breadcrumbs, fetchFiles };
};
