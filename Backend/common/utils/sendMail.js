const nodemailer = require("nodemailer");
const logger = require('./logger');

// Email transporter configuration
const transporter = nodemailer.createTransport({
     service: process.env.EMAIL_SERVICE || 'gmail',
     auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASSWORD
     }
});

transporter.verify((error, success) => {
     if (error) {
          logger.error('Nodemailer verification failed', {
               error: error.message
          });
     } else {
          // logger.info('Nodemailer transport verified successfully');
     }
});

module.exports = transporter;