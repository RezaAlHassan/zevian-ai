import { GoogleGenAI, Type } from "@google/genai";
import { Criterion, Report, ReportCriterionScore, Goal, Employee } from '../types';

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

    const systemInstruction = `You are a Senior Engineering Manager with 15 years of experience. Your goal is to help an employee write a strong performance report that clearly demonstrates their accomplishments against the provided goal criteria. Your tone is professional, direct, and growth-oriented. Analyze the report text. If it is too short, vague, or lacks specific examples, provide constructive feedback on how to improve it. Suggest adding metrics, specific project details, or outcomes. If the report is well-written and detailed, affirm it and state it looks ready for submission. Keep feedback to a few sentences.`;

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


export const evaluateReport = async (
    reportText: string,
    criteria: Criterion[],
    goalInstructions?: string,
    knowledgeBase?: string,
    selectedMetrics?: string[]
): Promise<EvaluationResponse> => {
    const model = 'gemini-2.5-flash';

    const systemInstruction = `You are a Senior Engineering Manager with 15 years of experience. Your task is to analyze a work report submitted by an employee. Your tone is professional, direct, and growth-oriented.
  
  CRITICAL: You have been provided with a comprehensive Knowledge Base about the project. This Knowledge Base contains:
  - Project description and context
  - Technical lexicon and terminology
  - Operational priorities
  - Quality benchmarks and standards
  - Constraints and challenges
  
  You MUST ground your evaluation in this Knowledge Base and the specific Goal Criteria. Do NOT hallucinate or assume project details not mentioned in the Knowledge Base or the report itself.
  
  Evaluate the report based on the provided criteria and goal instructions. For each criterion, provide a score from 1 (poor) to 10 (excellent).
  Consider how well the report demonstrates understanding of the project's priorities, adheres to quality benchmarks, and addresses known constraints.
  
  If Standard Metrics are provided, you MUST evaluate those AS WELL.

  Your response must be a valid JSON object. Do not add any markdown formatting like \`\`\`json.
  The 'reasoning' should be a concise summary (2-3 sentences) explaining the overall performance based on the Knowledge Base context and criteria.
  The 'criteriaScores' array must contain an object for each criterion AND each standard metric provided.`;

    const knowledgeBaseSection = knowledgeBase
        ? `\n\nPROJECT KNOWLEDGE BASE (Use this as ground truth for project context):\n${knowledgeBase}\n`
        : '';

    const instructionsSection = goalInstructions
        ? `\n\nGOAL INSTRUCTIONS:\n${goalInstructions}\n`
        : '';

    const metricsSection = selectedMetrics && selectedMetrics.length > 0
        ? `\n\nSTANDARD METRICS TO EVALUATE:
  ${selectedMetrics.join('\n')}\n`
        : '';

    const prompt = `${knowledgeBaseSection}${instructionsSection}${metricsSection}
  REPORT TEXT TO EVALUATE:
  "${reportText}"
  
  EVALUATION CRITERIA:
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
    const model = 'gemini-2.5-flash';

    const prompt = `Based on the following average performance scores and individual report reasoning snippets, generate a single, comprehensive paragraph summarizing the employee's performance for this period. The summary should be constructive and highlight both strengths and areas for potential improvement.
    
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

export const summarizeTeamPerformance = async (params: {
    reasonings: string[];
    criteriaAverages: { name: string; score: number }[];
    reliability: { rate: number; expected: number; actual: number };
    knowledgeBases: string[];
}): Promise<string> => {
    const model = 'gemini-2.5-flash';

    const systemInstruction = `You are a Senior Engineering Manager with 15 years of experience. Your task is to provide a comprehensive summary of your team's collective performance and project progress for the selected period. Your tone is professional, direct, and growth-oriented.
    
    You will be provided with:
    1. Snippets of reasoning from individual employee reports.
    2. Average performance scores across various criteria.
    3. Accountability/Reliability metrics (expected vs. actual reports).
    4. Summaries from Project Knowledge Bases to understand project context and progress.

    Your summary should follow this structure:
    - **Team Overview**: A high-level summary of collective performance.
    - **Project Progress**: Insights derived from the provided Knowledge Bases and reports.
    - **Performance Trends & Skill Gaps**: Analysis of the criteria scores.
    - **Accountability & Engagement**: Commentary on the report reliability metrics.
    
    Focus on synthesizing the information to provide actionable insights for an organization owner.`;

    const prompt = `
    ### PERFORMANCE DATA:
    
    1. REPRESENTATIVE REASONING SNIPPETS:
    ${params.reasonings.slice(0, 15).map(r => `- "${r}"`).join('\n')}
    
    2. CRITERIA AVERAGES (Skill Levels):
    ${params.criteriaAverages.map(s => `- ${s.name}: ${s.score.toFixed(2)}/10`).join('\n')}
    
    3. ACCOUNTABILITY METRICS:
    - Submission Reliability Rate: ${params.reliability.rate.toFixed(1)}%
    - Expected Reports: ${params.reliability.expected}
    - Actual Reports: ${params.reliability.actual}
    
    4. PROJECT KNOWLEDGE BASES (Context & Progress):
    ${params.knowledgeBases.join('\n\n---\n\n')}
    
    Please provide the Senior Engineering Manager summary now.`;

    try {
        const response = await getAI().models.generateContent({
            model: model,
            contents: prompt,
            config: {
                systemInstruction: systemInstruction,
                temperature: 0.6,
            }
        });
        return response.text;
    } catch (error) {
        console.error("Error summarizing team performance with Gemini:", error);
        throw new Error("Failed to generate team performance summary.");
    }
};

export const generateInsights = async (reports: Report[]): Promise<{ strengths: string; improvements: string; }> => {
    const model = 'gemini-2.5-flash';

    const reportSummaries = reports.map(r =>
        `Report from ${new Date(r.submissionDate).toLocaleDateString()}:
        - Final Score: ${r.evaluationScore.toFixed(2)}/10
        - Evaluation Reasoning: "${r.evaluationReasoning}"
        - Criteria Scores: ${r.criterionScores.map(cs => `${cs.criterionName}: ${cs.score}`).join(', ')}`
    ).join('\n\n');

    const prompt = `
    You are a Senior Engineering Manager with 15 years of experience analyzing a series of performance reports for an employee. Based on the data provided, identify key strengths and actionable areas for improvement. Your tone is professional, direct, and growth-oriented.

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
                systemInstruction: "You are a Senior Engineering Manager with 15 years of experience analyzing performance reports. Provide professional, direct, and growth-oriented feedback in JSON format.",
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

export const generateKnowledgeBase = async (params: {
    projectName: string;
    description: string;
    goals: Goal[];
    reports: Report[];
    employees: Employee[];
    fileContents?: { name: string; content: string }[];
}): Promise<string> => {
    const model = 'gemini-2.5-flash';

    const goalSummary = params.goals.map(g =>
        `Goal: ${g.name}\nInstructions: ${g.instructions}\nCriteria: ${g.criteria.map(c => `${c.name} (${c.weight}%)`).join(', ')}`
    ).join('\n\n');

    // Filter high-performing reports (score >= 8)
    const highPerformanceReports = params.reports
        .filter(r => r.evaluationScore >= 8)
        .map(r => {
            const emp = params.employees.find(e => e.id === r.employeeId);
            return `Report by ${emp?.name || 'Unknown'} (Score: ${r.evaluationScore}/10):\n${r.reportText.replace(/<[^>]*>/g, '')}\nReasoning: ${r.evaluationReasoning}`;
        }).join('\n\n');

    const allReportsSummary = params.reports.map(r => {
        const emp = params.employees.find(e => e.id === r.employeeId);
        return `${emp?.name || 'Unknown'} - ${new Date(r.submissionDate).toLocaleDateString()} - Score: ${r.evaluationScore}/10`;
    }).join('\n');

    const filesContent = params.fileContents?.map(f =>
        `File [${f.name}]:\n${f.content}`
    ).join('\n\n') || 'No additional files provided.';

    const systemInstruction = `You are a project documentation specialist. Your task is to synthesize project data into a structured JSON knowledge base for AI-driven performance evaluation.

CRITICAL INSTRUCTIONS:
1. Analyze ALL input data comprehensively
2. Extract technical terms, acronyms, and project-specific vocabulary
3. Identify success patterns from high-performance reports
4. Detect implicit challenges or constraints mentioned in descriptions
5. Output ONLY valid JSON - no markdown, no explanation text
6. Be concise but factual - remove fluff while preserving critical details`;

    const prompt = `
### INPUT DATA:

1. PROJECT DESCRIPTION:
${params.description || 'Not provided'}

2. UPLOADED DOCUMENTS (SUMMARIES):
${filesContent}

3. HISTORICAL HIGH-PERFORMANCE REPORTS (Score >= 8/10):
${highPerformanceReports || 'No high-performance reports yet'}

4. CURRENT GOALS AND CRITERIA:
${goalSummary}

5. ALL REPORTS SUMMARY:
${allReportsSummary || 'No reports submitted yet'}

### TASK:
Create a structured JSON knowledge base that standardizes the following:

1. **Project Description**: Concise overview of the project purpose and scope
2. **Roadmaps and KPIs**: Key milestones, deliverables, and success metrics found in the data
3. **Project Lexicon**: Define 5-10 technical terms, acronyms, or internal names to ensure evaluation consistency
4. **Operational Priorities**: Top 3 non-negotiable success factors based on goals and documents
5. **Style & Quality Benchmarks**: Expected tone, technical standard, or quality level based on high-performance reports
6. **Implicit Constraints**: Hidden challenges (e.g., legacy code, tight deadlines, vendor dependencies)

### OUTPUT FORMAT:
{
  "projectDescription": "...",
  "roadmapsAndKPIs": ["...", "...", "..."],
  "projectLexicon": [
    { "term": "term1", "definition": "definition" },
    { "term": "term2", "definition": "definition" }
  ],
  "operationalPriorities": ["priority1", "priority2", "priority3"],
  "styleAndQualityBenchmarks": "...",
  "implicitConstraints": ["constraint1", "constraint2"]
}

Return ONLY the JSON object. Ensure it is concise, factual, and removes redundant fluff.`;

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
                        projectDescription: { type: Type.STRING },
                        roadmapsAndKPIs: {
                            type: Type.ARRAY,
                            items: { type: Type.STRING }
                        },
                        projectLexicon: {
                            type: Type.ARRAY,
                            description: 'Technical terms and their definitions',
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    term: { type: Type.STRING },
                                    definition: { type: Type.STRING }
                                },
                                required: ['term', 'definition']
                            }
                        },
                        operationalPriorities: {
                            type: Type.ARRAY,
                            items: { type: Type.STRING },
                            description: 'Top 3 success factors'
                        },
                        styleAndQualityBenchmarks: { type: Type.STRING },
                        implicitConstraints: {
                            type: Type.ARRAY,
                            items: { type: Type.STRING }
                        }
                    },
                    required: ['projectDescription', 'roadmapsAndKPIs', 'projectLexicon', 'operationalPriorities', 'styleAndQualityBenchmarks']
                },
                temperature: 0.3,
            }
        });

        // Parse and format the JSON for display
        const jsonData = JSON.parse(response.text);

        // Convert to human-readable format
        let formatted = `PROJECT DESCRIPTION\n${jsonData.projectDescription}\n\n`;

        formatted += `ROADMAPS AND KPIS\n${jsonData.roadmapsAndKPIs.map((kpi: string, i: number) => `${i + 1}. ${kpi}`).join('\n')}\n\n`;

        formatted += `PROJECT LEXICON\n`;
        if (Array.isArray(jsonData.projectLexicon)) {
            jsonData.projectLexicon.forEach((item: { term: string; definition: string }) => {
                formatted += `• ${item.term}: ${item.definition}\n`;
            });
        }
        formatted += '\n';

        formatted += `OPERATIONAL PRIORITIES\n${jsonData.operationalPriorities.map((p: string, i: number) => `${i + 1}. ${p}`).join('\n')}\n\n`;

        formatted += `STYLE AND QUALITY BENCHMARKS\n${jsonData.styleAndQualityBenchmarks}\n\n`;

        if (jsonData.implicitConstraints && jsonData.implicitConstraints.length > 0) {
            formatted += `IMPLICIT CONSTRAINTS\n${jsonData.implicitConstraints.map((c: string) => `• ${c}`).join('\n')}`;
        }

        return formatted;
    } catch (error) {
        console.error("Error generating knowledge base with Gemini:", error);
        throw new Error("Failed to generate comprehensive knowledge base.");
    }
};

export const analyzeSkillMetrics = async (
    reports: Report[],
    metrics: { id: string, name: string }[],
    knowledgeBase?: string
): Promise<{ [metricId: string]: number }> => {
    const model = 'gemini-2.5-flash';

    const reportSummaries = reports.slice(0, 20).map(r =>
        `Date: ${new Date(r.submissionDate).toLocaleDateString()}
        Text: ${r.reportText.replace(/<[^>]*>/g, '').substring(0, 500)}
        Original Score: ${r.evaluationScore}/10`
    ).join('\n\n');

    const systemInstruction = `You are a Senior Engineering Manager with 15 years of experience. Your task is to perform a holistic assessment of an employee's skills based on a history of their work reports and the project context.
    
    You will be provided with:
    1. A list of recent work reports.
    2. A Knowledge Base for project context (if available).
    3. A set of metrics to evaluate.

    For each metric provided, assign a score from 1 (poor) to 10 (excellent) that represents the employee's current proficiency or performance level as demonstrated across the historical reports.
    
    CRITICAL: 
    - Be objective and data-driven.
    - If a metric isn't explicitly mentioned but can be inferred from the technical quality of the reports (e.g., "Documentation" from the clarity of writing), use your expert judgment.
    - If there is absolutely no data to evaluate a metric, assign a neutral score of 5.0.

    Your response must be a valid JSON object where keys are metric IDs and values are numerical scores.`;

    const knowledgeBaseSection = knowledgeBase
        ? `\n\nPROJECT KNOWLEDGE BASE:\n${knowledgeBase}\n`
        : '';

    const prompt = `${knowledgeBaseSection}
    ### HISTORICAL WORK REPORTS:
    ${reportSummaries || 'No reports available yet.'}
    
    ### METRICS TO EVALUATE:
    ${metrics.map(m => `- ${m.name} (ID: ${m.id})`).join('\n')}
    
    Please provide the scores now as a JSON object of { "metricId": score }.`;

    try {
        const response = await getAI().models.generateContent({
            model: model,
            contents: prompt,
            config: {
                systemInstruction: systemInstruction,
                responseMimeType: "application/json",
                temperature: 0.2,
            }
        });

        const jsonText = response.text.trim();
        return JSON.parse(jsonText);
    } catch (error) {
        console.error("Error analyzing skill metrics with Gemini:", error);
        throw new Error("Failed to analyze skills.");
    }
};