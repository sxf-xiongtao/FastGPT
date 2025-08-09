import { ChatCompletionRequestMessageRoleEnum } from '@fastgpt/global/core/ai/constants';
import type { ChatCompletionMessageParam } from '@fastgpt/global/core/ai/type';
import { countGptMessagesTokens, countPromptTokens } from '@fastgpt/service/common/string/tiktoken';
import { createChatCompletion } from '@fastgpt/service/core/ai/config';
import { getLLMModel } from '@fastgpt/service/core/ai/model';
import { formatLLMResponse, llmCompletionsBodyFormat } from '@fastgpt/service/core/ai/utils';
import { loadRequestMessages } from '@fastgpt/service/core/chat/utils';
import json5 from 'json5';
import type { LLMModelItemType } from '@fastgpt/global/core/ai/model.d';
import { sliceJsonStr } from '@fastgpt/global/common/string/tools';
import { addLog } from '@fastgpt/service/common/system/log';

// Define directory item type
type DirectoryItem = {
  line_number: number;
  content: string;
};

const PROMPT = `## 任务描述

你是一个专业的文档结构分析助手。你的任务是根据提供的文档内容，识别并提取出目录结构（最高支持四级目录）。

## 文档格式说明

- 文档的每一行都以 "[行号]" 开头，例如 "[3] 标题一"。
- 方括号中的数字表示该行在原始文档中的准确行号。
- 你提取的每个标题的行号必须严格对应该 "[数字]" 中的值（不要偏移）。

## 任务要求

1. 分析文档的整体结构和语义信息来提取出文本的目录结构（最多四层）。
2. 对于每一个层级的目录项：
    - 如果原文中有明确的标题（如以 "#" 开头、或整行为标题风格的短句），请直接使用原文标题文本（**不要对标题文字做任何修改**，因为后续需要做精确匹配）。
    - 如果标题被拆分在多行中（例如：公司名在一行，规则名在下一行），请智能合并为一个完整标题，仅保留第一行的行号，并将多个标题行的内容使用空格连接。
    - 如果某个段落没有明显标题，但语义上属于独立部分，请你为它生成一个合理的标题，并加上合适的 Markdown 层级（如："## 概要信息"）。
3. 每个目录项应包含以下字段：
    - "line_number"：该标题在原始文档中对应的行号（从该标题第一行的 "[数字]" 中提取）。
    - "content"：该标题文本，并用 Markdown 标题语法标注其层级（如："# 一级标题"、"## 二级标题" 等）。
4. 层级识别参考标准如下（模型可以灵活判断）：
    - 一级标题（"#"）：通常为整篇文档的主标题、大章节名称。
    - 二级标题（"##"）：章节内部的子模块、小节、规则名称等。
    - 三级标题（"###"）：更细粒度的分类，例如：背景、目的、适用范围等。
    - 四级标题（"####"）：表格说明、子条件、执行细则等。
5. 如果有额外的目录信息输入，可以考虑之前目录内容的层级关系和标号进而来提取新内容的目录。
   
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

// split text to chunks: numbering + chunking
const splitTextToChunks = (
  rawText: string,
  maxContext: number
): { chunks: string[]; rawTextLines: string[] } => {
  const rawTextLines = rawText
    .split('\n')
    .map((text, index) => `[${index + 1}] ${text.replace(/^#+\s*/, '').trim()}`);

  const chunks: string[] = [];
  let currentChunk = '';

  for (const line of rawTextLines) {
    const lineWithNewline = line + '\n';

    if (currentChunk.length + lineWithNewline.length > maxContext) {
      if (currentChunk) {
        chunks.push(currentChunk.trim());
        currentChunk = '';
      }
    }

    currentChunk += lineWithNewline;
  }

  if (currentChunk) {
    chunks.push(currentChunk.trim());
  }

  return { chunks, rawTextLines };
};

// Helper function: process a single chunk
const getLLMParseResults = async (
  chunk: string,
  previousDirList: DirectoryItem[],
  modelData: LLMModelItemType
): Promise<{
  dirList: DirectoryItem[];
  inputTokens: number;
  outputTokens: number;
}> => {
  // Build system prompt with optional context information
  const systemContent = (() => {
    if (previousDirList.length === 0) {
      return PROMPT;
    }

    const contextPrompt = `这是上一段内容的目录结构：
${previousDirList.map((item) => `[${item.line_number}] ${item.content}`).join('\n')}

特别重要：为了保障连贯性，请确保之后提取的行号大于${
      previousDirList[previousDirList.length - 1].line_number
    }`;

    return `${PROMPT}

${contextPrompt}`;
  })();

  const messages: ChatCompletionMessageParam[] = [
    {
      role: ChatCompletionRequestMessageRoleEnum.System,
      content: systemContent
    },
    {
      role: ChatCompletionRequestMessageRoleEnum.User,
      content: chunk
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

  // Parse directory list from answer
  const dirList: DirectoryItem[] = (() => {
    try {
      const formatAnswer = sliceJsonStr(answer.trim());
      const rawResult = json5.parse(formatAnswer) as {
        line_number: string;
        content: string;
      }[];
      if (rawResult && Array.isArray(rawResult)) {
        return rawResult
          .map((item) => ({
            line_number: Number(item.line_number),
            content: item.content
          }))
          .filter((item) => !isNaN(item.line_number) && item.line_number > 0);
      }
    } catch (error) {
      addLog.error(`[llmPargraph] parse error`, {
        message: answer
      });
    }
    return [];
  })();

  dirList.sort((a, b) => a.line_number - b.line_number);

  return { dirList, inputTokens, outputTokens };
};

// filter duplicate and invalid directory items
const filterDirectoryList = (
  dirList: DirectoryItem[],
  previousDirList: DirectoryItem[]
): DirectoryItem[] => {
  const previousLatestNumber = previousDirList[previousDirList.length - 1]?.line_number || 0;

  const dirListFirstIndex = dirList.findIndex((item) => item.line_number > previousLatestNumber);

  // 如果 line_number 相同，合并content
  const mergedDirList = dirList.slice(dirListFirstIndex).reduce<DirectoryItem[]>((acc, item) => {
    const lastItem = acc[acc.length - 1];
    if (lastItem && lastItem.line_number === item.line_number) {
      lastItem.content += `\n${item.content}`;
    } else {
      acc.push(item);
    }
    return acc;
  }, []);

  return mergedDirList;
};

// Helper function: apply directories to text
const applyDirectoriesToText = (lineRawText: string[], answerResults: DirectoryItem[]): string => {
  // Remove [num] at the beginning of each line
  const cleanedText = lineRawText.map((item) => item.replace(/^\[\d+\]\s*/, ''));

  // Assign model results to the original text
  answerResults.forEach((item) => {
    const line = item.line_number - 1;
    const title = item.content;

    if (!cleanedText[line]) {
      return;
    }

    // Remove the part at the beginning of lineRawText[line] that matches the extracted result
    if (cleanedText[line].startsWith(title)) {
      cleanedText[line] = cleanedText[line].substring(title.length).trim();
    }

    cleanedText[line] = `${item.content}\n${cleanedText[line]}`;
  });

  return cleanedText.join('\n');
};

export const llmPargraph = async ({ rawText, model }: { rawText: string; model: string }) => {
  const modelData = getLLMModel(model);
  if (!modelData) {
    return Promise.reject('Model not found');
  }

  // 1. Remove markdown header
  rawText = rawText.replace(/^#+\s+/gm, '');

  // 2. Split text to chunks
  const maxContext = Math.max(modelData.maxContext - modelData.maxResponse, 16000);
  const { chunks, rawTextLines } = splitTextToChunks(rawText, maxContext);

  // 3. Call the model in segments to get results
  const results: DirectoryItem[] = [];
  let previousDirList: DirectoryItem[] = [];
  let totalInputTokens = 0;
  let totalOutputTokens = 0;

  for await (const chunk of chunks) {
    const { dirList, inputTokens, outputTokens } = await getLLMParseResults(
      chunk,
      previousDirList,
      modelData
    );

    totalInputTokens += inputTokens;
    totalOutputTokens += outputTokens;

    // Handle duplicate headings and line numbers less than previous heading lines
    const filteredDirList = filterDirectoryList(dirList, previousDirList);

    // Update context information
    previousDirList = filteredDirList;

    results.push(...filteredDirList);
  }

  // 4. Apply directories to text and get the final result
  const resultText = applyDirectoriesToText(rawTextLines, results);

  return {
    resultText,
    totalInputTokens,
    totalOutputTokens
  };
};
