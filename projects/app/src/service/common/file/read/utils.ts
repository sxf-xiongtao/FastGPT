import { ReadFileByBufferParams } from '@fastgpt/service/common/file/read/type';
import fs from 'fs';
import { ReadFileParams } from './type';
import { detectFileEncoding } from '@fastgpt/global/common/file/tools';
import { readFileRawContent } from '@fastgpt/service/common/file/read/utils';

export const readFileContent = async (params: ReadFileParams) => {
  const { path } = params;

  const extension = path?.split('.')?.pop()?.toLowerCase() || '';

  const buffer = fs.readFileSync(path);
  const encoding = detectFileEncoding(buffer);

  const readParams: ReadFileByBufferParams = {
    teamId: params.teamId,
    encoding,
    buffer,
    metadata: params.metadata
  };

  const { rawText } = await readFileRawContent({
    extension,
    csvFormat: true,
    params: readParams
  });

  return {
    rawText
  };
};
