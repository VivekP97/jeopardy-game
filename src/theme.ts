import { createTheme } from '@mui/material/styles'

declare module '@mui/material/styles' {
  interface Palette {
    board: Palette['primary']
  }
  interface PaletteOptions {
    board?: PaletteOptions['primary']
  }
}

export const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#0a1172',
      light: '#1a237e',
      dark: '#050854',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#ffd700',
      light: '#ffe44d',
      dark: '#c9a800',
      contrastText: '#0a1172',
    },
    background: {
      default: '#0d0d52',
      paper: '#1a1a8c',
    },
    text: {
      primary: '#ffffff',
      secondary: 'rgba(255, 255, 255, 0.7)',
    },
    board: {
      main: '#060ce9',
      light: '#2a30ff',
      dark: '#050aa0',
      contrastText: '#ffd700',
    },
  },
  shape: {
    borderRadius: 8,
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h4: {
      fontWeight: 600,
    },
    h5: {
      fontWeight: 600,
    },
    h6: {
      fontWeight: 700,
    },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          scrollbarColor: 'rgba(255, 215, 0, 0.4) rgba(0, 0, 0, 0.2)',
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundColor: '#050854',
          borderRight: '1px solid rgba(255, 215, 0, 0.2)',
        },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          '&.Mui-selected': {
            backgroundColor: 'rgba(255, 215, 0, 0.15)',
            borderLeft: '4px solid',
            borderLeftColor: 'secondary.main',
            '&:hover': {
              backgroundColor: 'rgba(255, 215, 0, 0.25)',
            },
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 600,
        },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: {
          alignItems: 'center',
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          fontWeight: 600,
        },
      },
    },
    MuiTextField: {
      defaultProps: {
        variant: 'outlined',
      },
    },
  },
})
