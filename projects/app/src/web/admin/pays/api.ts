import { POST } from '@/service/common/request';

export const getPays = (data: any) => POST('/admin/routes/pays/getPays', data);
