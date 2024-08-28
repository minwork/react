import { Stack } from '@mui/material';
import type { ComponentType } from 'react';

export const ContentDecorator = (Story: ComponentType, context: object) => {
  return (
    <Stack
      width="100vw"
      height="100vh"
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
