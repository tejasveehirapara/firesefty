import { toast } from 'react-hot-toast';

/* =========================
   SUCCESS TOAST
========================= */
export const successToast = (message = 'Success') => {
    toast.success(message, {
        duration: 3000,
        position: 'top-right'
    });
};

/* =========================
   ERROR TOAST
========================= */
export const errorToast = (message = 'Something went wrong') => {
    toast.error(message, {
        duration: 4000,
        position: 'top-right'
    });
};

/* =========================
   WARNING TOAST
========================= */
export const warningToast = (message = 'Warning') => {
    toast(message, {
        duration: 3500,
        position: 'top-right',
        style: {
            background: '#fff7ed',
            color: '#9a3412',
            border: '1px solid #fdba74'
        }
    });
};
