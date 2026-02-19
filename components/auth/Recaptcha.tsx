"use client";

import ReCAPTCHA from "react-google-recaptcha";
import { useRef, forwardRef, useImperativeHandle } from "react";

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

        useImperativeHandle(ref, () => ({
            getValue: () => recaptchaRef.current?.getValue() ?? null,
            reset: () => recaptchaRef.current?.reset(),
        }));

        return (
            <div className="flex justify-center">
                <ReCAPTCHA
                    ref={recaptchaRef}
                    sitekey={process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY!}
                    onChange={onChange}
                />
            </div>
        );
    }
);

Recaptcha.displayName = "Recaptcha";
