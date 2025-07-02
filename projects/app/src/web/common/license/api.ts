import type { activeBody } from '@/pages/api/admin/common/license/active';
import { GET, POST } from '@/service/common/request';
import type { LicenseDataType } from '@fastgpt/global/common/system/types';

export const getLicenseData = () => GET<LicenseDataType>('/admin/common/license/auth');

export const postActiveLicense = (data: activeBody) => POST('/admin/common/license/active', data);
