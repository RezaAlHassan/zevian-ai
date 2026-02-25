import React from 'react';
import { Employee } from '../types';
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

// Profile Picture Component
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
        <Avatar className={className} style={{ width: size, height: size }}>
            <AvatarFallback className={`${bgColor} text-white font-semibold flex-shrink-0 w-full h-full`} style={{ fontSize: size * 0.4 }}>
                {initials}
            </AvatarFallback>
        </Avatar>
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
        <div className="flex items-center hover:z-10 relative" style={{ gap: size * -0.25 }}>
            {visible.map((employee, index) => (
                <div
                    key={employee.id}
                    className="relative transition-transform hover:z-50 hover:-translate-y-1"
                    style={{ zIndex: maxVisible - index }}
                    title={employee.name}
                >
                    <ProfilePicture
                        name={employee.name}
                        size={size}
                        className="border-2 border-background shadow-xs"
                    />
                </div>
            ))}
            {remaining > 0 && (
                <button
                    onClick={onSeeMore}
                    className="relative rounded-full bg-muted border-2 border-background flex items-center justify-center text-foreground font-semibold hover:bg-muted/80 transition-colors shadow-xs"
                    style={{
                        width: size,
                        height: size,
                        fontSize: size * 0.35,
                        zIndex: 0,
                    }}
                >
                    +{remaining}
                </button>
            )}
        </div>
    );
};
