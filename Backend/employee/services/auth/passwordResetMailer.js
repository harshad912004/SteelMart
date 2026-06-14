const transporter = require('../../../common/utils/sendMail');
const logger = require('../../../common/utils/logger');

const sendPasswordResetResultEmail = async (email, isSuccess, reason = '') => {
     const subject = isSuccess
          ? 'Password Reset Successful - Aquil Project'
          : 'Password Reset Failed - Aquil Project';
     const title = isSuccess ? 'Password Reset Successful' : 'Password Reset Failed';
     const statusColor = isSuccess ? '#28a745' : '#dc3545';
     const statusText = isSuccess ? '✔️ Password Changed Successfully' : '❌ Password Reset Failed';
     const message = isSuccess
          ? 'Your password has been successfully updated.'
          : `Your password reset could not be completed${reason ? `: ${reason}` : '.'}`;

     try {
          await transporter.sendMail({
               from: process.env.EMAIL_USER,
               to: email,
               subject,
               html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                         <h2 style="color: #333;">${title}</h2>
                         <p>${message}</p>
                         <div style="background-color: #f0f0f0; padding: 20px; text-align: center; border-radius: 5px; margin: 20px 0;">
                         <h3 style="color: ${statusColor};">${statusText}</h3>
                         </div>
                         <p style="color: #666;">If you did not request this, please contact support immediately.</p>
                         <hr style="margin: 20px 0; border: none; border-top: 1px solid #ddd;">
                         <p style="margin-top: 30px; color: #999; font-size: 12px;">Aquil Project. All rights reserved.</p>
                    </div>
               `
          });
          logger.info(`Password reset ${isSuccess ? 'success' : 'failure'} email sent to ${email}`);
     } catch (mailError) {
          logger.error(`Unable to send password reset ${isSuccess ? 'success' : 'failure'} email: ${mailError.message}`);
     }
};

const sendResetOtpEmail = async (email, otp) => {
     try {
          await transporter.sendMail({
               from: process.env.EMAIL_USER,
               to: email,
               subject: 'Password Reset OTP - SteelMart',
               html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                         <h2 style="color: #333;">Password Reset Request</h2>
                         <p>You requested to reset your password. Use the OTP below to proceed:</p>
                         <div style="background-color: #f0f0f0; padding: 20px; text-align: center; border-radius: 5px; margin: 20px 0;">
                         <h1 style="color: #007bff; letter-spacing: 5px;">${otp}</h1>
                         </div>
                         <p style="color: #666;">This OTP is valid for <strong>10 minutes</strong>.</p>
                         <p style="color: #666;">If you didn't request this, please ignore this email.</p>
                         <hr style="margin: 20px 0; border: none; border-top: 1px solid #ddd;">
                         <p style="margin-top: 30px; color: #999; font-size: 12px;">© Aquil Project. All rights reserved.</p>
                    </div>
               `
          });
          logger.info(`OTP sent successfully to ${email}`);
     } catch (mailError) {
          logger.error(`Unable to send OTP email to ${email}: ${mailError.message}`);
     }
};

module.exports = {
     sendPasswordResetResultEmail,
     sendResetOtpEmail
};