// server/config/mailer.js
const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
        },
    });

    const mailOptions = {
        from: `الرسال السعودي <${process.env.EMAIL_USER}>`,
        to: options.email,
        subject: options.subject,
        text: options.message,
        // html: '<b>Hello world?</b>' // يمكنك استخدام HTML إذا أردت
    };

    await transporter.sendMail(mailOptions);
};

module.exports = sendEmail;