import type { ApiRequestProps, ApiResponseType } from '@fastgpt/service/type/next';
import { adminCert } from '@/service/support/permission/adminCert';
import { NextAPI } from '@/service/middleware/entry';

export type adminCertQuery = {};
export type adminCertBody = {};
export type adminCertResponse = AdminInfoType;

export type AdminInfoType = {
  userId: string;
  teamId: string;
  tmbId: string;
  username: string;
};

async function handler(
  req: ApiRequestProps<adminCertBody, adminCertQuery>,
  res: ApiResponseType<adminCertResponse>
): Promise<adminCertResponse> {
  const data = await adminCert({ req, authToken: true });

  return {
    userId: data.userId,
    teamId: data.teamId,
    tmbId: data.tmbId,
    username: data.username
  };
}

export default NextAPI(handler);
