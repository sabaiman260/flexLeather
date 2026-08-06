import { asyncHandler } from "../../core/utils/async-handler.js";
import { sendEmailWithRetry, getEmailQueueStatus, testEmailConnection } from "../../shared/helpers/mail.helper.js";
import { ApiResponse } from "../../core/utils/api-response.js";

const sendTestEmail = asyncHandler(async (req, res) => {
  const to = req.body?.to || req.query?.to;
  if (!to) return res.status(400).json(new ApiResponse(400, null, "Missing 'to' email address"));

  const mailOptions = {
    from: process.env.BREVO_VERIFIED_EMAIL ? `"The Flex Leather" <${process.env.BREVO_VERIFIED_EMAIL}>` : '"The Flex Leather" <info@theflexleather.com>',
    to,
    subject: 'Test Email from FlexLeather',
    html: `<p>This is a test email sent at ${new Date().toISOString()}</p>`
  };

  const result = await sendEmailWithRetry(mailOptions, 2);
  return res.status(200).json(new ApiResponse(200, { success: !!result.success, queued: !!result.queued, error: result.error?.message || null }, 'Test email attempted'));
});

const emailQueueStatus = asyncHandler(async (_req, res) => {
  const status = getEmailQueueStatus();
  return res.status(200).json(new ApiResponse(200, status, 'Email queue status'));
});

const emailConnectionTest = asyncHandler(async (_req, res) => {
  const ok = await testEmailConnection();
  return res.status(200).json(new ApiResponse(200, { ok }, 'Email connection test'));
});

export { sendTestEmail, emailQueueStatus, emailConnectionTest };
