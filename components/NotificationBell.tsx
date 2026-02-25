
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
                className="relative p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ring group"
            >
                <Bell size={20} className="transition-all duration-200 group-hover:scale-110 group-hover:text-primary" />
                {unreadCount > 0 && (
                    <span className="absolute top-0 right-0 inline-flex items-center justify-center px-1.5 py-0.5 text-[10px] font-bold leading-none text-destructive-foreground transform translate-x-1/4 -translate-y-1/4 bg-destructive rounded-full">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-popover rounded-2xl ring-1 ring-border z-50 shadow-lg">
                    <div className="p-4 border-b border-border flex justify-between items-center">
                        <h3 className="text-sm font-semibold text-popover-foreground">Notifications</h3>
                        {unreadCount > 0 && (
                            <button onClick={handleMarkAllRead} className="text-xs text-primary hover:text-primary/80">
                                Mark all read
                            </button>
                        )}
                    </div>

                    <div className="max-h-96 overflow-y-auto hidden-scroll">
                        {notifications.length === 0 ? (
                            <div className="p-4 text-center text-sm text-muted-foreground">
                                No notifications
                            </div>
                        ) : (
                            <ul className="divide-y divide-border">
                                {notifications.map((notif) => (
                                    <li
                                        key={notif.id}
                                        className={`p-4 hover:bg-accent cursor-pointer transition-colors ${!notif.isRead ? 'bg-primary/5' : ''}`}
                                        onClick={() => handleNotificationClick(notif)}
                                    >
                                        <div className="flex flex-col gap-1">
                                            <p className={`text-sm ${!notif.isRead ? 'font-semibold text-popover-foreground' : 'text-muted-foreground'}`}>
                                                {notif.title}
                                            </p>
                                            <p className="text-xs text-muted-foreground line-clamp-2">
                                                {notif.message}
                                            </p>
                                            <span className="text-[10px] text-muted-foreground mt-1 opacity-80">
                                                {new Date(notif.createdAt).toLocaleDateString()}
                                            </span>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>

                    <div className="p-2 border-t border-border bg-muted rounded-b-2xl">
                        <button
                            onClick={handleViewAll}
                            className="w-full py-2 text-sm text-primary font-medium hover:text-primary/80 text-center"
                        >
                            View all notifications
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};
