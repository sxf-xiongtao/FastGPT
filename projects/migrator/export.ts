import { global } from './index.ts';

const uri = global.uri;

async function mongoexport({
  collection,
  query,
  queryFile
}: {
  collection: string;
  query?: object;
  queryFile?: string;
}) {
  const filepath = `./data/${collection}.json`;
  const cmd = new Deno.Command('mongoexport', {
    args: [
      '--uri',
      uri,
      '-c',
      collection,
      ...(query ? ['-q', JSON.stringify(query)] : []),
      ...(queryFile ? ['--queryFile', queryFile] : []),
      '-o',
      filepath
    ]
  });
  // console.log(query);

  const process = cmd.spawn();
  const { code, success } = await process.status;
  console.log(`mongoexport ${collection} process exited with code ${code}`);

  if (!success) {
    throw new Error('mongoexport failed');
  }
  return filepath;
}

async function getFields(path: string, fields: string = '_id'): Promise<(object | string)[]> {
  const rawJson = await Deno.readTextFile(path);
  const data: (object | string)[] = [];
  rawJson.split('\n').forEach((line) => {
    if (!line) return;
    const obj = JSON.parse(line);
    const field = obj[fields];
    if (field) data.push(field);
  });
  return data;
}

export async function mongoexportRewrite({
  collection,
  query,
  rewrite
}: {
  collection: string;
  query: object;
  // deno-lint-ignore no-explicit-any
  rewrite: (obj: any) => object;
}) {
  const cmd = new Deno.Command('mongoexport', {
    args: ['--uri', uri, '-c', collection, '-q', JSON.stringify(query)],
    stdout: 'piped',
    stderr: 'inherit'
  });

  const { success, code, stdout } = await cmd.output();
  console.log(`mongoexport ${collection} process exited with code ${code}`);
  if (!success) {
    throw new Error('mongoexport users failed');
  }
  // rewrite username
  const file = await Deno.open(`./data/${collection}.json`, {
    write: true,
    create: true
  });
  const writter = file.writable.getWriter();
  const encoder = new TextEncoder();
  const lines = new TextDecoder().decode(stdout).split('\n');
  for (const line of lines) {
    if (!line) return;
    const obj = JSON.parse(line);
    const result = rewrite(obj);
    writter.write(encoder.encode(JSON.stringify(result) + '\n'));
  }
  await writter.close();
  file.close();
}

async function exportUsers(users: object[]) {
  await mongoexportRewrite({
    collection: 'users',
    query: { _id: { $in: users } },
    rewrite: (obj) => {
      obj.username = 'exported-' + obj.username;
      return obj;
    }
  });
}

