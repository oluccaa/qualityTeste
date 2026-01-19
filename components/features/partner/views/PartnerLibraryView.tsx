
import React, { useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../../../../context/authContext.tsx';
import { usePartnerCertificates } from '../hooks/usePartnerCertificates.ts';
import { FileExplorer } from '../../files/FileExplorer.tsx';
import { ExplorerToolbar } from '../../files/components/ExplorerToolbar.tsx';
import { FilePreviewModal } from '../../files/FilePreviewModal.tsx';
import { FileNode, UserRole, FileType } from '../../../../types/index.ts';
import { fileService, partnerService } from '../../../../lib/services/index.ts';
import { Archive, FileCheck, Loader2, Layers } from 'lucide-react';

/**
 * Biblioteca de arquivos remasterizada para Parceiros Aços Vital.
 * Visual Premium Pro com foco em cards largos e navegação direta.
 */
export const PartnerLibraryView: React.FC = () => {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const currentFolderId = searchParams.get('folderId');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFileIds, setSelectedFileIds] = useState<string[]>([]);
  
  const { files, isLoading, breadcrumbs, refresh } = usePartnerCertificates(currentFolderId, searchTerm);
  
  const [previewFile, setPreviewFile] = useState<FileNode | null>(null);

  const handleNavigate = useCallback((id: string | null) => {
    setSelectedFileIds([]);
    setSearchParams(prev => {
        if (id) prev.set('folderId', id);
        else prev.delete('folderId');
        return prev;
    }, { replace: true });
  }, [setSearchParams]);

  const handleFileClick = async (file: FileNode) => {
    if (file.type === FileType.FOLDER) {
        handleNavigate(file.id);
    } else {
        if (user) await partnerService.logFileView(user, file);
        setPreviewFile(file);
    }
  };

  const handleDownload = async (file: FileNode) => {
    try {
        const url = await fileService.getFileSignedUrl(user!, file.id);
        window.open(url, '_blank');
    } catch (e) {
        console.error("Falha ao baixar arquivo:", e);
    }
  };

  if (isLoading && files.length === 0) {
      return (
          <div className="h-96 flex flex-col items-center justify-center bg-white rounded-[3rem] border-2 border-dashed border-slate-100">
              <Loader2 className="animate-spin text-blue-600 mb-6" size={48} />
              <p className="text-[11px] font-black uppercase tracking-[6px] text-slate-400">Sincronizando Vault Vital...</p>
          </div>
      );
  }

  return (
    <div className="flex flex-col gap-10 animate-in fade-in duration-700">
      {/* Premium Hero Section */}
      <section className="bg-[#081437] rounded-[3.5rem] p-12 text-white relative overflow-hidden shadow-3xl border border-white/5">
        <div className="absolute inset-0 opacity-[0.05] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#fff 2px, transparent 2px)', backgroundSize: '40px 40px' }} />
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-blue-600/20 rounded-full blur-[120px]" />
        
        <div className="relative z-10 flex flex-col xl:flex-row items-center justify-between gap-12">
          <div className="flex flex-col md:flex-row items-center gap-12 text-center md:text-left">
            <div className="w-28 h-28 bg-gradient-to-br from-[#b23c0e] to-orange-600 rounded-[2.8rem] flex items-center justify-center border-4 border-white/10 shrink-0 shadow-2xl rotate-2 hover:rotate-0 transition-transform duration-700">
               <Layers size={56} className="text-white" />
            </div>
            <div className="space-y-4">
              <div className="flex items-center gap-3 justify-center md:justify-start">
                  <span className="px-4 py-1.5 bg-blue-500/20 border border-blue-400/30 rounded-full text-[10px] font-black uppercase tracking-[3px] text-blue-400">Raiz Corporativa Ativa</span>
                  <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              </div>
              <h2 className="text-5xl font-black tracking-tighter leading-none uppercase">Biblioteca de arquivos</h2>
              <p className="text-slate-400 text-lg max-w-2xl leading-relaxed font-medium">
                Terminal de ativos técnicos da <b>Aços Vital</b>. Gerencie certificados e laudos com rastreabilidade criptográfica e visualização de alta fidelidade.
              </p>
            </div>
          </div>

          <div className="bg-white/5 backdrop-blur-2xl p-8 rounded-[3rem] border border-white/10 flex flex-col items-center gap-3 min-w-[220px] shadow-inner">
             <p className="text-[11px] font-black text-slate-500 uppercase tracking-[3px]">Total de Ativos</p>
             <p className="text-5xl font-black text-white tracking-tighter">{files.length}</p>
             <div className="flex items-center gap-2 text-emerald-400 bg-emerald-400/10 px-4 py-1 rounded-full">
                <FileCheck size={14} />
                <span className="text-[10px] font-black uppercase tracking-widest">Sincronizado</span>
             </div>
          </div>
        </div>
      </section>

      {/* Main Command Station */}
      <div className="flex flex-col bg-white rounded-[3.5rem] border border-slate-200 shadow-2xl shadow-slate-900/5 overflow-hidden min-h-[800px] transition-all">
        <FilePreviewModal 
          initialFile={previewFile}
          isOpen={!!previewFile} 
          onClose={() => { setPreviewFile(null); refresh(); }} 
          onDownloadFile={handleDownload} 
        />

        <div className="bg-slate-50/50 border-b border-slate-100 p-3">
            <ExplorerToolbar
                breadcrumbs={breadcrumbs}
                onNavigate={handleNavigate}
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
                onUploadClick={() => {}} 
                onCreateFolderClick={() => {}}
                selectedCount={selectedFileIds.length}
                onDeleteSelected={() => {}} 
                onRenameSelected={() => {}}
                onDownloadSelected={() => {
                    const selected = files.find(f => f.id === selectedFileIds[0]);
                    if (selected) handleDownload(selected);
                }}
                viewMode={viewMode}
                onViewChange={setViewMode}
                selectedFilesData={files.filter(f => selectedFileIds.includes(f.id))}
                userRole={UserRole.CLIENT}
            />
        </div>

        <div className="flex-1 flex flex-col relative bg-white">
            <FileExplorer 
                files={files} 
                loading={isLoading}
                currentFolderId={currentFolderId}
                searchTerm={searchTerm}
                breadcrumbs={breadcrumbs}
                selectedFileIds={selectedFileIds}
                onToggleFileSelection={(id) => setSelectedFileIds(prev => prev.includes(id) ? [] : [id])}
                onNavigate={handleNavigate}
                onFileSelectForPreview={handleFileClick}
                onDownloadFile={handleDownload}
                onRenameFile={() => {}}
                onDeleteFile={() => {}}
                viewMode={viewMode}
                userRole={UserRole.CLIENT}
            />
        </div>
      </div>
    </div>
  );
};
