import { Box, Center } from '@chakra-ui/react';
import { useEffect, useState } from 'react';
import { TMenu } from '../[pageId]';

export default function OneAPI({ menuList }: { menuList: TMenu[] }) {
  const [oneAPIUrl, setOneAPIUrl] = useState('');

  useEffect(() => {
    const oneAPIItem = menuList.find((item: TMenu) => item.pageId === 'oneAPI');
    if (oneAPIItem && oneAPIItem.oneAPIUrl) {
      const processedUrl = new URL(oneAPIItem.oneAPIUrl);
      const baseUrl = `${processedUrl.protocol}//${processedUrl.hostname}`;
      setOneAPIUrl(baseUrl);
    }
  }, [menuList]);
  console.log(oneAPIUrl);

  return (
    <div className="w-[90%] m-auto h-[95%] pb-8">
      <Box
        className="bg-white mt-8 w-full h-full overflow-auto"
        style={{ boxShadow: '0px 2px 10px  rgba(76, 141, 235, 0.1)' }}
      >
        {oneAPIUrl ? (
          <iframe src={oneAPIUrl} title="OneAPI" width="100%" height="100%" />
        ) : (
          <Center className="h-full">未设置 OneAPI 地址</Center>
        )}
      </Box>
    </div>
  );
}
