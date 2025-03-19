import { create, devtools, immer } from '@fastgpt/web/common/zustand';

import { LicenseDataType } from '@/types';
import { getLicenseData } from '@/web/admin/common/api';

type State = {
  licenseData?: LicenseDataType;
  initLicenseData: () => Promise<void>;
  clearLicenseData: () => void;
};

export const useUserStore = create<State>()(
  devtools(
    immer((set, get) => ({
      licenseData: undefined,
      clearLicenseData: () => {
        set((state) => {
          state.licenseData = undefined;
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
