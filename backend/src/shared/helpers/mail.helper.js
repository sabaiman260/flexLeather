import Mailgen from "mailgen"
import nodemailer from "nodemailer"
import dotenv from "dotenv"

dotenv.config()

const mailTransporter = nodemailer.createTransport({
    host: process.env.MAIL_HOST,
    port: process.env.MAIL_PORT,
    auth: {
        user: process.env.MAIL_USERNAME,
        pass: process.env.MAIL_PASSWORD
    }
})

const mailGenerator = new Mailgen({
    theme: "default",
    product: {
        name: 'E - Commerce',
        link: process.env.CLIENT_URL || "http://localhost:3000",
        copyright: `© ${new Date().getFullYear()} E - Commerce. All rights reserved.`,
    },
})

export { mailGenerator, mailTransporter }