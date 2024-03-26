import React from 'react';
import { WidgetProps } from '@rjsf/utils';
import JSONEditor from '@fastgpt/web/components/common/Textarea/JsonEditor';

const CustomJsonEditor: React.FC<WidgetProps> = (props) => {
  return (
    <div className="mt-4 mb-8 w-[88%]">
      <JSONEditor value={props.value} onChange={props.onChange} defaultHeight={250} resize />
    </div>
  );
};

export default CustomJsonEditor;
