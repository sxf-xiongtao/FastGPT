import { connectToDatabase } from '@/service/mongo';
import { adminCert } from '@/service/support/permission/adminCert';
import { jsonRes } from '@fastgpt/service/common/response';
import { MongoUser } from '@fastgpt/service/support/user/schema';
import { MongoTeamMember } from '@fastgpt/service/support/user/team/teamMemberSchema';
import { NextApiRequest, NextApiResponse } from 'next';

export const PRICE_SCALE = 100000;

export const formatPrice = (val = 0, multiple = 1) => {
  return Number(((val / PRICE_SCALE) * multiple).toFixed(10));
};

export default async function getTeamMembers(req: NextApiRequest, res: NextApiResponse) {
  try {
    await connectToDatabase();
    await adminCert({ req, authToken: true });

    const teamId = (req.query.teamId as string) || '';

    const membersRow: any = await MongoTeamMember.find({ teamId: Object(teamId) });

    const members = await Promise.all(
      membersRow.map(async (member: any) => {
        const userName = await MongoUser.findById(member.userId, 'username');

        return {
          id: member._id,
          userName: userName?.username,
          teamId: member.teamId,
          createTime: member.createTime,
          role: member.role,
          status: member.status,
          default: member.default
        };
      })
    );

    jsonRes(res, {
      data: {
        members
      }
    });
  } catch (err) {
    jsonRes(res, {
      code: 500,
      error: err
    });
  }
}
