// ── File upload validation ───────────────────────────────────────
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const ALLOWED_FILE_TYPES = [...ALLOWED_IMAGE_TYPES, 'application/pdf'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

export function validateFile(file, { allowPdf = false } = {}) {
    const allowed = allowPdf ? ALLOWED_FILE_TYPES : ALLOWED_IMAGE_TYPES;
    if (!allowed.includes(file.type)) {
        const types = allowPdf ? 'JPEG, PNG, WebP, GIF, or PDF' : 'JPEG, PNG, WebP, or GIF';
        return `"${file.name}" is not an allowed type. Accepted: ${types}.`;
    }
    if (file.size > MAX_FILE_SIZE) {
        return `"${file.name}" exceeds the 5 MB size limit.`;
    }
    return null;
}

// ── URL validation ──────────────────────────────────────────────
export function validateImageUrl(urlString) {
    try {
        const url = new URL(urlString);
        if (!['http:', 'https:'].includes(url.protocol)) return 'Only HTTP/HTTPS URLs are allowed.';
        const host = url.hostname;
        if (['localhost', '127.0.0.1', '0.0.0.0'].includes(host) ||
            host.startsWith('192.168.') || host.startsWith('10.') || host.startsWith('172.')) {
            return 'Internal network URLs are not allowed.';
        }
        return null;
    } catch {
        return 'Invalid URL format.';
    }
}

// ── Contact form validation ─────────────────────────────────────
export const isValidEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
export const isValidPhone = (v) => !v || (/^[\d\s+\-()]+$/.test(v) && v.replace(/\D/g, '').length >= 7);
export const MAX_MESSAGE_LENGTH = 5000;
