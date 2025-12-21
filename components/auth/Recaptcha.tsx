"use client";

import ReCAPTCHA from "react-google-recaptcha";
import { useRef, forwardRef, useImperativeHandle, useEffect, useState } from "react";

export interface RecaptchaRef {
    getValue: () => string | null;
    reset: () => void;
}

interface RecaptchaProps {
    onChange?: (token: string | null) => void;
}

export const Recaptcha = forwardRef<RecaptchaRef, RecaptchaProps>(
    ({ onChange }, ref) => {
        const recaptchaRef = useRef<ReCAPTCHA>(null);
        // Add mounted state to prevent hydration mismatches and ensure script loads
        const [isMounted, setIsMounted] = useState(false);

        useEffect(() => {
            setIsMounted(true);
        }, []);

        useImperativeHandle(ref, () => ({
            getValue: () => recaptchaRef.current?.getValue() ?? null,
            reset: () => recaptchaRef.current?.reset(),
        }));

        if (!isMounted) return <div className="h-[78px] w-full bg-muted/20 animate-pulse rounded" />;

        return (
            <div className="flex justify-center">
                <ReCAPTCHA
                    ref={recaptchaRef}
                    sitekey={process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY!}
                    onChange={onChange}
                    theme="light" // Force light theme or dynamic if needed, but light usually looks cleaner
                />
            </div>
        );
    }
);

Recaptcha.displayName = "Recaptcha";
