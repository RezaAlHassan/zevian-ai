import React from 'react';
import { User, UserCog } from 'lucide-react';
import type { Employee } from '../types';

interface ViewModeSwitcherProps {
    currentEmployeeId: string;
    employees: Employee[];
    onEmployeeChange: (employeeId: string) => void;
}

const ViewModeSwitcher: React.FC<ViewModeSwitcherProps> = ({
    currentEmployeeId,
    employees,
    onEmployeeChange,
}) => {
    // Draggable state
    const [position, setPosition] = React.useState<{ x: number, y: number } | null>(null);
    const [isDragging, setIsDragging] = React.useState(false);
    const [dragOffset, setDragOffset] = React.useState({ x: 0, y: 0 });

    // Initialize position to bottom-right
    React.useEffect(() => {
        // Only set initial position if not set yet
        if (!position) {
            setPosition({
                x: window.innerWidth - 320, // Approx width + margin
                y: window.innerHeight - 250 // Approx height + margin
            });
        }
    }, []);

    // Handle mouse move and up globally when dragging
    React.useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (isDragging && position) {
                setPosition({
                    x: e.clientX - dragOffset.x,
                    y: e.clientY - dragOffset.y
                });
            }
        };

        const handleMouseUp = () => {
            setIsDragging(false);
        };

        if (isDragging) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
        }

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging, dragOffset, position]);

    const handleMouseDown = (e: React.MouseEvent) => {
        if (position) {
            setIsDragging(true);
            setDragOffset({
                x: e.clientX - position.x,
                y: e.clientY - position.y
            });
        }
    };

    const currentEmployee = employees.find(e => e.id === currentEmployeeId);
    const viewMode = currentEmployee?.role || 'employee';

    // Get managers and employees
    const managers = employees.filter(e => e.role === 'manager');
    const regularEmployees = employees.filter(e => e.role === 'employee');

    // Style for the draggable container
    const containerStyle: React.CSSProperties = position ? {
        left: `${position.x}px`,
        top: `${position.y}px`,
        position: 'fixed',
        zIndex: 50,
        cursor: isDragging ? 'grabbing' : 'auto'
    } : {
        // Fallback before JS loads position
        position: 'fixed',
        bottom: '1.5rem',
        right: '1.5rem',
        zIndex: 50,
        visibility: 'hidden' // Hide until position is calculated to prevent jump
    };

    // If no employees, show message
    if (employees.length === 0) {
        return (
            <div style={containerStyle}>
                <div
                    className="bg-surface-elevated border-2 border-yellow-500/30 rounded-lg shadow-lg p-4 max-w-[280px]"
                    onMouseDown={handleMouseDown}
                >
                    <div className="flex items-center gap-2 mb-2 cursor-grab active:cursor-grabbing">
                        <div className="p-1.5 rounded-lg bg-yellow-500/10 text-yellow-600">
                            <User size={18} />
                        </div>
                        <p className="text-sm font-bold text-on-surface select-none">Test Mode</p>
                    </div>
                    <p className="text-xs text-on-surface-secondary">
                        No employees found. Please run <code className="px-1 py-0.5 bg-surface rounded text-primary font-mono text-xs">schema.sql</code> in Supabase to create sample data.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div style={containerStyle}>
            <div className="bg-surface-elevated border-2 border-primary/20 rounded-lg shadow-lg p-4 min-w-[280px]">
                <div
                    className="flex items-center gap-2 mb-3 cursor-grab active:cursor-grabbing"
                    onMouseDown={handleMouseDown}
                >
                    <div className={`p-1.5 rounded-lg ${viewMode === 'manager' ? 'bg-primary/10 text-primary' : 'bg-surface text-on-surface-secondary'}`}>
                        {viewMode === 'manager' ? <UserCog size={18} /> : <User size={18} />}
                    </div>
                    <div className="flex-grow select-none">
                        <p className="text-xs font-semibold text-on-surface-tertiary uppercase tracking-wide">Test Mode</p>
                        <p className="text-sm font-bold text-on-surface capitalize">{viewMode} View</p>
                    </div>
                    <div className="text-on-surface-tertiary">
                        {/* Grip indicator */}
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="12" r="1" /><circle cx="9" cy="5" r="1" /><circle cx="9" cy="19" r="1" /><circle cx="15" cy="12" r="1" /><circle cx="15" cy="5" r="1" /><circle cx="15" cy="19" r="1" /></svg>
                    </div>
                </div>

                <div className="space-y-2">
                    <div>
                        <label className="text-xs font-semibold text-on-surface-secondary mb-1 block">
                            Switch User:
                        </label>
                        <select
                            value={currentEmployeeId}
                            onChange={(e) => onEmployeeChange(e.target.value)}
                            className="w-full px-3 py-2 text-sm bg-surface border border-border rounded-lg text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all cursor-pointer"
                        >
                            {managers.length > 0 && (
                                <optgroup label="👔 Managers">
                                    {managers.map(emp => (
                                        <option key={emp.id} value={emp.id}>
                                            {emp.name} {emp.title ? `(${emp.title})` : ''}
                                        </option>
                                    ))}
                                </optgroup>
                            )}
                            {regularEmployees.length > 0 && (
                                <optgroup label="👤 Employees">
                                    {regularEmployees.map(emp => (
                                        <option key={emp.id} value={emp.id}>
                                            {emp.name} {emp.title ? `(${emp.title})` : ''}
                                        </option>
                                    ))}
                                </optgroup>
                            )}
                        </select>
                    </div>

                    <div className="pt-2 border-t border-border">
                        <p className="text-xs text-on-surface-tertiary">
                            Current: <span className="font-semibold text-on-surface">{currentEmployee?.name || 'Unknown'}</span>
                        </p>
                        <p className="text-xs text-on-surface-tertiary">
                            Email: <span className="font-mono text-on-surface-secondary text-[10px]">{currentEmployee?.email || 'N/A'}</span>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ViewModeSwitcher;
