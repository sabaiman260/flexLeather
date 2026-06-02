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
                body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; background: #f5f5f5; }
                .wrapper { background: #f5f5f5; padding: 40px 20px; }
                .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
                .header { background: linear-gradient(135deg, #2c2c2c 0%, #1a1a1a 100%); color: white; padding: 40px 30px; text-align: center; }
                .header h1 { font-size: 28px; font-weight: 300; letter-spacing: 2px; margin-bottom: 5px; }
                .header p { font-size: 13px; opacity: 0.9; letter-spacing: 1px; }
                .content { padding: 40px 30px; }
                .greeting { font-size: 16px; margin-bottom: 20px; color: #2c2c2c; }
                .greeting strong { font-weight: 600; }
                .message { font-size: 14px; line-height: 1.8; color: #555; margin-bottom: 30px; }
                .cta-section { text-align: center; padding: 20px 0; }
                .cta-button { display: inline-block; background: linear-gradient(135deg, #8B6914 0%, #A8860F 100%); color: white; padding: 14px 40px; text-decoration: none; border-radius: 4px; font-weight: 500; font-size: 15px; letter-spacing: 0.5px; transition: all 0.3s ease; }
                .cta-button:hover { background: linear-gradient(135deg, #A8860F 0%, #8B6914 100%); transform: translateY(-2px); box-shadow: 0 4px 12px rgba(139, 105, 20, 0.3); }
                .divider { height: 1px; background: #e0e0e0; margin: 30px 0; }
                .footer-content { font-size: 13px; color: #777; line-height: 1.8; }
                .footer-content p { margin-bottom: 10px; }
                .note { background: #f9f9f9; padding: 15px; border-left: 4px solid #8B6914; margin-top: 20px; font-size: 12px; color: #666; }
                .footer { background: #fafafa; padding: 30px; text-align: center; border-top: 1px solid #e0e0e0; }
                .footer p { font-size: 12px; color: #999; margin: 5px 0; }
                .social-links { margin-top: 15px; }
                .social-links a { display: inline-block; color: #8B6914; text-decoration: none; margin: 0 10px; font-size: 12px; }
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
                        <div class="note" style="border-left-color: #999; background: #f5f5f5;">
                            <strong>Didn't create this account?</strong> If you didn't register with FlexLeather, simply disregard this email. Your email address will not be verified.
                        </div>
                    </div>
                    <div class="footer">
                        <p>&copy; 2026 FlexLeather. All rights reserved.</p>
                        <p style="margin-top: 10px; color: #aaa;">This is an automated message, please do not reply.</p>
                        <p style="margin-top: 8px;">Questions? Contact us at <a href="mailto:flexleather.official@gmail.com" style="color: #8B6914; text-decoration: none;">flexleather.official@gmail.com</a></p>
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
                body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; background: #f5f5f5; }
                .wrapper { background: #f5f5f5; padding: 40px 20px; }
                .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
                .header { background: linear-gradient(135deg, #2c2c2c 0%, #1a1a1a 100%); color: white; padding: 40px 30px; text-align: center; }
                .header h1 { font-size: 28px; font-weight: 300; letter-spacing: 2px; margin-bottom: 5px; }
                .header p { font-size: 13px; opacity: 0.9; letter-spacing: 1px; }
                .content { padding: 40px 30px; }
                .greeting { font-size: 16px; margin-bottom: 20px; color: #2c2c2c; }
                .greeting strong { font-weight: 600; }
                .message { font-size: 14px; line-height: 1.8; color: #555; margin-bottom: 30px; }
                .cta-section { text-align: center; padding: 20px 0; }
                .cta-button { display: inline-block; background: linear-gradient(135deg, #8B6914 0%, #A8860F 100%); color: white; padding: 14px 40px; text-decoration: none; border-radius: 4px; font-weight: 500; font-size: 15px; letter-spacing: 0.5px; transition: all 0.3s ease; }
                .cta-button:hover { background: linear-gradient(135deg, #A8860F 0%, #8B6914 100%); transform: translateY(-2px); box-shadow: 0 4px 12px rgba(139, 105, 20, 0.3); }
                .divider { height: 1px; background: #e0e0e0; margin: 30px 0; }
                .warning { background: #fff3cd; padding: 15px; border-left: 4px solid #e8860f; margin-bottom: 20px; font-size: 13px; color: #856404; }
                .note { background: #f9f9f9; padding: 15px; border-left: 4px solid #8B6914; margin-top: 20px; font-size: 12px; color: #666; }
                .footer { background: #fafafa; padding: 30px; text-align: center; border-top: 1px solid #e0e0e0; }
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
                        <div class="note" style="border-left-color: #e8860f; background: #f5f5f5;">
                            <strong>Security Tip:</strong> Never share your password reset link with anyone. FlexLeather will never ask for your password via email.
                        </div>
                    </div>
                    <div class="footer">
                        <p>&copy; 2026 FlexLeather. All rights reserved.</p>
                        <p style="margin-top: 10px; color: #aaa;">This is an automated message, please do not reply.</p>
                        <p style="margin-top: 8px;">Questions? Contact us at <a href="mailto:flexleather.official@gmail.com" style="color: #8B6914; text-decoration: none;">flexleather.official@gmail.com</a></p>
                    </div>
                </div>
            </div>
        </body>
        </html>
    `;
};

/**
 * Order Confirmation Email HTML
 */
const orderConfirmationMailBody = (orderDetails) => {
    const {
        orderId,
        customerName,
        customerEmail,
        items,
        subtotal,
        shipping,
        total,
        paymentMethod,
        shippingAddress
    } = orderDetails;

    const itemsList = items.map(item =>
        `<tr>
            <td style="padding: 10px; border-bottom: 1px solid #eee;">${item.productName}</td>
            <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
            <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">PKR ${item.price.toLocaleString()}</td>
        </tr>`
    ).join('');

    const email = {
        body: {
            name: customerName,
            intro: `Thank you for your order! Your order #${orderId} has been successfully placed.`,
            table: {
                data: [
                    {
                        'Order ID': orderId,
                        'Payment Method': paymentMethod.toUpperCase(),
                        'Total Amount': `PKR ${total.toLocaleString()}`,
                        'Shipping Address': shippingAddress
                    }
                ]
            },
            action: paymentMethod === 'cod' ? null : {
                instructions: paymentMethod === 'jazzcash' || paymentMethod === 'easypaisa'
                    ? `Please complete your ${paymentMethod.toUpperCase()} payment using the details provided. Your order will be processed once payment is confirmed.`
                    : 'Your payment is being processed. You will receive a confirmation email once payment is verified.',
                button: {
                    color: '#22BC66',
                    text: 'View Order Status',
                    link: `${process.env.CLIENT_URL || 'http://localhost:3000'}/order-confirmation?order=${orderId}`
                }
            },
            outro: 'If you have any questions about your order, please contact our support team.'
        }
    };

    return mailGenerator.generate(email);
};

/**
 * Payment Confirmation Email HTML
 */
const paymentConfirmationMailBody = (paymentDetails) => {
    const {
        orderId,
        customerName,
        customerEmail,
        paymentMethod,
        amount,
        transactionId
    } = paymentDetails;

    const email = {
        body: {
            name: customerName,
            intro: `Great news! Your payment for order #${orderId} has been confirmed.`,
            table: {
                data: [
                    {
                        'Order ID': orderId,
                        'Payment Method': paymentMethod.toUpperCase(),
                        'Amount Paid': `PKR ${amount.toLocaleString()}`,
                        'Transaction ID': transactionId || 'N/A',
                        'Status': 'PAID'
                    }
                ]
            },
            action: {
                instructions: 'Your order is now being processed. You can track your order status below.',
                button: {
                    color: '#22BC66',
                    text: 'Track Your Order',
                    link: `${process.env.CLIENT_URL || 'http://localhost:3000'}/order-confirmation?order=${orderId}`
                }
            },
            outro: 'Thank you for choosing FlexLeather! We appreciate your business.'
        }
    };

    return mailGenerator.generate(email);
};

export { userVerificationMailBody, userForgotPasswordMailBody, orderConfirmationMailBody, paymentConfirmationMailBody };
