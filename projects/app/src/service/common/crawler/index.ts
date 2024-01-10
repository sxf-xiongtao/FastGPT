import { delay } from '@fastgpt/global/common/system/utils';
import { simpleText } from '@fastgpt/global/common/string/tools';
import { CheerioCrawler, LogLevel, EnqueueStrategy, Configuration } from 'crawlee';
import { htmlToMarkdown } from '@fastgpt/service/common/string/markdown';
import { cheerioToHtml } from '@fastgpt/service/common/string/cheerio';

const filterRegxs = [
  /^(?!.*\.(png|jpg|jpeg|gif|svg|css|js|ico|woff|woff2|ttf|eot|otf|mp4|mp3|webm|ogg|wav|flac|aac|zip|tar|gz|rar|7z|exe|dmg|apk|csv|xls|xlsx|doc|docx|pdf|epub|iso|dmg|bin|ppt|pptx|odt|avi|mkv|xml|json|yml|yaml|rss|atom|swf|txt|dart|webp|bmp|tif|psd|ai|indd|eps|ps|zipx|srt|wasm|m4v|m4a|webp|weba|m4b|opus|ogv|ogm|oga|spx|ogx|flv|3gp|3g2|jxr|wdp|jng|hief|avif|apng|avifs|heif|heic|cur|ico|ani|jp2|jpm|jpx|mj2|wmv|wma|aac|tif|tiff|mpg|mpeg|mov|avi|wmv|flv|swf|mkv|m4v|m4p|m4b|m4r|m4a|mp3|wav|wma|ogg|oga|webm|3gp|3g2|flac|spx|amr|mid|midi|mka|dts|ac3|eac3|weba|m3u|m3u8|ts|wpl|pls|vob|ifo|bup|svcd|drc|dsm|dsv|dsa|dss|vivo|ivf|dvd|fli|flc|flic|flic|mng|asf|m2v|asx|ram|ra|rm|rpm|roq|smi|smil|wmf|wmz|wmd|wvx|wmx|movie|wri|ins|isp|acsm|djvu|fb2|xps|oxps|ps|eps|ai|prn|svg|dwg|dxf|ttf|fnt|fon|otf|cab)$)/g
];
const excludeList = [/(\.edu\.cn|\.gov\.cn)/g];

// too short content will be ignored
const contentMinLength = 20;

export type CrawlDataItemType = { url: string; title: string; content: string };

export const crawlWebsite = async ({
  uid,
  url,
  maxPage = 50,
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
      errorHandler({ error, request }) {
        console.log(error);
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

  const reuslts = datas.filter((item) => item.content.length > contentMinLength);

  onSuccess?.(reuslts);

  return reuslts;
};
