const transporter = require('../../../common/utils/sendMail');
const logger = require('../../../common/utils/logger');

const sendWelcomeEmail = async ({ email, name, roleType }) => {
     const isVendor = roleType === 'vendor';
     const portalName = isVendor ? 'SteelMart Vendor Portal' : 'SteelMart Employee Portal';

     const subject = `Welcome to SteelMart - Account Created`;

     try {
          await transporter.sendMail({
               from: process.env.EMAIL_USER,
               to: email,
               subject: subject,
               html: `
                    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #E2E8F0; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
                         <div style="background-color: #3047F7; padding: 24px; text-align: center;">
                              <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 600; letter-spacing: 0.5px;">Welcome to SteelMart</h1>
                         </div>
                         <div style="padding: 32px 24px; background-color: #ffffff; color: #1E293B;">
                              <h2 style="margin-top: 0; color: #0F172A; font-size: 20px; font-weight: 600;">Hello ${name},</h2>
                              <p style="font-size: 16px; line-height: 1.6; color: #475569;">Your account on the <strong>${portalName}</strong> has been successfully created. You can now access your dashboard using the credentials below:</p>
                              
                              <div style="background-color: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 6px; padding: 20px; margin: 24px 0;">
                                   <table style="width: 100%; border-collapse: collapse; font-size: 15px;">
                                        
                                        <tr>
                                             <td style="padding: 6px 0; font-weight: 600; color: #475569;">Email ID:</td>
                                             <td style="padding: 6px 0; color: #0F172A; font-family: monospace; font-size: 15px;">${email}</td>
                                        </tr>
                                        <tr>
                                             <td style="padding: 6px 0; font-weight: 600; color: #475569;">Password:</td>
                                             <td style="padding: 6px 0; color: #0F172A; font-weight: 500;">Same as your Email ID</td>
                                        </tr>
                                   </table>
                              </div>

                              <div style="background-color: #FFFBEB; border-left: 4px solid #F59E0B; padding: 16px; border-radius: 4px; margin-bottom: 24px;">
                                   <p style="margin: 0; font-size: 14px; line-height: 1.5; color: #B45309; font-weight: 500;">
                                        ⚠️ <strong>Important Security Step:</strong> For your security, you will be required to verify a One-Time Password (OTP) and set your custom password immediately upon your first login.
                                   </p>
                              </div>

                              <p style="font-size: 15px; line-height: 1.6; color: #475569; margin-bottom: 0;">If you have any questions or did not request this account, please contact our system administrator immediately.</p>
                         </div>
                         <div style="background-color: #F1F5F9; padding: 20px; text-align: center; border-top: 1px solid #E2E8F0;">
                              <p style="margin: 0; color: #64748B; font-size: 12px;">&copy; ${new Date().getFullYear()} SteelMart. All rights reserved.</p>
                         </div>
                    </div>
               `
          });
          logger.info(`Welcome email successfully sent to ${email}`);
     } catch (mailError) {
          logger.error(`Unable to send welcome email to ${email}: ${mailError.message}`);
     }
};

module.exports = {
     sendWelcomeEmail
};
