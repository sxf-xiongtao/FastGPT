export type ReadFileParams = {
  teamId: string;
  path: string;
  metadata?: Record<string, any>;
};

export type ReadFileResponse = {
  rawText: string;
  metadata?: Record<string, any>;
};
