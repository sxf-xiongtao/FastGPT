import { createLogger, format, transports } from 'winston';
import 'winston-mongodb';
import { readFileSync } from 'fs';

export const initService = () => {
  global.store = {};
  try {
    const filename =
      process.env.NODE_ENV === 'development' ? 'data/config.local.json' : '/app/data/config.json';
    const res = JSON.parse(readFileSync(filename, 'utf-8'));
    console.log(res);

    global.systemConfig = res;
  } catch (error) {
    console.log('init config error', error);
  }
};

export const initLogger = () => {
  global.logger = createLogger({
    transports: [
      new transports.MongoDB({
        db: process.env.MONGODB_URI as string,
        collection: 'server_logs',
        options: {
          useUnifiedTopology: true
        },
        cappedSize: 500000000,
        tryReconnect: true,
        metaKey: 'meta',
        format: format.combine(format.timestamp(), format.json())
      }),
      new transports.Console({
        format: format.combine(
          format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
          format.printf((info) => {
            if (info.level === 'error') {
              console.log(info.meta);
              return `${info.level}: ${[info.timestamp]}: ${info.message}`;
            }
            return `${info.level}: ${[info.timestamp]}: ${info.message}${
              info.meta ? `: ${JSON.stringify(info.meta)}` : ''
            }`;
          })
        )
      })
    ]
  });
};
