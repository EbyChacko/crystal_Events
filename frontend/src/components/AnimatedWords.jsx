import { motion } from 'framer-motion';
import { wordContainer, wordReveal, VP_CONTENT } from '../utils/animations';

/**
 * Splits `text` into words and reveals each one by sliding up from beneath
 * an overflow-hidden mask — the classic masked-reveal used in editorial sites.
 *
 * • Triggers on viewport entry (whileInView)
 * • Reverses when scrolled back past (once: false via VP_CONTENT)
 * • `el`  — the rendered HTML element (h1, h2, h3, p, span …)
 * • `className` — applied to the root element (include all text/size styles here)
 */
const AnimatedWords = ({ text, el = 'span', className = '' }) => {
    const words = text.split(' ');

    // Build a motion version of whatever HTML element is requested
    const MotionEl = motion[el] ?? motion.span;

    return (
        <MotionEl
            className={className}
            variants={wordContainer}
            initial="hidden"
            whileInView="visible"
            viewport={VP_CONTENT}
        >
            {words.map((word, i) => (
                // outer span: overflow-hidden clips the rising word
                // paddingBottom / negative marginBottom prevents descender clipping
                <span
                    key={i}
                    className="inline-block overflow-hidden"
                    style={{
                        marginRight: '0.28em',
                        paddingBottom: '0.08em',
                        marginBottom: '-0.08em',
                        verticalAlign: 'bottom',
                    }}
                >
                    <motion.span className="inline-block" variants={wordReveal}>
                        {word}
                    </motion.span>
                </span>
            ))}
        </MotionEl>
    );
};

export default AnimatedWords;
