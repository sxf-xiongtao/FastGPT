import mammoth from 'mammoth';
import { htmlToMarkdown } from '@fastgpt/service/common/string/markdown';
import { ReadFileParams, ReadFileResponse } from './type';
import { initMarkdownText } from './utils';

/**
 * read docx to markdown
 */
export const readWordFile = async ({
  teamId,
  path,
  metadata = {}
}: ReadFileParams): Promise<ReadFileResponse> => {
  try {
    const { value: html } = await mammoth.convertToHtml({
      path
    });

    const md = await htmlToMarkdown(html);

    const rawText = await initMarkdownText({
      teamId,
      md,
      metadata
    });

    return {
      rawText,
      metadata: {}
    };
  } catch (error) {
    console.log('error doc read:', error);
    return Promise.reject('Can not read doc file, please convert to PDF');
  }
};
