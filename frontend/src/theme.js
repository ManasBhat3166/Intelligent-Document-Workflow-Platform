import { createTheme } from '@mui/material/styles';

const theme = createTheme({
    palette: {
        primary: {
            main: '#1E2761',
            light: '#4D5BA8',
            dark: '#121A47',
            contrastText: '#FFFFFF',
        },

        secondary: {
            main: '#00A896',
            light: '#33B8AA',
            dark: '#007D70',
            contrastText: '#FFFFFF',
        },

        background: {
            default: '#F4F6FA',
            paper: '#FFFFFF',
        },

        success: {
            main: '#2E7D32',
        },

        warning: {
            main: '#ED6C02',
        },

        error: {
            main: '#D32F2F',
        },

        text: {
            primary: '#1F2937',
            secondary: '#6B7280',
        },
    },

    typography: {
        fontFamily: '"Segoe UI", Arial, sans-serif',

        h4: {
            fontWeight: 700,
        },

        h5: {
            fontWeight: 700,
        },

        h6: {
            fontWeight: 700,
        },

        subtitle1: {
            fontWeight: 600,
        },

        button: {
            fontWeight: 600,
        },
    },

    shape: {
        borderRadius: 12,
    },

    components: {
        MuiCssBaseline: {
            styleOverrides: {
                body: {
                    margin: 0,
                    backgroundColor: '#F4F6FA',
                },
            },
        },

        MuiPaper: {
            styleOverrides: {
                root: {
                    backgroundImage: 'none',
                    boxShadow: '0 2px 12px rgba(0, 0, 0, 0.05)',
                },
            },
        },

        MuiButton: {
            styleOverrides: {
                root: {
                    textTransform: 'none',
                    fontWeight: 600,
                    borderRadius: 9,
                    boxShadow: 'none',
                },

                contained: {
                    '&:hover': {
                        boxShadow: '0 4px 12px rgba(30, 39, 97, 0.20)',
                    },
                },
            },
        },

        MuiTextField: {
            defaultProps: {
                variant: 'outlined',
            },
        },

        MuiChip: {
            styleOverrides: {
                root: {
                    fontWeight: 600,
                },
            },
        },

        MuiTableCell: {
            styleOverrides: {
                head: {
                    fontWeight: 700,
                    color: '#4B5563',
                    backgroundColor: '#F8F9FC',
                },
            },
        },
    },
});

export default theme;