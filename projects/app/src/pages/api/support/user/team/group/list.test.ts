// import '../../../../__mocks__/base';
// import { getTestRequest } from '@fastgpt/service/test/utils'; ;
// import handler from './list';
// import { root } from '@/pages/api/__mocks__/db/init';
// import { RequestResponse } from '@/pages/api/__mocks__/type';
// import { MongoMemberGroupModel } from '@fastgpt/service/support/permission/memberGroup/memberGroupSchema';
// import { MongoGroupMemberModel } from '@fastgpt/service/support/permission/memberGroup/groupMemberSchema';
// import { MongoResourcePermission } from '@fastgpt/service/support/permission/schema';
// import { PerResourceTypeEnum } from '@fastgpt/global/support/permission/constant';
// import { TeamWritePermissionVal } from '@fastgpt/global/support/permission/user/constant';
//
// beforeAll(async () => {
//   const testGroup = await MongoMemberGroupModel.create({
//     teamId: root.teamId,
//     name: 'test'
//   });
//   await MongoGroupMemberModel.create({
//     groupId: testGroup._id,
//     tmbId: root.tmbId,
//     role: 'owner'
//   });
//   await MongoResourcePermission.create({
//     groupId: testGroup._id,
//     teamId: root.teamId,
//     permission: TeamWritePermissionVal,
//     resourceType: PerResourceTypeEnum.team
//   });
// });
//
// test('200', async () => {
//   const testGroup = await MongoMemberGroupModel.findOne({
//     teamId: root.teamId,
//     name: 'test'
//   });
//
//   const res = (await handler(
//     ...getTestRequest({
//       authToken: true,
//       user: root
//     })
//   )) as RequestResponse;
//   expect(res.code).toBe(200);
//   expect(res.data.length).toBe(2);
//   const testGroupReturned = res.data.find(
//     (item: any) => String(item._id) === String(testGroup?._id)
//   );
//   // console.debug(testGroupReturned);
//   expect(testGroupReturned.members.length).toBe(1);
//   expect(testGroupReturned.permission).toHaveProperty('value');
//   expect(testGroupReturned.permission.value).toBe(TeamWritePermissionVal);
// });
