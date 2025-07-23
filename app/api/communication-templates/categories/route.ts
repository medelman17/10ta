import { NextResponse } from 'next/server';
import { TemplateCategory } from '@prisma/client';
import { withAuth, createErrorResponse } from '@/lib/api-middleware';
import { getCurrentUser } from '@/lib/auth';

// GET /api/communication-templates/categories
export const GET = withAuth(async () => {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return createErrorResponse(401, 'Authentication required');
    }

    // Define category metadata with descriptions
    const categoryMetadata: Record<TemplateCategory, { name: string; description: string; icon: string }> = {
      [TemplateCategory.MAINTENANCE]: {
        name: 'Maintenance',
        description: 'Templates for maintenance requests and follow-ups',
        icon: 'wrench'
      },
      [TemplateCategory.RENT]: {
        name: 'Rent & Lease',
        description: 'Templates for rent increases, lease issues, and housing costs',
        icon: 'dollar-sign'
      },
      [TemplateCategory.LEGAL]: {
        name: 'Legal & Habitability',
        description: 'Templates for housing code violations and legal notices',
        icon: 'scale'
      },
      [TemplateCategory.NOISE]: {
        name: 'Noise Complaints',
        description: 'Templates for noise disturbances and quiet enjoyment issues',
        icon: 'volume-x'
      },
      [TemplateCategory.SECURITY]: {
        name: 'Security & Safety',
        description: 'Templates for security concerns and safety issues',
        icon: 'shield'
      },
      [TemplateCategory.GENERAL]: {
        name: 'General',
        description: 'General purpose communication templates',
        icon: 'message-circle'
      },
      [TemplateCategory.FOLLOW_UP]: {
        name: 'Follow-up',
        description: 'Templates for following up on previous communications',
        icon: 'clock'
      },
      [TemplateCategory.ESCALATION]: {
        name: 'Escalation',
        description: 'Templates for escalating unresolved issues',
        icon: 'trending-up'
      }
    };

    const categories = Object.values(TemplateCategory).map(category => ({
      value: category,
      ...categoryMetadata[category]
    }));

    return NextResponse.json(categories);
  } catch (error) {
    console.error('Error fetching template categories:', error);
    return createErrorResponse(500, 'Internal server error');
  }
});