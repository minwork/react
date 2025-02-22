import type { Decorator } from '@storybook/react';
import { Stack } from '@mui/material';

export const ContentDecorator: Decorator = (Story, context) => {
  return (
    <Stack
      width="100vw"
      height={context.viewMode === 'docs' ? 500 : '100vh'}
      maxWidth={1}
      maxHeight={1}
      alignItems="center"
      justifyContent="center"
      sx={{
        perspective: 1000,
      }}
    >
      <Story {...context} />
    </Stack>
  );
};
