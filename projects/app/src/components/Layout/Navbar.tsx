import { useRouter } from 'next/router';
import { Box, BoxProps, Flex, HStack, LinkProps } from '@chakra-ui/react';
import MyIcon from '@fastgpt/web/components/common/Icon';
import { ChevronDownIcon, ChevronUpIcon } from '@chakra-ui/icons';
import { useState } from 'react';

export default function Navbar() {
  const router = useRouter();
  const [expandItems, setExpandItems] = useState<string[]>([]);

  const LIST = [
    {
      activeLink: '/dashboard',
      name: '数据面板',
      icon: 'common/data'
    },
    {
      activeLink: '/inform',
      name: '通知管理',
      icon: 'support/user/informLight'
    },
    {
      activeLink: '/users',
      name: '用户管理',
      icon: 'support/user/userLight',
      subItems: [
        {
          activeLink: '/users/users',
          icon: 'support/team/memberLight',
          name: '用户信息'
        },
        {
          activeLink: '/users/teams',
          icon: 'support/permission/publicLight',
          name: '团队管理'
        },
        {
          activeLink: '/users/plans',
          icon: 'support/bill/priceLight',
          name: '套餐管理'
        },
        {
          activeLink: '/users/pays',
          icon: 'support/bill/payRecordLight',
          name: '支付记录'
        }
      ]
    },
    {
      activeLink: '/resources',
      name: '资源管理',
      icon: 'common/courseLight',
      subItems: [
        {
          activeLink: '/resources/apps',
          name: '应用管理',
          icon: 'core/app/aiLight'
        },
        {
          activeLink: '/resources/datasets',
          name: '知识库管理',
          icon: 'core/dataset/datasetLight'
        }
      ]
    },
    {
      activeLink: '/settings',
      name: '系统配置',
      icon: 'common/settingLight'
    }
  ];

  const itemStyles: BoxProps & LinkProps = {
    py: 3,
    mb: 2,
    pl: 6,
    pr: 3,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    cursor: 'pointer',
    borderRadius: 'md'
  };

  const handleItemClick = (item: any) => {
    if (item.subItems) {
      if (expandItems.includes(item.activeLink)) {
        setExpandItems(expandItems.filter((i) => i !== item.activeLink));
      } else {
        setExpandItems([...expandItems, item.activeLink]);
      }
    } else {
      router.push(item.activeLink);
    }
  };

  const handleSubItemClick = (subItem: any) => {
    router.push(subItem.activeLink);
  };

  return (
    <>
      {LIST.map((item) => {
        return (
          <Box key={item.activeLink}>
            <Flex
              alignItems={'center'}
              key={item.activeLink}
              {...itemStyles}
              {...(router.pathname.startsWith(item.activeLink)
                ? {
                    color: 'primary.600'
                  }
                : {
                    _hover: {
                      bg: 'rgba(255,255,255,0.9)'
                    }
                  })}
              onClick={() => handleItemClick(item)}
            >
              <HStack spacing={3} justifyContent={'space-between'}>
                <Flex>
                  <MyIcon name={item.icon as any} w={'16px'} mr={2} />
                  <Box>{item.name}</Box>
                </Flex>
                {item.subItems ? (
                  expandItems.includes(item.activeLink) ? (
                    <ChevronUpIcon fontSize={'1.5rem'} />
                  ) : (
                    <ChevronDownIcon fontSize={'1.5rem'} />
                  )
                ) : null}
              </HStack>
            </Flex>
            {item.subItems &&
              (expandItems.includes(item.activeLink) ||
                router.pathname.startsWith(item.activeLink)) && (
                <Box ml={4}>
                  {item.subItems.map((subItem) => (
                    <Flex
                      key={subItem.activeLink}
                      {...itemStyles}
                      {...(router.pathname.startsWith(subItem.activeLink)
                        ? {
                            color: 'primary.600',
                            boxShadow:
                              '0px 0px 1px 0px rgba(19, 51, 107, 0.08), 0px 4px 4px 0px rgba(19, 51, 107, 0.05)',
                            bg: 'white'
                          }
                        : {
                            _hover: {
                              bg: 'rgba(255,255,255,0.9)'
                            }
                          })}
                      onClick={() => handleSubItemClick(subItem)}
                    >
                      <Flex>
                        <MyIcon name={subItem.icon as any} w={'14px'} />
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
