import { ReadFileParams, ReadFileResponse } from './type.d';
import { readFileSync } from 'fs';
import { initMarkdownText } from './utils';

export const readMarkdown = async ({
  teamId,
  metadata,
  path
}: ReadFileParams): Promise<ReadFileResponse> => {
  const md = readFileSync(path, 'utf-8');

  const rawText = await initMarkdownText({
    teamId,
    md,
    metadata
  });

  return {
    rawText
  };
};
