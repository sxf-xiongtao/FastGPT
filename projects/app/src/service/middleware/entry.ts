import { NextEntry } from '@fastgpt/service/common/middle/entry';
import { licenseCheck } from './licenseCheck';

export const NextAPI = NextEntry({
  beforeCallback: [licenseCheck]
});
