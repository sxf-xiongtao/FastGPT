import { Flex, Switch, Input } from '@chakra-ui/react';
import React, { useEffect, useState } from 'react';

const ThirdPartyAccountItem = ({
  value,
  onChange,
  description
}: {
  value: string;
  onChange: (value: string) => void;
  description?: string;
}) => {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    setIsOpen(!!value);
  }, [value]);

  return (
    <Flex alignItems={'center'} h={8}>
      <Switch
        mr={8}
        isChecked={isOpen}
        onChange={() => {
          setIsOpen(!isOpen);
          onChange('');
        }}
      />
      {isOpen && (
        <Input
          w={'320px'}
          bg={'myGray.50'}
          value={value}
          placeholder={description}
          onChange={(e) => onChange(e.target.value)}
        />
      )}
    </Flex>
  );
};

export default React.memo(ThirdPartyAccountItem);
