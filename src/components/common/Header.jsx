"use client";
import React, { useState, useEffect, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import {
    Bell,
    Search,
    HelpCircle,
    Menu,
    ChevronDown,
    User,
    LogOut,
    Settings
} from 'lucide-react';
import Button from '@/components/ui/Button';
import { showToast } from '@/utils/toast';
import { clearCurrentUser, getCurrentUser } from '@/utils/AuthCookie';

// Mock function to format pathname to title
const getPageTitle = (pathname) => {
    const parts = pathname.split('/').filter(Boolean);
    if (parts.length === 0) return 'Dashboard';
    return parts.map(part => part.charAt(0).toUpperCase() + part.slice(1)).join(' / ');
};

const Header = ({ toggleSidebar, isSidebarCollapsed }) => {
    const pathname = usePathname();
    const router = useRouter();
    const pageTitle = getPageTitle(pathname);
    const [user, setUser] = useState(null);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const menuRef = useRef(null);

    useEffect(() => {
        const storedUser = getCurrentUser();

        if (storedUser) {
            setUser(storedUser);
        }

        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setIsMenuOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleLogout = async () => {
        try {
            const res = await fetch('/api/auth/logout', { method: 'POST' });
            if (res.ok) {
                clearCurrentUser()
                localStorage.removeItem('sidebarData');
                showToast('success', 'Logged out successfully');
                router.push('/');
            } else {
                showToast('error', 'Logout failed');
            }
        } catch (error) {
            console.error('Logout error:', error);
            showToast('error', 'Internal server error');
        }
    };

    const userInitial = user?.firstName?.charAt(0).toUpperCase() || 'A';

    return (
        <header className="h-20 px-4 bg-white/90 border-b border-gray-100 flex items-center justify-between sticky top-0 z-40 backdrop-blur-xl transition-all duration-300 shadow-[0_4px_24px_-4px_rgba(0,0,0,0.02)]">
            {/* Left: Page Title */}
            <div className="flex items-center gap-1 sm:gap-2 gap-4">
                {/* Mobile Sidebar Toggle */}
                <Button
                    variant="outline"
                    className="md:hidden p-1 sm:p-2 !rounded-lg border-transparent hover:bg-gray-50 text-gray-500 !shadow-none"
                    onClick={toggleSidebar}
                    startIcon={<Menu className="w-5 h-5" />}
                    label=""
                />

                <div>
                    <h1 className="sm:text-xl text-lg font-bold text-gray-900 tracking-tight">
                        {pageTitle}
                    </h1>
                    <p className="text-xs text-gray-500 font-medium mt-0.5">Overview of your {pageTitle.toLowerCase()}</p>
                </div>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-4">


                {/* User Menu Trigger */}
                <div className="relative" ref={menuRef}>

                    <div onClick={() => setIsMenuOpen(!isMenuOpen)} className="w-9 h-9 cursor-pointer rounded-full bg-gradient-to-tr from-gray-900 to-gray-700 flex items-center justify-center text-white font-bold text-sm shadow-md ring-2 ring-white uppercase">
                        {userInitial}
                    </div>


                    {/* Dropdown Menu */}
                    {isMenuOpen && (
                        <div className="absolute right-0 mt-3 w-56 bg-white rounded-2xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.1)] border border-gray-100 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                            <div className="px-4 py-3 border-b border-gray-50 mb-1">
                                <p className="text-sm font-bold text-gray-900 truncate">{user?.firstName} {user?.lastName}</p>
                                <p className="text-[10px] font-medium text-gray-500 truncate mt-0.5">{user?.email}</p>
                            </div>

                            <button
                                className="w-full flex cursor-pointer items-center gap-3 px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors"
                                onClick={() => {
                                    setIsMenuOpen(false);
                                    router.push('/profile');
                                }}
                            >
                                <User className="w-4 h-4 text-gray-400" strokeWidth={1.5} />
                                Profile
                            </button>



                            <div className="border-t border-gray-50 mt-1 pt-1">
                                <button
                                    className="w-full flex cursor-pointer items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors font-medium"
                                    onClick={handleLogout}
                                >
                                    <LogOut className="w-4 h-4" strokeWidth={1.5} />
                                    Logout
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
};

export default Header;