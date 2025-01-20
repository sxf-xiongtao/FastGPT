import { SyncOrgSourceEnum } from '@fastgpt/global/support/user/team/org/constant';
import { wecomOrgSync } from './wecom';

// sync the org
export type SyncOrgParams = {
  teamId: string;
};

function getSyncSource() {
  return systemConfig.auth?.wecom?.isSync ? SyncOrgSourceEnum.wecom : undefined;
}

/** sync org entrance function
 * @param teamId. The Org and user will be overwitten to the team.
 * */
export default function syncOrg({ teamId }: SyncOrgParams) {
  const source = getSyncSource(); // get the sync source, could be wecom (only for now).
  switch (source) {
    case SyncOrgSourceEnum.wecom:
      const { corpid, secret, syncSecret, agentid } = systemConfig.auth?.wecom || {};
      if (!corpid || !secret || !syncSecret || !agentid) {
        return Promise.reject('wecom config is not exist');
      }

      return wecomOrgSync({
        teamId,
        corpid,
        agentid,
        secret,
        syncSecret
      });
    default:
      return Promise.reject('no sync source');
  }
}
