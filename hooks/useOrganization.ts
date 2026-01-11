import { useState, useEffect } from 'react';
import { Organization } from '../types';
import { organizationService } from '../services/databaseService';

export const useOrganization = (organizationId?: string) => {
    const [organization, setOrganization] = useState<Organization | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        if (!organizationId) {
            setLoading(false);
            return;
        }

        const fetchOrganization = async () => {
            try {
                setLoading(true);
                const data = await organizationService.getById(organizationId);
                setOrganization(data);
                setError(null);
            } catch (err: any) {
                console.error('Error fetching organization:', err);
                setError(err);
            } finally {
                setLoading(false);
            }
        };

        fetchOrganization();
    }, [organizationId]);

    const updateOrganizationMetrics = async (selectedMetrics: string[]) => {
        if (!organizationId || !organization) return;

        try {
            const updatedOrg = await organizationService.update(organizationId, { selectedMetrics });
            setOrganization(updatedOrg);
            return updatedOrg;
        } catch (err: any) {
            console.error('Error updating organization metrics:', err);
            throw err;
        }
    };

    return {
        organization,
        loading,
        error,
        updateOrganizationMetrics
    };
};
