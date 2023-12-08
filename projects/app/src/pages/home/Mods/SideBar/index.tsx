import clsx from 'clsx';
import styles from './index.module.scss';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Icons from '@/components/Icons';

export default function SideBar() {
  const router = useRouter();
  const pageId = router.asPath.split('/').pop();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  useEffect(() => {
    const sidebarCollapsed = localStorage.getItem('sidebarCollapsed') === 'true';
    setSidebarCollapsed(sidebarCollapsed);
  }, []);

  const BOTTOM_LIST = [
    {
      pageId: 'settings',
      name: '项目配置',
      icon: <Icons type="config" />
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
      {[BOTTOM_LIST].map((items, index) => {
        return (
          <div key={index}>
            {items.map((item) => {
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
            })}
          </div>
        );
      })}
      <span
        className={clsx(
          'absolute top-1/2 -translate-y-1/2 cursor-pointer opacity-40 hover:opacity-90 right-0'
        )}
        onClick={handleToggleSidebar}
      >
        {sidebarCollapsed ? <Icons type="expand" /> : <Icons type="collapse" />}
      </span>
    </div>
  );
}
