export function getAllPageIds() {
  return [
    { params: { pageId: 'dashboard' } },
    { params: { pageId: 'users' } },
    { params: { pageId: 'teams' } },
    { params: { pageId: 'apps' } },
    { params: { pageId: 'pays' } },
    { params: { pageId: 'datasets' } },
    { params: { pageId: 'settings' } }
  ];
}

export async function getPageData(pageId: string) {
  const pageData = { pageId };
  return pageData;
}
