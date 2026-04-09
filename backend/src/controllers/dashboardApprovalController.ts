import { Request, Response } from 'express';
import { getPrismaClient } from '../services/prisma.service';
import axios from 'axios';

const prisma = getPrismaClient();

/**
 * GET /api/approvals/pending
 * Fetch all pending approval requests for the dashboard
 */
export const getPendingApprovals = async (req: Request, res: Response) => {
  try {
    const approvals = await prisma.approvalRequest.findMany({
      where: {
        status: 'pending',
        expiresAt: {
          gt: new Date(), // Only non-expired requests
        },
      },
      include: {
        newsItem: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    res.json({
      success: true,
      count: approvals.length,
      approvals: approvals.map(approval => ({
        id: approval.id,
        newsItemId: approval.newsItemId,
        title: approval.title,
        summary: approval.summary,
        source: approval.source,
        link: approval.link,
        imageUrl: approval.imageUrl,
        generatedPosts: approval.generatedPosts,
        createdAt: approval.createdAt,
        expiresAt: approval.expiresAt,
      })),
    });
  } catch (error: any) {
    console.error('❌ Failed to fetch pending approvals:', error.message);
    res.status(500).json({ error: error.message });
  }
};

/**
 * GET /api/approvals/pending/:approvalId
 * Fetch a single approval request details
 */
export const getApprovalDetail = async (req: Request, res: Response) => {
  try {
    const { approvalId } = req.params;

    const approval = await prisma.approvalRequest.findUnique({
      where: { id: approvalId },
      include: {
        newsItem: true,
      },
    });

    if (!approval) {
      return res.status(404).json({ error: 'Approval request not found' });
    }

    res.json({
      success: true,
      approval: {
        id: approval.id,
        newsItemId: approval.newsItemId,
        title: approval.title,
        summary: approval.summary,
        source: approval.source,
        link: approval.link,
        imageUrl: approval.imageUrl,
        generatedPosts: approval.generatedPosts,
        status: approval.status,
        createdAt: approval.createdAt,
        expiresAt: approval.expiresAt,
      },
    });
  } catch (error: any) {
    console.error('❌ Failed to fetch approval details:', error.message);
    res.status(500).json({ error: error.message });
  }
};

/**
 * POST /api/approvals/:approvalId/approve
 * Approve an approval request and publish to n8n
 */
export const approveRequest = async (req: Request, res: Response) => {
  try {
    const { approvalId } = req.params;
    const { edits } = req.body; // Optional edits to generated posts

    console.log(`\n✅ STAGE 3: DASHBOARD APPROVAL`);
    console.log(`   Approval ID: ${approvalId}`);
    console.log(`   Status: APPROVED\n`);

    const approval = await prisma.approvalRequest.findUnique({
      where: { id: approvalId },
      include: {
        newsItem: true,
      },
    });

    if (!approval) {
      return res.status(404).json({ error: 'Approval request not found' });
    }

    if (approval.status !== 'pending') {
      return res.status(400).json({
        error: `Cannot approve: approval is already ${approval.status}`,
      });
    }

    // Apply edits if provided
    let generatedPosts = approval.generatedPosts as any[];
    if (edits && Array.isArray(edits)) {
      for (const edit of edits) {
        const post = generatedPosts.find(p => p.platform === edit.platform);
        if (post) {
          if (edit.content !== undefined) post.content = edit.content;
          if (edit.hashtags !== undefined) post.hashtags = edit.hashtags;
        }
      }
    }

    // Resume the n8n workflow via the one-time resumeUrl
    try {
      console.log(`🔄 Resuming n8n workflow...`);

      const resumeUrl = new URL(approval.resumeUrl);
      resumeUrl.searchParams.set('approved', 'true');

      const n8nResponse = await axios.get(resumeUrl.toString(), {
        timeout: 15000,
        validateStatus: () => true,
      });

      console.log(`✅ n8n workflow resumed with status: ${n8nResponse.status}`);
    } catch (n8nError: any) {
      console.error('❌ Failed to resume n8n workflow:', n8nError.message);
      // Don't fail the approval if n8n fails — user already approved
    }

    // Update approval request status
    const updatedApproval = await prisma.approvalRequest.update({
      where: { id: approvalId },
      data: {
        status: 'approved',
        approvedAt: new Date(),
        approvedBy: (req as any).auth?.userId || 'dashboard',
        generatedPosts: generatedPosts,
      },
    });

    await prisma.auditLog.create({
      data: {
        action: 'approval_request_approved',
        entityType: 'approval_request',
        entityId: approvalId,
        userId: (req as any).auth?.userId || 'dashboard',
        details: {
          newsId: approval.newsItemId,
          editsApplied: edits?.length || 0,
        },
      },
    });

    res.json({
      success: true,
      message: 'Approval processed and n8n workflow resumed',
      approval: updatedApproval,
    });
  } catch (error: any) {
    console.error('❌ Approval processing error:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * POST /api/approvals/:approvalId/reject
 * Reject an approval request
 */
export const rejectRequest = async (req: Request, res: Response) => {
  try {
    const { approvalId } = req.params;
    const { reason } = req.body;

    console.log(`\n❌ DASHBOARD REJECTION`);
    console.log(`   Approval ID: ${approvalId}`);
    console.log(`   Reason: ${reason || 'No reason provided'}\n`);

    const approval = await prisma.approvalRequest.findUnique({
      where: { id: approvalId },
      include: {
        newsItem: true,
      },
    });

    if (!approval) {
      return res.status(404).json({ error: 'Approval request not found' });
    }

    if (approval.status !== 'pending') {
      return res.status(400).json({
        error: `Cannot reject: approval is already ${approval.status}`,
      });
    }

    // Try to resume n8n with rejection signal
    try {
      console.log(`🔄 Resuming n8n workflow with rejection signal...`);

      const resumeUrl = new URL(approval.resumeUrl);
      resumeUrl.searchParams.set('approved', 'false');
      if (reason) {
        resumeUrl.searchParams.set('reason', String(reason));
      }

      const n8nResponse = await axios.get(resumeUrl.toString(), {
        timeout: 15000,
        validateStatus: () => true,
      });

      console.log(`✅ n8n workflow resumed with rejection status: ${n8nResponse.status}`);
    } catch (n8nError: any) {
      console.error('❌ Failed to resume n8n workflow:', n8nError.message);
      // Don't fail the rejection if n8n fails
    }

    // Update approval request status
    const updatedApproval = await prisma.approvalRequest.update({
      where: { id: approvalId },
      data: {
        status: 'rejected',
        rejectedAt: new Date(),
        approvedBy: (req as any).auth?.userId || 'dashboard',
        rejectionReason: reason || 'Rejected via dashboard',
      },
    });

    await prisma.auditLog.create({
      data: {
        action: 'approval_request_rejected',
        entityType: 'approval_request',
        entityId: approvalId,
        userId: (req as any).auth?.userId || 'dashboard',
        details: {
          newsId: approval.newsItemId,
          reason: reason || 'No reason provided',
        },
      },
    });

    res.json({
      success: true,
      message: 'Approval rejected and n8n workflow notified',
      approval: updatedApproval,
    });
  } catch (error: any) {
    console.error('❌ Rejection processing error:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * POST /api/approvals/:approvalId/edit-posts
 * Edit generated posts before approval
 */
export const editApprovalPosts = async (req: Request, res: Response) => {
  try {
    const { approvalId } = req.params;
    const { edits } = req.body; // Array of { platform, content, hashtags }

    if (!Array.isArray(edits) || edits.length === 0) {
      return res.status(400).json({ error: 'No edits provided' });
    }

    const approval = await prisma.approvalRequest.findUnique({
      where: { id: approvalId },
    });

    if (!approval) {
      return res.status(404).json({ error: 'Approval request not found' });
    }

    if (approval.status !== 'pending') {
      return res.status(400).json({
        error: 'Cannot edit: approval is no longer pending',
      });
    }

    // Apply edits to generated posts
    let generatedPosts = approval.generatedPosts as any[];
    for (const edit of edits) {
      const post = generatedPosts.find(p => p.platform === edit.platform);
      if (post) {
        if (edit.content !== undefined) post.content = edit.content;
        if (edit.hashtags !== undefined) post.hashtags = edit.hashtags;
      }
    }

    // Save updated posts
    const updated = await prisma.approvalRequest.update({
      where: { id: approvalId },
      data: {
        generatedPosts,
      },
    });

    res.json({
      success: true,
      message: 'Posts updated successfully',
      generatedPosts: updated.generatedPosts,
    });
  } catch (error: any) {
    console.error('❌ Failed to edit posts:', error.message);
    res.status(500).json({ error: error.message });
  }
};
