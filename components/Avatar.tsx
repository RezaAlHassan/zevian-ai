import React from 'react';
import { Employee } from '../types';

// Profile Picture Component (Discord style)
export const ProfilePicture: React.FC<{ name: string; size?: number; className?: string }> = ({ name, size = 32, className = '' }) => {
    const initials = name
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);

    // Generate a color based on name (consistent color for same name)
    const colors = [
        'bg-red-500', 'bg-orange-500', 'bg-amber-500', 'bg-yellow-500',
        'bg-lime-500', 'bg-green-500', 'bg-emerald-500', 'bg-teal-500',
        'bg-cyan-500', 'bg-sky-500', 'bg-blue-500', 'bg-indigo-500',
        'bg-violet-500', 'bg-purple-500', 'bg-fuchsia-500', 'bg-pink-500',
        'bg-rose-500'
    ];
    const colorIndex = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % colors.length;
    const bgColor = colors[colorIndex];

    return (
        <div
            className={`rounded-full ${bgColor} flex items-center justify-center text-white font-semibold flex-shrink-0 ${className}`}
            style={{ width: size, height: size, fontSize: size * 0.4 }}
        >
            {initials}
        </div>
    );
};

// Stacked Profile Pictures Component (Discord style - overlapping)
export const StackedAvatars: React.FC<{
    employees: Employee[];
    maxVisible?: number;
    size?: number;
    onSeeMore?: () => void;
}> = ({ employees, maxVisible = 5, size = 32, onSeeMore }) => {
    const visible = employees.slice(0, maxVisible);
    const remaining = employees.length - maxVisible;

    return (
        <div className="flex items-center" style={{ gap: size * -0.25 }}>
            {visible.map((employee, index) => (
                <div
                    key={employee.id}
                    className="relative"
                    style={{ zIndex: maxVisible - index }}
                >
                    <ProfilePicture
                        name={employee.name}
                        size={size}
                        className="border-2 border-white"
                    />
                </div>
            ))}
            {remaining > 0 && (
                <button
                    onClick={onSeeMore}
                    className="relative rounded-full bg-blue-500 border-2 border-white flex items-center justify-center text-white font-semibold hover:bg-blue-600 transition-colors cursor-pointer"
                    style={{
                        width: size,
                        height: size,
                        fontSize: size * 0.35,
                        zIndex: 0,
                        marginLeft: size * -0.25 > 0 ? `${size * -0.25}px` : '0px'
                    }}
                >
                    +{remaining}
                </button>
            )}
        </div>
    );
};
