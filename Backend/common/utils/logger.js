const fs = require('fs');
const path = require('path');
const winston = require('winston');

const logDirectory = path.join(__dirname, '../logFiles');
if (!fs.existsSync(logDirectory)) {
     fs.mkdirSync(logDirectory, { recursive: true });
}

const baseFormat = winston.format.combine(
     winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
     winston.format.errors({ stack: true }),
     winston.format.metadata({ fillExcept: ['message', 'level', 'timestamp', 'label'] }),
     winston.format.colorize(),
     winston.format.printf(({ timestamp, level, message, metadata }) => {
          const metaString = metadata && Object.keys(metadata).length
               ? ` ${JSON.stringify(metadata)}`
               : '';
          return `[${timestamp}] ${level}: ${message}${metaString}`;
     })
);

const logger = winston.createLogger({
     level: 'info',
     format: baseFormat,
     transports: [
          new winston.transports.File({
               filename: path.join(logDirectory, 'combined.log'),
               format: baseFormat
          }),
          new winston.transports.File({
               filename: path.join(logDirectory, 'error.log'),
               level: 'error',
               format: baseFormat
          }),
          new winston.transports.File({
               filename: path.join(logDirectory, 'warn.log'),
               level: 'warn',
               format: baseFormat
          })
     ],
     exceptionHandlers: [
          new winston.transports.File({
               filename: path.join(logDirectory, 'exceptions.log'),
               format: baseFormat
          })
     ]
});

module.exports = logger;