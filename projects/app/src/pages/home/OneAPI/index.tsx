import { Box, Center } from '@chakra-ui/react';
import { useEffect, useState } from 'react';

export default function OneAPI({ oneAPIUrl }: { oneAPIUrl: string }) {
  const [url, setUrl] = useState('');

  useEffect(() => {
    if (!oneAPIUrl) return;
    const processedUrl = new URL(oneAPIUrl);
    const baseUrl = `${processedUrl.protocol}//${processedUrl.hostname}`;
    setUrl(baseUrl);
  }, [oneAPIUrl]);

  return (
    <div className="w-[90%] m-auto h-[95%] pb-8">
      <Box
        className="bg-white mt-8 w-full h-full overflow-auto"
        style={{ boxShadow: '0px 2px 10px  rgba(76, 141, 235, 0.1)' }}
      >
        {url ? (
          <iframe src={url} title="OneAPI" width="100%" height="100%" />
        ) : (
          <Center className="h-full">未设置 OneAPI 地址</Center>
        )}
      </Box>
    </div>
  );
}
