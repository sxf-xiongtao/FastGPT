import {
  PermissionList,
  constructPermission
} from '@fastgpt/service/support/permission/resourcePermission/permisson';

export const OwnerPermission = constructPermission([
  PermissionList['Read'],
  PermissionList['Write'],
  PermissionList['Manage']
]).value; // 0b111, read, write, manage, 7
