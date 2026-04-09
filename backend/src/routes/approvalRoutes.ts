import { Router } from 'express';
import { submitApproval, getApprovalStatus, showApprovalPage, resumeApproval } from '../controllers/approvalController';
import {
  getPendingApprovals,
  getApprovalDetail,
  approveRequest,
  rejectRequest,
  editApprovalPosts,
} from '../controllers/dashboardApprovalController';

const router = Router();

// ========== Legacy: n8n workflow approval endpoints ==========
// Ricevi approvazione dal tuo webhook
router.post('/submit', submitApproval);

// Status approvazione
router.get('/status/:newsId', getApprovalStatus);

// Pagina HTML di conferma (sicura contro link scanner)
router.get('/resume', showApprovalPage);

// Riprendi wait node n8n da form o API
router.post('/resume', resumeApproval);

// ========== Dashboard-based approval endpoints ==========
// List all pending approvals for the dashboard
router.get('/pending', getPendingApprovals);

// Get single approval details
router.get('/pending/:approvalId', getApprovalDetail);

// Approve an approval request (and resume n8n)
router.post('/pending/:approvalId/approve', approveRequest);

// Reject an approval request (and notify n8n)
router.post('/pending/:approvalId/reject', rejectRequest);

// Edit generated posts before approval
router.post('/pending/:approvalId/edit-posts', editApprovalPosts);

export default router;
