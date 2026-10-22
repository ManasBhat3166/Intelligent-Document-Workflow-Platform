import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
    Box,
    TextField,
    Button,
    Typography,
    Paper,
    Alert,
    Stack,
    Divider
} from '@mui/material';
import {
    DescriptionOutlined,
    AutoAwesome,
    SecurityOutlined,
    ArrowForward
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { getApiErrorMessage } from '../utils/apiError';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        try {
            await login(email, password);
            navigate('/dashboard');
        } catch (err) {
            console.error('Login failed:', err);

            setError(
                getApiErrorMessage(
                    err,
                    'Login failed. Check your email and password.'
                )
            );
        }
    };

    return (
        <Box
            sx={{
                minHeight: '100vh',
                display: 'flex',
                background:
                    'linear-gradient(135deg, #121A47 0%, #1E2761 55%, #25357D 100%)',
                p: { xs: 2, md: 4 }
            }}
        >
            <Box
                sx={{
                    width: '100%',
                    maxWidth: 1180,
                    margin: 'auto',
                    display: 'grid',
                    gridTemplateColumns: { xs: '1fr', md: '1.15fr 0.85fr' },
                    minHeight: { md: 680 },
                    borderRadius: 4,
                    overflow: 'hidden',
                    boxShadow: '0 25px 70px rgba(0,0,0,0.25)',
                    backgroundColor: '#fff'
                }}
            >
                {/* LEFT BRAND PANEL */}
                <Box
                    sx={{
                        display: { xs: 'none', md: 'flex' },
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        p: 6,
                        color: '#fff',
                        background:
                            'linear-gradient(145deg, #121A47 0%, #1E2761 65%, #007D70 150%)',
                        position: 'relative',
                        overflow: 'hidden'
                    }}
                >
                    <Box
                        sx={{
                            position: 'absolute',
                            width: 320,
                            height: 320,
                            borderRadius: '50%',
                            background: 'rgba(0,168,150,0.12)',
                            top: -120,
                            right: -100
                        }}
                    />

                    <Box
                        sx={{
                            position: 'absolute',
                            width: 250,
                            height: 250,
                            borderRadius: '50%',
                            background: 'rgba(255,255,255,0.04)',
                            bottom: -100,
                            left: -80
                        }}
                    />

                    <Box sx={{ position: 'relative', zIndex: 1 }}>
                        {/* LOGO */}
                        <Stack
                            direction="row"
                            spacing={1.5}
                            alignItems="center"
                            sx={{ mb: 7 }}
                        >
                            <Box
                                sx={{
                                    width: 46,
                                    height: 46,
                                    borderRadius: 2.5,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    background:
                                        'linear-gradient(135deg, #00A896, #33B8AA)',
                                    boxShadow:
                                        '0 8px 25px rgba(0,168,150,0.25)'
                                }}
                            >
                                <DescriptionOutlined
                                    sx={{ color: '#fff', fontSize: 27 }}
                                />
                            </Box>

                            <Box>
                                <Typography
                                    sx={{
                                        fontSize: 20,
                                        fontWeight: 800,
                                        letterSpacing: '-0.3px'
                                    }}
                                >
                                    IDWP
                                </Typography>

                                <Typography
                                    sx={{
                                        fontSize: 10,
                                        opacity: 0.65,
                                        letterSpacing: 1.2
                                    }}
                                >
                                    INTELLIGENT DOCUMENT WORKFLOW
                                </Typography>
                            </Box>
                        </Stack>

                        <Typography
                            variant="h3"
                            sx={{
                                fontWeight: 800,
                                lineHeight: 1.15,
                                letterSpacing: '-1px',
                                maxWidth: 520,
                                mb: 3
                            }}
                        >
                            Intelligent documents.
                            <br />
                            Smarter workflows.
                        </Typography>

                        <Typography
                            sx={{
                                color: 'rgba(255,255,255,0.72)',
                                fontSize: 16,
                                lineHeight: 1.8,
                                maxWidth: 500
                            }}
                        >
                            Upload, process, analyze and approve documents
                            through one intelligent workflow platform.
                        </Typography>

                        {/* WORKFLOW */}
                        <Stack spacing={2.2} sx={{ mt: 6 }}>
                            {[
                                {
                                    icon: <DescriptionOutlined />,
                                    title: 'Document Processing',
                                    text: 'OCR extracts information automatically.'
                                },
                                {
                                    icon: <AutoAwesome />,
                                    title: 'AI-Powered Analysis',
                                    text: 'AI summarizes and understands documents.'
                                },
                                {
                                    icon: <SecurityOutlined />,
                                    title: 'Controlled Approval',
                                    text: 'Role-based review keeps workflows secure.'
                                }
                            ].map((item) => (
                                <Stack
                                    key={item.title}
                                    direction="row"
                                    spacing={2}
                                    alignItems="center"
                                >
                                    <Box
                                        sx={{
                                            width: 40,
                                            height: 40,
                                            flexShrink: 0,
                                            borderRadius: 2,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            background:
                                                'rgba(255,255,255,0.09)',
                                            color: '#33B8AA'
                                        }}
                                    >
                                        {item.icon}
                                    </Box>

                                    <Box>
                                        <Typography
                                            sx={{
                                                fontWeight: 700,
                                                fontSize: 14
                                            }}
                                        >
                                            {item.title}
                                        </Typography>

                                        <Typography
                                            sx={{
                                                color: 'rgba(255,255,255,0.58)',
                                                fontSize: 12.5,
                                                mt: 0.3
                                            }}
                                        >
                                            {item.text}
                                        </Typography>
                                    </Box>
                                </Stack>
                            ))}
                        </Stack>
                    </Box>

                    <Typography
                        sx={{
                            position: 'relative',
                            zIndex: 1,
                            color: 'rgba(255,255,255,0.4)',
                            fontSize: 12
                        }}
                    >
                        Secure document workflow management
                    </Typography>
                </Box>

                {/* LOGIN PANEL */}
                <Box
                    sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        p: { xs: 3, sm: 5, md: 6 },
                        backgroundColor: '#fff'
                    }}
                >
                    <Box sx={{ width: '100%', maxWidth: 390 }}>
                        {/* MOBILE BRAND */}
                        <Stack
                            direction="row"
                            spacing={1.2}
                            alignItems="center"
                            sx={{
                                display: { xs: 'flex', md: 'none' },
                                mb: 5
                            }}
                        >
                            <Box
                                sx={{
                                    width: 42,
                                    height: 42,
                                    borderRadius: 2,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    background:
                                        'linear-gradient(135deg, #1E2761, #00A896)',
                                    color: '#fff'
                                }}
                            >
                                <DescriptionOutlined />
                            </Box>

                            <Typography
                                sx={{
                                    fontWeight: 800,
                                    fontSize: 20,
                                    color: '#1E2761'
                                }}
                            >
                                IDWP
                            </Typography>
                        </Stack>

                        <Typography
                            sx={{
                                color: '#00A896',
                                fontSize: 13,
                                fontWeight: 700,
                                letterSpacing: 1,
                                textTransform: 'uppercase',
                                mb: 1
                            }}
                        >
                            Welcome back
                        </Typography>

                        <Typography
                            variant="h4"
                            sx={{
                                color: '#121A47',
                                fontWeight: 800,
                                letterSpacing: '-0.5px',
                                mb: 1
                            }}
                        >
                            Sign in to IDWP
                        </Typography>

                        <Typography
                            sx={{
                                color: '#6B7280',
                                fontSize: 14,
                                lineHeight: 1.6,
                                mb: 4
                            }}
                        >
                            Access your documents, workflows and intelligent
                            insights.
                        </Typography>

                        {error && (
                            <Alert
                                severity="error"
                                sx={{
                                    mb: 2.5,
                                    borderRadius: 2
                                }}
                            >
                                {error}
                            </Alert>
                        )}

                        <form onSubmit={handleSubmit}>
                            <TextField
                                fullWidth
                                label="Email address"
                                type="email"
                                margin="normal"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                autoComplete="email"
                                sx={{
                                    mb: 1,
                                    '& .MuiOutlinedInput-root': {
                                        borderRadius: 2
                                    }
                                }}
                            />

                            <TextField
                                fullWidth
                                label="Password"
                                type="password"
                                margin="normal"
                                value={password}
                                onChange={(e) =>
                                    setPassword(e.target.value)
                                }
                                autoComplete="current-password"
                                sx={{
                                    mb: 1,
                                    '& .MuiOutlinedInput-root': {
                                        borderRadius: 2
                                    }
                                }}
                            />

                            <Button
                                fullWidth
                                variant="contained"
                                type="submit"
                                endIcon={<ArrowForward />}
                                sx={{
                                    mt: 3,
                                    py: 1.45,
                                    borderRadius: 2,
                                    fontWeight: 700,
                                    fontSize: 14,
                                    background:
                                        'linear-gradient(90deg, #1E2761, #00A896)',
                                    boxShadow:
                                        '0 8px 20px rgba(30,39,97,0.18)',
                                    '&:hover': {
                                        background:
                                            'linear-gradient(90deg, #121A47, #007D70)',
                                        boxShadow:
                                            '0 10px 25px rgba(30,39,97,0.25)'
                                    }
                                }}
                            >
                                Sign in
                            </Button>
                        </form>

                        <Divider sx={{ my: 3 }}>
                            <Typography
                                sx={{
                                    fontSize: 11,
                                    color: '#9CA3AF'
                                }}
                            >
                                SECURE WORKSPACE
                            </Typography>
                        </Divider>

                        <Typography
                            align="center"
                            sx={{
                                fontSize: 14,
                                color: '#6B7280'
                            }}
                        >
                            Don't have an account?{' '}
                            <Link
                                to="/register"
                                style={{
                                    color: '#1E2761',
                                    fontWeight: 700,
                                    textDecoration: 'none'
                                }}
                            >
                                Create account
                            </Link>
                        </Typography>
                    </Box>
                </Box>
            </Box>
        </Box>
    );
}