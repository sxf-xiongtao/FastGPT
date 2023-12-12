import { Switch } from '@chakra-ui/react';
import { WidgetProps } from '@rjsf/utils';

const CustomCheckbox: React.FC<WidgetProps> = (props) => {
  return (
    <div className="flex items-center w-1/2 justify-between pb-8">
      <span className="text-md h-full items-center flex">{props.label}</span>
      <Switch
        isChecked={props.value}
        onChange={() => props.onChange(!props.value)}
        className="ml-4"
        size={'lg'}
      />
    </div>
  );
};

export default CustomCheckbox;
