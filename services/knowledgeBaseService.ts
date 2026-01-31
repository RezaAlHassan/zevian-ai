import { supabase } from './supabaseClient';
import { KnowledgePin, KnowledgeBaseData } from '../types';

export const knowledgeBaseService = {
    async getPins(projectId: string) {
        const { data, error } = await supabase
            .from('knowledge_pins')
            .select('*')
            .eq('project_id', projectId)
            .order('created_at', { ascending: true });

        if (error) throw error;

        return data.map((pin: any) => ({
            id: pin.id,
            projectId: pin.project_id,
            section: pin.section,
            content: pin.content,
            createdBy: pin.created_by,
            createdAt: pin.created_at
        } as KnowledgePin));
    },

    async addPin(pin: Omit<KnowledgePin, 'id' | 'createdAt'>) {
        const { data, error } = await supabase
            .from('knowledge_pins')
            .insert({
                project_id: pin.projectId,
                section: pin.section,
                content: pin.content,
                created_by: pin.createdBy
            })
            .select()
            .single();

        if (error) throw error;

        return {
            id: data.id,
            projectId: data.project_id,
            section: data.section,
            content: data.content,
            createdBy: data.created_by,
            createdAt: data.created_at
        } as KnowledgePin;
    },

    async deletePin(pinId: string) {
        const { error } = await supabase
            .from('knowledge_pins')
            .delete()
            .eq('id', pinId);

        if (error) throw error;
    },

    // Helper to format the AI Context String from structured data + Pins
    formatContextString(data: KnowledgeBaseData, pins: KnowledgePin[]): string {
        let context = `PROJECT DESCRIPTION\n${data.projectDescription}\n\n`;

        // Roadmaps
        if (data.roadmapsAndKPIs && data.roadmapsAndKPIs.length > 0) {
            context += `ROADMAPS AND KPIS\n${data.roadmapsAndKPIs.map((k, i) => `${i + 1}. ${k}`).join('\n')}\n\n`;
        }

        // Lexicon (AI + Pins)
        const lexiconPins = pins.filter(p => p.section === 'lexicon');
        context += `PROJECT LEXICON\n`;
        if (lexiconPins.length > 0) {
            context += `[MANDATORY DEFINITIONS]\n`;
            lexiconPins.forEach(p => context += `• ${p.content} (PINNED)\n`);
        }
        if (data.projectLexicon) {
            data.projectLexicon.forEach(item => {
                // We could filter out generic terms here if needed
                context += `• ${item.term}: ${item.definition}\n`;
            });
        }
        context += '\n';

        // Operational Priorities
        const priorityPins = pins.filter(p => p.section === 'priorities');
        context += `OPERATIONAL PRIORITIES\n`;
        if (priorityPins.length > 0) {
            context += `[MANDATORY PRIORITIES]\n`;
            priorityPins.forEach(p => context += `• ${p.content} (PINNED)\n`);
        }
        if (data.operationalPriorities) {
            data.operationalPriorities.forEach((p, i) => context += `${i + 1}. ${p}\n`);
        }
        context += '\n';

        // Style & Quality
        const benchmarkPins = pins.filter(p => p.section === 'benchmarks');
        context += `STYLE AND QUALITY BENCHMARKS\n`;
        if (benchmarkPins.length > 0) {
            context += `[MANDATORY BENCHMARKS]\n`;
            benchmarkPins.forEach(p => context += `• ${p.content} (PINNED)\n`);
        }
        if (data.styleAndQualityBenchmarks) {
            context += `${data.styleAndQualityBenchmarks}\n\n`;
        }

        // Constraints
        const constraintPins = pins.filter(p => p.section === 'constraints');
        context += `IMPLICIT CONSTRAINTS\n`;
        if (constraintPins.length > 0) {
            context += `[HARD CONSTRAINTS]\n`;
            constraintPins.forEach(p => context += `• ${p.content} (PINNED)\n`);
        }
        if (data.implicitConstraints && data.implicitConstraints.length > 0) {
            data.implicitConstraints.forEach(c => context += `• ${c}\n`);
        }

        // General Pins (Anything else)
        const generalPins = pins.filter(p => p.section === 'general');
        if (generalPins.length > 0) {
            context += `\nADDITIONAL PINNED RULES\n`;
            generalPins.forEach(p => context += `• ${p.content}\n`);
        }

        return context;
    }
};
