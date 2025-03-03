import type { ApiRequestProps, ApiResponseType } from '@fastgpt/service/type/next';
import { NextAPI } from '@/service/middleware/entry';
import { OwnerPermissionVal } from '@fastgpt/global/support/permission/constant';
import { MongoDataset } from '@fastgpt/service/core/dataset/schema';
import { TrainingModeEnum } from '@fastgpt/global/core/dataset/constants';
import { UsageSourceEnum } from '@fastgpt/global/support/wallet/usage/constants';
import { mongoSessionRun } from '@fastgpt/service/common/mongo/sessionRun';
import { getEmbeddingModel, getLLMModel } from '@fastgpt/service/core/ai/model';
import { MongoDatasetData } from '@fastgpt/service/core/dataset/data/schema';
import { MongoDatasetTraining } from '@fastgpt/service/core/dataset/training/schema';
import { createTrainingUsage } from '@fastgpt/service/support/wallet/usage/controller';
import { authCert } from '@fastgpt/service/support/permission/auth/common';
import { MongoTeam } from '@fastgpt/service/support/user/team/teamSchema';

export type RebuildAllEmbbeddingQuery = {};
export type RebuildAllEmbbeddingBody = {
  teamId: string;
};
export type RebuildAllEmbbeddingResponse = {};

/**
 * This function should be called in init script
 * TeamId and
 * */
async function handler(
  req: ApiRequestProps<RebuildAllEmbbeddingBody, RebuildAllEmbbeddingQuery>,
  _res: ApiResponseType<any>
): Promise<RebuildAllEmbbeddingResponse> {
  const { teamId } = req.body;
  await authCert({ req, authRoot: true, per: OwnerPermissionVal });
  const team = await MongoTeam.findById(teamId).lean();
  if (!team) {
    return Promise.reject('未找到团队');
  }
  const tmbId = team.ownerId;
  const datasets = await MongoDataset.find({ teamId }).lean();
  for await (const dataset of datasets) {
    const datasetId = String(dataset._id);
    const vectorModel = getEmbeddingModel(dataset.vectorModel).model;
    const [rebuilding, training] = await Promise.all([
      MongoDatasetData.findOne({ teamId, rebuilding: true }),
      MongoDatasetTraining.findOne({ teamId })
    ]);

    if (rebuilding || training) {
      return Promise.reject('数据集正在训练或者重建中，请稍后再试');
    }

    const { billId } = await createTrainingUsage({
      teamId,
      tmbId,
      appName: '数据库重建索引',
      billSource: UsageSourceEnum.training,
      vectorModel: getEmbeddingModel(dataset.vectorModel)?.name,
      agentModel: getLLMModel(dataset.agentModel)?.name
    });

    // update vector model and dataset.data rebuild field
    await mongoSessionRun(async (session) => {
      await MongoDatasetData.updateMany(
        {
          teamId,
          datasetId
        },
        {
          $set: {
            rebuilding: true
          }
        },
        {
          session
        }
      );
    });
    // get 10 init dataset.data
    const max = global.systemEnv?.vectorMaxProcess || 10;
    const arr = new Array(max * 2).fill(0);

    for await (const _ of arr) {
      try {
        const hasNext = await mongoSessionRun(async (session) => {
          // get next dataset.data
          const data = await MongoDatasetData.findOneAndUpdate(
            {
              rebuilding: true,
              teamId,
              datasetId
            },
            {
              $unset: {
                rebuilding: null
              },
              updateTime: new Date()
            },
            {
              session
            }
          ).select({
            _id: 1,
            collectionId: 1
          });

          if (data) {
            await MongoDatasetTraining.create(
              [
                {
                  teamId,
                  tmbId,
                  datasetId,
                  collectionId: data.collectionId,
                  billId,
                  mode: TrainingModeEnum.chunk,
                  model: vectorModel,
                  dataId: data._id
                }
              ],
              {
                session,
                ordered: true
              }
            );
          }

          return !!data;
        });

        if (!hasNext) {
          break;
        }
      } catch (error) {}
    }
  }

  return {};
}
export default NextAPI(handler);
