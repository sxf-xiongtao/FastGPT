import { useRouter } from 'next/router';
import { Box, BoxProps, Flex, LinkProps } from '@chakra-ui/react';
import MyIcon from '@fastgpt/web/components/common/Icon';

export default function SideBar() {
  const router = useRouter();

  const LIST = [
    {
      activeLink: '/dashboard',
      name: '数据总览',
      icon: 'common/data'
    },
    {
      activeLink: '/users',
      name: '用户信息',
      icon: 'support/user/userLight'
    },
    {
      activeLink: '/teams',
      name: '团队信息',
      icon: 'support/permission/publicLight'
    },
    {
      activeLink: '/pays',
      name: '账单管理',
      icon: 'support/bill/payRecordLight'
    },
    {
      activeLink: '/apps',
      name: '应用信息',
      icon: 'core/app/aiLight'
    },
    {
      activeLink: '/datasets',
      name: '知识库管理',
      icon: 'core/dataset/datasetLight'
    },
    {
      activeLink: '/inform',
      name: '消息通知管理',
      icon: 'support/user/informLight'
    },
    {
      activeLink: '/settings',
      name: '项目配置',
      icon: 'common/settingLight'
    }
    // {
    //   pageId: 'collapseButton',
    //   name: '',
    //   icon: null
    // }
  ];

  const itemStyles: BoxProps & LinkProps = {
    mb: 2,
    px: 10,
    py: 4,
    display: 'flex',
    alignItems: 'center',
    cursor: 'pointer',
    borderRadius: 'md'
  };
  const hoverStyle: LinkProps = {
    _hover: {
      bg: 'myGray.05',
      color: 'primary.600'
    }
  };

  return (
    <Box px={3} bg={'white'} borderRight={'1px'} borderRightColor={'borderColor.base'}>
      <Box textAlign={'center'} fontSize={'2xl'} color={'primary.600'} fontWeight={'bold'} py={4}>
        Admin
      </Box>
      {LIST.map((item) => {
        return (
          <Flex
            alignItems={'center'}
            key={item.activeLink}
            {...itemStyles}
            {...(item.activeLink.includes(router.pathname)
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
            onClick={() => {
              router.push(item.activeLink);
            }}
          >
            <MyIcon name={item.icon as any} w={'16px'} mr={2} />
            <div>{item.name}</div>
          </Flex>
        );
      })}
    </Box>
  );
}
