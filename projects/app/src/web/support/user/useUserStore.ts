import { LicenseDataType } from '@/types';
import { getLicenseData } from '@/web/admin/common/api';
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

type State = {
  licenseData?: LicenseDataType;
  initLicenseData: () => Promise<void>;
};

export const useUserStore = create<State>()(
  devtools(
    immer((set, get) => ({
      licenseData: undefined,
      initLicenseData: async () => {
        try {
          const licenseData = await getLicenseData();
          set({ licenseData });
        } catch (error) {
          console.error(error);
        }
      }
    }))
  )
);
