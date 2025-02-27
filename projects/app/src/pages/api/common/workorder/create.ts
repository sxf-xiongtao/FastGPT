import type { ApiRequestProps, ApiResponseType } from '@fastgpt/service/type/next';
import { NextAPI } from '@/service/middleware/entry';
import { parseHeaderCert } from '@fastgpt/service/support/permission/controller';
import { MongoUser } from '@fastgpt/service/support/user/schema';
import { sign } from 'jsonwebtoken';
import { StandardSubLevelEnum } from '@fastgpt/global/support/wallet/sub/constants';
import { getTeamPlanStatus } from '@fastgpt/service/support/wallet/sub/utils';

export type WorkorderCreateQuery = {};
export type WorkorderCreateBody = {};
export type WorkorderCreateResponse = {
  redirectUrl: string;
};

type PayloadType = {
  username: string;
  userId: string;
  teamId: string;
  domain: string;
  level: number;
};

const workorder_base_url = process.env.WORKORDER_BASE_URL || '';
const workorder_jwt_secret = process.env.WORKORDER_JWT_SECRET || '';

async function handler(
  req: ApiRequestProps<WorkorderCreateBody, WorkorderCreateQuery>,
  _res: ApiResponseType<any>
): Promise<WorkorderCreateResponse> {
  if (!workorder_base_url || !workorder_jwt_secret) {
    return Promise.reject('Workorder is not configured');
  }
  const { userId, teamId } = await parseHeaderCert({ req, authToken: true });
  const user = await MongoUser.findOne({ _id: userId }).lean();
  // const teamsub = await MongoTeamSub.findOne({
  //   teamId
  // }).lean();
  const domain = req.headers.host || '';

  if (!user) {
    return Promise.reject('User not found');
  }

  const teamPlan = await getTeamPlanStatus({ teamId });

  const payload: PayloadType = {
    username: user.username,
    userId: user._id,
    teamId,
    domain,
    level: Object.keys(StandardSubLevelEnum).indexOf(
      teamPlan.standard?.currentSubLevel ?? StandardSubLevelEnum.free
    )
  };

  const token = sign(payload, workorder_jwt_secret, {
    expiresIn: '7d'
  });

  const url = `${workorder_base_url}/workorder/create?token=${token}`;

  return {
    redirectUrl: url
  };
}

export default NextAPI(handler);
