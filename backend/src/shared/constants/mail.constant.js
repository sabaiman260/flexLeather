// import { mailGenerator } from "../helpers/mail.helper.js";

// const userVerificationMailBody = (name, url) => {
//     const email = {
//         body: {
//             name: name,
//             intro: "Welcome to FlexLeather! We're very excited to have you on board.",
//             action: {
//                 instructions: "To get started with E-Commerce, please click here:",
//                 button: {
//                     color: "#22BC66",
//                     text: "Confirm your account",
//                     link: url,
//                 },
//             },
//             outro: "Need help or have questions? Just reply to this email — we're always happy to help.",
//         },
//     };


//     return mailGenerator.generate(email);
// };

// const userForgotPasswordMailBody = (name, url) => {
//     const email = {
//         body: {
//             name: name,
//             intro: "You have requested to reset your password for E-Commerce. Click the button below to reset your password.",
//             action: {
//                 instructions: "To reset your password, click here:",
//                 button: {
//                     color: "#22BC66",
//                     text: "Reset your password",
//                     link: url,
//                 },
//             },
//             outro: "Need help or have questions? Just reply to this email — we're always happy to help.",
//         },
//     };

//     return mailGenerator.generate(email);
// }

// export { userVerificationMailBody, userForgotPasswordMailBody };


// Commented out old mailGenerator based templates - using direct HTML instead

/**
 * Registration Verification Email HTML - Professional Design
 */
const userVerificationMailBody = (name, url) => {
    return `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Verify Your Email - FlexLeather</title>
            <style>
                * { margin: 0; padding: 0; box-sizing: border-box; }
                body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; background: #ffffff; }
                .wrapper { background: #ffffff; padding: 40px 20px; }
                .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.05); border: 1px solid #f0f0f0; }
                .header { background: #3E2723; color: white; padding: 40px 30px; text-align: center; }
                .header h1 { font-size: 28px; font-weight: 300; letter-spacing: 2px; margin-bottom: 5px; }
                .header p { font-size: 13px; opacity: 0.9; letter-spacing: 1px; }
                .content { padding: 40px 30px; }
                .greeting { font-size: 16px; margin-bottom: 20px; color: #3E2723; }
                .greeting strong { font-weight: 600; }
                .message { font-size: 14px; line-height: 1.8; color: #555; margin-bottom: 30px; }
                .cta-section { text-align: center; padding: 20px 0; }
                .cta-button { display: inline-block; background: #C19A6B; color: white; padding: 14px 40px; text-decoration: none; border-radius: 4px; font-weight: 500; font-size: 15px; letter-spacing: 0.5px; transition: all 0.3s ease; }
                .cta-button:hover { background: #3E2723; transform: translateY(-2px); }
                .divider { height: 1px; background: #e0e0e0; margin: 30px 0; }
                .footer-content { font-size: 13px; color: #777; line-height: 1.8; }
                .footer-content p { margin-bottom: 10px; }
                .note { background: #fafafa; padding: 15px; border-left: 4px solid #C19A6B; margin-top: 20px; font-size: 12px; color: #666; }
                .footer { background: #ffffff; padding: 30px; text-align: center; border-top: 1px solid #e0e0e0; }
                .footer p { font-size: 12px; color: #999; margin: 5px 0; }
                .social-links { margin-top: 15px; }
                .social-links a { display: inline-block; color: #C19A6B; text-decoration: none; margin: 0 10px; font-size: 12px; }
            </style>
        </head>
        <body>
            <div class="wrapper">
                <div class="container">
                    <div class="header">
                        <h1>FLEXLEATHER</h1>
                        <p>PREMIUM LEATHER GOODS</p>
                    </div>
                    <div class="content">
                        <div class="greeting">Hi <strong>${name}</strong>,</div>
                        <div class="message">
                            <p>Welcome to FlexLeather! We're thrilled to have you join our community of leather enthusiasts.</p>
                            <p style="margin-top: 15px;">To complete your account setup and start exploring our exclusive collection, please verify your email address by clicking the button below.</p>
                        </div>
                        <div class="cta-section">
                            <a href="${url}" class="cta-button">Verify Email Address</a>
                        </div>
                        <div class="divider"></div>
                        <div class="note">
                            <strong>Why verify?</strong> Verification ensures your account is secure and helps us send you order updates and exclusive offers.
                        </div>
                        <div class="note" style="border-left-color: #999; background: #fafafa;">
                            <strong>Didn't create this account?</strong> If you didn't register with FlexLeather, simply disregard this email. Your email address will not be verified.
                        </div>
                    </div>
                    <div class="footer">
                        <p>&copy; 2026 FlexLeather. All rights reserved.</p>
                        <p style="margin-top: 10px; color: #aaa;">This is an automated message, please do not reply.</p>
                        <p style="margin-top: 8px;">Questions? Contact us at <a href="mailto:flexleather.official@gmail.com" style="color: #C19A6B; text-decoration: none;">flexleather.official@gmail.com</a></p>
                    </div>
                </div>
            </div>
        </body>
        </html>
    `;
};

