// import '../../../../__mocks__/base';
// import { getTestRequest } from '@fastgpt/service/test/utils'; ;
// import handler from './update';
// import { root } from '@/pages/api/__mocks__/db/init';
// import { PerResourceTypeEnum } from '@fastgpt/global/support/permission/constant';
// import { TeamWritePermissionVal } from '@fastgpt/global/support/permission/user/constant';
// import { MongoGroupMemberModel } from '@fastgpt/service/support/permission/memberGroup/groupMemberSchema';
// import { MongoMemberGroupModel } from '@fastgpt/service/support/permission/memberGroup/memberGroupSchema';
// import { MongoResourcePermission } from '@fastgpt/service/support/permission/schema';
// import { DefaultGroupName } from '@fastgpt/global/support/user/team/group/constant';
// import { CommonErrEnum } from '@fastgpt/global/common/error/code/common';
//
// beforeEach(async () => {
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
// afterEach(async () => {
//   await MongoMemberGroupModel.deleteMany({
//     teamId: root.teamId,
//     name: {
//       $not: RegExp(`/${DefaultGroupName}/`)
//     }
//   });
// });
//
// test('Update name', async () => {
//   const testGroup = await MongoMemberGroupModel.findOne({
//     teamId: root.teamId,
//     name: 'test'
//   });
//
//   if (!testGroup) throw new Error('testGroup not found');
//
//   const res = (await handler(
//     ...getTestRequest({
//       body: {
//         groupId: testGroup._id,
//         name: 'test2'
//       },
//       authToken: true,
//       user: root
//     })
//   )) as any;
//   console.debug(res);
//   expect(res.code).toBe(200);
//
//   const testGroup2 = await MongoMemberGroupModel.findById(testGroup._id);
//   expect(testGroup2?.name).toBe('test2');
// });
//
// test('Update avatar', async () => {
//   const testGroup = await MongoMemberGroupModel.findOne({
//     teamId: root.teamId,
//     name: 'test'
//   });
//
//   if (!testGroup) throw new Error('testGroup not found');
//
//   const res = (await handler(
//     ...getTestRequest({
//       body: {
//         groupId: testGroup._id,
//         avatar: 'test'
//       },
//       authToken: true,
//       user: root
//     })
//   )) as any;
//   expect(res.code).toBe(200);
//
//   const testGroup2 = await MongoMemberGroupModel.findById(testGroup._id);
//   expect(testGroup2?.avatar).toBe('test');
// });
//
// test('groupId is not provided', async () => {
//   const res = (await handler(
//     ...getTestRequest({
//       body: {
//         name: 'test'
//       },
//       authToken: true,
//       user: root
//     })
//   )) as any;
//   expect(res.code).toBe(500);
//   expect(res.error).toBe(CommonErrEnum.missingParams);
// });
//
// describe('test member update', () => {
//   test('test add member', async () => {
//     const testGroup = await MongoMemberGroupModel.findOne({
//       teamId: root.teamId,
//       name: 'test'
//     });
//     if (!testGroup) throw new Error('testGroup not found');
//
//     const res = (await handler(
//       ...getTestRequest({
//         body: {
//           groupId: testGroup._id,
//           memberList: [
//             {
//               tmbId: root.tmbId,
//               role: 'owner'
//             }
//           ]
//         },
//         authToken: true,
//         user: root
//       })
//     )) as any;
//     expect(res.code).toBe(200);
//   });
// });
