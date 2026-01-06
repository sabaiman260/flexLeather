import { mailGenerator } from "../helpers/mail.helper.js";

const userVerificationMailBody = (name, url) => {
    const email = {
        body: {
            name: name,
            intro: "Welcome to E-Commerce! We're very excited to have you on board.",
            action: {
                instructions: "To get started with E-Commerce, please click here:",
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

const userForgotPasswordMailBody = (name, url) => {
    const email = {
        body: {
            name: name,
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
}

export { userVerificationMailBody, userForgotPasswordMailBody };