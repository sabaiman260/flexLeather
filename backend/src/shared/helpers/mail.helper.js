// import Mailgen from "mailgen"
// import nodemailer from "nodemailer"
// import dotenv from "dotenv"

// dotenv.config()

// const mailTransporter = nodemailer.createTransport({
//     host: process.env.MAIL_HOST,
//     port: process.env.MAIL_PORT,
//     auth: {
//         user: process.env.MAIL_USERNAME,
//         pass: process.env.MAIL_PASSWORD
//     }
// })

// const mailGenerator = new Mailgen({
//     theme: "default",
//     product: {
//         name: 'E - Commerce',
//         link: process.env.CLIENT_URL || "http://localhost:3000",
//         copyright: `© ${new Date().getFullYear()} E - Commerce. All rights reserved.`,
//     },
// })

import Mailgen from "mailgen";
import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

/**
 * Brevo SMTP Transport Configuration
 * Default verified sender: info@theflexleather.com
 * Sender display name: The Flex Leather
 */
const mailTransporter = nodemailer.createTransport({
    host: process.env.BREVO_SMTP_HOST || "smtp-relay.brevo.com",
    port: Number(process.env.BREVO_SMTP_PORT) || 587,
    secure: false,
    auth: {
        user: process.env.BREVO_SMTP_USER || process.env.MAIL_USERNAME,
        pass: process.env.BREVO_SMTP_PASS || process.env.MAIL_PASSWORD,
    },
    tls: {
        rejectUnauthorized: false,
    },
    pool: true,
    maxConnections: 5,
    maxMessages: 100,
    socketTimeout: 30000,
    greetingTimeout: 15000,
    connectionTimeout: 15000,
});

/**
 * Email queue for reliable delivery
 */
const emailQueue = [];
let isProcessingQueue = false;
let queueProcessingStarted = false;

/**
 * Send email with retry logic
 */
export const sendEmailWithRetry = async (mailOptions, maxRetries = 3) => {
    const timestamp = new Date().toISOString();
    const logPrefix = `[📧 EMAIL ${timestamp}]`;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            console.log(`${logPrefix} Attempt ${attempt}/${maxRetries} → Sending to: ${mailOptions.to}`);

            // Ensure replyTo and envelope are set to improve deliverability and bounce handling
            const finalOptions = {
                ...mailOptions,
                replyTo: mailOptions.replyTo || mailOptions.from,
                envelope: mailOptions.envelope || { from: mailOptions.from, to: mailOptions.to }
            };

            const info = await mailTransporter.sendMail(finalOptions);

            // Log full transporter info to aid debugging (accepted/rejected/envelope/response)
            console.log(`${logPrefix} ✅ SUCCESS! MessageId: ${info.messageId}`);
            console.log(`${logPrefix} From: ${finalOptions.from}`);
            console.log(`${logPrefix} To: ${finalOptions.to}`);
            console.log(`${logPrefix} Subject: ${finalOptions.subject}`);
            console.log(`${logPrefix} Accepted:`, info.accepted);
            console.log(`${logPrefix} Rejected:`, info.rejected);
            console.log(`${logPrefix} Envelope:`, info.envelope || finalOptions.envelope);
            console.log(`${logPrefix} Response:`, info.response || 'n/a');

            return { success: true, info };
        } catch (error) {
            console.error(`${logPrefix} ❌ FAILED (Attempt ${attempt}/${maxRetries}):`, {
                to: mailOptions.to,
                error: error.message,
                code: error.code
            });
            
            if (attempt === maxRetries) {
                console.error(`${logPrefix} ⚠️ ALL RETRIES EXHAUSTED for ${mailOptions.to}`);
                
                // Add to queue for later retry
                emailQueue.push(mailOptions);
                console.error(`${logPrefix} Email queued for later retry. Queue length: ${emailQueue.length}`);
                
                return { success: false, error, queued: true };
            }
            
            // Wait before retrying (exponential backoff: 1s, 2s, 4s)
            const waitTime = Math.pow(2, attempt - 1) * 1000;
            console.log(`${logPrefix} ⏳ Retrying in ${waitTime}ms...`);
            await new Promise(resolve => setTimeout(resolve, waitTime));
        }
    }
};

/**
 * Get queue status
 */
export const getEmailQueueStatus = () => {
    return {
        queueLength: emailQueue.length,
        isProcessing: isProcessingQueue
    };
};

/**
 * Test email transporter connection
 */
export const testEmailConnection = async () => {
    try {
        await mailTransporter.verify();
        console.log('✅ Brevo SMTP connection successful');
        return true;
    } catch (error) {
        console.error('❌ Brevo SMTP connection failed:', {
            message: error.message,
            code: error.code,
            stack: error.stack
        });
        return false;
    }
};

/**
 * Mailgen config
 */
const mailGenerator = new Mailgen({
    theme: "default",
    product: {
        name: "The Flex Leather",
        link: process.env.CLIENT_URL || "http://localhost:3000",
        copyright: `© ${new Date().getFullYear()} The Flex Leather. All rights reserved.`,
    },
});

export { mailTransporter, mailGenerator };
