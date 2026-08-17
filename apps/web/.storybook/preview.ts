import type { Preview } from '@storybook/react';
// Load global styles and theme CSS variables
import '../src/app/styles/globals.css';

const preview: Preview = {
  parameters: {
    layout: 'centered',
    controls: { matchers: { color: /(background|color)$/i, date: /Date$/i } },
  },
};

export default preview;
