
const expressWinston = require('express-winston');
const winston = require('winston'); // for transports.Console

const logger = {
  pre: expressWinston.logger({
    transports: [
      new winston.transports.Console()
    ],
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.colorize(),
      winston.format.json()
    )
  }),

  post: expressWinston.errorLogger({
    transports: [
      new winston.transports.Console()
    ],
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.colorize(),
      winston.format.json()
    )
  })
};

expressWinston.requestWhitelist.push('body');
expressWinston.responseWhitelist.push('body');

module.exports = logger;