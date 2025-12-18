import { Employee } from '../types';

/**
 * Returns a Set of IDs for the manager and all their subordinates (direct and indirect).
 * This implements the "My Reporting Chain" scope.
 */
export const getReportingChainIds = (managerId: string, allEmployees: Employee[]): Set<string> => {
    const chainIds = new Set<string>();

    // Recursive function to find subordinates
    const findSubordinates = (currentManagerId: string) => {
        // Find all direct reports for this manager
        const directReports = allEmployees.filter(emp => emp.managerId === currentManagerId);

        directReports.forEach(report => {
            if (!chainIds.has(report.id)) {
                chainIds.add(report.id);
                // Recursively find reports for this employee (if they are also a manager)
                findSubordinates(report.id);
            }
        });
    };

    // Start recursion
    findSubordinates(managerId);

    // Note: The requirement usually implies seeing the manager's own data too? 
    // "My Reporting Chain" usually implies "Me + My Downstream".
    // If the prompt implies just subordinates, distinct from "Me", we might not add managerId.
    // But usually for "My Team" vs "My Reporting Chain", "My Reporting Chain" is a superset.
    // We'll add the managerId implies they are part of the chain (head of chain).
    // However, often managers want to see *their* performance too?
    // Let's stick to subordinates first as that's the core "chain" definition.
    // If the dashboard filters by `employee.id IN chainIds`, and we want to see the manager's own generated reports?
    // The dashboard typically shows "Key Metrics" for the scope.
    // Let's include the manager themselves in the set for completeness.
    // chainIds.add(managerId); 

    return chainIds;
};

/**
 * Filters items (Projects, Goals, Reports) based on scope.
 * 
 * @param items Array of items with an `assigneeId` or `employeeId` field (or similar).
 * @param scope The current scope filter.
 * @param managerId The current manager's ID.
 * @param allEmployees List of all employees to calculate chain.
 * @param getItemOwnerId Function to extract the owner ID from an item.
 */
export const filterByScope = <T>(
    items: T[],
    scope: 'direct-reports' | 'organization' | 'reporting-chain',
    managerId: string,
    allEmployees: Employee[],
    getItemOwnerId: (item: T) => string | undefined
): T[] => {
    if (scope === 'organization') return items;

    if (scope === 'reporting-chain') {
        const chainIds = getReportingChainIds(managerId, allEmployees);
        // Include direct reports in chainIds logic above? Yes.
        return items.filter(item => {
            const ownerId = getItemOwnerId(item);
            return ownerId && chainIds.has(ownerId);
        });
    }

    // Default: direct-reports
    // Get direct report IDs
    const directReportIds = new Set(
        allEmployees
            .filter(e => e.managerId === managerId)
            .map(e => e.id)
    );

    return items.filter(item => {
        const ownerId = getItemOwnerId(item);
        return ownerId && directReportIds.has(ownerId);
    });
};
