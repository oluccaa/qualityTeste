import React from 'react';
// Fix: Added Archive to the imports from lucide-react
import { Archive, ChevronRight, List, LayoutGrid, Search, UploadCloud, FolderPlus, Trash2, Home, Filter, Calendar, User, FileType as FileIcon, MoreHorizontal, SlidersHorizontal } from 'lucide-react';
import { BreadcrumbItem, FileNode, UserRole } from '../../../../types/index.ts';
import { useTranslation } from 'react-i18next';

interface ExplorerToolbarProps {
  viewMode: 'grid' | 'list';
  onViewChange: (mode: 'grid' | 'list') => void;
  onNavigate: (folderId: string | null) => void;
  breadcrumbs: BreadcrumbItem[];
  searchTerm: string;
  onSearchChange: (term: string) => void;
  onUploadClick: () => void;
  onCreateFolderClick: () => void;
  selectedCount: number;
  onDeleteSelected: () => void;
  onRenameSelected: () => void;
  onDownloadSelected: () => void;
  userRole: UserRole;
  selectedFilesData: FileNode[];
}

export const ExplorerToolbar: React.FC<ExplorerToolbarProps> = ({ 
  viewMode, onViewChange, onNavigate, breadcrumbs, searchTerm, onSearchChange,
  onUploadClick, onCreateFolderClick, selectedCount, onDeleteSelected, onRenameSelected, onDownloadSelected, userRole
}) => {
  const { t } = useTranslation();

  return (
    <div className="bg-white flex flex-col gap-4 p-4 md:px-8 md:py-6">
      <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
        {/* Advanced Breadcrumbs Control */}
        <div className="flex-1 min-w-0 w-full lg:w-auto">
          <Breadcrumbs breadcrumbs={breadcrumbs} onNavigate={onNavigate} />
        </div>

        {/* Action Center */}
        <div className="flex items-center gap-4 shrink-0 w-full lg:w-auto justify-end">
          {selectedCount > 0 ? (
            <div className="flex items-center gap-2 bg-blue-600 px-6 py-2.5 rounded-[1.2rem] shadow-xl shadow-blue-600/20 animate-in zoom-in-95 border border-blue-500">
                <span className="text-[10px] font-black text-white uppercase tracking-widest mr-4 border-r border-white/20 pr-4">{selectedCount} Selecionados</span>
                <div className="flex items-center gap-1">
                    <button onClick={onDownloadSelected} className="p-2 text-white hover:bg-white/10 rounded-lg transition-all" title="Baixar Selecionados"><SlidersHorizontal size={16}/></button>
                    {userRole !== UserRole.CLIENT && (
                        <>
                            <button onClick={onRenameSelected} className="p-2 text-white hover:bg-white/10 rounded-lg transition-all"><MoreHorizontal size={16}/></button>
                            <button onClick={onDeleteSelected} className="p-2 text-red-100 hover:bg-red-500 rounded-lg transition-all"><Trash2 size={16}/></button>
                        </>
                    )}
                </div>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              {userRole !== UserRole.CLIENT && (
                <div className="flex items-center gap-2 mr-2">
                  <button onClick={onUploadClick} className="flex items-center gap-3 px-6 py-3 bg-slate-900 hover:bg-black text-white rounded-2xl text-[10px] font-black uppercase tracking-[2px] shadow-2xl transition-all active:scale-95 group">
                    <UploadCloud size={16} className="text-blue-400 group-hover:scale-110 transition-transform" /> Importar Ativo
                  </button>
                  <button onClick={onCreateFolderClick} className="p-3 text-slate-500 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-2xl transition-all" title="Novo Dossier">
                    <FolderPlus size={20} />
                  </button>
                </div>
              )}
              
              <div className="h-8 w-px bg-slate-200 mx-2 hidden md:block" />
              
              <div className="flex bg-slate-100 p-1.5 rounded-2xl border border-slate-200/50">
                <button 
                    onClick={() => onViewChange('list')} 
                    className={`p-2.5 rounded-xl transition-all ${viewMode === 'list' ? 'bg-white shadow-xl text-blue-600 ring-1 ring-slate-100' : 'text-slate-400 hover:text-slate-600'}`}
                    title="Lista Detalhada"
                >
                    <List size={18}/>
                </button>
                <button 
                    onClick={() => onViewChange('grid')} 
                    className={`p-2.5 rounded-xl transition-all ${viewMode === 'grid' ? 'bg-white shadow-xl text-blue-600 ring-1 ring-slate-100' : 'text-slate-400 hover:text-slate-600'}`}
                    title="Mosaico Técnico"
                >
                    <LayoutGrid size={18}/>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Advanced Filter Bar - Simplified: Removed Category, Auditor, Period, and Status chips */}
      <div className="flex items-center gap-4 border-t border-slate-50 pt-4 overflow-x-auto no-scrollbar">
        <div className="relative group w-full max-w-sm shrink-0">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-500 transition-colors" size={16} />
          <input 
            type="text" 
            placeholder="Rastrear por Lote, Certificado ou Tag..."
            className="pl-12 pr-4 py-3 bg-slate-100/50 border border-slate-200/60 rounded-[1.2rem] text-xs font-bold w-full outline-none focus:bg-white focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500/30 transition-all placeholder:text-slate-400" 
            value={searchTerm} 
            onChange={e => onSearchChange(e.target.value)} 
          />
        </div>
      </div>
    </div>
  );
};

const Breadcrumbs: React.FC<{ breadcrumbs: BreadcrumbItem[]; onNavigate: (id: string | null) => void }> = ({ breadcrumbs, onNavigate }) => (
  <nav className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
    {breadcrumbs.map((item, index) => {
      const isLast = index === breadcrumbs.length - 1;
      return (
        <React.Fragment key={item.id || `bc-${index}`}>
          <button 
            onClick={() => onNavigate(item.id)}
            className={`px-4 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-[2px] transition-all whitespace-nowrap flex items-center gap-3
              ${isLast ? 'text-blue-600 bg-blue-50 border border-blue-100 shadow-sm' : 'text-slate-400 hover:text-slate-900 hover:bg-slate-100'}
            `}
            disabled={isLast}
          >
            {index === 0 ? <Archive size={16} className={isLast ? 'text-blue-600' : 'text-slate-400'} /> : null}
            {item.name}
          </button>
          {!isLast && (
              <div className="flex items-center justify-center w-6 h-6 rounded-full bg-slate-100 border border-slate-200 shrink-0">
                <ChevronRight size={12} className="text-slate-400" />
              </div>
          )}
        </React.Fragment>
      );
    })}
  </nav>
);