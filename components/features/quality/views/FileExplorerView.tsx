import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../../../../context/authContext.tsx';
import { useTranslation } from 'react-i18next';
import { FileNode, FileType, UserRole } from '../../../../types/index.ts';
import { useFileExplorer } from '../../files/hooks/useFileExplorer.ts';
import { FileExplorer, FileExplorerHandle } from '../../files/FileExplorer.tsx';
import { ExplorerToolbar } from '../../files/components/ExplorerToolbar.tsx';
import { FilePreviewModal } from '../../files/FilePreviewModal.tsx';
import { CreateFolderModal } from '../../files/modals/CreateFolderModal.tsx';
import { RenameModal } from '../../files/modals/RenameModal.tsx';
import { UploadFileModal } from '../../files/modals/UploadFileModal.tsx';
import { DeleteConfirmationModal } from '../../files/modals/DeleteConfirmationModal.tsx';
import { QualityLoadingState, ProcessingOverlay } from '../components/ViewStates.tsx';
import { fileService } from '../../../../lib/services/index.ts';
import { supabase } from '../../../../lib/supabaseClient.ts';
import { Info, FileText, Clock, ShieldCheck, User } from 'lucide-react';

interface FileExplorerViewProps {
  orgId: string;
}

export const FileExplorerView: React.FC<FileExplorerViewProps> = ({ orgId }) => {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const currentFolderId = searchParams.get('folderId');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFileIds, setSelectedFileIds] = useState<string[]>([]);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [selectedFileForPreview, setSelectedFileForPreview] = useState<FileNode | null>(null);
  const [showInfoPanel, setShowInfoPanel] = useState(true);
  
  const [isReady, setIsReady] = useState(false);
  const [isCreateFolderModalOpen, setIsCreateFolderModalOpen] = useState(false);
  const [isRenameModalOpen, setIsRenameModalOpen] = useState(false);
  const [fileToRename, setFileToRename] = useState<FileNode | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const fileExplorerRef = useRef<FileExplorerHandle>(null);

  useEffect(() => {
    const resolveInitialFolder = async () => {
      if (orgId && orgId !== 'global' && !currentFolderId) {
        setIsReady(false);
        const { data } = await supabase.from('files')
          .select('id')
          .eq('owner_id', orgId)
          .is('parent_id', null)
          .maybeSingle();
          
        if (data?.id) {
            setSearchParams(p => { p.set('folderId', data.id); p.set('orgId', orgId); return p; }, { replace: true });
        }
      }
      setIsReady(true);
    };
    resolveInitialFolder();
  }, [orgId, currentFolderId, setSearchParams]);

  const {
    files, loading, breadcrumbs,
    handleDeleteFiles, handleRenameFile, handleCreateFolder, handleUploadFile
  } = useFileExplorer({ currentFolderId, searchTerm, viewMode, ownerId: orgId });

  const activeSelectedFile = files.find(f => f.id === selectedFileIds[selectedFileIds.length - 1]) || null;

  const handleNavigate = useCallback((folderId: string | null) => {
    setSelectedFileIds([]);
    setSearchParams(prev => {
      if (folderId) prev.set('folderId', folderId);
      else prev.delete('folderId');
      prev.set('orgId', orgId); 
      return prev;
    }, { replace: true });
  }, [setSearchParams, orgId]);

  const toggleSelection = (id: string) => {
    setSelectedFileIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  if (!isReady) return <QualityLoadingState message="Acessando Repositório..." />;

  return (
    <div className="flex flex-col h-full bg-slate-50 rounded-[2.5rem] border border-slate-200 shadow-2xl overflow-hidden min-h-[700px] animate-in fade-in duration-700">
      {isProcessing && <ProcessingOverlay message="Atualizando Ledger..." />}
      
      <FilePreviewModal 
        initialFile={selectedFileForPreview}
        isOpen={isPreviewOpen} 
        onClose={() => setIsPreviewOpen(false)} 
        onDownloadFile={async (f) => {
            const url = await fileService.getFileSignedUrl(user!, f.id);
            window.open(url, '_blank');
        }}
      />

      <UploadFileModal isOpen={isUploadModalOpen} onClose={() => setIsUploadModalOpen(false)} onUpload={async (f, n) => { setIsProcessing(true); await handleUploadFile(f, n, currentFolderId); setIsUploadModalOpen(false); setIsProcessing(false); }} isUploading={isProcessing} currentFolderId={currentFolderId} />
      <CreateFolderModal isOpen={isCreateFolderModalOpen} onClose={() => setIsCreateFolderModalOpen(false)} onCreate={async (n) => { setIsProcessing(true); await handleCreateFolder(n, currentFolderId); setIsCreateFolderModalOpen(false); setIsProcessing(false); }} isCreating={isProcessing} />
      <RenameModal isOpen={isRenameModalOpen} onClose={() => setIsRenameModalOpen(false)} onRename={async (n) => { setIsProcessing(true); await handleRenameFile(fileToRename!.id, n); setIsRenameModalOpen(false); setIsProcessing(false); }} isRenaming={isProcessing} currentName={fileToRename?.name || ''} />
      <DeleteConfirmationModal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} onConfirm={async () => { setIsProcessing(true); await handleDeleteFiles(selectedFileIds); setIsDeleteModalOpen(false); setSelectedFileIds([]); setIsProcessing(false); }} isDeleting={isProcessing} itemCount={selectedFileIds.length} hasFolder={files.some(f => selectedFileIds.includes(f.id) && f.type === FileType.FOLDER)} />

      <ExplorerToolbar
        breadcrumbs={breadcrumbs}
        onNavigate={handleNavigate}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        onUploadClick={() => setIsUploadModalOpen(true)} 
        onCreateFolderClick={() => setIsCreateFolderModalOpen(true)}
        selectedCount={selectedFileIds.length}
        onDeleteSelected={() => setIsDeleteModalOpen(true)} 
        onRenameSelected={() => { if(activeSelectedFile) { setFileToRename(activeSelectedFile); setIsRenameModalOpen(true); } }}
        onDownloadSelected={async () => { if(activeSelectedFile) { const url = await fileService.getFileSignedUrl(user!, activeSelectedFile.id); window.open(url, '_blank'); } }}
        viewMode={viewMode}
        onViewChange={setViewMode}
        userRole={user?.role as UserRole}
        selectedFilesData={files.filter(f => selectedFileIds.includes(f.id))}
      />

      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 overflow-hidden flex flex-col bg-white">
          <FileExplorer 
            ref={fileExplorerRef}
            files={files} 
            loading={loading}
            currentFolderId={currentFolderId}
            searchTerm={searchTerm}
            breadcrumbs={breadcrumbs}
            selectedFileIds={selectedFileIds}
            onToggleFileSelection={toggleSelection}
            onNavigate={handleNavigate}
            onFileSelectForPreview={(f) => { setSelectedFileForPreview(f); setIsPreviewOpen(true); }}
            onDownloadFile={() => {}}
            onRenameFile={(f) => { setFileToRename(f); setIsRenameModalOpen(true); }}
            onDeleteFile={(id) => { setSelectedFileIds([id]); setIsDeleteModalOpen(true); }}
            viewMode={viewMode}
            userRole={user?.role as UserRole}
          />
        </div>

        {showInfoPanel && (
          <aside className="w-80 border-l border-slate-100 bg-white hidden xl:flex flex-col animate-in slide-in-from-right duration-500">
            <div className="p-6 border-b border-slate-50 flex items-center justify-between">
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                    <Info size={16} className="text-blue-500" /> Detalhes
                </h3>
                <button onClick={() => setShowInfoPanel(false)} className="text-slate-400 hover:text-slate-600">×</button>
            </div>
            
            <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-8">
                {activeSelectedFile ? (
                   <>
                    <div className="flex flex-col items-center text-center">
                        <div className="w-20 h-20 bg-slate-50 rounded-2xl flex items-center justify-center mb-4 shadow-inner">
                            {activeSelectedFile.type === FileType.FOLDER ? <FileText size={40} className="text-blue-500 opacity-20" /> : <FileText size={40} className="text-slate-400" />}
                        </div>
                        <h4 className="text-sm font-bold text-slate-900 break-all leading-tight">{activeSelectedFile.name}</h4>
                    </div>

                    <div className="space-y-4 pt-4 border-t border-slate-50">
                        <InfoItem icon={ShieldCheck} label="Status Vital" value={activeSelectedFile.metadata?.status || 'Pendente'} color="text-emerald-600" />
                        <InfoItem icon={Clock} label="Última Sincronização" value={new Date(activeSelectedFile.updatedAt).toLocaleDateString()} />
                        <InfoItem icon={User} label="Autor do Ativo" value={activeSelectedFile.authorName || 'Sistema'} />
                        <InfoItem icon={FileText} label="Dimensão" value={activeSelectedFile.size || '--'} />
                    </div>

                    {activeSelectedFile.metadata && (
                        <div className="bg-blue-50/50 p-4 rounded-2xl border border-blue-100/50 space-y-2">
                            <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Protocolo Metalúrgico</p>
                            <p className="text-xs text-blue-800 font-bold">Lote: {activeSelectedFile.metadata.batchNumber || 'N/A'}</p>
                            <p className="text-xs text-blue-700">Norma: {activeSelectedFile.metadata.grade || 'N/A'}</p>
                        </div>
                    )}
                   </>
                ) : (
                    <div className="h-full flex flex-col items-center justify-center text-slate-300 text-center space-y-4 opacity-50">
                        <FileText size={48} />
                        <p className="text-xs font-bold uppercase tracking-widest leading-relaxed">Selecione um recurso para visualizar metadados técnicos</p>
                    </div>
                )}
            </div>
          </aside>
        )}
      </div>
    </div>
  );
};

const InfoItem = ({ icon: Icon, label, value, color = "text-slate-600" }: any) => (
    <div className="space-y-1">
        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
            <Icon size={12} /> {label}
        </p>
        <p className={`text-xs font-bold ${color}`}>{value}</p>
    </div>
);