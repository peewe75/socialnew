import { Request, Response } from 'express';
import { ApprovalRequest } from '../types';
import { getPrismaClient } from '../services/prisma.service';
import axios from 'axios';

const prisma = getPrismaClient();

/**
 * POST /api/approval/submit
 * Receive approval request from n8n workflow and save to dashboard
 * Also forwards approved content to publishing webhook
 */
export const submitApproval = async (req: Request, res: Response) => {
  try {
    const approvalData: ApprovalRequest = req.body;

    console.log(`\n✅ STAGE 2: APPROVAL REQUEST SAVED TO DASHBOARD`);
    console.log(`   News ID: ${approvalData.newsId}`);
    console.log(`   Title: ${approvalData.title || 'N/A'}`);
    console.log(`   Resume URL: ${approvalData.resumeUrl ? 'set' : 'missing'}\n`);

    if (!approvalData.newsId) {
      return res.status(400).json({ error: 'Missing newsId' });
    }

    if (!approvalData.resumeUrl) {
      return res.status(400).json({ error: 'Missing resumeUrl' });
    }

    // Create approval request record in database
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    const approvalRequest = await prisma.approvalRequest.create({
      data: {
        newsItemId: approvalData.newsId,
        title: approvalData.title || 'Approvazione da workflow',
        summary: approvalData.summary || '',
        source: approvalData.source || null,
        link: approvalData.link || null,
        generatedPosts: approvalData.generatedPosts || [],
        imageUrl: approvalData.imageUrl || null,
        resumeUrl: approvalData.resumeUrl,
        status: 'pending',
        expiresAt,
      },
    });

    console.log(`✅ Approval request created: ${approvalRequest.id}`);
    console.log(`   Status: PENDING`);
    console.log(`   Awaiting user action in dashboard\n`);

    await prisma.auditLog.create({
      data: {
        action: 'approval_request_created',
        entityType: 'approval_request',
        entityId: approvalRequest.id,
        details: {
          newsId: approvalData.newsId,
          source: 'n8n_workflow',
        },
      },
    });

    res.json({
      success: true,
      message: 'Approval request saved to dashboard',
      approvalRequestId: approvalRequest.id,
      approvalUrl: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/approvals/pending`,
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

/**
 * GET /api/approval/resume
 * Mostra una pagina HTML di conferma.
 * I link scanner di Slack/Gmail vedono solo questa pagina e NON
 * consumano l'URL one-time di n8n.
 */
export const showApprovalPage = async (req: Request, res: Response) => {
  const { resumeUrl, approved } = req.query;

  if (!resumeUrl || typeof resumeUrl !== 'string') {
    return res.status(400).send('<h1>Link non valido</h1><p>Parametro resumeUrl mancante.</p>');
  }

  const isApproval = approved === 'true';
  const action = isApproval ? 'APPROVARE' : 'RIFIUTARE';
  const color = isApproval ? '#22c55e' : '#ef4444';
  const emoji = isApproval ? '&#10004;' : '&#10006;';

  res.send(`<!DOCTYPE html>
<html lang="it">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Conferma ${isApproval ? 'Approvazione' : 'Rifiuto'} - News to Social</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
           display: flex; justify-content: center; align-items: center; min-height: 100vh;
           background: #f8fafc; color: #1e293b; }
    .card { background: white; border-radius: 16px; padding: 48px; max-width: 420px;
            text-align: center; box-shadow: 0 4px 24px rgba(0,0,0,0.08); }
    .emoji { font-size: 48px; margin-bottom: 16px; }
    h1 { font-size: 22px; margin-bottom: 12px; }
    p { color: #64748b; margin-bottom: 32px; line-height: 1.5; }
    button { background: ${color}; color: white; border: none; padding: 14px 40px;
             border-radius: 10px; font-size: 16px; font-weight: 600; cursor: pointer;
             transition: opacity 0.2s; }
    button:hover { opacity: 0.9; }
    button:disabled { opacity: 0.5; cursor: not-allowed; }
    .done { display: none; color: ${color}; font-weight: 600; font-size: 18px; }
  </style>
</head>
<body>
  <div class="card">
    <div class="emoji">${emoji}</div>
    <h1>Vuoi ${action} questo contenuto?</h1>
    <p>Clicca il pulsante per confermare. Questa azione non pu&ograve; essere annullata.</p>
    <form method="POST" action="/api/approval/resume" id="frm">
      <input type="hidden" name="resumeUrl" value="${resumeUrl.replace(/"/g, '&quot;')}">
      <input type="hidden" name="approved" value="${isApproval}">
      <button type="submit" id="btn">Conferma: ${action}</button>
    </form>
    <p class="done" id="done">${isApproval ? 'Approvato!' : 'Rifiutato!'} Puoi chiudere questa pagina.</p>
  </div>
  <script>
    document.getElementById('frm').addEventListener('submit', function() {
      document.getElementById('btn').disabled = true;
      document.getElementById('btn').textContent = 'Invio in corso...';
    });
  </script>
</body>
</html>`);
};

/**
 * POST /api/approval/resume
 * Riprende in modo sicuro un Wait node n8n via resumeUrl.
 * Accetta sia JSON (API) che form-urlencoded (dalla pagina HTML).
 */
export const resumeApproval = async (req: Request, res: Response) => {
  try {
    const { resumeUrl, approved, reason } = req.body || {};

    if (!resumeUrl || typeof resumeUrl !== 'string') {
      return res.status(400).json({ error: 'resumeUrl required' });
    }

    const url = new URL(resumeUrl);
    const isApproved = approved === true || approved === 'true';
    url.searchParams.set('approved', isApproved ? 'true' : 'false');
    if (reason) {
      url.searchParams.set('reason', String(reason));
    }

    const response = await axios.get(url.toString(), {
      timeout: 15000,
      validateStatus: () => true,
    });

    // Se la richiesta viene da un form HTML, mostra una pagina di conferma
    const isFormSubmit = req.headers['content-type']?.includes('form-urlencoded');
    if (isFormSubmit) {
      const ok = response.status < 400;
      const color = isApproved ? '#22c55e' : '#ef4444';
      return res.send(`<!DOCTYPE html>
<html lang="it"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${ok ? 'Fatto!' : 'Errore'}</title>
<style>body{font-family:-apple-system,sans-serif;display:flex;justify-content:center;align-items:center;
min-height:100vh;background:#f8fafc}.card{background:white;border-radius:16px;padding:48px;
max-width:420px;text-align:center;box-shadow:0 4px 24px rgba(0,0,0,.08)}
h1{color:${ok ? color : '#ef4444'};margin-bottom:12px}p{color:#64748b}</style></head>
<body><div class="card"><h1>${ok ? (isApproved ? '&#10004; Approvato!' : '&#10006; Rifiutato!') : '&#9888; Errore'}</h1>
<p>${ok ? 'Puoi chiudere questa pagina.' : 'Il link potrebbe essere gi&agrave; stato usato.'}</p></div></body></html>`);
    }

    if (response.status >= 400) {
      return res.status(response.status).json({
        error: 'Resume failed',
        details: response.data,
      });
    }

    res.json({
      success: true,
      approved: isApproved,
      data: response.data,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
