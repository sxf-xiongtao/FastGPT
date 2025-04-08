import { addLog } from '@fastgpt/service/common/system/log';
import { initWebsiteSyncWorker } from '@/service/core/dataset/website';

export const initBullMQWorkers = () => {
  addLog.info('Init BullMQ Workers...');
  initWebsiteSyncWorker();
};
