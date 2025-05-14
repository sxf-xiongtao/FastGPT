import { useRouter } from 'next/router';
import { Box, BoxProps, Flex, LinkProps } from '@chakra-ui/react';
import MyIcon from '@fastgpt/web/components/common/Icon';
import { useMemo, useState } from 'react';
import { useSystemStore } from '@/web/common/system/useSystemStore';

const itemStyles: BoxProps & LinkProps = {
  h: 9,
  px: 3,
  mb: 0.5,
  fontSize: '14px',
  fontWeight: 'medium',
  display: 'flex',
  alignItems: 'center',
  cursor: 'pointer',
  borderRadius: 'xs',
  _hover: {
    bg: 'primary.50'
  }
};

export default function Navbar({ onClose }: { onClose?: () => void }) {
  const router = useRouter();
  const [expandItems, setExpandItems] = useState<string[]>([]);
  const { licenseData } = useSystemStore();

  const LIST = useMemo(
    () => [
      {
        activeLink: '/dashboard',
        name: '数据面板',
        icon: 'common/overviewLight'
      },
      {
        activeLink: '/inform',
        name: '通知管理',
        icon: 'support/user/informLight'
      },
      {
        activeLink: '/log',
        name: '日志管理',
        icon: 'core/app/logsLight'
      },
      {
        activeLink: '/users',
        name: '用户管理',
        icon: 'common/administrator',
        subItems: [
          {
            activeLink: '/users/users',
            icon: 'common/userInfo',
            name: '用户信息'
          },
          {
            activeLink: '/users/teams',
            icon: 'support/team/group',
            name: '团队管理'
          },
          ...(licenseData?.functions?.pay
            ? [
                {
                  activeLink: '/users/plans',
                  icon: 'support/account/plans',
                  name: '套餐管理'
                },
                {
                  activeLink: '/users/pays',
                  icon: 'support/bill/payRecordLight',
                  name: '支付记录'
                },
                {
                  activeLink: '/users/invoice',
                  icon: 'common/billing',
                  name: '开票管理'
                }
              ]
            : [])
        ]
      },
      {
        activeLink: '/resources',
        name: '资源管理',
        icon: 'book',
        subItems: [
          {
            activeLink: '/resources/apps',
            name: '应用管理',
            icon: 'core/app/aiLightSmall'
          },
          {
            activeLink: '/resources/datasets',
            name: '知识库管理',
            icon: 'core/dataset/datasetLightSmall'
          }
        ]
      },
      {
        activeLink: '/settings/config',
        name: '系统配置',
        icon: 'common/settingLight',
        subItems: [
          {
            activeLink: '/settings/config/basic',
            name: '基础配置',
            icon: 'core/workflow/debugResult'
          },
          {
            activeLink: '/settings/config/feature',
            name: '功能清单',
            icon: 'common/check'
          },
          {
            activeLink: '/settings/config/model',
            name: '安全审查',
            icon: 'common/model'
          },
          {
            activeLink: '/settings/config/thirdParty',
            name: '第三方提供商',
            icon: 'common/thirdParty'
          },
          {
            activeLink: '/settings/config/user',
            name: '用户配置',
            icon: 'support/user/userLightSmall'
          },
          ...(licenseData?.functions?.pay
            ? [
                {
                  activeLink: '/settings/config/pay',
                  name: '套餐 & 充值',
                  icon: 'support/bill/priceLight'
                }
              ]
            : [])
        ]
      },
      ...(licenseData?.functions?.customTemplates
        ? [
            {
              activeLink: '/settings/templates',
              name: '模板 & 工具',
              icon: 'common/layer',
              subItems: [
                {
                  activeLink: '/settings/templates/app',
                  name: '模板市场',
                  icon: 'common/templateMarket'
                },
                {
                  activeLink: '/settings/templates/toolkit',
                  name: '工具箱',
                  icon: 'common/toolkit'
                }
              ]
            }
          ]
        : [])
    ],
    [licenseData]
  );

  const handleItemClick = (item: any) => {
    if (item.subItems) {
      if (expandItems.includes(item.activeLink)) {
        setExpandItems(expandItems.filter((i) => i !== item.activeLink));
      } else {
        setExpandItems([...expandItems, item.activeLink]);
      }
    } else {
      router.push(item.activeLink);
      onClose?.();
    }
  };

  const handleSubItemClick = (subItem: any) => {
    router.push(subItem.activeLink);
    onClose?.();
  };

  return (
    <>
      {LIST.map((item) => {
        const isActive = router.pathname.startsWith(item.activeLink);

        return (
          <Box key={item.activeLink}>
            <Flex
              alignItems={'center'}
              key={item.activeLink}
              {...itemStyles}
              {...(isActive && {
                color: 'primary.600',
                bg: 'primary.50'
              })}
              onClick={() => handleItemClick(item)}
            >
              <Flex>
                <MyIcon
                  name={item.icon as any}
                  w={'18px'}
                  mr={2}
                  color={isActive ? 'primary.600' : 'myGray.500'}
                />
                <Box>{item.name}</Box>
              </Flex>
              <Box flex={1} />
              {item.subItems ? (
                expandItems.includes(item.activeLink) || isActive ? (
                  <MyIcon name={'core/chat/chevronUp'} w={'16px'} />
                ) : (
                  <MyIcon name={'core/chat/chevronDown'} w={'16px'} />
                )
              ) : null}
            </Flex>
            {item.subItems && (expandItems.includes(item.activeLink) || isActive) && (
              <Box ml={4}>
                {item.subItems.map((subItem) => (
                  <Flex
                    key={subItem.activeLink}
                    {...itemStyles}
                    {...(router.pathname.startsWith(subItem.activeLink)
                      ? {
                          color: 'primary.600',
                          bg: 'primary.50'
                        }
                      : {})}
                    onClick={() => handleSubItemClick(subItem)}
                  >
                    <Flex>
                      <MyIcon
                        name={subItem.icon as any}
                        w={'18px'}
                        color={
                          router.pathname.startsWith(subItem.activeLink)
                            ? 'primary.600'
                            : 'myGray.500'
                        }
                      />
                      <Box ml={2} fontSize={'14px'}>
                        {subItem.name}
                      </Box>
                    </Flex>
                  </Flex>
                ))}
              </Box>
            )}
          </Box>
        );
      })}
    </>
  );
}
