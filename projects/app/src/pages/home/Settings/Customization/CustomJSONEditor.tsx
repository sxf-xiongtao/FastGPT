import { WidgetProps } from '@rjsf/utils';
import JSONEditor from '@fastgpt/web/components/common/JSONEditor';

const CustomJSONEditor: React.FC<WidgetProps> = (props) => {
  return (
    <div className="flex flex-col border mt-4 mb-8">
      <JSONEditor value={props.value} onChange={props.onChange} />
    </div>
  );
};

export default CustomJSONEditor;
