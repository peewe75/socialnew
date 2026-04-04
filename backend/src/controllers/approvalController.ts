import { Request, Response } from 'express';
import { ApprovalRequest } from '../types';

/**
 * POST /api/approval/submit
 * Riceve l'approvazione dal tuo sistema
 */
export const submitApproval = async (req: Request, res: Response) => {
  try {
    const approvalData: ApprovalRequest = req.body;

    console.log(`\n✅ STAGE 3: APPROVAL RECEIVED`);
    console.log(`   News ID: ${approvalData.newsId}`);
    console.log(`   Status: ${approvalData.approved ? 'APPROVED' : 'REJECTED'}`);
    console.log(`   Scheduled: ${approvalData.scheduleTime || 'immediate'}\n`);

    if (approvalData.edits && approvalData.edits.length > 0) {
      console.log(`   Edits applied: ${approvalData.edits.length}`);
      approvalData.edits.forEach(edit => {
        console.log(`      - ${edit.platform}: updated`);
      });
      console.log();
    }

    res.json({
      success: true,
      message: `Post ${approvalData.newsId} processed`,
      status: approvalData.approved ? 'approved' : 'rejected',
    });
  } catch (error: any) {
    console.error('❌ Approval error:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * GET /api/approval/status/:newsId
 * Controlla lo stato dell'approvazione
 */
export const getApprovalStatus = async (req: Request, res: Response) => {
  try {
    const { newsId } = req.params;

    res.json({
      success: true,
      newsId,
      status: 'pending',
      message: 'Database integration required',
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};