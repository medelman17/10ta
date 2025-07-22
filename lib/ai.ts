import { createAnthropic } from '@ai-sdk/anthropic';
import { generateObject } from 'ai';
import { z } from 'zod';

const anthropic = createAnthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export const IssueAnalysisSchema = z.object({
  category: z.enum(['plumbing', 'electrical', 'hvac', 'structural', 'pest', 'safety', 'noise', 'other']),
  severity: z.enum(['emergency', 'high', 'medium', 'low']),
  description: z.string(),
  location: z.string(),
  suggested_action: z.string(),
  confidence: z.number().min(0).max(1),
});

export type IssueAnalysis = z.infer<typeof IssueAnalysisSchema>;

export async function analyzeIssuePhoto(imageUrl: string): Promise<IssueAnalysis> {
  const { object } = await generateObject({
    model: anthropic('claude-3-5-sonnet-20241022'),
    schema: IssueAnalysisSchema,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: `Analyze this photo for property/housing issues that a tenant might report to their landlord. 
            
            Focus on identifying:
            - Type of issue (plumbing, electrical, structural damage, pests, safety hazards, HVAC problems, general maintenance)
            - Severity level (emergency = immediate danger/habitability, urgent = affects daily living, routine = cosmetic/minor)
            - Location within the property
            - Detailed description of what you see
            - What action the tenant should request from the landlord
            - Your confidence level in this analysis (0.0 to 1.0)
            
            Be specific and actionable in your descriptions. Consider tenant rights and habitability standards.`,
          },
          {
            type: 'image',
            image: imageUrl,
          },
        ],
      },
    ],
  });

  return object;
}