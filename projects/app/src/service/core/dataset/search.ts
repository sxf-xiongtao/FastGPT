import { chats2GPTMessages } from '@fastgpt/global/core/chat/adapt';
import { getLLMModel } from '@fastgpt/service/core/ai/model';
import { filterGPTMessageByMaxContext } from '@fastgpt/service/core/chat/utils';
import { replaceVariable } from '@fastgpt/global/common/string/tools';
import { createChatCompletion } from '@fastgpt/service/core/ai/config';
import { llmCompletionsBodyFormat, formatLLMResponse } from '@fastgpt/service/core/ai/utils';
import type { ChatCompletionMessageParam } from '@fastgpt/global/core/ai/type';
import type { SearchDataResponseItemType } from '@fastgpt/global/core/dataset/type';
import type {
  DeepRagSearchProps,
  SearchDatasetDataResponse
} from '@fastgpt/service/core/dataset/search/controller';
import {
  datasetDataReRank,
  filterDatasetDataByMaxTokens,
  searchDatasetData
} from '@fastgpt/service/core/dataset/search/controller';
import type { LLMModelItemType } from '@fastgpt/global/core/ai/model.d';
import json5 from 'json5';
import { ChatCompletionRequestMessageRoleEnum } from '@fastgpt/global/core/ai/constants';
import { countGptMessagesTokens } from '@fastgpt/service/common/string/tiktoken';

const PlanerPrompt = `## 任务介绍
你是一个数据检索专家，会利用图的思维来进行深度检索。

你通过将一个问题，拆分成能够通过搜索回答的子问题(没有关联的问题可以同步并列搜索），每个搜索的问题应该是一个单一问题，即单个具体人、事、物、具体时间点、地点或知识点的问题，不是一个复合问题(比如某个时间段), 一步步构建搜索图，最终回答问题。

## 注意事项
1. 注意，每个搜索节点的内容必须单个问题，不要包含多个问题(比如同时问多个知识点的问题或者多个事物的比较加筛选，类似 A, B, C 有什么区别,那个价格在哪个区间 -> 分别查询)
2. 每次只进行一个检索任务，也就是一个 Output，并等待检索结果。并且至多创建 3 个子搜索。
3. 检索历史记录中已有的问题不要重复提问，可以在已有问题的基础上继续提问。

## 样例

第一次执行：
### 问题
哪家大模型API最便宜?

### Nodes
- root: """"""

### Edges

------

### Output
["国内有哪些大模型 API","国外有哪些大模型 API"]

第二次执行：
### 问题
哪家大模型API最便宜?

### Nodes
- root: """"""
- 国内有哪些大模型 API: """腾讯, 阿里, 华为, 百度"""
- 国外有哪些大模型 API: """OpenAI"""

### Edges
- root -> 国内有哪些大模型 API
- root -> 国外有哪些大模型 API

### Output
["OpenAI 大模型API价格","腾讯大模型API价格","阿里大模型API价格","华为大模型API价格","百度大模型API价格"]

------

第三次执行:
### 问题
哪家大模型API最便宜?

### Nodes
- root: """"""
- 国内有哪些大模型 API: """腾讯, 阿里, 华为, 百度"""
- 国外有哪些大模型 API: """OpenAI"""
- OpenAI 大模型API价格: """0.05元/1M tokens"""
- 腾讯大模型API价格: """0.1元/1M tokens"""
- 阿里大模型API价格: """0.1元/1M tokens"""
- 华为大模型API价格: """0.1元/1M tokens"""
- 百度大模型API价格: """0.1元/1M tokens"""

### Edges
- root -> 国内有哪些大模型 API
- root -> 国外有哪些大模型 API
- 国内有哪些大模型 API -> 腾讯大模型API价格
- 国内有哪些大模型 API -> 阿里大模型API价格
- 国内有哪些大模型 API -> 华为大模型API价格
- 国内有哪些大模型 API -> 百度大模型API价格
- 国外有哪些大模型 API -> OpenAI 大模型API价格

### Output
Done

## 正式任务
### 问题
{{query}}

{{history}}

### Output
`;
class DeepSearchGraph {
  searchBg?: string;
  histories: ChatCompletionMessageParam[] = [];
  query: string = '';
  modelData: LLMModelItemType;

  nodes: {
    name: string;
    content?: string;
  }[] = [];
  edges: {
    source: string;
    target: string;
  }[] = [];

  constructor({
    query,
    histories,
    model,
    searchBg
  }: {
    query: string;
    histories: ChatCompletionMessageParam[];
    model: LLMModelItemType;
    searchBg?: string;
  }) {
    this.searchBg = searchBg;
    this.query = query;
    this.modelData = model;
    this.histories = histories;
    this.nodes.push({
      name: 'root'
    });
  }
  addNode(name: string, content?: string) {
    this.nodes.push({
      name,
      content
    });
  }
  addContent(name: string, content: string) {
    this.nodes.forEach((node) => {
      if (node.name === name) {
        node.content = content;
      }
    });
  }
  addEdge(source: string, target: string) {
    this.edges.push({
      source,
      target
    });
  }
  printGraph() {
    let graph = '';
    graph += '### Nodes:\n';
    for (const node of this.nodes) {
      graph += `- ${node.name}: """${node.content || ''}"""`;
    }
    graph += '\n### Edges:\n';
    for (const edge of this.edges) {
      graph += `- ${edge.source} -> ${edge.target}`;
    }
    return graph;
  }

