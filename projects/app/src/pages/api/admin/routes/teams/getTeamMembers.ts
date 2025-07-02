import { adminCert } from '@/service/support/permission/adminCert';
import type { TeamMemberItemType } from '@fastgpt/global/support/user/team/type';
import { jsonRes } from '@fastgpt/service/common/response';
import { MongoUser } from '@fastgpt/service/support/user/schema';
import { MongoTeamMember } from '@fastgpt/service/support/user/team/teamMemberSchema';
import { MongoTeam } from '@fastgpt/service/support/user/team/teamSchema';
import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    await adminCert({ req, authToken: true });

    const teamId = (req.query.teamId as string) || '';

    const membersRow: TeamMemberItemType[] = await MongoTeamMember.find({ teamId: Object(teamId) });
    const team = await MongoTeam.findById(teamId, 'name');

    const members = await Promise.all(
      membersRow.map(async (member) => {
        const user = await MongoUser.findById(member.userId, 'username');

        return {
          userName: user?.username,
          teamId: member.teamId,
          role: member.role,
          status: member.status
        };
      })
    );

    jsonRes(res, {
      data: {
        members,
        team
      }
    });
  } catch (err) {
    jsonRes(res, {
      code: 500,
      error: err
    });
  }
}
