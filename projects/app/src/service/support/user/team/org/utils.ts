import { MongoOrgMemberModel } from '@fastgpt/service/support/permission/org/orgMemberSchema';
import { MongoOrgModel } from '@fastgpt/service/support/permission/org/orgSchema';

export async function getOrgWithMembers({ teamId, path }: { teamId: string; path: string }) {
  const orgs = await MongoOrgModel.find({ teamId, path }).lean();
  const orgMembers = await MongoOrgMemberModel.find({
    orgId: { $in: orgs.map((org) => org._id) }
  }).lean();

  const orgWithMembers = orgs.map((org) => {
    const members = orgMembers.filter((member) => member.orgId === org._id);
    return {
      ...org,
      members
    };
  });

  return orgWithMembers;
}

export const countOrgChildren = async ({
  teamId,
  path,
  orgId
}: {
  teamId: string;
  path: string;
  orgId: string;
}) => {
  const [orgCount, memberCount] = await Promise.all([
    MongoOrgModel.countDocuments({
      path,
      teamId
    }),
    MongoOrgMemberModel.countDocuments({
      orgId,
      teamId
    })
  ]);

  return orgCount + memberCount;
};
