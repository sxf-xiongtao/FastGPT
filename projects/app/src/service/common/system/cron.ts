import { setCron } from '@fastgpt/service/common/system/cron';
import { getProInitData } from '@/service/init';

export const startCron = () => {
  setUpdateSystemConfigCron();
};

export const setUpdateSystemConfigCron = () => {
  setCron('*/5 * * * *', () => {
    getProInitData();
    console.log('refresh system config');
  });
};
