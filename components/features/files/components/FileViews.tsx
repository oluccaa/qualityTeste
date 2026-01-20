
import React from 'react';
import { FileNode, FileType, UserRole } from '../../../../types/index.ts';
import { FileRow } from './FileRow.tsx';
import { FileCard } from './FileCard.tsx';

interface FileViewProps {
  files: FileNode[];
  onNavigate: (id: string | null) => void;
  onSelectFileForPreview: (file: FileNode | null) => void;
  selectedFileIds: string[];
  onToggleFileSelection: (fileId: string) => void;
  onDownload: (file: FileNode) => void;
  onRename: (file: FileNode) => void;
  onDelete: (fileId: string) => void;
  userRole: UserRole;
}

/**
 * FileListView (Collection View)
 */
export const FileListView: React.FC<FileViewProps> = ({ 
  files, onNavigate, onSelectFileForPreview, selectedFileIds, onToggleFileSelection 
}) => {
  return (
    <div className="min-w-full divide-y divide-slate-100 bg-white">
      <div className="flex items-center px-8 py-5 bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-[4px] border-b border-slate-200">
        <div className="w-10 shrink-0" />
        <div className="flex-1 px-6">Identificador / Nome do Ativo</div>
        <div className="w-24 hidden lg:block text-right px-4">Tamanho</div>
        <div className="w-40 hidden md:block">Atualização</div>
        <div className="w-32">Status</div>
        <div className="w-16 text-right">Selec.</div>
      </div>
      {files.map((file) => (
        <FileRow 
          key={file.id}
          file={file}
          isSelected={selectedFileIds.includes(file.id)}
          onNavigate={onNavigate}
          onPreview={onSelectFileForPreview}
          onToggleSelection={onToggleFileSelection}
        />
      ))}
    </div>
  );
};

/**
 * FileGridView (Collection View)
 */
export const FileGridView: React.FC<FileViewProps> = ({ 
  files, onNavigate, onSelectFileForPreview, selectedFileIds, onToggleFileSelection 
}) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-4 gap-6 p-8">
      {files.map((file) => (
        <FileCard 
          key={file.id}
          file={file}
          isSelected={selectedFileIds.includes(file.id)}
          onNavigate={onNavigate}
          onPreview={onSelectFileForPreview}
          onToggleSelection={onToggleFileSelection}
        />
      ))}
    </div>
  );
};
