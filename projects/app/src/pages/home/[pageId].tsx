import Apps from './Apps';
import HeadBar from './Mods/HeadBar';
import SideBar from './Mods/SideBar';
import { Settings } from './Settings';
import { getAllPageIds, getPageData } from '@/utils/web/getPageData';
import Users from './Users';
import DashBoard from './Dashboard';
import Pays from './Pays';
import Datasets from './Datasets';

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
  return (
    <div className="bg-white h-screen flex">
      <HeadBar />
      <SideBar />
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
            pageId: 'settings',
            component: Settings
          }
        ].map((item) =>
          pageData.pageId === item.pageId ? <item.component key={item.pageId} /> : null
        )}
      </div>
    </div>
  );
};

export default Home;
