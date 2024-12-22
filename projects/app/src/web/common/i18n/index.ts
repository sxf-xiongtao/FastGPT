export const LANG_KEY = 'NEXT_LOCALE_LANG';
export enum LangEnum {
  'zh' = 'zh',
  'en' = 'en'
}
export const langMap = {
  [LangEnum.en]: {
    label: 'English',
    icon: 'common/language/en'
  },
  [LangEnum.zh]: {
    label: '简体中文',
    icon: 'common/language/zh'
  }
};

export const setLngStore = (lng: string) => {
  if (!localStorage) return;
  localStorage.setItem(LANG_KEY, lng);
};
