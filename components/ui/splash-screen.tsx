"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";

export function SplashScreen() {
    const [show, setShow] = useState(true);

    useEffect(() => {
        // Check if we've already shown the splash in this session
        const hasSeen = typeof window !== 'undefined' ? sessionStorage.getItem("splash-seen") : null;

        if (hasSeen) {
            setShow(false);
        } else {
            const timer = setTimeout(() => {
                setShow(false);
                sessionStorage.setItem("splash-seen", "true");
            }, 4500); // 4.5s total (Complete cycle)
            return () => clearTimeout(timer);
        }
    }, []);

    return (
        <AnimatePresence>
            {show && (
                <motion.div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-background"
                    initial={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.8, ease: "easeInOut" }}
                >
                    <div className="flex flex-col items-center gap-4">
                        <motion.div
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ duration: 1.2, ease: "easeOut", delay: 0.2 }} // Longer entrance
                            className="relative"
                        >
                            <div className="relative h-32 w-32 drop-shadow-2xl">
                                <Image
                                    src="/icon.png"
                                    alt="PubConv Logo"
                                    fill
                                    className="object-contain"
                                    priority
                                />
                            </div>
                        </motion.div>

                        <motion.h1
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ duration: 0.6, delay: 0.4 }}
                            className="text-2xl font-bold tracking-tight text-foreground"
                        >
                            PubConv
                        </motion.h1>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
