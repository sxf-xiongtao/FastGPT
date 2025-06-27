import { create, devtools, persist, immer } from '@fastgpt/web/common/zustand';
import { GET } from '@/service/common/request';
import { type AdminInfoType } from '@/pages/api/admin/support/user/adminCert';

type State = {
  adminInfo: AdminInfoType | null;
  setAdminInfo: (info: AdminInfoType | null) => void;
  initAdminInfo: () => Promise<AdminInfoType>;
};

export const useAdminStore = create<State>()(
  devtools(
    persist(
      immer((set, get) => ({
        adminInfo: null,

        setAdminInfo(info: AdminInfoType | null) {
          set((state) => {
            state.adminInfo = info;
          });
        },

        async initAdminInfo() {
          try {
            const result = await GET<AdminInfoType>('/admin/support/user/adminCert');
            get().setAdminInfo(result);
            return result;
          } catch (error) {
            console.log('error', error);
            get().setAdminInfo(null);
            throw error;
          }
        }
      })),
      {
        name: 'adminStore'
      }
    )
  )
);