/**
 * Forgot Password Email HTML - Professional Design
 */
const userForgotPasswordMailBody = (name, url) => {
    return `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Reset Your Password - FlexLeather</title>
            <style>
                * { margin: 0; padding: 0; box-sizing: border-box; }
                body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; background: #ffffff; }
                .wrapper { background: #ffffff; padding: 40px 20px; }
                .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.05); border: 1px solid #f0f0f0; }
                .header { background: #3E2723; color: white; padding: 40px 30px; text-align: center; }
                .header h1 { font-size: 28px; font-weight: 300; letter-spacing: 2px; margin-bottom: 5px; }
                .header p { font-size: 13px; opacity: 0.9; letter-spacing: 1px; }
                .content { padding: 40px 30px; }
                .greeting { font-size: 16px; margin-bottom: 20px; color: #3E2723; }
                .greeting strong { font-weight: 600; }
                .message { font-size: 14px; line-height: 1.8; color: #555; margin-bottom: 30px; }
                .cta-section { text-align: center; padding: 20px 0; }
                .cta-button { display: inline-block; background: #C19A6B; color: white; padding: 14px 40px; text-decoration: none; border-radius: 4px; font-weight: 500; font-size: 15px; letter-spacing: 0.5px; transition: all 0.3s ease; }
                .cta-button:hover { background: #3E2723; transform: translateY(-2px); }
                .divider { height: 1px; background: #e0e0e0; margin: 30px 0; }
                .warning { background: #fafafa; padding: 15px; border-left: 4px solid #C19A6B; margin-bottom: 20px; font-size: 13px; color: #333; }
                .note { background: #fafafa; padding: 15px; border-left: 4px solid #C19A6B; margin-top: 20px; font-size: 12px; color: #666; }
                .footer { background: #ffffff; padding: 30px; text-align: center; border-top: 1px solid #e0e0e0; }
                .footer p { font-size: 12px; color: #999; margin: 5px 0; }
            </style>
        </head>
        <body>
            <div class="wrapper">
                <div class="container">
                    <div class="header">
                        <h1>FLEXLEATHER</h1>
                        <p>PREMIUM LEATHER GOODS</p>
                    </div>
                    <div class="content">
                        <div class="greeting">Hi <strong>${name}</strong>,</div>
                        <div class="warning">
                            We received a request to reset the password associated with your FlexLeather account.
                        </div>
                        <div class="message">
                            <p>To reset your password, click the button below. This link will expire in 24 hours for your security.</p>
                        </div>
                        <div class="cta-section">
                            <a href="${url}" class="cta-button">Reset Password</a>
                        </div>
                        <div class="divider"></div>
                        <div class="note">
                            <strong>Didn't request this?</strong> If you didn't ask to reset your password, you can safely ignore this email. Your account remains secure.
                        </div>
                        <div class="note" style="border-left-color: #999; background: #fafafa;">
                            <strong>Security Tip:</strong> Never share your password reset link with anyone. FlexLeather will never ask for your password via email.
                        </div>
                    </div>
                    <div class="footer">
                        <p>&copy; 2026 FlexLeather. All rights reserved.</p>
                        <p style="margin-top: 10px; color: #aaa;">This is an automated message, please do not reply.</p>
                        <p style="margin-top: 8px;">Questions? Contact us at <a href="mailto:flexleather.official@gmail.com" style="color: #C19A6B; text-decoration: none;">flexleather.official@gmail.com</a></p>
                    </div>
                </div>
            </div>
        </body>
        </html>
    `;
};

