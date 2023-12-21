import { WidgetProps } from '@rjsf/utils';
import Editor from '@monaco-editor/react';

const CustomImage: React.FC<WidgetProps> = (props) => {
  const options = {
    lineNumbers: 'off',
    guides: {
      indentation: false
    },
    automaticLayout: true,
    minimap: {
      enabled: false
    },
    scrollbar: {
      verticalScrollbarSize: 4,
      horizontalScrollbarSize: 8,
      alwaysConsumeMouseWheel: false
    },
    lineNumbersMinChars: 0,
    fontSize: 12,
    scrollBeyondLastLine: false,
    folding: false,
    overviewRulerBorder: false,
    tabSize: 2
  };

  return (
    <div className="mt-4 mb-8 border">
      <Editor
        height={200}
        defaultLanguage="json"
        value={props.value}
        options={options as any}
        onChange={props.onChange}
        theme={'JSONEditorTheme'}
        beforeMount={(monaco) => {
          monaco?.editor.defineTheme('JSONEditorTheme', {
            base: 'vs',
            inherit: true,
            rules: [],
            colors: {
              'editor.background': '#ffffff00',
              'editorLineNumber.foreground': '#aaa',
              'editorOverviewRuler.border': '#ffffff00',
              'editor.lineHighlightBackground': '#F7F8FA',
              'scrollbarSlider.background': '#E8EAEC',
              'editorIndentGuide.activeBackground': '#ddd',
              'editorIndentGuide.background': '#eee'
            }
          });
        }}
      />
    </div>
  );
};

export default CustomImage;
