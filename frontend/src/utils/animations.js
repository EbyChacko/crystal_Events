// Crystal Events — shared animation system
// viewport once:false  →  every animation REVERSES when scrolling back up

// ── Viewport presets ───────────────────────────────────────────
export const VP         = { once: false, amount: 0.1 };   // section-level trigger
export const VP_CONTENT = { once: false, amount: 0.14 };  // inner element trigger

// ── Cascade container ──────────────────────────────────────────
// Wrap an eyebrow + gold line + body paragraph group so they
// stagger in order: first child → 0 ms, second → 100 ms, etc.
export const cascadeContainer = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.1, delayChildren: 0 } },
};

// ── General block reveal (eyebrow labels, paragraphs) ──────────
export const blockReveal = {
    hidden: { opacity: 0, y: 22 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.65, ease: [0.22, 1, 0.36, 1] },
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

// ── Slide from left ────────────────────────────────────────────
export const fromLeft = {
    hidden:  { opacity: 0, x: -48 },
    visible: {
        opacity: 1,
        x: 0,
        transition: { duration: 0.72, ease: [0.22, 1, 0.36, 1] },
    },
};

// ── Slide from right ───────────────────────────────────────────
export const fromRight = {
    hidden:  { opacity: 0, x: 48 },
    visible: {
        opacity: 1,
        x: 0,
        transition: { duration: 0.72, ease: [0.22, 1, 0.36, 1] },
    },
};

// ── Apple-icon grid container ──────────────────────────────────
// Each card starts 80 ms after the previous — creates the
// characteristic staggered bounce of iOS home-screen icons.
export const cardGrid = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.08, delayChildren: 0 } },
};

// ── Apple-icon card — spring pop + rise ───────────────────────
export const cardItem = {
    hidden:  { opacity: 0, y: 36, scale: 0.86 },
    visible: {
        opacity: 1,
        y: 0,
        scale: 1,
        transition: {
            type: 'spring',
            stiffness: 255,
            damping: 22,
            mass: 0.75,
        },
    },
};

// ── Scale pop (stats, badges, icons) ──────────────────────────
export const scaleIn = {
    hidden:  { opacity: 0, scale: 0.76 },
    visible: {
        opacity: 1,
        scale: 1,
        transition: {
            type: 'spring',
            stiffness: 290,
            damping: 22,
            mass: 0.65,
        },
    },
};

// ── Word-by-word reveal — container ───────────────────────────
// Used by <AnimatedWords>. The container drives the stagger;
// each word child uses wordReveal below.
export const wordContainer = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.062, delayChildren: 0 } },
};

// ── Single word — slides up from below its overflow-hidden mask
export const wordReveal = {
    hidden:  { y: '108%', opacity: 0 },
    visible: {
        y: 0,
        opacity: 1,
        transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] },
    },
};
