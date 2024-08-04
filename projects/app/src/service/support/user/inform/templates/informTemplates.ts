export type InformTemplateType = {
  title: string;
  content: string;
};

export const expireSoonTemplate = ({
  name,
  sub,
  day
}: {
  name: string;
  sub: string;
  day: number;
}): InformTemplateType => {
  return {
    title: `订阅套餐即将过期`,
    content: `尊敬的【${name}】团队，您的的【${sub}】还有 ${day} 天过期。为了保障您的服务正常运行，请及时登录平台进行续费。如您已续费，请忽略该通知。
`
  };
};

// 已过期（暂未用到）
export const expiredTemplate = ({
  name,
  sub,
  day
}: {
  name: string;
  sub: string;
  day: number;
}): InformTemplateType => {
  return {
    title: `【${global.feConfigs.systemTitle}】您的 ${sub} 已过期`,
    content: `
    【${global.feConfigs.systemTitle}】尊敬的 ${name} 用户您好，

    您在 ${global.feConfigs.systemTitle} 中的 ${sub} 已过期 ${day == 0 ? '' : String(day) + '天'}。为了保障您的服务正常运行，请及时登录平台进行续费。如您已续费，请忽略该通知。
`
  };
};

// 积分不足
export const lackOfPointsTemplate = ({ name }: { name: string }) => {
  return {
    title: `AI积分不足，任务暂停`,
    content: `尊敬的【${name}】团队，由于您团队的 AI 积分不足，您团队中的知识库训练任务已暂停，并且无法继续使用 AI 模型。为了保障您的服务正常运行，请及时登录平台进行续费。如您已续费，请忽略该通知。`
  };
};

export const FreeCleanTemplate = ({ name, day }: { name: string; day: string }) => {
  return {
    title: `知识库即将清理通知`,
    content: `由于您的团队【${name}】近期无任何使用记录。根据免费版套餐协议，系统将在 ${day} 天后自动清理您的知识库，请及时关注。`
  };
};

export const CustomTemplate = ({ title, content }: { title: string; content: string }) => {
  return {
    title,
    content
  };
};
