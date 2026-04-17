import { ChevronLeft, ChevronRight } from 'lucide-react';

const Pagination = ({ currentPage, totalPages, onPageChange }) => {
    if (totalPages <= 1) return null;

    // Build visible page numbers: always show first, last, current ±1, with ellipsis
    const pages = [];
    for (let i = 1; i <= totalPages; i++) {
        if (i === 1 || i === totalPages || (i >= currentPage - 1 && i <= currentPage + 1)) {
            pages.push(i);
        } else if (pages[pages.length - 1] !== '...') {
            pages.push('...');
        }
    }

    const btnBase = "flex items-center justify-center w-8 h-8 rounded-lg text-sm font-medium transition-all";
    const navBtn = `${btnBase} text-gray-400 hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed`;

    return (
        <div className="flex items-center justify-center gap-1 px-4 py-3 border-t border-white/10">
            <button
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className={navBtn}
            >
                <ChevronLeft size={16} />
            </button>

            {/* Mobile: compact "X of Y" label */}
            <span className="sm:hidden text-sm text-gray-400 px-3">
                {currentPage} <span className="text-gray-600">/ {totalPages}</span>
            </span>

            {/* Desktop: numbered buttons with ellipsis */}
            <span className="hidden sm:contents">
                {pages.map((p, i) =>
                    p === '...' ? (
                        <span key={`ellipsis-${i}`} className="w-8 text-center text-gray-600 text-sm">…</span>
                    ) : (
                        <button
                            key={p}
                            onClick={() => onPageChange(p)}
                            className={`${btnBase} ${p === currentPage
                                ? 'bg-mustard-gold text-deep-teal font-bold'
                                : 'text-gray-400 hover:text-white hover:bg-white/10'
                            }`}
                        >
                            {p}
                        </button>
                    )
                )}
            </span>

            <button
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className={navBtn}
            >
                <ChevronRight size={16} />
            </button>
        </div>
    );
};

export default Pagination;
