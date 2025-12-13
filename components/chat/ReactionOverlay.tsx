"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

type Reaction = {
    id: string;
    emoji: string;
    x: number; // Random horizontal position
};

export function ReactionOverlay({
    lastReaction
}: {
    lastReaction: { emoji: string, sender: string, id: string } | null
}) {
    const [reactions, setReactions] = useState<Reaction[]>([]);

    useEffect(() => {
        if (lastReaction) {
            const newReaction: Reaction = {
                id: lastReaction.id,
                emoji: lastReaction.emoji,
                x: Math.random() * 80 + 10, // 10% to 90% width
            };

            setReactions((current) => [...current, newReaction]);

            // Auto cleanup after animation
            setTimeout(() => {
                setReactions((current) => current.filter(r => r.id !== newReaction.id));
            }, 2000);
        }
    }, [lastReaction]);

    return (
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-50">
            <AnimatePresence>
                {reactions.map((r) => (
                    <motion.div
                        key={r.id}
                        initial={{ y: "100%", x: `${r.x}%`, opacity: 0, scale: 0.5 }}
                        animate={{
                            y: "20%", // Fly up to top 20%
                            opacity: [0, 1, 1, 0], // Fade in then out
                            scale: [0.5, 1.5, 1.5, 1]
                        }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 2, ease: "easeOut" }}
                        className="absolute bottom-0 text-4xl transform -translate-x-1/2"
                    >
                        {r.emoji}
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>
    );
}
