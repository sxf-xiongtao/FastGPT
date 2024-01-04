import React from 'react';
import { WidgetProps } from '@rjsf/utils';
import JsonEditor from '@fastgpt/web/components/common/Textarea/JsonEditor';

const CustomJsonEditor: React.FC<WidgetProps> = (props) => {
  return (
    <div className="flex flex-col mt-4 mb-8">
      <JsonEditor value={props.value} onChange={props.onChange} height={250} resize />
    </div>
  );
};

export default CustomJsonEditor;
