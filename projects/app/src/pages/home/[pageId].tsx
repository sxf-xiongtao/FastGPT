import Apps from './Apps';
import HeadBar from './Mods/HeadBar';
import SideBar from './Mods/SideBar';
import { Settings } from './Settings';
import { getAllPageIds, getPageData } from '@/utils/web/getPageData';
import Users from './Users';
import DashBoard from './Dashboard';
import Pays from './Pays';
import Datasets from './Datasets';
import Teams from './Teams';
import OneAPI from './OneAPI';
import { useState } from 'react';
import { getInitMenuConfig } from '@/web/common/system/api';
import { useQuery } from '@tanstack/react-query';

export async function getStaticPaths() {
  const paths = getAllPageIds();
  return {
    paths,
    fallback: false
  };
}

export async function getStaticProps({ params }: any) {
  const pageData = await getPageData(params.pageId);
  return {
    props: {
      pageData
    }
  };
}

export type TMenu = {
  pageId: string;
  oneAPIUrl?: string;
};

const Home = ({ pageData }: any) => {
  const [menuList, setMenuList] = useState<Array<TMenu>>([]);
  const [menuListData, setMenuListData] = useState<Array<string>>([]);

  useQuery(['getInitMenuConfig'], () => getInitMenuConfig(), {
    onSuccess: (data: { menuList: [] }) => {
      setMenuList(data?.menuList);
      setMenuListData(data?.menuList.map((item: TMenu) => item.pageId));
    }
  });

  return (
    <div className="bg-white h-screen flex">
      <HeadBar />
      <SideBar menuListData={menuListData} />
      <div className="flex-1 overflow-auto mt-[60px] bg-[#F9FAFF]">
        {[
          {
            pageId: 'dashboard',
            component: DashBoard
          },
          {
            pageId: 'users',
            component: Users
          },
          {
            pageId: 'teams',
            component: Teams
          },
          {
            pageId: 'pays',
            component: Pays
          },
          {
            pageId: 'apps',
            component: Apps
          },
          {
            pageId: 'datasets',
            component: Datasets
          },
          {
            pageId: 'oneAPI',
            component: OneAPI
          },
          {
            pageId: 'settings',
            component: Settings
          }
        ].map((item) =>
          pageData.pageId === item.pageId && menuListData.includes(item.pageId) ? (
            <item.component key={item.pageId} menuList={menuList} />
          ) : null
        )}
      </div>
    </div>
  );
};

export default Home;
