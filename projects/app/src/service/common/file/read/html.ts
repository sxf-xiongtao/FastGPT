import { ReadFileParams, ReadFileResponse } from './type.d';
import { readFileSync } from 'fs';
import { initMarkdownText } from './utils';
import { htmlToMarkdown } from '@fastgpt/service/common/string/markdown';

export const readHtmlRawText = async ({
  teamId,
  metadata,
  path
}: ReadFileParams): Promise<ReadFileResponse> => {
  const html = readFileSync(path, 'utf-8');

  const md = await htmlToMarkdown(html);

  const rawText = await initMarkdownText({
    teamId,
    md,
    metadata
  });

  return {
    rawText
  };
};