  async getPlan() {
    const messages: any[] = [
      ...(this.searchBg ? [{ role: 'system', content: this.searchBg }] : []),
      ...this.histories,
      {
        role: 'user',
        content: replaceVariable(PlanerPrompt, {
          query: this.query,
          history: this.printGraph()
        })
      }
    ];
    //   console.log(messages, '--');
    const { response } = await createChatCompletion({
      body: llmCompletionsBodyFormat(
        {
          stream: false,
          model: this.modelData.model,
          temperature: 0.1,
          messages
        },
        this.modelData
      )
    });
    const { text: answer, usage } = await formatLLMResponse(response);

    // Count usage
    const AIMessages: ChatCompletionMessageParam[] = [
      {
        role: ChatCompletionRequestMessageRoleEnum.Assistant,
        content: answer
      }
    ];
    const inputTokens = usage?.prompt_tokens || (await countGptMessagesTokens(messages));
    const outputTokens = usage?.completion_tokens || (await countGptMessagesTokens(AIMessages));

    if (answer.includes('Done')) {
      return {
        queries: [],
        inputTokens,
        outputTokens
      };
    }

    try {
      const parseAnswer = json5.parse(answer) as string[];
      return {
        queries: parseAnswer.filter((item) => {
          if (this.nodes.some((node) => node.name === item)) {
            return false;
          }
          return true;
        }),
        inputTokens,
        outputTokens
      };
    } catch (error) {
      return {
        queries: [],
        inputTokens,
        outputTokens
      };
    }
  }
}

const searchResult2Text = (searchRes: SearchDataResponseItemType[]) => {
  return searchRes.map((item) => item.q + item.a).join('\n------\n');
};

export const deepRagSearch = async ({
  datasetDeepSearchModel = 'gpt-4o',
  datasetDeepSearchMaxTimes = 3,
  datasetDeepSearchBg,
  ...props
}: DeepRagSearchProps): Promise<SearchDatasetDataResponse> => {
  const query = props.queries[0];

  const searchResultList: SearchDataResponseItemType[] = [];
  let embeddingTokensUsage = 0;
  let llmInputTokensUsage = 0;
  let llmOutputTokensUsage = 0;

  const modelData = getLLMModel(datasetDeepSearchModel);
  const histories = await filterGPTMessageByMaxContext({
    messages: chats2GPTMessages({ messages: props.histories, reserveId: false }),
    maxContext: modelData.maxContext - 1000
  });

  let usingSimilarityFilter = false;
  let usingReRank = false;
  const deepSearchGraph = new DeepSearchGraph({
    query,
    histories,
    model: modelData,
    searchBg: datasetDeepSearchBg
  });
  let planQueries: string[] = [query];
  let runTimes = 0;

  while (runTimes < datasetDeepSearchMaxTimes) {
    const { queries, inputTokens, outputTokens } = await deepSearchGraph.getPlan();
    planQueries = queries;
    llmInputTokensUsage += inputTokens;
    llmOutputTokensUsage += outputTokens;

    if (planQueries.length === 0) {
      break;
    }

    for await (const query of planQueries) {
      const { searchRes: searchRes, embeddingTokens } = await searchDatasetData({
        ...props,
        queries: [query]
      });
      const uniqueResults = searchRes.filter((item) => {
        return !searchResultList.some((existingItem) => existingItem.id === item.id);
      });
      searchResultList.push(...uniqueResults);
      deepSearchGraph.addNode(query, searchResult2Text(uniqueResults));
      embeddingTokensUsage += embeddingTokens;
    }

    runTimes++;
  }

  const { formatResults, reRankInputTokens } = await (async () => {
    try {
      const rerankResults = await datasetDataReRank({
        query,
        data: searchResultList
      });
      const filterDataByTokens = await filterDatasetDataByMaxTokens(
        rerankResults.results,
        props.limit
      );
      return {
        formatResults: filterDataByTokens,
        reRankInputTokens: rerankResults.inputTokens
      };
    } catch (error) {
      return {
        formatResults: searchResultList,
        reRankInputTokens: 0
      };
    }
  })();

  return {
    searchRes: formatResults,
    embeddingTokens: embeddingTokensUsage,
    usingSimilarityFilter,
    usingReRank,
    searchMode: props.searchMode || 'embedding',
    limit: props.limit,
    similarity: props.similarity || 0.8,
    reRankInputTokens,
    deepSearchResult: {
      model: datasetDeepSearchModel,
      inputTokens: llmInputTokensUsage,
      outputTokens: llmOutputTokensUsage
    }
  };
};
