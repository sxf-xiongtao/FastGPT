export const getChatModel = (model?: string) => {
  return (
    global.fatgptMainConfig?.chatModels.find((item) => item.model === model) ??
    global.fatgptMainConfig?.chatModels?.[0]
  );
};
export const getQAModel = (model?: string) => {
  return (
    global.fatgptMainConfig?.qaModels.find((item) => item.model === model) ||
    global.fatgptMainConfig?.qaModels?.[0]
  );
};
export const getCQModel = (model?: string) => {
  return (
    global.fatgptMainConfig?.cqModels.find((item) => item.model === model) ||
    global.fatgptMainConfig?.cqModels?.[0]
  );
};
export const getExtractModel = (model?: string) => {
  return (
    global.fatgptMainConfig?.extractModels.find((item) => item.model === model) ||
    global.fatgptMainConfig?.extractModels?.[0]
  );
};
export const getQGModel = (model?: string) => {
  return (
    global.fatgptMainConfig?.qgModels.find((item) => item.model === model) ||
    global.fatgptMainConfig?.qgModels?.[0]
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
