import Cookies from 'js-cookie';

const USER_COOKIE_KEY = 'current_user';

/* =========================
   GET CURRENT USER
========================= */
export const getCurrentUser = () => {
    try {
        const user = Cookies.get(USER_COOKIE_KEY);
        return user ? JSON.parse(user) : null;
    } catch (error) {
        return null;
    }
};

/* =========================
   SET CURRENT USER
========================= */
export const setCurrentUser = user => {
    try {
        if (user) {
            Cookies.set(USER_COOKIE_KEY, JSON.stringify(user), {
                expires: 7,            // 7 days
                secure: true,          // HTTPS only
                sameSite: 'Strict'     // CSRF protection
            });
        } else {
            Cookies.remove(USER_COOKIE_KEY);
        }
    } catch (error) {
        console.error(error);
    }
};

/* =========================
   CLEAR USER
========================= */
export const clearCurrentUser = () => {
    Cookies.remove(USER_COOKIE_KEY);
};
