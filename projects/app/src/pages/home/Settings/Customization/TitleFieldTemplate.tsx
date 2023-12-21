import { extractThirdLevelTitles } from '@/utils/web/extractTitles';
import { Divider } from '@chakra-ui/react';
import { useCallback, useEffect, useState } from 'react';

const TitleFieldTemplate: React.FC<any> = (props) => {
  const { title } = props;
  const [titles, setTitles] = useState<string[]>([]);

  const fetchInitConfig = useCallback(async () => {
    try {
      const response = await fetch('/api/system/getInitData');
      const config = await response.json();
      setTitles(extractThirdLevelTitles(config));
    } catch (error) {
      console.error(error);
    }
  }, []);

  useEffect(() => {
    fetchInitConfig();
  }, [fetchInitConfig]);

  return (
    <div id={title}>
      {titles.includes(title) ? (
        <>
          {titles.indexOf(title) !== 0 && <Divider className="my-16" />}
          <div className="text-[18px] text-[#5283ff] font-semibold pb-4">{title}</div>
        </>
      ) : (
        <>
          <div className="text-[16px] text-blue-500 pb-2">{title}</div>
        </>
      )}
    </div>
  );
};

export default TitleFieldTemplate;
