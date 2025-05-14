import { create, devtools, immer } from '@fastgpt/web/common/zustand';

import { LicenseDataType } from '@fastgpt/global/common/system/types';
import { getLicenseData } from '../license/api';

type State = {
  licenseData?: LicenseDataType;
  initLicenseData: () => Promise<void>;
  clearLicenseData: () => void;
};

const defaultLicenseData = {
  company: '',
  startTime: '',
  expiredTime: '',
  functions: {
    sso: false,
    pay: false,
    customTemplates: false,
    datasetEnhance: false,
    batchEval: false
  }
};

export const useSystemStore = create<State>()(
  devtools(
    immer((set, get) => ({
      licenseData: defaultLicenseData,
      clearLicenseData: () => {
        set((state) => {
          state.licenseData = {
            ...defaultLicenseData,
            company: state.licenseData?.company || ''
          };
        });
      },
      initLicenseData: async () => {
        try {
          const licenseData = await getLicenseData();
          set((state) => {
            state.licenseData = licenseData;
          });
        } catch (error) {
          set((state) => {
            state.licenseData = undefined;
          });
          console.error(error);
        }
      }
    }))
  )
);
