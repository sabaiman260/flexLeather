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
 * Default verified sender: patina@theflexleather.com
 */
const mailTransporter = nodemailer.createTransport({
    host: process.env.BREVO_SMTP_HOST || "smtp-relay.brevo.com",
    port: Number(process.env.BREVO_SMTP_PORT) || 587, // Use 587 for TLS
    secure: false, // TLS - set to false for port 587
    auth: {
        user: process.env.BREVO_SMTP_USER || process.env.MAIL_USERNAME,
        pass: process.env.BREVO_SMTP_PASS || process.env.MAIL_PASSWORD,
    },
    tls: {
        ciphers: 'SSLv3',
        rejectUnauthorized: false,
    },
    // Brevo specific settings
    pool: true, // Use connection pooling
    maxConnections: 5,
    maxMessages: 100,
});

/**
 * Test email transporter connection
 */
export const testEmailConnection = async () => {
    try {
        await mailTransporter.verify();
        console.log('✅ Brevo SMTP connection successful');
        return true;
    } catch (error) {
        console.error('❌ Brevo SMTP connection failed:', error.message);
        return false;
    }
};

/**
 * Mailgen config
 */
const mailGenerator = new Mailgen({
    theme: "default",
    product: {
        name: "E - Commerce",
        link: process.env.CLIENT_URL || "http://localhost:3000",
        copyright: `© ${new Date().getFullYear()} E - Commerce. All rights reserved.`,
    },
});

export { mailTransporter, mailGenerator };
