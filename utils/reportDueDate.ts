/**
 * Calculates the next report due date based on the last report date and frequency.
 * 
 * @param lastReportDate ISO string of the last report submission
 * @param frequency 'daily', 'weekly', 'bi-weekly', or 'monthly'
 * @returns ISO string of the next due date
 */
export const calculateNextReportDate = (lastReportDate: string | null, frequency: string): string => {
    const start = lastReportDate ? new Date(lastReportDate) : new Date();
    const next = new Date(start);

    switch (frequency.toLowerCase()) {
        case 'daily':
            next.setDate(next.getDate() + 1);
            break;
        case 'weekly':
            next.setDate(next.getDate() + 7);
            break;
        case 'bi-weekly':
            next.setDate(next.getDate() + 14);
            break;
        case 'monthly':
            next.setMonth(next.getMonth() + 1);
            break;
        default:
            next.setDate(next.getDate() + 7); // Default to weekly
    }

    // Set to end of day (23:59:59) for the due date
    next.setHours(23, 59, 59, 999);
    return next.toISOString();
};

/**
 * Checks if a report is late based on the last report date and frequency.
 * 
 * @param lastReportDate ISO string of the last report submission
 * @param frequency 'daily', 'weekly', 'bi-weekly', or 'monthly'
 * @returns boolean indicating if the report is overdue
 */
export const isReportLate = (lastReportDate: string | null, frequency: string): boolean => {
    const nextDue = calculateNextReportDate(lastReportDate, frequency);
    return new Date() > new Date(nextDue);
};

/**
 * Formats the relative time remaining or overdue status.
 * 
 * @param dueDate ISO string of the due date
 * @returns String describing the status (e.g., "Due in 2 days", "Overdue by 5 hours")
 */
export const getReportStatusLabel = (lastReportDate: string | null, frequency: string): { label: string, isOverdue: boolean, isImminent: boolean } => {
    const dueDate = new Date(calculateNextReportDate(lastReportDate, frequency));
    const now = new Date();
    const diffMs = dueDate.getTime() - now.getTime();
    const diffHours = Math.floor(Math.abs(diffMs) / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    const isOverdue = diffMs < 0;
    const isImminent = !isOverdue && diffHours < 24;

    if (isOverdue) {
        if (diffDays > 0) return { label: `Overdue by ${diffDays}d`, isOverdue: true, isImminent: false };
        return { label: `Overdue by ${diffHours}h`, isOverdue: true, isImminent: false };
    }

    if (diffDays > 0) return { label: `Due in ${diffDays}d`, isOverdue: false, isImminent: false };
    if (diffHours > 0) return { label: `Due in ${diffHours}h`, isOverdue: false, isImminent: true };
    return { label: 'Due shortly', isOverdue: false, isImminent: true };
};
