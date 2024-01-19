import { readPdfFile } from './pdf';
import { readWordFile } from './word';
import { ReadFileParams } from './type';
import { readFileRawText } from './rawText';
import { markdownProcess } from '@fastgpt/global/common/string/markdown';
import { uploadMongoImg } from '@fastgpt/service/common/file/image/controller';
import { MongoImageTypeEnum } from '@fastgpt/global/common/file/image/constants';
import { readMarkdown } from './markdown';
import { readHtmlRawText } from './html';

export const readFileContent = async (params: ReadFileParams) => {
  const { path } = params;

  const extension = path?.split('.')?.pop()?.toLowerCase() || '';

  const { rawText } = await (async () => {
    switch (extension) {
      case 'txt':
        return readFileRawText(params);
      case 'md':
        return readMarkdown(params);
      case 'html':
        return readHtmlRawText(params);
      case 'pdf':
        return readPdfFile(params);
      case 'docx':
        return readWordFile(params);

      default:
        return Promise.reject('Only support .txt, .md, .html, .pdf, .docx');
    }
  })();

  return {
    rawText
  };
};

export const initMarkdownText = ({
  teamId,
  md,
  metadata
}: {
  md: string;
  teamId: string;
  metadata?: Record<string, any>;
}) =>
  markdownProcess({
    rawText: md,
    uploadImgController: (base64Img) =>
      uploadMongoImg({
        type: MongoImageTypeEnum.collectionImage,
        base64Img,
        teamId,
        metadata
      })
  });
