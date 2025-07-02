import { MongoGroupMemberModel } from '@fastgpt/service/support/permission/memberGroup/groupMemberSchema';
import { MongoMemberGroupModel } from '@fastgpt/service/support/permission/memberGroup/memberGroupSchema';
import type { ClientSession } from 'mongoose';

/**
 * Add a member to a group
 * @param{Object} obj
 * @param{string} obj.groupId
 * @param{string[]} obj.tmbIds
 * @param{ClientSession} obj.session
 */
export const addMemberToGroup = async ({
  groupId,
  tmbIds,
  session
}: {
  groupId: string;
  tmbIds: string[];
  session?: ClientSession;
}) => {
  for await (const tmbId of tmbIds) {
    await MongoGroupMemberModel.updateOne(
      { groupId, tmbId },
      { groupId, tmbId },
      { upsert: true, session }
    );
  }
};

/**
 * Create a Group
 * @param{Object} obj
 * @param{string} obj.teamId: create group for this team
 * @param{string} obj.name: the name of the group, when it is a empty string, it will be the *default group*
 * @param{string} obj.avatar: the avatar url of the group
 */
export const createMemberGroup = async ({
  teamId,
  name,
  avatar,
  session
}: {
  teamId: string;
  name: string;
  avatar: string;
  session?: ClientSession;
}) => {
  return await MongoMemberGroupModel.create(
    [
      {
        teamId,
        name,
        avatar
      }
    ],
    { session }
  );
};

/** Get the Group permission of a team member
 * Return the maximum permission of the member's groups
 * @param{string} tmbId
 */
// export const getGroupPerOfTmb = async ({ tmbId, resourceType, resourceId }: { tmbId: string; resourceType: `${PerResourceTypeEnum}`; resourceId: string; }) {
//   const groupIds = (await getGroupsByTmbId(tmbId)).map((group) => group._id);
// }
