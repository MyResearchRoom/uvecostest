const { createLogger, format, transports } = require("winston");
const { combine, timestamp, printf, errors, json } = format;

// Custom format

const myFormat = printf(({ level, message, timestamp, stack, ...meta }) => {
  let log = `${timestamp} [${level}] : ${stack || message}`;

  // Add extra meta info nicely formatted
  if (Object.keys(meta).length) {
    log += ` | meta: ${JSON.stringify(meta)}`;
  }

  return log;
});

const onlyLevel = (level) =>
  format((info) => {
    return info.level === level ? info : false;
  });

const logger = createLogger({
  level: "info",
  format: combine(timestamp(), errors({ stack: true }), myFormat),
  transports: [
    // new transports.Console(),

    new transports.File({ filename: "logs/error.log", level: "error" }),

    // 🚀 Only logs strictly `info` level
    new transports.File({
      filename: "logs/info.log",
      format: combine(onlyLevel("info")(), timestamp(), myFormat),
    }),

    new transports.File({ filename: "logs/combined.log" }),
  ],
  exceptionHandlers: [new transports.File({ filename: "logs/exceptions.log" })],
  rejectionHandlers: [new transports.File({ filename: "logs/rejections.log" })],
});

// Stream for morgan (for HTTP logs)
logger.stream = {
  write: (message) => logger.info(message.trim()),
};

module.exports = logger;
