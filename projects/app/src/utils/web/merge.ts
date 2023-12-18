export function deepMerge(
  target: Record<string, any>,
  source: Record<string, any>
): Record<string, any> {
  const isObject = (obj: any): obj is Record<string, any> => obj && typeof obj === 'object';

  if (!isObject(target) || !isObject(source)) {
    return source;
  }

  for (const key in source) {
    if (Object.prototype.hasOwnProperty.call(source, key)) {
      if (isObject(source[key])) {
        if (!target[key]) {
          Object.assign(target, { [key]: {} });
        }
        deepMerge(target[key], source[key]);
      } else {
        Object.assign(target, { [key]: source[key] });
      }
    }
  }

  return target;
}

export function mapFeConfig(feConfig: Record<string, any>): Record<string, any> {
  const { show_register, show_git, show_openai_account, show_promotion, favicon, avatar, ...rest } =
    feConfig;

  return {
    switches: {
      show_register,
      show_git,
      show_openai_account,
      show_promotion
    },
    images: { favicon, avatar },
    ...rest
  };
}

export function stripFeConfig(config: Record<string, any>): Record<string, any> {
  const { switches, images, ...rest } = config.FeConfig;
  return { FeConfig: { ...switches, ...images, ...rest } };
}
