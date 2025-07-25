import { createAnthropic } from '@ai-sdk/anthropic';
import { generateText } from 'ai';
import { z } from 'zod';

const anthropic = createAnthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export const IssueAnalysisSchema = z.object({
  category: z.string(),
  severity: z.string(),
  description: z.string(),
  location: z.string(),
  suggested_action: z.string(),
  confidence: z.number(),
});

export type IssueAnalysis = z.infer<typeof IssueAnalysisSchema>;

export async function analyzeIssuePhoto(imageUrl: string): Promise<IssueAnalysis> {
  console.log('analyzeIssuePhoto called with URL:', imageUrl);
  
  const { text } = await generateText({
    model: anthropic('claude-3-5-sonnet-20241022'),
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: `Analyze this photo for property/housing issues that a tenant might report to their landlord. 

Respond with ONLY a JSON object in this exact format:
{
  "category": "string - most accurate category (plumbing, electrical, hvac, structural, pest, safety, noise, elevator, mechanical, maintenance, or create specific like 'elevator maintenance', 'roofing', 'windows', etc.)",
  "severity": "string - emergency, high, medium, or low",
  "description": "string - detailed description of what you observe",
  "location": "string - where in building/unit this is located",
  "suggested_action": "string - recommended action to address this",
  "confidence": "number - confidence level from 0.0 to 1.0"
}

Be specific and accurate. Only describe what you can clearly observe.`,
          },
          {
            type: 'image',
            image: imageUrl,
          },
        ],
      },
    ],
  });

  console.log('AI response text:', text);

  try {
    const analysis = JSON.parse(text);
    console.log('Parsed analysis:', analysis);
    
    // Validate with Zod
    const validatedAnalysis = IssueAnalysisSchema.parse(analysis);
    return validatedAnalysis;
  } catch (parseError) {
    console.error('Failed to parse AI response:', parseError);
    console.error('Raw response:', text);
    
    // Fallback analysis
    return {
      category: 'other',
      severity: 'medium',
      description: 'Unable to analyze image automatically. Please provide details manually.',
      location: 'other',
      suggested_action: 'Please describe the issue in the form below',
      confidence: 0.0
    };
  }
}