const nodemailer = require('nodemailer');

const sendOTP = async (email, otp) => {
  try {
    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true, // Use SSL
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    const mailOptions = {
      from: '"SKCC Security" <' + process.env.EMAIL_USER + '>',
      to: email,
      subject: 'Verification Code for Admin Security Changes',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
          <h2 style="color: #4f7cff; text-align: center;">Security Verification</h2>
          <p>Hello Admin,</p>
          <p>You have requested to change your administrative credentials. Please use the following verification code to authorize this action:</p>
          <div style="background-color: #f4f7ff; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0;">
            <h1 style="letter-spacing: 10px; color: #1e293b; margin: 0;">${otp}</h1>
            <p style="font-size: 12px; color: #64748b; margin-top: 10px;">Valid for 10 minutes only.</p>
          </div>
          <p style="color: #ef4444; font-size: 14px;"><strong>Important:</strong> If you did not request this change, please ignore this email and check your security settings immediately.</p>
          <hr style="border: 0; border-top: 1px solid #e0e0e0; margin: 20px 0;">
          <p style="font-size: 12px; color: #94a3b8; text-align: center;">SKCC Management System &bull; Secured Portal</p>
        </div>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('OTP Email sent: ' + info.response);
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
};

module.exports = { sendOTP };
