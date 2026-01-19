
import { useState, useEffect, useCallback } from 'react';
import { FileNode, SteelBatchMetadata, User } from '../../../../types/index.ts';
import { fileService } from '../../../../lib/services/index.ts';
import { useToast } from '../../../../context/notificationContext.tsx';

/**
 * useFilePreview (Business Logic Hook)
 * Separa a lógica de dados da apresentação visual do modal.
 */
export const useFilePreview = (user: User | null, initialFile: FileNode | null) => {
  const { showToast } = useToast();
  const [currentFile, setCurrentFile] = useState<FileNode | null>(initialFile);
  const [url, setUrl] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [pageNum, setPageNum] = useState(1);
  const [zoom, setZoom] = useState(1.0);

  useEffect(() => {
    if (initialFile && user) {
      setCurrentFile(initialFile);
      setPageNum(1);
      fileService.getFileSignedUrl(user, initialFile.id)
        .then(setUrl)
        .catch(() => showToast("Falha ao autenticar acesso ao bucket.", "error"));
    }
  }, [initialFile, user, showToast]);

  const handleUpdateMetadata = useCallback(async (updatedMetadata: Partial<SteelBatchMetadata>) => {
    if (!currentFile) return;
    
    setIsSyncing(true);
    try {
        await fileService.updateFileMetadata(currentFile.id, updatedMetadata);
        
        // Atualiza estado local para reflexo imediato na UI
        setCurrentFile(prev => prev ? ({
            ...prev,
            metadata: { ...(prev.metadata || {}), ...updatedMetadata } as SteelBatchMetadata
        }) : null);
        
        showToast("Ledger Vital sincronizado com sucesso.", "success");
    } catch (e: any) {
        showToast(`Erro na persistência: ${e.message}`, "error");
    } finally {
        setIsSyncing(false);
    }
  }, [currentFile, showToast]);

  const handleDownload = useCallback(async () => {
    if (!currentFile || !user) return;
    try {
        const downloadUrl = await fileService.getFileSignedUrl(user, currentFile.id);
        window.open(downloadUrl, '_blank');
    } catch (e) {
        showToast("Erro ao processar download.", "error");
    }
  }, [currentFile, user, showToast]);

  return {
    currentFile,
    url,
    isSyncing,
    pageNum,
    setPageNum,
    zoom,
    setZoom,
    handleUpdateMetadata,
    handleDownload
  };
};