export async function exportData(teamId: string) {
  const queryByTeamId = { teamId: { $oid: teamId } };

  // export apps
  const appPath = await mongoexport({
    collection: 'apps',
    query: queryByTeamId
  });

  // take _id from apps collection and query for related data in other collections
  // read each line from apps.json and get _id
  const apps = await getFields(appPath);
  console.log(apps);

  // export app_versions
  await mongoexport({
    collection: 'app_versions',
    query: { appId: { $in: apps } }
  });

  // export outlinks
  await mongoexport({
    collection: 'outlinks',
    query: queryByTeamId
  });

  // export datasets
  await mongoexport({
    collection: 'datasets',
    query: queryByTeamId
  });

  // export dataset_datas
  await mongoexport({
    collection: 'dataset_datas',
    query: queryByTeamId
  });
  // export dataset_data_texts
  await mongoexport({
    collection: 'dataset_data_texts',
    query: queryByTeamId
  });
  // export dataset_trainings
  await mongoexport({
    collection: 'dataset_trainings',
    query: queryByTeamId
  });
  // export dataset_collection_tags
  await mongoexport({
    collection: 'dataset_collection_tags',
    query: queryByTeamId
  });

  // export dataset_collections
  const collectionPath = await mongoexport({
    collection: 'dataset_collections',
    query: queryByTeamId
  });
  const files = await getFields(collectionPath, 'fileId');
  console.log(files);

  // export files
  await mongoexport({
    collection: 'dataset.files',
    query: { _id: { $in: files } }
  });
  await mongoexport({
    collection: 'dataset.chunks',
    query: { files_id: { $in: files } }
  });

  // export images
  await mongoexport({
    collection: 'images',
    query: queryByTeamId
  });

  // export teams
  await mongoexport({
    collection: 'teams',
    query: { _id: { $oid: teamId } }
  });

  // export team_members
  const tmbPath = await mongoexport({
    collection: 'team_members',
    query: queryByTeamId
  });
  const users = await getFields(tmbPath, 'userId');
  console.log(users);

  // export users

  await exportUsers(users as object[]);

  // export resource_permissions
  await mongoexport({
    collection: 'resource_permissions',
    query: queryByTeamId
  });

  // export team_orgs
  await mongoexport({
    collection: 'team_orgs',
    query: queryByTeamId
  });
  // export team_org_members
  await mongoexport({
    collection: 'team_org_members',
    query: queryByTeamId
  });

  // export team_member_groups
  const groupPath = await mongoexport({
    collection: 'team_member_groups',
    query: queryByTeamId
  });
  const groups = await getFields(groupPath);
  console.log(groups);
  // export team_group_members
  await mongoexport({
    collection: 'team_group_members',
    query: { groupId: { $in: groups } }
  });
}

// only export app-related or dataset-related collections, and rewrite teamId and tmbId
export async function rewrite({
  teamId,
  newTeamId,
  newTmbId
}: {
  teamId: string;
  newTeamId: string;
  newTmbId: string;
}) {
  const queryByTeamId = { teamId: { $oid: teamId } };
  // deno-lint-ignore no-explicit-any
  const defaultRewriter = (obj: any) => {
    obj.teamId = { $oid: newTeamId };
    obj.tmbId = { $oid: newTmbId };
    return obj;
  };

  const apps: object[] = [];
  // export apps
  await mongoexportRewrite({
    collection: 'apps',
    query: queryByTeamId,
    rewrite: (obj) => {
      apps.push(obj._id);
      return defaultRewriter(obj);
    }
  });
  console.log(apps);

  // export app_versions
  await mongoexportRewrite({
    collection: 'app_versions',
    query: { appId: { $in: apps } },
    rewrite: defaultRewriter
  });

  // export outlinks
  await mongoexportRewrite({
    collection: 'outlinks',
    query: queryByTeamId,
    rewrite: defaultRewriter
  });

  // export datasets
  await mongoexportRewrite({
    collection: 'datasets',
    query: queryByTeamId,
    rewrite: defaultRewriter
  });

  // export dataset_datas
  await mongoexportRewrite({
    collection: 'dataset_datas',
    query: queryByTeamId,
    rewrite: defaultRewriter
  });
  // export dataset_data_texts
  await mongoexportRewrite({
    collection: 'dataset_data_texts',
    query: queryByTeamId,
    rewrite: defaultRewriter
  });
  // export dataset_trainings
  await mongoexportRewrite({
    collection: 'dataset_trainings',
    query: queryByTeamId,
    rewrite: defaultRewriter
  });
  // export dataset_collection_tags
  await mongoexportRewrite({
    collection: 'dataset_collection_tags',
    query: queryByTeamId,
    rewrite: defaultRewriter
  });

  // export dataset_collections
  const files: object[] = [];
  await mongoexportRewrite({
    collection: 'dataset_collections',
    query: queryByTeamId,
    rewrite: (obj) => {
      files.push(obj.fileId);
      return defaultRewriter(obj);
    }
  });
  console.log(files);

  // export files
  await mongoexport({
    collection: 'dataset.files',
    query: { _id: { $in: files } }
  });
  await mongoexport({
    collection: 'dataset.chunks',
    query: { files_id: { $in: files } }
  });

  // export images
  await mongoexportRewrite({
    collection: 'images',
    query: queryByTeamId,
    rewrite: defaultRewriter
  });
}
