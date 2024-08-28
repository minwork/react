import { CssBaseline, ThemeProvider } from '@mui/material';
import type { ComponentType } from 'react';
import { theme } from '../../src/lib/theme';

export const ThemeDecorator = (Story: ComponentType, context: object) => {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Story {...context} />
    </ThemeProvider>
  );
};
