import { delay } from '@/utils/tools';
import { simpleText } from '@fastgpt/global/common/string/tools';
import { CheerioCrawler, log, LogLevel, EnqueueStrategy } from 'crawlee';
import { htmlToMarkdown } from '@fastgpt/global/common/string/markdown';
import { cheerioToHtml } from '@fastgpt/global/common/file/tools';

// log.setLevel(LogLevel.ERROR);
const filterImgRegx =
  /^(?!.*\.(png|jpg|jpeg|gif|svg|css|js|ico|woff|woff2|ttf|eot|otf|mp4|mp3|webm|ogg|wav|flac|aac|zip|tar|gz|rar|7z|exe|dmg|apk|csv|xls|xlsx|doc|docx|pdf|epub|iso|dmg|bin|ppt|pptx|odt|avi|mkv|xml|json|yml|yaml|rss|atom|swf|txt|dart|webp|bmp|tif|psd|ai|indd|eps|ps|zipx|srt|wasm|m4v|m4a|webp|weba|m4b|opus|ogv|ogm|oga|spx|ogx|flv|3gp|3g2|jxr|wdp|jng|hief|avif|apng|avifs|heif|heic|cur|ico|ani|jp2|jpm|jpx|mj2|wmv|wma|aac|tif|tiff|mpg|mpeg|mov|avi|wmv|flv|swf|mkv|m4v|m4p|m4b|m4r|m4a|mp3|wav|wma|ogg|oga|webm|3gp|3g2|flac|spx|amr|mid|midi|mka|dts|ac3|eac3|weba|m3u|m3u8|ts|wpl|pls|vob|ifo|bup|svcd|drc|dsm|dsv|dsa|dss|vivo|ivf|dvd|fli|flc|flic|flic|mng|asf|m2v|asx|ram|ra|rm|rpm|roq|smi|smil|wmf|wmz|wmd|wvx|wmx|movie|wri|ins|isp|acsm|djvu|fb2|xps|oxps|ps|eps|ai|prn|svg|dwg|dxf|ttf|fnt|fon|otf|cab)$)/g;

export type CrawlDataItemType = { url: string; content: string };

// too short content will be ignored
const contentMinLength = 70;

export const crawlWebsite = async ({
  url,
  maxPage = 50,
  selector = 'body',
  crawlOnePageCallback,
  onSuccess
}: {
  url: string;
  maxPage?: number;
  selector?: string;
  crawlOnePageCallback?: (e: CrawlDataItemType) => any;
  onSuccess?: (e: CrawlDataItemType[]) => any;
}) => {
  const datas: { url: string; content: string }[] = [];
  let crawler = new CheerioCrawler({
    maxRequestsPerCrawl: maxPage,
    minConcurrency: 1,
    maxConcurrency: 3,

    maxRequestRetries: 3,
    requestHandlerTimeoutSecs: 60,

    async requestHandler({ $, request, enqueueLinks, log }) {
      log.info(request.url);

      const html = cheerioToHtml({
        fetchUrl: request.url,
        $,
        selector
      });

      const markdown = htmlToMarkdown(html);

      const item = {
        url: request.url,
        content: markdown
      };

      if (datas.find((e) => e.url === item.url)) {
        return;
      }

      if (item.content.length > contentMinLength) {
        datas.push(item);
        crawlOnePageCallback?.(item);
      }

      await delay(500);

      await enqueueLinks({
        strategy: EnqueueStrategy.SameHostname,
        regexps: [filterImgRegx]
      });
    }
  });

  await crawler.run([url]);
  crawler.requestQueue?.drop();
  crawler.requestList = undefined;
  crawler.teardown();

  const reuslts = datas
    .filter((item) => item.content.length > contentMinLength)
    .map((item) => ({
      ...item,
      content: simpleText(item.content)
    }));

  onSuccess?.(reuslts);

  return reuslts;
};
