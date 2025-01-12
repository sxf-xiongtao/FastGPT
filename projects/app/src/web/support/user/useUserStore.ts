import { LicenseDataType } from '@/types';
import { getLicenseData } from '@/web/admin/common/api';
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

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
