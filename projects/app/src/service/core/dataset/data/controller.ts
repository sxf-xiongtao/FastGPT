import type {
  PushDatasetDataProps,
  PushDatasetDataResponse
} from '@fastgpt/global/core/dataset/api.d';
import { pushDataListToTrainingQueue } from '@fastgpt/service/core/dataset/training/controller';

export async function pushDataToTrainingQueue(
  props: {
    teamId: string;
    tmbId: string;
  } & PushDatasetDataProps
): Promise<PushDatasetDataResponse> {
  const result = await pushDataListToTrainingQueue({
    ...props,
    vectorModelList: global.fatgptMainConfig?.vectorModels,
    datasetModelList: global.fatgptMainConfig?.llmModels
  });

  return result;
}
