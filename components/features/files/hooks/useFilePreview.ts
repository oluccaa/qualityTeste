
import { useState, useEffect, useCallback, useRef } from 'react';
import { FileNode, SteelBatchMetadata, User, FileType, UserRole, normalizeRole } from '../../../../types/index.ts';
import { fileService, partnerService } from '../../../../lib/services/index.ts';
import { useToast } from '../../../../context/notificationContext.tsx';

export const useFilePreview = (user: User | null, initialFile: FileNode | null) => {
  // Fix: Corrected hook call from showToast() to useToast() to avoid self-referencing declaration error
  const { showToast } = useToast();
  const [currentFile, setCurrentFile] = useState<FileNode | null>(initialFile);
  const [url, setUrl] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [pageNum, setPageNum] = useState(1);
  const [zoom, setZoom] = useState(1.0);
  
  const isLoadedRef = useRef(false);
  const hasLoggedViewRef = useRef(false);

  const loadFileDetails = useCallback(async (id: string) => {
    if (!user) return;
    setIsSyncing(true);
    try {
        const fileData = await fileService.getFile(user, id);
        setCurrentFile(fileData);
        
        const signed = await fileService.getFileSignedUrl(user, id);
        setUrl(signed);

        // Se for cliente, loga a visualização após carregar os detalhes
        if (normalizeRole(user.role) === UserRole.CLIENT && !hasLoggedViewRef.current) {
            hasLoggedViewRef.current = true;
            await partnerService.logFileView(user, fileData);
        }
    } catch (e: any) {
        console.error("[useFilePreview] Falha técnica:", e);
        showToast(e.message || "Falha ao autenticar acesso ao repositório.", "error");
    } finally {
        setIsSyncing(false);
    }
  }, [user, showToast]);

  useEffect(() => {
    if (!user || !initialFile?.id) return;
    
    if (!initialFile.name) {
        loadFileDetails(initialFile.id);
    } else if (!isLoadedRef.current) {
        isLoadedRef.current = true;
        fileService.getFileSignedUrl(user, initialFile.id)
            .then(async (signedUrl) => {
                setUrl(signedUrl);
                // Se for cliente e já temos o objeto do arquivo, loga a visualização
                if (normalizeRole(user.role) === UserRole.CLIENT && !hasLoggedViewRef.current) {
                    hasLoggedViewRef.current = true;
                    await partnerService.logFileView(user, initialFile);
                }
            })
            .catch(e => showToast("Erro ao gerar link de visualização.", "error"));
    }
  }, [initialFile?.id, user, loadFileDetails, initialFile?.name, showToast]);

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

        await fileService.updateFileMetadata(currentFile.id, {
            replacementFileId: uploaded.id,
            status: 'SENT' as any
        });

        setCurrentFile(uploaded);
        const newUrl = await fileService.getFileSignedUrl(user, uploaded.id);
        setUrl(newUrl);
        
        showToast(`Versão ${nextVersion} implementada com sucesso.`, "success");
    } catch (e: any) {
        showToast(`Falha no versionamento: ${e.message}`, "error");
    } finally {
        setIsSyncing(false);
    }
  }, [currentFile, user, showToast]);

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
