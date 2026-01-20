
import React, { useState, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../../context/authContext.tsx';
import { usePartnerCertificates } from '../hooks/usePartnerCertificates.ts';
import { FileExplorer } from '../../files/FileExplorer.tsx';
import { ExplorerToolbar } from '../../files/components/ExplorerToolbar.tsx';
import { FileNode, UserRole, FileType } from '../../../../types/index.ts';
import { fileService, partnerService } from '../../../../lib/services/index.ts';
import { FileCheck, Loader2, Layers } from 'lucide-react';

export const PartnerLibraryView: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const currentFolderId = searchParams.get('folderId');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>(() => 
    (localStorage.getItem('explorer_view_mode') as 'grid' | 'list') || 'grid'
  );
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFileIds, setSelectedFileIds] = useState<string[]>([]);
  
  const { files, isLoading, breadcrumbs, refresh } = usePartnerCertificates(currentFolderId, searchTerm);

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
        // NOVA LÓGICA: Navega para a página de preview
        navigate(`/preview/${file.id}`);
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
          <div className="flex-1 flex flex-col items-center justify-center bg-white rounded-[3rem] border-2 border-dashed border-slate-100 font-sans">
              <Loader2 className="animate-spin text-blue-600 mb-6" size={48} />
              <p className="text-[11px] font-black uppercase tracking-[6px] text-slate-400">Sincronizando Vault Vital...</p>
          </div>
      );
  }

  return (
    <div className="flex flex-col h-full gap-4 animate-in fade-in duration-700 overflow-hidden font-sans">
      <section className="bg-[#081437] rounded-[2rem] px-6 py-4 text-white relative overflow-hidden shadow-xl border border-white/5 shrink-0">
        <div className="relative z-10 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-gradient-to-br from-[#b23c0e] to-orange-600 rounded-xl flex items-center justify-center shadow-lg shrink-0">
               <Layers size={20} className="text-white" />
            </div>
            <div>
              <h2 className="text-lg font-black tracking-tight uppercase">Biblioteca de Ativos</h2>
              <p className="text-slate-400 text-[10px] font-medium uppercase tracking-widest">Acesso B2B Seguro</p>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-3 bg-white/5 px-4 py-1.5 rounded-xl border border-white/10">
             <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Total: <span className="text-white ml-1">{files.length}</span></p>
             <div className="w-px h-3 bg-white/10" />
             <div className="flex items-center gap-1.5 text-emerald-400">
                <FileCheck size={12} />
                <span className="text-[9px] font-black uppercase tracking-widest">Sincronizado</span>
             </div>
          </div>
        </div>
      </section>

      <div className="flex-1 min-h-0 flex flex-col bg-white rounded-[2rem] border border-slate-200 shadow-2xl overflow-hidden">
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

        <div className="flex-1 relative bg-white">
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
