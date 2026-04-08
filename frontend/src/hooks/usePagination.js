import { useState, useEffect, useMemo } from 'react';

/**
 * Client-side pagination hook.
 * Resets to page 1 whenever `items` changes (identity or length).
 *
 * @param {Array} items   - The full filtered array to paginate.
 * @param {number} [pageSize=20] - Items per page.
 * @returns {{ currentPage, setCurrentPage, totalPages, pagedItems }}
 */
const usePagination = (items, pageSize = 20) => {
    const [currentPage, setCurrentPage] = useState(1);

    const totalPages = Math.ceil(items.length / pageSize);

    const pagedItems = useMemo(
        () => items.slice((currentPage - 1) * pageSize, currentPage * pageSize),
        [items, currentPage, pageSize],
    );

    // Reset to page 1 when the source list changes
    useEffect(() => {
        setCurrentPage(1);
    }, [items.length]);

    return { currentPage, setCurrentPage, totalPages, pagedItems };
};

export default usePagination;
