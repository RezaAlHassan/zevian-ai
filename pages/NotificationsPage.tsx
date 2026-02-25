
import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { notificationService } from '../services/databaseService';
import { Notification } from '../types';
import { useNavigate } from 'react-router-dom';
import { Check, Clock, AlertCircle, Info, Briefcase, Users, CheckCircle } from 'lucide-react';

export const NotificationsPage: React.FC = () => {
    const { employee } = useAuth();
    const navigate = useNavigate();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'unread'>('all');

    useEffect(() => {
        loadNotifications();
    }, [employee]);

    const loadNotifications = async () => {
        if (!employee) return;
        try {
            setLoading(true);
            const data = await notificationService.getAll(employee.id);
            setNotifications(data);
        } catch (error) {
            console.error('Error loading notifications:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleMarkAsRead = async (id: number, e: React.MouseEvent) => {
        e.stopPropagation();
        try {
            await notificationService.markAsRead(id);
            setNotifications(prev => prev.map(n =>
                n.id === id ? { ...n, isRead: true } : n
            ));
        } catch (error) {
            console.error('Error marking as read:', error);
        }
    };

    const handleMarkAllRead = async () => {
        if (!employee) return;
        try {
            await notificationService.markAllAsRead(employee.id);
            setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
        } catch (error) {
            console.error('Error marking all read:', error);
        }
    };

    const handleNotificationClick = (notif: Notification) => {
        if (!notif.isRead) {
            notificationService.markAsRead(notif.id); // optimistic update handled by navigation or reload
        }
        if (notif.linkUrl) {
            navigate(notif.linkUrl);
        }
    };

    const getIcon = (type: string) => {
        switch (type) {
            case 'assignment': return <Briefcase className="text-blue-500" size={24} />;
            case 'team_update': return <Users className="text-green-500" size={24} />;
            case 'goal': return <CheckCircle className="text-purple-500" size={24} />;
            case 'performance': return <Clock className="text-indigo-500" size={24} />;
            case 'alert': return <AlertCircle className="text-red-500" size={24} />;
            default: return <Info className="text-gray-500" size={24} />;
        }
    };

    const filteredNotifications = filter === 'all'
        ? notifications
        : notifications.filter(n => !n.isRead);

    if (loading) return <div className="p-8 text-center text-gray-500">Loading notifications...</div>;

    return (
        <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
                    <p className="mt-1 text-sm text-gray-500">Stay updated with your latest activities</p>
                </div>
                <button
                    onClick={handleMarkAllRead}
                    className="text-sm font-medium text-indigo-600 hover:text-indigo-800 bg-indigo-50 px-4 py-2 rounded-md transition-colors"
                >
                    Mark all as read
                </button>
            </div>

            <div className="bg-background rounded-lg shadow overflow-hidden">
                <div className="border-b border-gray-200">
                    <nav className="-mb-px flex">
                        <button
                            onClick={() => setFilter('all')}
                            className={`${filter === 'all'
                                    ? 'border-indigo-500 text-indigo-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                } w-1/2 py-4 px-1 text-center border-b-2 font-medium text-sm`}
                        >
                            All
                        </button>
                        <button
                            onClick={() => setFilter('unread')}
                            className={`${filter === 'unread'
                                    ? 'border-indigo-500 text-indigo-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                } w-1/2 py-4 px-1 text-center border-b-2 font-medium text-sm`}
                        >
                            Unread
                        </button>
                    </nav>
                </div>

                <ul className="divide-y divide-gray-200">
                    {filteredNotifications.length === 0 ? (
                        <li className="p-8 text-center text-gray-500">
                            No {filter === 'unread' ? 'unread' : ''} notifications found.
                        </li>
                    ) : (
                        filteredNotifications.map((notif) => (
                            <li
                                key={notif.id}
                                onClick={() => handleNotificationClick(notif)}
                                className={`p-6 hover:bg-gray-50 transition-colors cursor-pointer ${!notif.isRead ? 'bg-indigo-50' : ''}`}
                            >
                                <div className="flex items-start space-x-4">
                                    <div className="flex-shrink-0 mt-1">
                                        {getIcon(notif.type)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-start">
                                            <p className={`text-sm font-medium ${!notif.isRead ? 'text-gray-900' : 'text-gray-700'}`}>
                                                {notif.title}
                                            </p>
                                            <span className="text-xs text-gray-500 whitespace-nowrap ml-2">
                                                {new Date(notif.createdAt).toLocaleDateString()} {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                        <p className="mt-1 text-sm text-gray-600">
                                            {notif.message}
                                        </p>
                                    </div>
                                    {!notif.isRead && (
                                        <button
                                            onClick={(e) => handleMarkAsRead(notif.id, e)}
                                            className="ml-4 flex-shrink-0 rounded-full p-1 text-gray-400 hover:bg-gray-200 hover:text-gray-500"
                                            title="Mark as read"
                                        >
                                            <Check size={16} />
                                        </button>
                                    )}
                                </div>
                            </li>
                        ))
                    )}
                </ul>
            </div>
        </div>
    );
};
