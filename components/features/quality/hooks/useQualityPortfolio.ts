
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../../../context/authContext.tsx';
import { qualityService } from '../../../../lib/services/index.ts';
import { supabase } from '../../../../lib/supabaseClient.ts';
import { ClientOrganization, FileNode, QualityStatus } from '../../../../types/index.ts';

export const useQualityPortfolio = () => {
  const { user } = useAuth();
  const [clients, setClients] = useState<ClientOrganization[]>([]);
  const [pendingFiles, setPendingFiles] = useState<FileNode[]>([]);
  const [rejectedFiles, setRejectedFiles] = useState<FileNode[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadQualityData = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      // 1. Busca Portfólio Global
      const portfolio = await qualityService.getManagedPortfolio(user.id);

      // 2. Busca ativos em PENDING (Aguardando ação de qualquer parte - Vital ou Cliente)
      const { data: pending, error: pendingError } = await supabase
        .from('files')
        .select('*, profiles:uploaded_by(full_name)')
        .eq('metadata->>status', QualityStatus.PENDING)
        .neq('type', 'FOLDER');

      if (pendingError) console.error("Erro ao buscar pendências:", pendingError);

      // 3. Busca arquivos em REJECTED ou TO_DELETE (Aguardando novo upload da Vital)
      const { data: rejected, error: rejectedError } = await supabase
        .from('files')
        .select('*')
        .or(`metadata->>status.eq.${QualityStatus.REJECTED},metadata->>status.eq.${QualityStatus.TO_DELETE}`)
        .neq('type', 'FOLDER');

      if (rejectedError) console.error("Erro ao buscar arquivos rejeitados:", rejectedError);

      setClients(portfolio);
      setPendingFiles(pending || []);
      setRejectedFiles(rejected || []);
    } catch (err) {
      console.error("Quality Context Sync Failure:", err);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadQualityData();
  }, [loadQualityData]);

  return { clients, pendingFiles, rejectedFiles, isLoading, refresh: loadQualityData };
};
