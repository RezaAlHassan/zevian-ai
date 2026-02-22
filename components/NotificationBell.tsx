
import React, { useState, useEffect, useRef } from 'react';
import { Bell } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { notificationService } from '../services/databaseService';
import { Notification } from '../types';
import { useNavigate } from 'react-router-dom';

export const NotificationBell: React.FC = () => {
    const { employee } = useAuth();
    const navigate = useNavigate();
    const [unreadCount, setUnreadCount] = useState(0);
    const [isOpen, setIsOpen] = useState(false);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const fetchNotifications = async () => {
        if (!employee) return;
        try {
            const count = await notificationService.getUnreadCount(employee.id);
            setUnreadCount(count);

            if (isOpen) {
                const data = await notificationService.getAll(employee.id);
                setNotifications(data.slice(0, 5)); // Show only latest 5 in dropdown
            }
        } catch (error) {
            console.error('Error fetching notifications:', error);
        }
    };

    // Initial fetch and poller
    useEffect(() => {
        fetchNotifications();
        const interval = setInterval(fetchNotifications, 30000); // Poll every 30s
        return () => clearInterval(interval);
    }, [employee, isOpen]);

    // Close dropdown on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleBellClick = () => {
        setIsOpen(!isOpen);
    };

    const handleNotificationClick = async (notif: Notification) => {
        try {
            if (!notif.isRead) {
                await notificationService.markAsRead(notif.id);
                setUnreadCount(prev => Math.max(0, prev - 1));
            }
            setIsOpen(false);
            if (notif.linkUrl) {
                navigate(notif.linkUrl);
            }
        } catch (error) {
            console.error('Error handling notification click:', error);
        }
    };

    const handleViewAll = () => {
        setIsOpen(false);
        navigate('/notifications');
    };

    const handleMarkAllRead = async () => {
        if (!employee) return;
        try {
            await notificationService.markAllAsRead(employee.id);
            setUnreadCount(0);
            setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
        } catch (error) {
            console.error('Error marking all read:', error);
        }
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={handleBellClick}
                className="relative p-2 text-trunks hover:text-bulma hover:bg-gohan rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-piccolo group"
            >
                <Bell size={20} className="transition-all duration-200 group-hover:scale-110 group-hover:text-piccolo" />
                {unreadCount > 0 && (
                    <span className="absolute top-0 right-0 inline-flex items-center justify-center px-1.5 py-0.5 text-[10px] font-bold leading-none text-goten transform translate-x-1/4 -translate-y-1/4 bg-dodoria rounded-full">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-goten rounded-moon-s-lg ring-1 ring-popo/5 z-50">
                    <div className="p-4 border-b border-beerus flex justify-between items-center">
                        <h3 className="text-moon-14 font-semibold text-bulma">Notifications</h3>
                        {unreadCount > 0 && (
                            <button onClick={handleMarkAllRead} className="text-moon-12 text-piccolo hover:text-piccolo/80">
                                Mark all read
                            </button>
                        )}
                    </div>

                    <div className="max-h-96 overflow-y-auto hidden-scroll">
                        {notifications.length === 0 ? (
                            <div className="p-4 text-center text-moon-14 text-trunks">
                                No notifications
                            </div>
                        ) : (
                            <ul className="divide-y divide-beerus">
                                {notifications.map((notif) => (
                                    <li
                                        key={notif.id}
                                        className={`p-4 hover:bg-gohan cursor-pointer transition-colors ${!notif.isRead ? 'bg-piccolo/5' : ''}`}
                                        onClick={() => handleNotificationClick(notif)}
                                    >
                                        <div className="flex flex-col gap-1">
                                            <p className={`text-moon-14 ${!notif.isRead ? 'font-semibold text-bulma' : 'text-trunks'}`}>
                                                {notif.title}
                                            </p>
                                            <p className="text-moon-12 text-trunks line-clamp-2">
                                                {notif.message}
                                            </p>
                                            <span className="text-[10px] text-trunks mt-1 opacity-80">
                                                {new Date(notif.createdAt).toLocaleDateString()}
                                            </span>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>

                    <div className="p-2 border-t border-beerus bg-gohan rounded-b-moon-s-lg">
                        <button
                            onClick={handleViewAll}
                            className="w-full py-2 text-moon-14 text-piccolo font-medium hover:text-piccolo/80 text-center"
                        >
                            View all notifications
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};
