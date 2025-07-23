import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { createErrorResponse } from '@/lib/api-middleware';
import { TemplateCategory } from '@prisma/client';
import { isUserInBuilding } from '@/lib/api-access-helpers';

// GET /api/communication-templates/[id]
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return createErrorResponse(401, 'Authentication required');
    }

    const { id } = await params;

    const template = await prisma.communicationTemplate.findUnique({
      where: { id },
      include: {
        creator: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          }
        },
        building: {
          select: {
            id: true,
            name: true,
          }
        }
      }
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

    // Increment usage count
    await prisma.communicationTemplate.update({
      where: { id },
      data: { usageCount: { increment: 1 } }
    });

    return NextResponse.json(template);
  } catch (error) {
    console.error('Error fetching communication template:', error);
    return createErrorResponse(500, 'Internal server error');
  }
}

// PUT /api/communication-templates/[id] - Update template
export async function PUT(
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
    const { 
      name, 
      category, 
      description, 
      subject, 
      content, 
      placeholders, 
      isActive 
    } = body;

    // Get the existing template
    const existingTemplate = await prisma.communicationTemplate.findUnique({
      where: { id }
    });

    if (!existingTemplate) {
      return createErrorResponse(404, 'Template not found');
    }

    // Check if user can modify this template
    if (existingTemplate.isBuiltIn) {
      return createErrorResponse(403, 'Cannot modify built-in templates');
    }

    if (existingTemplate.createdBy !== user.id) {
      // TODO: Add admin permission check here
      return createErrorResponse(403, 'You can only modify templates you created');
    }

    // Validate category if provided
    if (category && !Object.values(TemplateCategory).includes(category)) {
      return createErrorResponse(400, 'Invalid template category');
    }

    // Update the template
    const updatedTemplate = await prisma.communicationTemplate.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(category && { category }),
        ...(description !== undefined && { description }),
        ...(subject && { subject }),
        ...(content && { content }),
        ...(placeholders && { placeholders }),
        ...(isActive !== undefined && { isActive }),
      },
      include: {
        creator: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          }
        },
        building: {
          select: {
            id: true,
            name: true,
          }
        }
      }
    });

    return NextResponse.json(updatedTemplate);
  } catch (error) {
    console.error('Error updating communication template:', error);
    return createErrorResponse(500, 'Internal server error');
  }
}

// DELETE /api/communication-templates/[id]
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return createErrorResponse(401, 'Authentication required');
    }

    const { id } = await params;

    // Get the existing template
    const existingTemplate = await prisma.communicationTemplate.findUnique({
      where: { id }
    });

    if (!existingTemplate) {
      return createErrorResponse(404, 'Template not found');
    }

    // Check if user can delete this template
    if (existingTemplate.isBuiltIn) {
      return createErrorResponse(403, 'Cannot delete built-in templates');
    }

    if (existingTemplate.createdBy !== user.id) {
      // TODO: Add admin permission check here
      return createErrorResponse(403, 'You can only delete templates you created');
    }

    // Soft delete by marking as inactive instead of hard delete
    await prisma.communicationTemplate.update({
      where: { id },
      data: { isActive: false }
    });

    return NextResponse.json({ message: 'Template deleted successfully' });
  } catch (error) {
    console.error('Error deleting communication template:', error);
    return createErrorResponse(500, 'Internal server error');
  }
}