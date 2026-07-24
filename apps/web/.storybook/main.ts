import type { StorybookConfig } from '@storybook/react-vite';

// Storybook на Vite: stories рядом с UI-компонентами
const config: StorybookConfig = {
  stories: ['../src/**/*.stories.@(ts|tsx)'],
  addons: ['@storybook/addon-essentials', '@storybook/addon-interactions'],
  framework: '@storybook/react-vite',
};

export default config;
