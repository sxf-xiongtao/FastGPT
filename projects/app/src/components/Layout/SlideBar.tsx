import { useRouter } from 'next/router';
import { Box, BoxProps, Flex, LinkProps } from '@chakra-ui/react';
import MyIcon from '@fastgpt/web/components/common/Icon';
import { ChevronDownIcon, ChevronUpIcon } from '@chakra-ui/icons';
import { useState, useEffect } from 'react';

export default function SideBar({ showTitle }: { showTitle?: boolean }) {
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
    mb: 2,
    px: 10,
    py: 4,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    cursor: 'pointer',
    borderRadius: 'md'
  };
  const hoverStyle: LinkProps = {
    _hover: {
      bg: 'myGray.05',
      color: 'primary.600'
    }
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

  useEffect(() => {
    const currentPath = window.location.pathname;
    const activeItem = LIST.find((item) => currentPath.startsWith(item.activeLink));
    if (activeItem && activeItem.subItems) {
      setExpandItems([activeItem.activeLink]);
    } else {
      setExpandItems([]);
    }
  }, []);

  return (
    <Box
      px={3}
      bg={'white'}
      borderRight={'1px'}
      borderRightColor={'borderColor.base'}
      overflow={'auto'}
    >
      {showTitle ? (
        <Box textAlign={'center'} fontSize={'2xl'} color={'primary.600'} fontWeight={'bold'} py={4}>
          Admin
        </Box>
      ) : (
        <Box py={1}></Box>
      )}
      {LIST.map((item) => {
        return (
          <Box key={item.activeLink}>
            <Flex
              alignItems={'center'}
              key={item.activeLink}
              {...itemStyles}
              {...(item.activeLink === router.pathname
                ? {
                    color: 'white !important',
                    bg: 'primary.600 !important'
                  }
                : {
                    color: 'myGray.500',
                    bg: 'transparent',
                    _hover: {
                      bg: 'rgba(255,255,255,0.9)'
                    }
                  })}
              _hover={hoverStyle}
              onClick={() => handleItemClick(item)}
            >
              <Flex w={'full'} alignItems={'center'} justifyContent={'space-between'}>
                <Flex>
                  <MyIcon name={item.icon as any} w={'16px'} mr={2} />
                  <Box>{item.name}</Box>
                </Flex>
                {item.subItems ? (
                  expandItems.includes(item.activeLink) ? (
                    <ChevronUpIcon ml={6} />
                  ) : (
                    <ChevronDownIcon ml={6} />
                  )
                ) : null}
              </Flex>
            </Flex>
            {item.subItems && expandItems.includes(item.activeLink) && (
              <Box>
                {item.subItems.map((subItem) => (
                  <Flex
                    key={subItem.activeLink}
                    {...itemStyles}
                    {...(subItem.activeLink === router.pathname
                      ? {
                          color: 'white !important',
                          bg: 'primary.600 !important'
                        }
                      : {
                          color: 'myGray.500',
                          bg: 'transparent',
                          _hover: {
                            bg: 'rgba(255,255,255,0.9)'
                          }
                        })}
                    _hover={hoverStyle}
                    onClick={() => handleSubItemClick(subItem)}
                  >
                    <Flex>
                      <Box ml={6} fontSize={'14px'}>
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
    </Box>
  );
}
