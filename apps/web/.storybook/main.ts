import type { StorybookConfig } from '@storybook/react-vite';

// Storybook on Vite: stories next to UI components
const config: StorybookConfig = {
  stories: ['../src/**/*.stories.@(ts|tsx)'],
  addons: ['@storybook/addon-essentials', '@storybook/addon-interactions'],
  framework: '@storybook/react-vite',
};

export default config;
