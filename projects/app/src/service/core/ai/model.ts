export const getLlmModel = (model?: string) => {
  return (
    global.fatgptMainConfig?.llmModels.find((item) => item.model === model) ??
    global.fatgptMainConfig?.llmModels?.[0]
  );
};
export const getDatasetModel = (model?: string) => {
  return (
    global.fatgptMainConfig?.llmModels
      ?.filter((item) => item.datasetProcess)
      ?.find((item) => item.model === model) ?? global.fatgptMainConfig?.llmModels[0]
  );
};

export const getVectorModel = (model?: string) => {
  return (
    global.fatgptMainConfig?.vectorModels.find((item) => item.model === model) ||
    global.fatgptMainConfig?.vectorModels?.[0]
  );
};

export function getAudioSpeechModel(model?: string) {
  return (
    global.fatgptMainConfig?.audioSpeechModels.find((item) => item.model === model) ||
    global.fatgptMainConfig?.audioSpeechModels[0]
  );
}

export function getWhisperModel(model?: string) {
  return global.fatgptMainConfig.whisperModel;
}

export function getReRankModel(model?: string) {
  return global.fatgptMainConfig.reRankModels.find((item) => item.model === model);
}
