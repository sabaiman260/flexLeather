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


import { mailGenerator } from "../helpers/mail.helper.js"; // fixed import path

/**
 * Registration Verification Email HTML
 */
const userVerificationMailBody = (name, url) => {
    const email = {
        body: {
            name,
            intro: "Welcome to FlexLeather! We're very excited to have you on board.",
            action: {
                instructions: "To get started with E-Commerce, please confirm your account:",
                button: {
                    color: "#22BC66",
                    text: "Confirm your account",
                    link: url,
                },
            },
            outro: "Need help or have questions? Just reply to this email — we're always happy to help.",
        },
    };

    return mailGenerator.generate(email);
};

/**
 * Forgot Password Email HTML
 */
const userForgotPasswordMailBody = (name, url) => {
    const email = {
        body: {
            name,
            intro: "You have requested to reset your password for E-Commerce. Click the button below to reset your password.",
            action: {
                instructions: "To reset your password, click here:",
                button: {
                    color: "#22BC66",
                    text: "Reset your password",
                    link: url,
                },
            },
            outro: "Need help or have questions? Just reply to this email — we're always happy to help.",
        },
    };

    return mailGenerator.generate(email);
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
