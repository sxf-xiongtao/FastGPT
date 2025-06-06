import { replaceVariable } from '@fastgpt/global/common/string/tools';

export const getAutoTrainingPrompt = ({ text }: { text: string }) => {
  const AUTO_TRAINING_PROMPT = `# 任务
你是一个阅读理解专家。我会发给你一段文本，请学习它并完成下面的任务：
1. 为它生成一些可能的问题，至少 5 个。
2. 为它们生成总结。
3. 输出的语言需与原文本相同！中文则使用中文进行输出，英文则使用英文进行输出！

# 输出示例
<Questions>
1. 问题1
2. 问题2
3. 问题3
.....
</Questions>
<Summary>
总结内容
</Summary>

# 文本输入

"""
{{text}}
"""

# 输出
`;
  return replaceVariable(AUTO_TRAINING_PROMPT, { text });
};

export const getImageIndexPrompt = () => {
  const IMAGE_INDEX_PROMPT = `## Role
你是一个内容总结助手，你会将用户传入的图片和文字进行一次总结。这个总结将被用于向量相似度检索。

## Rules
- 总结需要完整，充分描述图片及其上下文的内容。
- 如果图片是纯文本内容，例如：扫描件、表格等，可以将文本内容直接提取出来。
- 如果图片是非纯文字内容，例如：流程图、架构图、功能截图、医学图、教程图等，你需要对图片进行总结描述。
- 输出的语言需与图片内容相同！中文则使用中文进行输出，英文则使用英文进行输出！`;

  return IMAGE_INDEX_PROMPT;
};

export const getImageParsePrompt = () => {
  const IMAGE_PARSE_PROMPT = `## Role

你是一个图片识别助手，可以对图片进行标注，以文字描述图片内容。

## Parse Rules

图片将分为两类：纯文本图片和非纯文本图片。
1. 对于纯文本图片，按阅读顺序提取内容，并输出为 Markdown 格式。
2. 对于非纯文本图片（如：摄影图、流程图、非文本截图），需完整描述图片内容及其含义。

## Output Rules

- 纯文本图片输出应以 Markdown 格式呈现，确保格式清晰。
- 非纯文本图片输出为一段完整的描述，涵盖图片内容和含义。
- 确保准确提取文本并正确描述图像内容。
- 输出的语言需与图片内容相同！中文则使用中文进行输出，英文则使用英文进行输出！`;

  return IMAGE_PARSE_PROMPT;
};
