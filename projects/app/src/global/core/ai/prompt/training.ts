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

export const getImageParsePrompt = () => {
  const IMAGE_PARSE_PROMPT = `## Role
你是一个内容总结助手，你会将用户传入的图片和文字进行一次总结。这个总结将被用于向量相似度检索。

## Rules
- 总结需要完整，充分描述图片及其上下文的内容。
- 如果图片是纯文本内容，例如：扫描件、表格等，可以将文本内容直接提取出来。
- 如果图片是非纯文字内容，例如：流程图、架构图、功能截图、医学图、教程图等，你需要对图片进行总结描述。
- 最后，使用与图片或上下文字相同的语言进行总结。`;

  return IMAGE_PARSE_PROMPT;
};
