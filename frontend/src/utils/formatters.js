// ── Shared formatting utilities ──

export const fmt = (n) =>
    `€${parseFloat(n || 0).toLocaleString('en-IE', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

export const fmtDec = (n) =>
    `€${parseFloat(n || 0).toLocaleString('en-IE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export const pct = (n) =>
    `${parseFloat(n || 0).toFixed(1)}%`;

export const fmtDate = (d) =>
    d ? new Date(d).toLocaleDateString('en-IE', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

export const fmtDateTime = (d) =>
    d ? new Date(d).toLocaleString('en-IE', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';

export const formatDateTime = (iso) => {
    if (!iso) return '—';
    return new Date(iso).toLocaleString('en-IE', {
        day: 'numeric', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
    });
};

export const formatDateTimeInput = (iso) => {
    if (!iso) return '';
    const d = new Date(iso);
    const pad = (n) => String(n).padStart(2, '0');
    return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}T${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}`;
};

export const staffName = (s) =>
    s ? (`${s.first_name} ${s.last_name}`.trim() || s.username) : '';

export const firstName = (s) =>
    staffName(s).split(' ')[0];

/**
 * Returns a URL safe for viewing a receipt in a new browser tab.
 * For Cloudinary image-type PDF URLs, swaps /image/upload/ → /raw/upload/
 * so the browser receives the actual PDF file (application/pdf) rather
 * than a Cloudinary JPEG page-preview render.
 */
export const receiptViewUrl = (url) => {
    if (!url) return null;
    const path = url.toLowerCase().split('?')[0];
    if (path.endsWith('.pdf') && url.includes('res.cloudinary.com') && url.includes('/image/upload/')) {
        return url.replace('/image/upload/', '/raw/upload/');
    }
    return url;
};
