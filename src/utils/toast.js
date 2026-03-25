import toast from 'react-hot-toast';

export const showToast = (type, message) => {
    const options = {
        position: 'top-right',
        duration: 3000,
    };

    switch (type) {
        case 'success':
            return toast.success(message, options);
        case 'error':
            return toast.error(message, options);
        case 'loading':
            return toast.loading(message, options);
        default:
            return toast(message, options);
    }
};
