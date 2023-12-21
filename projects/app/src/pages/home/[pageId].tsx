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
import { useEffect, useState } from 'react';

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

const Home = ({ pageData }: any) => {
  const [menuList, setMenuList] = useState<any>([]);
  const [menuListData, setMenuListData] = useState<any>([]);

  const fetchInitConfig = async () => {
    try {
      const response = await fetch('/api/system/getInitMenu');
      const config = await response.json();
      setMenuList(config.menuList);
      setMenuListData(config.menuList.map((item: any) => item.pageId));
    } catch (error) {
      console.log(error);
    } finally {
      // setIsSchemaLoading(false);
    }
  };

  useEffect(() => {
    fetchInitConfig();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
            pageId: 'apps',
            component: Apps
          },
          {
            pageId: 'pays',
            component: Pays
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
