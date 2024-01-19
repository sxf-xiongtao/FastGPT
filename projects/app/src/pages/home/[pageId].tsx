import Apps from './Apps';
import HeadBar from './components/HeadBar';
import SideBar from './components/SideBar';
import { Settings } from './Settings';
import { getAllPageIds, getPageData } from '@/web/common/system/utils';
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
};

const Home = ({ pageData }: any) => {
  const [menuListData, setMenuListData] = useState<Array<string>>([]);
  const [oneAPIUrl, setOneAPIUrl] = useState('');

  useQuery(['getInitMenuConfig'], () => getInitMenuConfig(), {
    onSuccess: (data: any) => {
      setMenuListData(data?.config.menuList.map((item: TMenu) => item.pageId));
      setOneAPIUrl(data?.oneAPIUrl);
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
            <item.component key={item.pageId} oneAPIUrl={oneAPIUrl} />
          ) : null
        )}
      </div>
    </div>
  );
};

export default Home;
