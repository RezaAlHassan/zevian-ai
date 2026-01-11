import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import Button from './Button';
import { STANDARD_METRICS } from '../constants';
import { Settings, Check } from 'lucide-react';

interface MetricsSelectionModalProps {
    isOpen: boolean;
    onClose: () => void;
    selectedMetrics: string[];
    onSave: (metrics: string[]) => void;
}

const MetricsSelectionModal: React.FC<MetricsSelectionModalProps> = ({
    isOpen,
    onClose,
    selectedMetrics,
    onSave
}) => {
    const [tempSelected, setTempSelected] = useState<string[]>(selectedMetrics);

    useEffect(() => {
        setTempSelected(selectedMetrics);
    }, [selectedMetrics, isOpen]);

    const toggleMetric = (id: string) => {
        setTempSelected(prev =>
            prev.includes(id)
                ? prev.filter(m => m !== id)
                : [...prev, id]
        );
    };

    const handleSave = () => {
        onSave(tempSelected);
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Customize Radar Chart Metrics">
            <div className="space-y-4">
                <p className="text-on-surface-secondary text-sm">
                    Select up to 8 metrics to display on the performance radar chart.
                    These metrics will be evaluated by AI for every report.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[60vh] overflow-y-auto p-1">
                    {STANDARD_METRICS.map((metric) => {
                        const isSelected = tempSelected.includes(metric.id);
                        return (
                            <div
                                key={metric.id}
                                onClick={() => toggleMetric(metric.id)}
                                className={`
                                    cursor-pointer p-4 rounded-xl border-2 transition-all flex flex-col gap-1
                                    ${isSelected
                                        ? 'border-primary bg-primary/5 ring-1 ring-primary/20'
                                        : 'border-border hover:border-primary/50 bg-surface'
                                    }
                                `}
                            >
                                <div className="flex justify-between items-start">
                                    <span className={`font-bold ${isSelected ? 'text-primary' : 'text-on-surface'}`}>
                                        {metric.friendlyName}
                                    </span>
                                    {isSelected && <Check className="w-4 h-4 text-primary" />}
                                </div>
                                <span className="text-xs font-medium text-on-surface-secondary">
                                    {metric.name}
                                </span>
                                <p className="text-xs text-on-surface-secondary mt-1 leading-relaxed">
                                    {metric.description}
                                </p>
                            </div>
                        );
                    })}
                </div>

                <div className="flex justify-between items-center pt-4 border-t border-border">
                    <span className="text-sm font-medium text-on-surface-secondary">
                        {tempSelected.length} metrics selected
                    </span>
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={onClose}>
                            Cancel
                        </Button>
                        <Button
                            variant="primary"
                            onClick={handleSave}
                            disabled={tempSelected.length === 0}
                        >
                            Save Changes
                        </Button>
                    </div>
                </div>
            </div>
        </Modal>
    );
};

export default MetricsSelectionModal;
