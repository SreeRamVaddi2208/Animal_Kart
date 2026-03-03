'use client';

import { ReactNode } from 'react';
import { motion } from 'framer-motion';

interface RevealCardProps {
    children: ReactNode;
    delay?: number;
    className?: string;
    once?: boolean;
}

export default function RevealCard({
    children,
    delay = 0,
    className = '',
    once = true,
}: RevealCardProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 48 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once, margin: '-60px' }}
            transition={{ duration: 0.65, delay, ease: [0.25, 0.46, 0.45, 0.94] }}
            className={className}
        >
            {children}
        </motion.div>
    );
}
