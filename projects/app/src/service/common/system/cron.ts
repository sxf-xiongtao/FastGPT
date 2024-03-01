import { setCron } from '@fastgpt/service/common/system/cron';
import { getProInitData } from '@/service/init';
import { startTrainingProcess } from '@/service/core/dataset/training/utils';

export const startCron = () => {
  setUpdateSystemConfigCron();
  setTrainingCron();
};

export const setUpdateSystemConfigCron = () => {
  setCron('*/5 * * * *', () => {
    getProInitData();
    console.log('refresh system config');
  });
};

export const setTrainingCron = () => {
  setCron('*/1 * * * *', () => {
    for (let i = 0; i < 10; i++) {
      startTrainingProcess();
    }
  });
};
