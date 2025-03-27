export type EmailTemplateType = {
  subject: string;
  html: string;
};

export const expireSoonTemplate = ({
  name,
  sub,
  day
}: {
  name: string;
  sub: string;
  day: number;
}) => {
  return {
    subject: `【${global.feConfigs.systemTitle}】通知 - 套餐即将过期`,
    html: `
  <div>
    <p>尊敬的【${name}】团队您好，</p>
    <p>您的【${sub}】还有 ${day} 天过期。为了保障您的服务正常运行，请及时登录平台进行续费。如您已续费，请忽略该通知。 </p>
  </div>
`
  };
};

export const expiredTemplate = ({ name, sub, day }: { name: string; sub: string; day: number }) => {
  return {
    subject: `【${global.feConfigs.systemTitle}】您的 ${sub} 已过期`,
    html: `
  <div>
    <p>【${global.feConfigs.systemTitle}】尊敬的 ${name} 用户您好，</p>
    <p> 您在 ${global.feConfigs.systemTitle} 中的 ${sub} 已过期 ${day == 0 ? '' : String(day) + '天'}。为了保障您的服务正常运行，请及时登录平台进行续费。如您已续费，请忽略该通知。 </p>
  </div>
`
  };
};

export const lackOfPointsTemplate = ({ name }: { name: string }) => {
  return {
    subject: `【${global.feConfigs.systemTitle}】通知 - AI 积分不足`,
    html: `
  <div>
    <p>尊敬的【${name}】团队您好，</p>
    <p>由于您团队的 AI 积分不足，您团队中的知识库训练任务已暂停，并且无法继续使用 AI 模型。为了保障您的服务正常运行，请及时登录平台进行续费。如您已续费，请忽略该通知。 </p>
  </div>
`
  };
};

export const FreeCleanTemplate = ({ name, day }: { name: string; day: number }) => {
  return {
    subject: `【${global.feConfigs.systemTitle}】通知 - 知识库即将清理`,
    html: `
  <div>
    <p>尊敬的【${name}】团队您好，</p>
    <p>由于您的团队近期无任何使用记录。根据免费版套餐协议，系统将在 ${day} 天后自动清理您的知识库，请及时登录官网查看关注。</p>
  </div>
`
  };
};

export const RegisterTemplate = ({ code }: { code: string }) => {
  return {
    subject: `【${global.feConfigs.systemTitle}】注册验证码`,
    html: `
  <div>
    <p> 您正在注册【${global.feConfigs.systemTitle}】账号，您的验证码是 ${code}。该验证码 5 分钟内有效，请勿泄露给他人。 </p>
  </div>
`
  };
};

export const ResetPasswordTemplate = ({ code }: { code: string }) => {
  return {
    subject: `【${global.feConfigs.systemTitle}】找回密码验证码`,
    html: `
  <div>
    <p> 您正在找回【${global.feConfigs.systemTitle}】账号，您的验证码是 ${code}。该验证码 5 分钟内有效，请勿泄露给他人。 </p>
  </div>
`
  };
};

export const NotificationBindTemplate = ({ code }: { code: string }) => {
  return {
    subject: `【${global.feConfigs.systemTitle}】绑定通知方式验证码`,
    html: `
  <div>
    <p> 您正在绑定【${global.feConfigs.systemTitle}】通知方式，您的验证码是 ${code}。该验证码 5 分钟内有效，请勿泄露给他人。 </p>
  </div>
`
  };
};

export const ManageRenameTemplate = ({
  name,
  managerName,
  newName
}: {
  name: string;
  managerName: string;
  newName: string;
}) => {
  return {
    subject: `${name} - 管理员改名通知`,
    html: `
  <div>
    <p>管理员 ${managerName} 将你在 ${name} 的用户名修改为 ${newName}。</p>
  </div>
`
  };
};

export const CustomTemplate = ({ title, content }: { title: string; content: string }) => {
  return {
    subject: title,
    html: content
  };
};
