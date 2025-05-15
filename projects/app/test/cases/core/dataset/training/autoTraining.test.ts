import { describe, expect, it } from 'vitest';
import { formatSplitText2Index } from '@/service/core/dataset/training/autoTrainingProcess';
import { DatasetDataIndexTypeEnum } from '@fastgpt/global/core/dataset/data/constants';

describe('formatSplitText2Index', () => {
  it('should return empty array if no question or summary', () => {
    const result = formatSplitText2Index({ answer: '' });
    expect(result).toEqual([]);
  });

  it('should return array with question and summary', () => {
    const result = formatSplitText2Index({ answer: '问题1\n问题2\n问题3\n总结1\n总结2\n总结3' });
    expect(result).toEqual([]);
  });

  it('正常数据', () => {
    const result = formatSplitText2Index({
      answer: `<Questions>
问题1
问题2
问题3
</Questions>
<Summary>总结1</Summary>`
    });
    expect(result).toEqual([
      {
        type: DatasetDataIndexTypeEnum.question,
        text: `问题1
问题2
问题3`
      },
      {
        type: DatasetDataIndexTypeEnum.summary,
        text: '总结1'
      }
    ]);
  });

  it('缺失</Summary>', () => {
    const result = formatSplitText2Index({
      answer: `<Questions>
问题1
问题2
问题3
</Questions>
<Summary>总结1`
    });
    expect(result).toEqual([
      {
        type: DatasetDataIndexTypeEnum.question,
        text: `问题1
问题2
问题3`
      },
      {
        type: DatasetDataIndexTypeEnum.summary,
        text: '总结1'
      }
    ]);
  });

  it('包含多余数据', () => {
    const result = formatSplitText2Index({
      answer: `测试多余的<Questions>
问题1
问题2
问题3
</Questions>测试多余的
<Summary>总结1</Summary>测试多余的`
    });
    expect(result).toEqual([
      {
        type: DatasetDataIndexTypeEnum.question,
        text: `问题1
问题2
问题3`
      },
      {
        type: DatasetDataIndexTypeEnum.summary,
        text: '总结1'
      }
    ]);
  });
});
