import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { createErrorResponse } from '@/lib/api-middleware';
import { isUserInBuilding } from '@/lib/api-access-helpers';

// POST /api/communication-templates/[id]/preview
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return createErrorResponse(401, 'Authentication required');
    }

    const { id } = await params;
    const body = await req.json();
    const { placeholderValues = {} } = body;

    // Get the template
    const template = await prisma.communicationTemplate.findUnique({
      where: { id }
    });

    if (!template) {
      return createErrorResponse(404, 'Template not found');
    }

    // Check access permissions
    if (template.buildingId) {
      const userInBuilding = await isUserInBuilding(user.id, template.buildingId);
      if (!userInBuilding) {
        return createErrorResponse(403, 'You do not have access to this template');
      }
    }

    // Get user's current tenancy for default values
    const currentTenancy = user.tenancies.find(t => t.isCurrent);
    
    // Default placeholder values based on user data
    const defaultValues: Record<string, string> = {
      '{TENANT_NAME}': `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Your Name',
      '{TENANT_EMAIL}': user.email || 'your.email@example.com',
      '{TENANT_PHONE}': user.phone || 'Your Phone Number',
      '{UNIT_NUMBER}': currentTenancy?.unit?.unitNumber || 'Your Unit',
      '{DATE}': new Date().toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      }),
      '{TIME}': new Date().toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      }),
      '{BUILDING_ADDRESS}': currentTenancy?.unit?.building?.address || 'Building Address',
      '{LANDLORD_NAME}': 'Landlord Name',
      '{CURRENT_RENT}': '$0,000',
      '{NEW_RENT}': '$0,000',
      '{REQUEST_DATE}': 'Request Date',
      '{ISSUE_DESCRIPTION}': 'Issue Description',
      '{VIOLATION_LIST}': '• Violation 1\n• Violation 2',
      '{SECURITY_ISSUES}': '• Security Issue 1\n• Security Issue 2',
      '{NOISE_SOURCE}': 'Noise Source',
      '{PREVIOUS_ATTEMPTS}': '• Previous communication on [date]\n• Follow-up on [date]',
      '{FREQUENCY_PATTERN}': 'Daily/Weekly pattern description',
      '{INSPECTION_REASONS}': '• Reason 1\n• Reason 2',
      '{IMMEDIATE_ACTIONS}': '• Action taken 1\n• Action taken 2',
      '{ADDITIONAL_CONCERNS}': 'Additional concerns...',
      '{START_DATE}': 'Start Date',
      '{NOTICE_DATE}': 'Notice Date',
      '{EFFECTIVE_DATE}': 'Effective Date',
      '{ORIGINAL_SUBJECT}': 'Original Subject',
      '{ORIGINAL_DATE}': 'Original Date',
      '{ISSUE_SUMMARY}': 'Issue Summary',
      '{IMPACT_DESCRIPTION}': 'Impact Description',
      '{ORIGINAL_REQUEST}': 'Original Request Details',
      '{COMMUNICATION_HISTORY}': '• Communication 1\n• Communication 2',
      '{UNRESOLVED_ISSUES}': '• Issue 1\n• Issue 2',
    };

    // Merge user-provided values with defaults
    const allValues = { ...defaultValues, ...placeholderValues };

    // Process the template content and subject
    let processedSubject = template.subject;
    let processedContent = template.content;

    // Replace placeholders in both subject and content
    Object.entries(allValues).forEach(([placeholder, value]) => {
      const regex = new RegExp(placeholder.replace(/[{}]/g, '\\$&'), 'g');
      const stringValue = String(value);
      processedSubject = processedSubject.replace(regex, stringValue);
      processedContent = processedContent.replace(regex, stringValue);
    });

    // Find any remaining unreplaced placeholders
    const unreplacedPlaceholders = new Set<string>();
    const placeholderRegex = /\{[^}]+\}/g;
    
    let match;
    while ((match = placeholderRegex.exec(processedSubject)) !== null) {
      unreplacedPlaceholders.add(match[0]);
    }
    while ((match = placeholderRegex.exec(processedContent)) !== null) {
      unreplacedPlaceholders.add(match[0]);
    }

    return NextResponse.json({
      template: {
        id: template.id,
        name: template.name,
        category: template.category,
        originalSubject: template.subject,
        originalContent: template.content,
        placeholders: template.placeholders,
      },
      preview: {
        subject: processedSubject,
        content: processedContent,
      },
      placeholderValues: allValues,
      unreplacedPlaceholders: Array.from(unreplacedPlaceholders),
      availablePlaceholders: template.placeholders,
    });
  } catch (error) {
    console.error('Error generating template preview:', error);
    return createErrorResponse(500, 'Internal server error');
  }
}