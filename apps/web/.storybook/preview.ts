import type { Preview } from '@storybook/react';
// Подключаем глобальные стили и CSS-переменные темы
import '../src/app/styles/globals.css';

const preview: Preview = {
  parameters: {
    layout: 'centered',
    controls: { matchers: { color: /(background|color)$/i, date: /Date$/i } },
  },
};

export default preview;
