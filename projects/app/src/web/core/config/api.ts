import { ConfigStoreType } from '@/global/admin/config';
import { GET } from '@/service/common/request';

export const getInitFormConfig = () => GET('/admin/common/system/getInitForm');
export const getInitFormData = () => GET<ConfigStoreType>('/admin/routes/settings/getConfig');
