import { createTheme } from '@mui/material';

const fallbackFontFamily = [
  '-apple-system',
  'BlinkMacSystemFont',
  '"Segoe UI"',
  'Roboto',
  '"Helvetica Neue"',
  'Arial',
  'sans-serif',
  '"Apple Color Emoji"',
  '"Segoe UI Emoji"',
  '"Segoe UI Symbol"',
];

export const fontFamily = ['Montserrat', ...fallbackFontFamily].join(', ');

export const theme = createTheme({
  palette: {
    mode: 'light',
    background: {
      default: '#f6f6f6',
      paper: '#FFFFFF',
    },
    text: {
      primary: '#212121',
      secondary: '#636363',
    },
    primary: {
      main: '#FFCD00',
    },
  },
  typography: {
    fontFamily: fontFamily,
  },
});
