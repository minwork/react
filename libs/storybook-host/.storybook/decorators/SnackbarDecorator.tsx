import type { ComponentType, FC } from 'react';
import { SnackbarProvider } from 'notistack';

export const SnackbarDecorator = (Story: ComponentType, context: object) => {
  return (
    <SnackbarProvider maxSnack={10} autoHideDuration={3000}>
      <Story {...context} />
    </SnackbarProvider>
  );
};
