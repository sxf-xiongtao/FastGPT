import { GET } from '@/service/common/request';

export async function getInitMenuConfig() {
  let result;
  try {
    result = await GET('/admin/common/system/getInitMenu');
  } catch (error) {
    console.error(error);
    result = null;
  }
  return result;
}
