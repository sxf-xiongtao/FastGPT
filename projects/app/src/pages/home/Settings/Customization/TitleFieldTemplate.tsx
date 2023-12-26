import { extractThirdLevelTitles } from '@/utils/web/extractTitles';
import { Divider } from '@chakra-ui/react';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { getInitFormConfig } from '../api';

const TitleFieldTemplate: React.FC<any> = (props) => {
  const { title } = props;
  const [titles, setTitles] = useState<string[]>([]);

  useQuery(['getInitFormConfig'], () => getInitFormConfig(), {
    onSuccess: (data) => {
      setTitles(extractThirdLevelTitles(data));
    }
  });

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
