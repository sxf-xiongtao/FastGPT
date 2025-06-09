import { ChatCompletionRequestMessageRoleEnum } from '@fastgpt/global/core/ai/constants';
import { ChatCompletionMessageParam } from '@fastgpt/global/core/ai/type';
import { countGptMessagesTokens, countPromptTokens } from '@fastgpt/service/common/string/tiktoken';
import { addLog } from '@fastgpt/service/common/system/log';
import { createChatCompletion } from '@fastgpt/service/core/ai/config';
import { getLLMModel } from '@fastgpt/service/core/ai/model';
import { formatLLMResponse, llmCompletionsBodyFormat } from '@fastgpt/service/core/ai/utils';
import { loadRequestMessages } from '@fastgpt/service/core/chat/utils';
import json5 from 'json5';

const PROMPT = `## 任务描述

你是一个专业的文档结构分析助手。你的任务是根据提供的文档内容，识别并提取出目录结构（最高支持四级目录）。

## 文档格式说明

- 文档的每一行都以 "[行号]" 开头，例如 "[3] 标题一"
- 方括号中的数字表示该行在原始文档中的准确行号
- 你提取的每个标题的行号必须严格对应该 "[数字]" 中的值（不要偏移）

## 任务要求

1. 分析文档的整体结构和语义信息来提取出文本的目录结构（最多四层）
2. 对于每一个层级的目录项：
    - 如果原文中有明确的标题（如以 "#" 开头、或整行为标题风格的短句），请直接使用原文标题文本（**不要对标题文字做任何修改**，因为后续需要做精确匹配）
    - 如果标题被拆分在多行中（例如：公司名在一行，规则名在下一行），请智能合并为一个完整标题，仅保留第一行的行号，并将多个标题行的内容使用空格连接
    - 如果某个段落没有明显标题，但语义上属于独立部分，请你为它生成一个合理的标题，并加上合适的 Markdown 层级（如："## 概要信息"）
3. 每个目录项应包含以下字段：
    - "line_number"：该标题在原始文档中对应的行号（从该标题第一行的 "[数字]" 中提取）
    - "content"：该标题文本，并用 Markdown 标题语法标注其层级（如："# 一级标题"、"## 二级标题" 等）
4. 层级识别参考标准如下（模型可以灵活判断）：
    - 一级标题（"#"）：通常为整篇文档的主标题、大章节名称
    - 二级标题（"##"）：章节内部的子模块、小节、规则名称等
    - 三级标题（"###"）：更细粒度的分类，例如：背景、目的、适用范围等
    - 四级标题（"####"）：表格说明、子条件、执行细则等
5. 如果有额外的目录信息输入，可以考虑之前目录内容的层级关系和标号进而来提取新内容的目录
   
## 输出格式

请严格输出以下 "数组" 格式的结构化数据，不允许包含多余解释或注释：

[
    {
        "line_number": "3",
        "content": "# 标题一"
    },
    {
        "line_number": "8",
        "content": "### 事件描述"
    }
]
`;

export const llmPargraph = async ({ rawText, model }: { rawText: string; model: string }) => {
  const modelData = getLLMModel(model);
  if (!modelData) {
    return Promise.reject('Model not found');
  }

  const start = Date.now();
  addLog.debug(`[LLM pargraph] start`);

  // 1. 原文每一行前面增加一个行号, 并删除原来的标题
  let lineRawText = rawText
    .split('\n')
    .map((text, index) => `[${index + 1}] ${text.replace(/^#+\s*/, '').trim()}`);

  // 2. 按最大上下文合并
  const maxContext = Math.max(modelData.maxContext - modelData.maxResponse, 16000);
  const chunks: string[] = [];
  let text = '';
  lineRawText.forEach((item) => {
    text += `${item}\n`;
    if (text.length > maxContext) {
      {
        chunks.push(text.trim());
        text = '';
      }
    }
  });
  if (text) {
    chunks.push(text);
  }

  // 3. 调用模型获取结果
  const results = await Promise.all(
    chunks.map(async (text) => {
      const messages: ChatCompletionMessageParam[] = [
        {
          role: ChatCompletionRequestMessageRoleEnum.System,
          content: PROMPT
        },
        {
          role: ChatCompletionRequestMessageRoleEnum.User,
          content: text
        }
      ];

      const { response: chatResponse } = await createChatCompletion({
        body: llmCompletionsBodyFormat(
          {
            model: modelData.model,
            temperature: 0.1,
            messages: await loadRequestMessages({ messages, useVision: false }),
            stream: true
          },
          modelData
        )
      });
      const { text: answer, usage } = await formatLLMResponse(chatResponse);
      const inputTokens = usage?.prompt_tokens || (await countGptMessagesTokens(messages));
      const outputTokens = usage?.completion_tokens || (await countPromptTokens(answer));

      return {
        answer,
        inputTokens,
        outputTokens
      };
    })
  );
  const totalInputTokens = results.reduce((acc, item) => acc + item.inputTokens, 0);
  const totalOutputTokens = results.reduce((acc, item) => acc + item.outputTokens, 0);
  const answerResults = results
    .map((item) => {
      try {
        const result = json5.parse(item.answer) as { line_number: string; content: string }[];
        return result.map((item) => ({
          line_number: Number(item.line_number),
          content: item.content
        }));
      } catch (error) {
        return [];
      }
    })
    .flat()
    .sort((a, b) => a.line_number - b.line_number);

  // 4. 删除每行开头的 [num]
  lineRawText.forEach((item, index) => {
    lineRawText[index] = item.replace(/^\[\d+\]\s*/, '');
  });

  // 5. 将模型结果赋值给原文
  answerResults.forEach((item, index) => {
    const line = item.line_number - 1;
    const title = item.content;

    if (!lineRawText[line]) return;

    // 提取 title 正文（过滤掉 # 标题符号）
    const titleText = title.replace(/^#+\s*/, '').trim();
    // 删除 lineRawText[line] 开头和提取结果相同的部分
    if (lineRawText[line].startsWith(titleText)) {
      lineRawText[line] = lineRawText[line].substring(titleText.length).trim();
    }

    lineRawText[line] = `${item.content}\n${lineRawText[line]}`;
  });

  // 6. 获取最终结果
  const resultText = lineRawText.join('\n');

  addLog.debug(`[LLM pargraph] finish, time: ${Date.now() - start}ms`);

  return {
    resultText,
    totalInputTokens,
    totalOutputTokens
  };
};
