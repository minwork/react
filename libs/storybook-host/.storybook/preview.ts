import type { Preview } from '@storybook/react';
import { ContentDecorator } from './decorators/Content.decorator';
import { ThemeDecorator } from './decorators/Theme.decorator';
import { SnackbarDecorator } from './decorators/SnackbarDecorator';

const preview: Preview = {
  decorators: [ThemeDecorator, ContentDecorator, SnackbarDecorator],

  parameters: {
    layout: 'fullscreen',
    controls: {
      expanded: true,
      sort: 'requiredFirst',
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/,
      },
    },
  },

  // tags: ['autodocs'],

  initialGlobals: {
    backgrounds: '#333',
  },
};

export default preview;
