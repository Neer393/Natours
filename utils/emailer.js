const nodemailer = require('nodemailer');

const sendEmail = async options =>{
    // 1)Create Transporter
    const transporter = nodemailer.createTransport({
        host:process.env.EMAIL_HOST,
        port:process.env.EMAIL_POST,
        auth:{
            user:process.env.EMAIL_USER,
            pass:process.env.EMAIL_PASSWORD
        }
    });

    // 2)Define Email options
    const mailOptions = {
        from:'Neeraj Khatri <trial@jonas.io>',
        to:options.email,
        subject:options.subject,
        text:options.message
    }
    // 3)Actually send the email to the email address
    await transporter.sendMail(mailOptions);
}

module.exports = sendEmail;