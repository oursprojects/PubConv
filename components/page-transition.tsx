"use client";

import { motion, AnimatePresence } from "framer-motion";
import { usePathname } from "next/navigation";

// Smooth, high frame rate page transition - elegant fade with subtle movement
export default function PageTransition({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();

    return (
        <AnimatePresence mode="wait">
            <motion.div
                key={pathname}
                initial={{
                    opacity: 0,
                    y: 8,
                    filter: "blur(4px)"
                }}
                animate={{
                    opacity: 1,
                    y: 0,
                    filter: "blur(0px)"
                }}
                exit={{
                    opacity: 0,
                    y: -4,
                    filter: "blur(2px)"
                }}
                transition={{
                    duration: 0.35,
                    ease: [0.22, 1, 0.36, 1] // Custom easing for smooth feel
                }}
                className="w-full"
            >
                {children}
            </motion.div>
        </AnimatePresence>
    );
}

