import { delay } from '@fastgpt/global/common/system/utils';
import { addLog } from '@fastgpt/service/common/system/log';

const retryFn = async (fn?: () => Promise<void>, retryTimes = 3): Promise<any> => {
  if (!fn) return;
  try {
    await fn();
  } catch (error) {
    if (retryTimes > 0) {
      await delay(500);
      return retryFn(fn, retryTimes - 1);
    } else {
      addLog.error('Send message error', error);
    }
  }
};

export const startSendInform = async () => {
  if (global.sendInformQueue.length === 0 || global.sendInformQueueLen > 5) return;
  global.sendInformQueueLen++;

  try {
    const fn = global.sendInformQueue.shift();

    await retryFn(fn, 3);

    global.sendInformQueueLen--;
    startSendInform();
  } catch (error) {
    global.sendInformQueueLen--;
    startSendInform();
  }
};
