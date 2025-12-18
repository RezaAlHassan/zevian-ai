import { GoogleGenAI, Type } from "@google/genai";
import { Criterion, Report, ReportCriterionScore } from '../types';

const getAI = () => {
    const apiKey = import.meta.env.VITE_GOOGLE_API_KEY;
    if (!apiKey) {
        throw new Error("VITE_GOOGLE_API_KEY is missing. Please add it to your environment variables.");
    }
    return new GoogleGenAI({ apiKey });
};

interface EvaluationResponse {
    reasoning: string;
    criteriaScores: ReportCriterionScore[];
}

export const getReportFeedback = async (reportText: string, criteria: Criterion[]): Promise<string> => {
    const model = 'gemini-2.5-flash';

    const systemInstruction = `You are a helpful writing coach. Your goal is to help an employee write a strong performance report that clearly demonstrates their accomplishments against the provided goal criteria. Analyze the report text. If it is too short, vague, or lacks specific examples, provide constructive feedback on how to improve it. Suggest adding metrics, specific project details, or outcomes. If the report is well-written and detailed, affirm it and state it looks ready for submission. Keep feedback to a few sentences.`;

    const prompt = `Here is the report to review:
    ---
    ${reportText}
    ---
    
    These are the goal's criteria to keep in mind:
    ${criteria.map(c => `- ${c.name}`).join('\n')}
    
    Please provide your feedback now.`;

    try {
        const response = await getAI().models.generateContent({
            model: model,
            contents: prompt,
            config: {
                systemInstruction: systemInstruction,
                temperature: 0.5,
            }
        });
        return response.text;
    } catch (error) {
        console.error("Error getting report feedback from Gemini:", error);
        throw new Error("Failed to get report feedback. Please try again.");
    }
};


export const evaluateReport = async (reportText: string, criteria: Criterion[]): Promise<EvaluationResponse> => {
    const model = 'gemini-2.5-flash';

    const systemInstruction = `You are an unbiased performance evaluator. Your task is to analyze a work report submitted by a freelancer.
  Evaluate the report based *only* on the provided criteria. For each criterion, provide a score from 1 (poor) to 10 (excellent).
  Your response must be a valid JSON object. Do not add any markdown formatting like \`\`\`json.
  The 'reasoning' should be a concise, one or two-sentence summary of the overall performance demonstrated in the report.
  The 'criteriaScores' array must contain an object for each criterion provided.`;

    const prompt = `Report Text: "${reportText}"
  
  Criteria to evaluate:
  ${criteria.map(c => `- ${c.name} (Weight: ${c.weight}%)`).join('\n')}
  `;

    try {
        const response = await getAI().models.generateContent({
            model: model,
            contents: prompt,
            config: {
                systemInstruction: systemInstruction,
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        reasoning: { type: Type.STRING, description: 'Overall reasoning for the scores.' },
                        criteriaScores: {
                            type: Type.ARRAY,
                            description: 'Scores for each criterion.',
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    criterionName: { type: Type.STRING, description: 'Name of the criterion.' },
                                    score: { type: Type.NUMBER, description: 'Score from 1 to 10.' },
                                },
                                required: ['criterionName', 'score'],
                            },
                        },
                    },
                    required: ['reasoning', 'criteriaScores'],
                },
                temperature: 0.2,
            }
        });

        const jsonText = response.text.trim();
        const result = JSON.parse(jsonText) as EvaluationResponse;

        const scoredCriteriaNames = new Set(result.criteriaScores.map(cs => cs.criterionName));
        const missingCriteria = criteria.filter(c => !scoredCriteriaNames.has(c.name));
        if (missingCriteria.length > 0) {
            console.warn('Evaluation did not return scores for all criteria. Missing:', missingCriteria);
        }

        return result;

    } catch (error) {
        console.error("Error evaluating report with Gemini:", error);
        throw new Error("Failed to get evaluation. Please check your API key and try again.");
    }
};


export const summarizePerformance = async (reasonings: string[], averageScores: { name: string; score: number }[]): Promise<string> => {
    const model = 'gemini-2.5-pro';

    const prompt = `Based on the following average performance scores and individual report reasoning snippets, generate a single, comprehensive paragraph summarizing the candidate's performance for this period. The summary should be constructive and highlight both strengths and areas for potential improvement.
    
    Average Scores:
    ${averageScores.map(s => `- ${s.name}: ${s.score.toFixed(2)}/10`).join('\n')}
    
    Reasoning Snippets from Reports:
    ${reasonings.map(r => `- "${r}"`).join('\n')}
    
    Summary:`;

    try {
        const response = await getAI().models.generateContent({
            model: model,
            contents: prompt,
        });
        return response.text;
    } catch (error) {
        console.error("Error summarizing performance with Gemini:", error);
        throw new Error("Failed to generate performance summary.");
    }
};

export const generateInsights = async (reports: Report[]): Promise<{ strengths: string; improvements: string; }> => {
    const model = 'gemini-2.5-pro';

    const reportSummaries = reports.map(r =>
        `Report from ${new Date(r.submissionDate).toLocaleDateString()}:
        - Final Score: ${r.evaluationScore.toFixed(2)}/10
        - Evaluation Reasoning: "${r.evaluationReasoning}"
        - Criteria Scores: ${r.criterionScores.map(cs => `${cs.criterionName}: ${cs.score}`).join(', ')}`
    ).join('\n\n');

    const prompt = `
    You are an expert career coach analyzing a series of performance reports for an employee. Based on the data provided, identify key strengths and actionable areas for improvement. Present your findings in a constructive and encouraging tone.

    **Performance Data:**
    ${reportSummaries}

    **Your Task:**
    Provide a JSON object with two keys: "strengths" and "improvements".
    - For "strengths", write a paragraph highlighting consistent high-performance areas. Mention specific skills or qualities demonstrated.
    - For "improvements", write a paragraph identifying recurring themes where scores are lower or feedback suggests growth. Suggest concrete, actionable steps the employee can take to develop in these areas.
    
    Example response format:
    {
      "strengths": "The employee consistently excels in...",
      "improvements": "An opportunity for growth lies in..."
    }
    `;

    try {
        const response = await getAI().models.generateContent({
            model: model,
            contents: prompt,
            config: {
                systemInstruction: "You are an expert career coach analyzing performance reports. Provide constructive feedback in JSON format.",
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        strengths: { type: Type.STRING },
                        improvements: { type: Type.STRING },
                    },
                    required: ['strengths', 'improvements']
                },
                temperature: 0.7,
            }
        });
        const jsonText = response.text.trim();
        return JSON.parse(jsonText) as { strengths: string; improvements: string; };
    } catch (error) {
        console.error("Error generating insights with Gemini:", error);
        throw new Error("Failed to generate insights.");
    }
};