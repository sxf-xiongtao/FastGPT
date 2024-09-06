import { delay } from '@fastgpt/global/common/system/utils';
import { LogLevel, EnqueueStrategy, Configuration, PuppeteerCrawler } from 'crawlee';
import { htmlToMarkdown } from '@fastgpt/service/common/string/utils';
import { cheerioToHtml, loadContentByCheerio } from '@fastgpt/service/common/string/cheerio';
import { filterRegxs, excludeList, contentMinLength } from './constants';

export type CrawlDataItemType = { url: string; title: string; content: string };

const maxConcurrency = process.env.CRAWL_MAX_CONCURRENCY
  ? parseInt(process.env.CRAWL_MAX_CONCURRENCY)
  : 1;

export const crawlDynamicWebsite = async ({
  uid,
  url,
  maxPage = 200,
  selector = 'body',
  crawlOnePageCallback,
  onSuccess
}: {
  uid: string;
  url: string;
  maxPage?: number;
  selector?: string;
  crawlOnePageCallback?: (e: CrawlDataItemType, stopCrawler: () => void) => any;
  onSuccess?: (e: CrawlDataItemType[]) => any;
}) => {
  const datas: CrawlDataItemType[] = [];

  const config = new Configuration({
    defaultDatasetId: uid,
    persistStorage: false,
    logLevel: LogLevel.INFO
  });

  let crawler = new PuppeteerCrawler(
    {
      maxRequestsPerCrawl: maxPage,
      keepAlive: false,

      minConcurrency: 1,
      maxConcurrency,

      maxRequestRetries: 3,
      requestHandlerTimeoutSecs: 60,

      async requestHandler({ request, enqueueLinks, log, page }) {
        log.info(request.url);

        // await page.waitForSelector(selector);
        await page.waitForNetworkIdle();

        const content = await page.content();

        const $ = await loadContentByCheerio(content);
        const { html, title } = cheerioToHtml({
          $,
          selector,
          fetchUrl: request.url
        });

        const markdown = await htmlToMarkdown(html);

        const item: CrawlDataItemType = {
          url: request.url,
          title,
          content: markdown
        };

        if (datas.find((e) => e.url === item.url)) {
          return;
        }

        if (item.content.length > contentMinLength) {
          datas.push(item);
          crawlOnePageCallback?.(item, stopCrawler);
        }

        await delay(200);

        await enqueueLinks({
          strategy: EnqueueStrategy.SameHostname,
          regexps: [...filterRegxs],
          exclude: excludeList
        });
      },
      errorHandler({ error }) {
        console.log(error);
      }
    },
    config
  );

  function stopCrawler() {
    crawler.requestQueue?.drop();
    crawler.requestList = undefined;
    crawler.browserPool.destroy();
    crawler.teardown();
    // @ts-ignore
    crawler = undefined;
  }

  await crawler.run([url]);

  stopCrawler();

  const reuslts = datas.filter((item) => item.content.length > contentMinLength);

  onSuccess?.(reuslts);

  return reuslts;
};
