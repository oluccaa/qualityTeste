
import React from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

interface PaginationControlsProps {
  currentPage: number;
  pageSize: number;
  totalItems: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  isLoading?: boolean;
}

export const PaginationControls: React.FC<PaginationControlsProps> = ({
  currentPage,
  pageSize,
  totalItems,
  onPageChange,
  onPageSizeChange,
  isLoading
}) => {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const startItem = (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);

  const pageSizes = [10, 20, 50, 100, 500];

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-6 py-4 bg-white border-t border-slate-100 rounded-b-3xl">
      <div className="flex items-center gap-4 order-2 sm:order-1">
        <div className="flex items-center gap-2">
          <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Exibir</p>
          <select
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            className="bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold px-2 py-1 outline-none focus:ring-2 focus:ring-blue-500/20"
          >
            {pageSizes.map(size => (
              <option key={size} value={size}>{size}</option>
            ))}
          </select>
        </div>
        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-tight">
          Mostrando <span className="text-slate-900">{startItem}-{endItem}</span> de <span className="text-slate-900">{totalItems}</span>
        </p>
      </div>

      <div className="flex items-center gap-1 order-1 sm:order-2">
        <NavButton 
          onClick={() => onPageChange(1)} 
          disabled={currentPage === 1 || isLoading} 
          icon={ChevronsLeft} 
        />
        <NavButton 
          onClick={() => onPageChange(currentPage - 1)} 
          disabled={currentPage === 1 || isLoading} 
          icon={ChevronLeft} 
        />
        
        <div className="flex items-center px-4">
          <span className="text-xs font-black text-slate-800">
            Página {currentPage} <span className="text-slate-300 mx-1">/</span> {totalPages}
          </span>
        </div>

        <NavButton 
          onClick={() => onPageChange(currentPage + 1)} 
          disabled={currentPage === totalPages || isLoading} 
          icon={ChevronRight} 
        />
        <NavButton 
          onClick={() => onPageChange(totalPages)} 
          disabled={currentPage === totalPages || isLoading} 
          icon={ChevronsRight} 
        />
      </div>
    </div>
  );
};

const NavButton = ({ onClick, disabled, icon: Icon }: any) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className="p-2 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-blue-600 disabled:opacity-20 disabled:hover:bg-transparent transition-all active:scale-90"
  >
    <Icon size={16} />
  </button>
);
