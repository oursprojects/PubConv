"use client";

import Swal, { SweetAlertOptions, SweetAlertResult } from 'sweetalert2';

// Get computed CSS variable values
const getCSSVar = (name: string): string => {
    if (typeof window === 'undefined') return '';
    return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
};

// Convert HSL CSS variable to proper format
const hslToColor = (hslValue: string): string => {
    if (!hslValue) return '#333';
    return `hsl(${hslValue})`;
};

// Get theme-aware colors
const getThemeColors = () => ({
    background: hslToColor(getCSSVar('--card')),
    color: hslToColor(getCSSVar('--card-foreground')),
    confirmButtonColor: hslToColor(getCSSVar('--primary')),
    cancelButtonColor: hslToColor(getCSSVar('--muted')),
    iconColor: hslToColor(getCSSVar('--primary')),
});

// Create themed SweetAlert instance
const createThemedSwal = () => {
    const colors = getThemeColors();

    return Swal.mixin({
        background: colors.background,
        color: colors.color,
        confirmButtonColor: colors.confirmButtonColor,
        cancelButtonColor: colors.cancelButtonColor,
        iconColor: colors.iconColor,
        customClass: {
            popup: 'rounded-3xl shadow-xl border border-border w-auto max-w-sm p-4', // Smaller popup
            title: 'text-lg font-semibold text-foreground', // Clearer text
            htmlContainer: 'text-sm text-muted-foreground',
            confirmButton: 'rounded-xl px-5 py-2 text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 focus:ring-2 focus:ring-primary', // Strong contrast
            cancelButton: 'rounded-xl px-5 py-2 text-sm font-medium bg-muted text-foreground hover:bg-muted/80',
            actions: 'gap-2',
        },
        buttonsStyling: false, // Important to disable default swal styles to let customClass take over
        showClass: {
            popup: 'animate-in fade-in zoom-in-95 duration-200',
        },
        hideClass: {
            popup: 'animate-out fade-out zoom-out-95 duration-150',
        },
    });
};

// Pre-configured alert functions
export const swalSuccess = (title: string, text?: string, options?: SweetAlertOptions): Promise<SweetAlertResult> => {
    return createThemedSwal().fire({
        icon: 'success',
        title,
        text,
        ...options,
    });
};

export const swalError = (title: string, text?: string, options?: SweetAlertOptions): Promise<SweetAlertResult> => {
    return createThemedSwal().fire({
        icon: 'error',
        title,
        text,
        iconColor: hslToColor(getCSSVar('--destructive')),
        ...options,
    });
};

export const swalWarning = (title: string, text?: string, options?: SweetAlertOptions): Promise<SweetAlertResult> => {
    return createThemedSwal().fire({
        icon: 'warning',
        title,
        text,
        iconColor: '#f59e0b', // Amber for warnings
        ...options,
    });
};

export const swalInfo = (title: string, text?: string, options?: SweetAlertOptions): Promise<SweetAlertResult> => {
    return createThemedSwal().fire({
        icon: 'info',
        title,
        text,
        ...options,
    });
};

export const swalConfirm = (
    title: string,
    text?: string,
    options?: SweetAlertOptions
): Promise<SweetAlertResult> => {
    return createThemedSwal().fire({
        icon: 'question',
        title,
        text,
        showCancelButton: true,
        confirmButtonText: 'Yes',
        cancelButtonText: 'Cancel',
        reverseButtons: true,
        ...options,
    });
};

export const swalDelete = (
    title: string = 'Are you sure?',
    text: string = 'This action cannot be undone.'
): Promise<SweetAlertResult> => {
    const colors = getThemeColors();
    return createThemedSwal().fire({
        icon: 'warning',
        title,
        text,
        showCancelButton: true,
        confirmButtonText: 'Delete',
        cancelButtonText: 'Cancel',
        confirmButtonColor: hslToColor(getCSSVar('--destructive')),
        cancelButtonColor: colors.cancelButtonColor,
        reverseButtons: true,
    });
};

export const swalToast = (
    title: string,
    icon: 'success' | 'error' | 'warning' | 'info' = 'success'
): Promise<SweetAlertResult> => {
    return createThemedSwal().fire({
        toast: true,
        position: 'top-end',
        icon,
        title,
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
    });
};

// Export themed Swal for custom usage
export const ThemedSwal = createThemedSwal;
export default Swal;
