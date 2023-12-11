export const extractThirdLevelTitles = (obj, titles = [], depth = 1) => {
  for (const key in obj) {
    if (obj[key] && typeof obj[key] === 'object') {
      if (depth === 4 && obj[key].title && typeof obj[key].title === 'string') {
        titles.push(obj[key].title);
      }
      extractThirdLevelTitles(obj[key], titles, depth + 1);
    }
  }
  return titles;
};
