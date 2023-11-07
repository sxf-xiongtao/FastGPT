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

export function initGlobal() {
  global.sendInformQueue = [];
  global.sendInformQueueLen = 0;
}
