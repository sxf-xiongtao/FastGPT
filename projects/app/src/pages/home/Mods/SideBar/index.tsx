import clsx from 'clsx';
import styles from './index.module.scss';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Icons from '@/components/Icons';

export default function SideBar({ menuListData }: { menuListData: string[] }) {
  const router = useRouter();
  const pageId = router.asPath.split('/').pop();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    const sidebarCollapsed = localStorage.getItem('sidebarCollapsed') === 'true';
    setSidebarCollapsed(sidebarCollapsed);
  }, []);

  const LIST = [
    {
      pageId: 'dashboard',
      name: '仪表盘',
      icon: <Icons type="dashboard" />
    },
    {
      pageId: 'users',
      name: '用户信息',
      icon: <Icons type="user" />
    },
    {
      pageId: 'teams',
      name: '团队信息',
      icon: <Icons type="team" />
    },
    {
      pageId: 'pays',
      name: '账单管理',
      icon: <Icons type="pay" />
    },
    {
      pageId: 'apps',
      name: '应用信息',
      icon: <Icons type="app" />
    },
    {
      pageId: 'datasets',
      name: '知识库管理',
      icon: <Icons type="dataset" />
    },
    {
      pageId: 'oneAPI',
      name: 'OneAPI 管理',
      icon: <Icons type="api" />
    }
  ];

  const BOTTOM_LIST = [
    {
      pageId: 'settings',
      name: '项目配置',
      icon: <Icons type="config" />
    },
    {
      pageId: 'collapseButton',
      name: '',
      icon: null
    }
  ];

  const handleToggleSidebar = () => {
    localStorage.setItem('sidebarCollapsed', JSON.stringify(!sidebarCollapsed));
    setSidebarCollapsed(!sidebarCollapsed);
  };

  return (
    <div
      className={clsx('mt-[60px] flex flex-col justify-between w-64 relative', {
        [styles.collapsed]: sidebarCollapsed
      })}
      style={{ boxShadow: '0px 2px 10px  rgba(76, 141, 235, 0.1)' }}
    >
      {menuListData &&
        [LIST, BOTTOM_LIST].map((items, index) => {
          return (
            <div key={index}>
              {items.map((item) => {
                if (item.pageId !== 'collapseButton' && menuListData.includes(item.pageId)) {
                  return (
                    <div
                      key={item.pageId}
                      className={clsx(
                        styles.icon,
                        {
                          [styles.current]: pageId === item.pageId
                        },
                        sidebarCollapsed ? 'flex justify-center' : ''
                      )}
                      onClick={() => {
                        router.replace(`/home/${item.pageId}`);
                      }}
                    >
                      <div className={clsx(!sidebarCollapsed ? 'ml-10 mr-6' : '')}>{item.icon}</div>
                      {!sidebarCollapsed && <div>{item.name}</div>}
                    </div>
                  );
                } else if (item.pageId === 'collapseButton') {
                  return (
                    <span
                      key={item.pageId}
                      className={clsx(
                        styles.icon,
                        {
                          [styles.current]: pageId === item.pageId
                        },
                        'flex justify-center'
                      )}
                      onClick={handleToggleSidebar}
                    >
                      {sidebarCollapsed ? <Icons type="expand" /> : <Icons type="collapse" />}
                    </span>
                  );
                }
              })}
            </div>
          );
        })}
    </div>
  );
}
