import { replaceVariable } from '@fastgpt/global/common/string/tools';

export const getAutoTrainingPrompt = ({ text }: { text: string }) => {
  const AUTO_TRAINING_PROMPT = `你是一个阅读理解专家。我会发给你一段文本，请学习它并完成任务：
1. 为它生成一些可能的问题，至少 5 个。
2. 为它们生成总结。
3. 要求输出的语言与源文本语言相同，输出的总结要完整全面。

例如：
"""
文本
"""
## Questions
1. 问题1
2. 问题2
3. 问题3
……
## Summary
总结内容

------

现在，任务开始：
"""
{{text}}
"""`;
  return replaceVariable(AUTO_TRAINING_PROMPT, { text });
};

export const getImageParsePrompt = (varables: { text: string }) => {
  const IMAGE_PARSE_PROMPT = `## Task
As an assistant, you are responsible for integrating the provided textual and image information. These summaries will be embedded and used to retrieve the raw image. Write a clear and concise summary that captures all the important information. 

## Rules
- Please use the same language as the "image" or "Input" for output.

## Input
"""
{{text}}
"""
`;

  return replaceVariable(IMAGE_PARSE_PROMPT, varables) as string;
};
