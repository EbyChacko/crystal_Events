import { motion } from 'framer-motion';
import { wordContainer, wordReveal, VP_CONTENT } from '../utils/animations';

/**
 * Splits `text` into words and fades each one in sequentially.
 * `el`  — the rendered HTML element (h1, h2, h3, p, span …)
 * `className` — applied to the root element
 */
const AnimatedWords = ({ text, el = 'span', className = '' }) => {
    const words = text.split(' ');
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
                <motion.span
                    key={i}
                    className="inline-block"
                    style={{ marginRight: '0.28em' }}
                    variants={wordReveal}
                >
                    {word}
                </motion.span>
            ))}
        </MotionEl>
    );
};

export default AnimatedWords;
