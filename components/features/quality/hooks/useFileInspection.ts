
import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../../context/authContext.tsx';
import { useToast } from '../../../../context/notificationContext.tsx';
import { FileNode, QualityStatus, FileType, SteelBatchMetadata } from '../../../../types/index.ts';
import { qualityService, fileService } from '../../../../lib/services/index.ts';
import { supabase } from '../../../../lib/supabaseClient.ts';

export const useFileInspection = () => {
  const { fileId } = useParams<{ fileId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showToast } = useToast();

  const [inspectorFile, setInspectorFile] = useState<FileNode | null>(null);
  const [loadingFile, setLoadingFile] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [mainPreviewUrl, setMainPreviewUrl] = useState<string | null>(null);
  const [previewFile, setPreviewFile] = useState<FileNode | null>(null);

  const fetchDetails = useCallback(async () => {
    if (!user || !fileId) return;
    setLoadingFile(true);
    try {
      const { data, error } = await supabase.from('files').select('*').eq('id', fileId).single();
      if (error || !data) throw new Error("Não localizado");

      const file = {
        ...data,
        ownerId: data.owner_id,
        type: data.type as FileType,
        updatedAt: data.updated_at,
        storagePath: data.storage_path,
        metadata: data.metadata 
      } as FileNode;

      setInspectorFile(file);
      const url = await fileService.getSignedUrl(file.storagePath);
      setMainPreviewUrl(url);
    } catch (err) {
      showToast("Falha na sincronização técnica.", 'error');
      navigate(-1);
    } finally {
      setLoadingFile(false);
    }
  }, [fileId, user, navigate, showToast]);

  useEffect(() => {
    fetchDetails();
  }, [fetchDetails]);

  const handleInspectAction = async (updates: Partial<SteelBatchMetadata>) => {
    if (!inspectorFile || !user) return;
    setIsProcessing(true);
    
    try {
      await qualityService.submitVeredict(user, inspectorFile, updates);
      showToast(`Protocolo industrial atualizado.`, 'success');
      
      setInspectorFile(prev => prev ? ({ 
        ...prev, 
        metadata: { ...prev.metadata!, ...updates } 
      }) : null);
    } catch (err) {
      showToast("Falha ao gravar veredito no ledger.", 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUploadEvidence = async (file: File) => {
    if (!inspectorFile || !user) return;
    setIsProcessing(true);
    try {
        const { data: evidenceFolder, error: folderError } = await supabase.from('files').upsert({
            name: 'Fotos e Evidências',
            type: 'FOLDER',
            parent_id: inspectorFile.parentId,
            owner_id: inspectorFile.ownerId,
            storage_path: 'system/folder',
            metadata: { status: 'SENT', is_evidence_folder: true }
        }, { onConflict: 'name,parent_id' }).select().single();

        if (folderError) throw folderError;

        const sanitizedName = file.name
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/\s+/g, "_")
            .replace(/[^a-zA-Z0-9._-]/g, "")
            .toLowerCase();
            
        const filePath = `${inspectorFile.ownerId}/${evidenceFolder.id}/${Date.now()}-${sanitizedName}`;

        const { error: uploadError } = await supabase.storage.from('certificates').upload(filePath, file);
        if (uploadError) throw uploadError;

        await supabase.from('files').insert({
            name: file.name,
            type: 'IMAGE',
            parent_id: evidenceFolder.id,
            owner_id: inspectorFile.ownerId,
            storage_path: filePath,
            size: `${(file.size / 1024 / 1024).toFixed(2)} MB`,
            metadata: { status: 'SENT', source: 'INSPECTION_EVIDENCE' }
        });

        showToast("Evidência anexada com sucesso.", "success");
    } catch (err) {
        showToast("Erro ao anexar evidência.", "error");
    } finally {
        setIsProcessing(false);
    }
  };

  return {
    inspectorFile,
    loadingFile,
    isProcessing,
    mainPreviewUrl,
    handleInspectAction,
    handleUploadEvidence,
    previewFile,
    setPreviewFile,
    user,
    handleDownload: async (file: FileNode) => {
      try {
        const url = await fileService.getSignedUrl(file.storagePath);
        window.open(url, '_blank');
      } catch { showToast("Erro ao baixar PDF.", 'error'); }
    },
    handleBackToClientFiles: () => navigate(-1)
  };
};
