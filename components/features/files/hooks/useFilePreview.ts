
import { useState, useEffect, useCallback } from 'react';
import { FileNode, SteelBatchMetadata, User, FileType } from '../../../../types/index.ts';
import { fileService } from '../../../../lib/services/index.ts';
import { useToast } from '../../../../context/notificationContext.tsx';

export const useFilePreview = (user: User | null, initialFile: FileNode | null) => {
  const { showToast } = useToast();
  const [currentFile, setCurrentFile] = useState<FileNode | null>(initialFile);
  const [url, setUrl] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [pageNum, setPageNum] = useState(1);
  const [zoom, setZoom] = useState(1.0);

  const loadFileUrl = useCallback(async (file: FileNode) => {
    if (!user) return;
    try {
        const signed = await fileService.getFileSignedUrl(user, file.id);
        setUrl(signed);
    } catch (e) {
        showToast("Falha ao autenticar acesso ao bucket.", "error");
    }
  }, [user, showToast]);

  useEffect(() => {
    if (initialFile && user) {
      setCurrentFile(initialFile);
      setPageNum(1);
      loadFileUrl(initialFile);
    }
  }, [initialFile, user, loadFileUrl]);

  const handleUpdateMetadata = useCallback(async (updatedMetadata: Partial<SteelBatchMetadata>) => {
    if (!currentFile) return;
    
    setIsSyncing(true);
    try {
        await fileService.updateFileMetadata(currentFile.id, updatedMetadata);
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

  const handleReplacementUpload = useCallback(async (newFileBlob: File) => {
    if (!currentFile || !user || !currentFile.ownerId) return;
    
    setIsSyncing(true);
    try {
        // 1. Sobe o novo arquivo físico como uma nova versão
        const nextVersion = (currentFile.versionNumber || 1) + 1;
        const newFileName = `v${nextVersion}_${currentFile.name.replace(/^v\d+_/, '')}`;
        
        const uploaded = await fileService.uploadFile(user, {
            name: newFileName,
            fileBlob: newFileBlob,
            parentId: currentFile.parentId,
            type: FileType.PDF,
            size: `${(newFileBlob.size / 1024 / 1024).toFixed(2)} MB`,
            mimeType: 'application/pdf'
        }, currentFile.ownerId);

        // 2. Atualiza metadados do original com link para o substituto
        await fileService.updateFileMetadata(currentFile.id, {
            replacementFileId: uploaded.id,
            status: 'SENT' as any // Reinicia o status ou marca como substituído
        });

        // 3. Muda a visualização para o novo arquivo
        setCurrentFile(uploaded);
        await loadFileUrl(uploaded);
        
        showToast(`Versão ${nextVersion} implementada com sucesso.`, "success");
    } catch (e: any) {
        showToast(`Falha no versionamento: ${e.message}`, "error");
    } finally {
        setIsSyncing(false);
    }
  }, [currentFile, user, showToast, loadFileUrl]);

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
    handleDownload,
    handleReplacementUpload
  };
};
