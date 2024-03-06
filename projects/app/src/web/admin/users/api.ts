import { POST } from '@/service/common/request';

export const getUsers = (data: any) => POST('/admin/routes/users/getUsers', data);
