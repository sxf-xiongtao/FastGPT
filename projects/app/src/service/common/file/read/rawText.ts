import { ReadFileParams, ReadFileResponse } from './type.d';
import { readFileSync } from 'fs';

// 加载源文件内容
export const readFileRawText = ({ path }: ReadFileParams): ReadFileResponse => {
  const content = readFileSync(path, 'utf-8');

  return {
    rawText: content
  };
};
