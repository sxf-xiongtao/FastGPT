import { ConfigStoreType } from '@/global/admin/config';
import { GET } from '@/service/common/request';

export async function getInitFormConfig() {
  let result;
  try {
    result = await GET('/admin/common/system/getInitForm');
  } catch (error) {
    console.error(error);
    result = null;
  }
  return result;
}

export async function getInitFormData() {
  let result;
  try {
    result = await GET<ConfigStoreType>('/admin/routes/settings/getConfig');
  } catch (error) {
    console.error(error);
    result = null;
  }
  return result;
}
