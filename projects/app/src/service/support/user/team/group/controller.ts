import { PerResourceTypeEnum } from '@fastgpt/global/support/permission/constant';
import { MongoGroupMemberModel } from '@fastgpt/service/support/permission/memberGroup/groupMemberSchema';
import { MongoMemberGroupModel } from '@fastgpt/service/support/permission/memberGroup/memberGroupSchema';
import { MongoResourcePermission } from '@fastgpt/service/support/permission/schema';

/** Get all groups of a team by teamId
 * @param teamId: the objectId of team
 * @return a object whose type is [GroupItemType]
 * @throws {Error} if teamId is not exist
 */
export const getGroupsByTeamId = async (teamId: string) => {
  const groups = await MongoMemberGroupModel.find({
    teamId
  }).lean();

  const members = await MongoGroupMemberModel.find({
    groupId: {
      $in: groups.map((item) => item._id)
    }
  }).lean();

  const permissions = await MongoResourcePermission.find({
    teamId,
    resourceType: PerResourceTypeEnum.team,
    groupId: {
      $in: groups.map((item) => item._id)
    }
  }).lean();

  return groups.map((group) => {
    const memberInGroup = members
      .filter((member) => String(member.groupId) === String(group._id))
      .map((item) => String(item.tmbId));
    const permission = permissions.find(
      (permission) => String(permission.groupId) === String(group._id)
    )?.permission;
    return {
      ...group,
      members: memberInGroup,
      permission
    };
  });
};
