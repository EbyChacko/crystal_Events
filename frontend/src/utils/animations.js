// Crystal Events — shared animation system

// ── Viewport presets ───────────────────────────────────────────
export const VP         = { once: true, amount: 0.1 };   // section-level trigger
export const VP_CONTENT = { once: true, amount: 0.14 };  // inner element trigger

// ── Cascade container ──────────────────────────────────────────
export const cascadeContainer = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.08, delayChildren: 0 } },
};

// ── General block reveal (eyebrow labels, paragraphs) ──────────
export const blockReveal = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] },
    },
};

// ── Gold rule — sweeps open left→right ────────────────────────
export const goldLine = {
    hidden:  { scaleX: 0, opacity: 0 },
    visible: {
        scaleX: 1,
        opacity: 1,
        transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] },
    },
};

// ── Fade from left ─────────────────────────────────────────────
export const fromLeft = {
    hidden:  { opacity: 0, x: -24 },
    visible: {
        opacity: 1,
        x: 0,
        transition: { duration: 0.65, ease: [0.22, 1, 0.36, 1] },
    },
};

// ── Fade from right ────────────────────────────────────────────
export const fromRight = {
    hidden:  { opacity: 0, x: 24 },
    visible: {
        opacity: 1,
        x: 0,
        transition: { duration: 0.65, ease: [0.22, 1, 0.36, 1] },
    },
};

// ── Card grid container ────────────────────────────────────────
export const cardGrid = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.06, delayChildren: 0 } },
};

// ── Card — smooth zoom-in fade (no spring bounce, no y movement) ─
export const cardItem = {
    hidden:  { opacity: 0, scale: 0.88 },
    visible: {
        opacity: 1,
        scale: 1,
        transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] },
    },
};

// ── Scale fade (stats, badges, icons) ─────────────────────────
export const scaleIn = {
    hidden:  { opacity: 0, scale: 0.82 },
    visible: {
        opacity: 1,
        scale: 1,
        transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] },
    },
};

// ── Word-by-word reveal — container ───────────────────────────
export const wordContainer = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.045, delayChildren: 0 } },
};

// ── Single word — fades in (no y slide that caused blink) ─────
export const wordReveal = {
    hidden:  { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { duration: 0.4, ease: 'easeOut' },
    },
};
