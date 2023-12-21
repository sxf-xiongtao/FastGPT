import { Box } from '@chakra-ui/react';
import { useEffect, useState } from 'react';

export default function OneAPI({ menuList }: any) {
  const [oneAPIUrl, setOneAPIUrl] = useState('');

  useEffect(() => {
    const oneAPIItem = menuList.find((item: any) => item.pageId === 'oneAPI');
    if (oneAPIItem && oneAPIItem.oneAPIUrl) {
      const processedUrl = new URL(oneAPIItem.oneAPIUrl);
      const baseUrl = `${processedUrl.protocol}//${processedUrl.hostname}`;
      setOneAPIUrl(baseUrl);
    }
  }, [menuList]);

  return (
    <div className="w-[90%] m-auto h-[95%] pb-8">
      <Box
        className="bg-white mt-8 w-full h-full overflow-auto"
        style={{ boxShadow: '0px 2px 10px  rgba(76, 141, 235, 0.1)' }}
      >
        <iframe src={oneAPIUrl} title="OneAPI" width="100%" height="100%" />
      </Box>
    </div>
  );
}