/**
 * Order Confirmation Email HTML - FlexLeather Themed
 */
const orderConfirmationMailBody = (orderDetails) => {
    const {
        orderId,
        customerName,
        items,
        subtotal,
        shipping,
        total,
        paymentMethod,
        shippingAddress
    } = orderDetails;

    const itemRows = (items || []).map(item =>
        `<tr>
            <td style="padding: 12px 10px; border-bottom: 1px solid #f0f0f0; font-size: 14px; color: #333;">${item.productName}</td>
            <td style="padding: 12px 10px; border-bottom: 1px solid #f0f0f0; text-align: center; font-size: 14px; color: #555;">${item.quantity}</td>
            <td style="padding: 12px 10px; border-bottom: 1px solid #f0f0f0; text-align: right; font-size: 14px; color: #333; font-weight: 500;">PKR ${Number(item.price).toLocaleString()}</td>
        </tr>`
    ).join('');

    const paymentLabel = paymentMethod === 'cod' ? 'Cash on Delivery'
        : paymentMethod === 'jazzcash' ? 'JazzCash'
        : paymentMethod === 'easypaisa' ? 'EasyPaisa'
        : paymentMethod.toUpperCase();

    const paymentNote = paymentMethod === 'cod'
        ? `<div style="background:#ffffff;border-left:4px solid #C19A6B;padding:14px 16px;margin-top:20px;border-radius:0 4px 4px 0;font-size:13px;color:#333;border-top:1px solid #f0f0f0;border-right:1px solid #f0f0f0;border-bottom:1px solid #f0f0f0;">
               <strong>Cash on Delivery:</strong> Please have the exact amount ready at the time of delivery.
           </div>`
        : `<div style="background:#ffffff;border-left:4px solid #3E2723;padding:14px 16px;margin-top:20px;border-radius:0 4px 4px 0;font-size:13px;color:#333;border-top:1px solid #f0f0f0;border-right:1px solid #f0f0f0;border-bottom:1px solid #f0f0f0;">
               <strong>Payment Pending:</strong> Your order will be processed once your ${paymentLabel} payment is confirmed.
           </div>`;

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Order Confirmation - FlexLeather</title>
</head>
<body style="margin:0;padding:0;background:#ffffff;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;line-height:1.6;color:#333;">
    <div style="background:#ffffff;padding:40px 20px;">
        <div style="max-width:600px;margin:0 auto;background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.05);border:1px solid #f0f0f0;">

            <div style="background:#3E2723;color:#fff;padding:40px 30px;text-align:center;">
                <h1 style="margin:0;font-size:28px;font-weight:300;letter-spacing:2px;">FLEXLEATHER</h1>
                <p style="margin:6px 0 0;font-size:13px;opacity:0.85;letter-spacing:1px;">PREMIUM LEATHER GOODS</p>
            </div>

            <div style="background:#C19A6B;padding:16px 30px;text-align:center;">
                <p style="margin:0;color:#fff;font-size:15px;font-weight:500;letter-spacing:0.5px;">&#10003; Order Placed Successfully</p>
            </div>

            <div style="padding:36px 30px;">
                <p style="font-size:16px;color:#3E2723;margin:0 0 8px;">Hi <strong>${customerName}</strong>,</p>
                <p style="font-size:14px;color:#555;margin:0 0 28px;">Thank you for shopping with FlexLeather! We've received your order and are getting it ready for you.</p>

                <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
                    <tr>
                        <td style="background:#ffffff;border-radius:4px;padding:14px 16px;border:1px solid #eee;">
                            <table width="100%" cellpadding="0" cellspacing="0">
                                <tr>
                                    <td style="font-size:12px;color:#888;text-transform:uppercase;letter-spacing:0.8px;">Order ID</td>
                                    <td style="font-size:12px;color:#888;text-transform:uppercase;letter-spacing:0.8px;text-align:right;">Payment Method</td>
                                </tr>
                                <tr>
                                    <td style="font-size:15px;color:#3E2723;font-weight:600;padding-top:4px;">#${orderId}</td>
                                    <td style="font-size:15px;color:#C19A6B;font-weight:600;padding-top:4px;text-align:right;">${paymentLabel}</td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                </table>

                <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #eee;border-radius:4px;overflow:hidden;margin-bottom:4px;">
                    <thead>
                        <tr style="background:#3E2723;">
                            <th style="padding:12px 10px;font-size:12px;font-weight:500;color:#fff;text-align:left;text-transform:uppercase;letter-spacing:0.8px;">Product</th>
                            <th style="padding:12px 10px;font-size:12px;font-weight:500;color:#fff;text-align:center;text-transform:uppercase;letter-spacing:0.8px;">Qty</th>
                            <th style="padding:12px 10px;font-size:12px;font-weight:500;color:#fff;text-align:right;text-transform:uppercase;letter-spacing:0.8px;">Price</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${itemRows}
                    </tbody>
                </table>

                <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:0;border:1px solid #eee;border-top:none;border-radius:0 0 4px 4px;overflow:hidden;">
                    <tr>
                        <td style="padding:10px 10px;font-size:13px;color:#777;border-bottom:1px solid #f0f0f0;">Subtotal</td>
                        <td style="padding:10px 10px;font-size:13px;color:#777;text-align:right;border-bottom:1px solid #f0f0f0;">PKR ${Number(subtotal || total).toLocaleString()}</td>
                    </tr>
                    <tr>
                        <td style="padding:10px 10px;font-size:13px;color:#777;border-bottom:1px solid #f0f0f0;">Shipping</td>
                        <td style="padding:10px 10px;font-size:13px;color:#777;text-align:right;border-bottom:1px solid #f0f0f0;">${Number(shipping || 0) === 0 ? 'Free' : 'PKR ' + Number(shipping).toLocaleString()}</td>
                    </tr>
                    <tr style="background:#ffffff;">
                        <td style="padding:12px 10px;font-size:15px;color:#3E2723;font-weight:600;border-top:1px solid #eee;">Total</td>
                        <td style="padding:12px 10px;font-size:15px;color:#C19A6B;font-weight:700;text-align:right;border-top:1px solid #eee;">PKR ${Number(total).toLocaleString()}</td>
                    </tr>
                </table>

                <div style="margin-top:24px;padding:14px 16px;background:#ffffff;border:1px solid #eee;border-radius:4px;">
                    <p style="margin:0 0 4px;font-size:12px;color:#888;text-transform:uppercase;letter-spacing:0.8px;">Shipping Address</p>
                    <p style="margin:0;font-size:14px;color:#333;">${shippingAddress || 'N/A'}</p>
                </div>

                ${paymentNote}

                <div style="height:1px;background:#e0e0e0;margin:28px 0;"></div>
                <p style="font-size:13px;color:#777;margin:0;">Questions about your order? Reply to this email or contact us at <a href="mailto:flexleather.official@gmail.com" style="color:#C19A6B;text-decoration:none;">flexleather.official@gmail.com</a></p>
            </div>

            <div style="background:#ffffff;padding:28px 30px;text-align:center;border-top:1px solid #e0e0e0;">
                <p style="font-size:12px;color:#999;margin:0;">&copy; 2026 FlexLeather. All rights reserved.</p>
                <p style="font-size:12px;color:#aaa;margin:6px 0 0;">This is an automated message, please do not reply directly.</p>
            </div>
        </div>
    </div>
</body>
</html>`;
};

/**
 * Payment Confirmation Email HTML - FlexLeather Themed
 */
const paymentConfirmationMailBody = (paymentDetails) => {
    const {
        orderId,
        customerName,
        paymentMethod,
        amount,
        transactionId
    } = paymentDetails;

    const paymentLabel = paymentMethod === 'jazzcash' ? 'JazzCash'
        : paymentMethod === 'easypaisa' ? 'EasyPaisa'
        : paymentMethod.toUpperCase();

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Payment Confirmed - FlexLeather</title>
</head>
<body style="margin:0;padding:0;background:#ffffff;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;line-height:1.6;color:#333;">
    <div style="background:#ffffff;padding:40px 20px;">
        <div style="max-width:600px;margin:0 auto;background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.05);border:1px solid #f0f0f0;">

            <div style="background:#3E2723;color:#fff;padding:40px 30px;text-align:center;">
                <h1 style="margin:0;font-size:28px;font-weight:300;letter-spacing:2px;">FLEXLEATHER</h1>
                <p style="margin:6px 0 0;font-size:13px;opacity:0.85;letter-spacing:1px;">PREMIUM LEATHER GOODS</p>
            </div>

            <div style="background:#C19A6B;padding:16px 30px;text-align:center;">
                <p style="margin:0;color:#fff;font-size:15px;font-weight:500;letter-spacing:0.5px;">&#10003; Payment Confirmed</p>
            </div>

            <div style="padding:36px 30px;">
                <p style="font-size:16px;color:#3E2723;margin:0 0 8px;">Hi <strong>${customerName}</strong>,</p>
                <p style="font-size:14px;color:#555;margin:0 0 28px;">Great news! Your payment has been received and confirmed. We're now processing your order.</p>

                <div style="background:#ffffff;border:1px solid #eee;border-radius:4px;overflow:hidden;margin-bottom:24px;">
                    <div style="background:#3E2723;padding:12px 16px;">
                        <p style="margin:0;font-size:12px;color:#ccc;text-transform:uppercase;letter-spacing:0.8px;">Payment Details</p>
                    </div>
                    <table width="100%" cellpadding="0" cellspacing="0">
                        <tr>
                            <td style="padding:12px 16px;font-size:13px;color:#777;border-bottom:1px solid #f0f0f0;">Order ID</td>
                            <td style="padding:12px 16px;font-size:13px;color:#333;font-weight:600;text-align:right;border-bottom:1px solid #f0f0f0;">#${orderId}</td>
                        </tr>
                        <tr>
                            <td style="padding:12px 16px;font-size:13px;color:#777;border-bottom:1px solid #f0f0f0;">Payment Method</td>
                            <td style="padding:12px 16px;font-size:13px;color:#C19A6B;font-weight:600;text-align:right;border-bottom:1px solid #f0f0f0;">${paymentLabel}</td>
                        </tr>
                        ${transactionId ? `<tr>
                            <td style="padding:12px 16px;font-size:13px;color:#777;border-bottom:1px solid #f0f0f0;">Transaction ID</td>
                            <td style="padding:12px 16px;font-size:13px;color:#333;text-align:right;border-bottom:1px solid #f0f0f0;">${transactionId}</td>
                        </tr>` : ''}
                        <tr style="background:#ffffff;">
                            <td style="padding:14px 16px;font-size:15px;color:#3E2723;font-weight:600;">Amount Paid</td>
                            <td style="padding:14px 16px;font-size:16px;color:#C19A6B;font-weight:700;text-align:right;">PKR ${Number(amount).toLocaleString()}</td>
                        </tr>
                    </table>
                </div>

                <div style="background:#ffffff;border-left:4px solid #C19A6B;padding:14px 16px;border-radius:0 4px 4px 0;font-size:13px;color:#333;margin-bottom:24px;border-top:1px solid #f0f0f0;border-right:1px solid #f0f0f0;border-bottom:1px solid #f0f0f0;">
                    <strong>Order Status:</strong> Your order is now being processed and will be dispatched shortly.
                </div>

                <div style="height:1px;background:#e0e0e0;margin:28px 0;"></div>
                <p style="font-size:13px;color:#777;margin:0;">Questions? Contact us at <a href="mailto:flexleather.official@gmail.com" style="color:#C19A6B;text-decoration:none;">flexleather.official@gmail.com</a></p>
            </div>

            <div style="background:#ffffff;padding:28px 30px;text-align:center;border-top:1px solid #e0e0e0;">
                <p style="font-size:12px;color:#999;margin:0;">&copy; 2026 FlexLeather. All rights reserved.</p>
                <p style="font-size:12px;color:#aaa;margin:6px 0 0;">Thank you for choosing FlexLeather!</p>
            </div>
        </div>
    </div>
</body>
</html>`;
};

export { userVerificationMailBody, userForgotPasswordMailBody, orderConfirmationMailBody, paymentConfirmationMailBody };