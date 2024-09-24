import * as cheerio from 'cheerio';
export const cheerioToHtml = ({
  fetchUrl,
  $,
  selector
}: {
  fetchUrl: string;
  $: cheerio.CheerioAPI;
  selector?: string;
}) => {
  // get origin url
  const originUrl = new URL(fetchUrl).origin;

  const usedSelector = selector || 'body';
  const selectDom = $(usedSelector);

  // remove i element
  selectDom.find('i,script').remove();

  // remove empty a element
  selectDom
    .find('a')
    .filter((_, el) => {
      return $(el).text().trim() === '' && $(el).children().length === 0;
    })
    .remove();

  // if link,img startWith /, add origin url
  selectDom.find('a').each((_, el) => {
    const href = $(el).attr('href');
    if (href && href.startsWith('/')) {
      $(el).attr('href', originUrl + href);
    }
  });
  selectDom.find('img').each((_, el) => {
    const src = $(el).attr('src');
    if (src && src.startsWith('/')) {
      $(el).attr('src', originUrl + src);
    }
  });

  const html = selectDom
    .map((_, dom) => {
      return $(dom).html();
    })
    .get()
    .join('\n');

  const title = $('head title').text() || $('h1:first').text() || fetchUrl;

  return {
    html,
    title,
    usedSelector
  };
};

export const loadContentByCheerio = async (content: string) => cheerio.load(content);
