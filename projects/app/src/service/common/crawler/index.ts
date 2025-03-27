import { delay } from '@fastgpt/global/common/system/utils';
import { CheerioCrawler, LogLevel, EnqueueStrategy, Configuration } from 'crawlee';
import { htmlToMarkdown } from '@fastgpt/service/common/string/utils';
import { cheerioToHtml } from '@fastgpt/service/common/string/cheerio';
import { filterRegxs, excludeList, contentMinLength } from './constants';
import { addLog } from '@fastgpt/service/common/system/log';

export type CrawlDataItemType = { url: string; title: string; content: string };

export const crawlWebsite = async ({
  uid,
  url,
  maxPage = 50,
  selector = 'body',
  crawlOnePageCallback
}: {
  uid: string;
  url: string;
  maxPage?: number;
  selector?: string;
  crawlOnePageCallback?: (e: CrawlDataItemType, stopCrawler: () => void) => any;
}) => {
  const existUrl = new Map<string, boolean>();

  const config = new Configuration({
    defaultDatasetId: uid,
    persistStorage: false,
    logLevel: LogLevel.INFO
  });
  let crawler = new CheerioCrawler(
    {
      maxRequestsPerCrawl: maxPage,
      keepAlive: false,

      minConcurrency: 1,
      maxConcurrency: 1,

      maxRequestRetries: 3,
      requestHandlerTimeoutSecs: 60,

      async requestHandler({ $, request, enqueueLinks, log }) {
        log.info(request.url);

        const { title, html } = cheerioToHtml({
          fetchUrl: request.url,
          $,
          selector
        });

        const markdown = await htmlToMarkdown(html);

        const item: CrawlDataItemType = {
          url: request.url,
          title,
          content: markdown
        };

        if (existUrl.get(item.url)) {
          return;
        }

        if (item.content.length > contentMinLength) {
          existUrl.set(item.url, true);
          crawlOnePageCallback?.(item, stopCrawler);
        } else {
          return;
        }

        await delay(100);

        await enqueueLinks({
          strategy: EnqueueStrategy.SameHostname,
          regexps: [...filterRegxs],
          exclude: excludeList
        });
      },
      errorHandler({ error, request }) {
        console.log(request);
        addLog.error('[WebsiteSync]: Error', error);
      }
    },
    config
  );

  function stopCrawler() {
    crawler.requestQueue?.drop();
    crawler.requestList = undefined;
    crawler.teardown();
    // @ts-ignore
    crawler = undefined;
  }

  await crawler.run([url]);

  stopCrawler();
};
