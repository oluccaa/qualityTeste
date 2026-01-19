import React, { forwardRef, useImperativeHandle } from 'react'; 
import { Loader2, FileText } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { FileNode, BreadcrumbItem, UserRole } from '../../../types/index.ts';
import { FileListView, FileGridView } from './components/FileViews.tsx';

export interface FileExplorerHandle {
    clearSelection: () => void;
}

interface FileExplorerProps {
  files: FileNode[];
  loading: boolean;
  currentFolderId: string | null;
  searchTerm: string;
  breadcrumbs: BreadcrumbItem[];
  selectedFileIds: string[];
  viewMode: 'grid' | 'list';
  userRole: UserRole;
  
  onNavigate: (folderId: string | null) => void; 
  onFileSelectForPreview: (file: FileNode | null) => void; 
  onToggleFileSelection: (fileId: string) => void;

  onDownloadFile: (file: FileNode) => void;
  onRenameFile: (file: FileNode) => void;
  onDeleteFile: (fileId: string) => void;
}

export const FileExplorer = forwardRef<FileExplorerHandle, FileExplorerProps>((props, ref) => {
  const { t } = useTranslation();
  const { 
    files, loading, onNavigate, 
    onFileSelectForPreview, 
    selectedFileIds, onToggleFileSelection,
    onDownloadFile, onRenameFile, onDeleteFile, viewMode,
    userRole
  } = props;

  useImperativeHandle(ref, () => ({
      clearSelection: () => {}
  }));

  if (loading && files.length === 0) return <LoadingState t={t} />;
  if (!loading && files.length === 0) return <EmptyState t={t} />;

  const viewProps = {
    files,
    onNavigate,
    onSelectFileForPreview: onFileSelectForPreview,
    selectedFileIds,
    onToggleFileSelection,
    onDownload: onDownloadFile,
    onRename: onRenameFile,
    onDelete: onDeleteFile,
    userRole: userRole,
  };

  return (
    <div className="flex-1 overflow-y-auto custom-scrollbar p-6 bg-slate-50/30">
      <div className="max-w-[1600px] mx-auto">
        {viewMode === 'list' ? (
          <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
            <FileListView {...viewProps} />
          </div>
        ) : (
          <FileGridView {...viewProps} />
        )}
      </div>
    </div>
  );
});

const LoadingState = ({ t }: { t: any }) => (
  <div className="h-full flex flex-col items-center justify-center text-slate-400 gap-4 min-h-[400px]">
    <div className="relative">
      <Loader2 size={32} className="animate-spin text-blue-500/60" />
      <div className="absolute inset-0 blur-xl bg-blue-500/20 rounded-full animate-pulse" />
    </div>
    <span className="text-[11px] font-black uppercase tracking-[4px] text-slate-500">{t('common.loading')}</span>
  </div>
);

const EmptyState = ({ t }: { t: any }) => (
  <div className="h-full flex flex-col items-center justify-center text-slate-300 py-20 min-h-[400px] text-center">
    <FileText size={48} className="opacity-10 mb-6" />
    <p className="font-bold text-base text-slate-500 uppercase tracking-tight">{t('files.noResultsFound')}</p>
    <p className="text-xs text-slate-400 mt-2 font-medium">{t('files.typeToSearch')}</p>
  </div>
);

FileExplorer.displayName = 'FileExplorer';