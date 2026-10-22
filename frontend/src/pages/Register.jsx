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
    PersonAddOutlined,
    SecurityOutlined,
    AutoAwesome,
    ArrowForward
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { getApiErrorMessage } from '../utils/apiError';


export default function Register() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [error, setError] = useState('');
    const [fieldErrors, setFieldErrors] = useState({});

    const { register } = useAuth();
    const navigate = useNavigate();


    const validateForm = () => {
        const errors = {};
        const cleanName = fullName.trim();
        const cleanEmail = email.trim();

        if (!cleanName) {
            errors.fullName = 'Full name is required';
        } else if (cleanName.length < 2) {
            errors.fullName = 'Name must contain at least 2 characters';
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!cleanEmail) {
            errors.email = 'Email address is required';
        } else if (!emailRegex.test(cleanEmail)) {
            errors.email = 'Enter a valid email address';
        }

        if (!password) {
            errors.password = 'Password is required';
        } else if (password.length < 8) {
            errors.password = 'Password must be at least 8 characters';
        } else if (
            !/[A-Z]/.test(password) ||
            !/[a-z]/.test(password) ||
            !/[0-9]/.test(password)
        ) {
            errors.password =
                'Include uppercase, lowercase, and a number';
        }

        setFieldErrors(errors);
        return Object.keys(errors).length === 0;
    };


    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!validateForm()) {
            return;
        }

        try {
            await register(email.trim(), password, fullName.trim());
            navigate('/login', {
                replace: true,
                state: { message: 'Account created successfully. Please log in.' }
            });
        } catch (err) {
            console.error('Registration failed:', err);

            setError(
                getApiErrorMessage(
                    err,
                    'Registration failed. Email may already be in use.'
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
                    gridTemplateColumns: { xs: '1fr', md: '0.85fr 1.15fr' },
                    minHeight: { md: 680 },
                    borderRadius: 4,
                    overflow: 'hidden',
                    boxShadow: '0 25px 70px rgba(0,0,0,0.25)',
                    backgroundColor: '#fff'
                }}
            >
                {/* REGISTER FORM */}
                <Box
                    sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        p: { xs: 3, sm: 5, md: 6 },
                        backgroundColor: '#fff'
                    }}
                >
                    <Box sx={{ width: '100%', maxWidth: 410 }}>
                        {/* MOBILE BRAND */}
                        <Stack
                            direction="row"
                            spacing={1.2}
                            alignItems="center"
                            sx={{
                                display: { xs: 'flex', md: 'none' },
                                mb: 4
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
                            Get started
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
                            Create your account
                        </Typography>

                        <Typography
                            sx={{
                                color: '#6B7280',
                                fontSize: 14,
                                lineHeight: 1.6,
                                mb: 3
                            }}
                        >
                            Join the intelligent document workflow platform.
                        </Typography>

                        {error && (
                            <Alert
                                severity="error"
                                sx={{
                                    mb: 2,
                                    borderRadius: 2
                                }}
                            >
                                {error}
                            </Alert>
                        )}

                        <form onSubmit={handleSubmit}>
                            <TextField
                                fullWidth
                                label="Full name"
                                margin="normal"
                                value={fullName}
                                onChange={(e) =>
                                    setFullName(e.target.value)
                                }
                                autoComplete="name"
                                error={Boolean(fieldErrors.fullName)}
                                helperText={fieldErrors.fullName || ' '}
                                sx={{
                                    '& .MuiOutlinedInput-root': {
                                        borderRadius: 2
                                    }
                                }}
                            />

                            <TextField
                                fullWidth
                                label="Email address"
                                type="email"
                                margin="normal"
                                value={email}
                                onChange={(e) =>
                                    setEmail(e.target.value)
                                }
                                autoComplete="email"
                                error={Boolean(fieldErrors.email)}
                                helperText={fieldErrors.email || ' '}
                                sx={{
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
                                autoComplete="new-password"
                                error={Boolean(fieldErrors.password)}
                                helperText={fieldErrors.password || ' '}
                                sx={{
                                    '& .MuiOutlinedInput-root': {
                                        borderRadius: 2
                                    }
                                }}
                            />


                            <Button
                                fullWidth
                                variant="contained"
                                type="submit"
                                endIcon={<PersonAddOutlined />}
                                sx={{
                                    mt: 2.5,
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
                                            'linear-gradient(90deg, #121A47, #007D70)'
                                    }
                                }}
                            >
                                Create account
                            </Button>
                        </form>

                        <Divider sx={{ my: 3 }} />

                        <Typography
                            align="center"
                            sx={{
                                fontSize: 14,
                                color: '#6B7280'
                            }}
                        >
                            Already have an account?{' '}
                            <Link
                                to="/login"
                                style={{
                                    color: '#1E2761',
                                    fontWeight: 700,
                                    textDecoration: 'none'
                                }}
                            >
                                Sign in
                            </Link>
                        </Typography>
                    </Box>
                </Box>

                {/* RIGHT BRAND PANEL */}
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
                            width: 330,
                            height: 330,
                            borderRadius: '50%',
                            background: 'rgba(0,168,150,0.12)',
                            top: -130,
                            right: -100
                        }}
                    />

                    <Box
                        sx={{
                            position: 'absolute',
                            width: 260,
                            height: 260,
                            borderRadius: '50%',
                            background: 'rgba(255,255,255,0.04)',
                            bottom: -110,
                            left: -90
                        }}
                    />

                    <Box sx={{ position: 'relative', zIndex: 1 }}>
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
                                        fontWeight: 800
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
                            One platform.
                            <br />
                            Every document.
                        </Typography>

                        <Typography
                            sx={{
                                color: 'rgba(255,255,255,0.72)',
                                fontSize: 16,
                                lineHeight: 1.8,
                                maxWidth: 500
                            }}
                        >
                            Bring document processing, AI analysis,
                            semantic search and approval workflows together
                            in one secure workspace.
                        </Typography>

                        <Stack spacing={2.5} sx={{ mt: 6 }}>
                            <Stack direction="row" spacing={2}>
                                <AutoAwesome
                                    sx={{
                                        color: '#33B8AA',
                                        mt: 0.2
                                    }}
                                />

                                <Box>
                                    <Typography
                                        sx={{
                                            fontWeight: 700,
                                            fontSize: 14
                                        }}
                                    >
                                        AI-powered document intelligence
                                    </Typography>

                                    <Typography
                                        sx={{
                                            color: 'rgba(255,255,255,0.58)',
                                            fontSize: 12.5,
                                            mt: 0.4
                                        }}
                                    >
                                        Extract, summarize and understand
                                        document content.
                                    </Typography>
                                </Box>
                            </Stack>

                            <Stack direction="row" spacing={2}>
                                <SecurityOutlined
                                    sx={{
                                        color: '#33B8AA',
                                        mt: 0.2
                                    }}
                                />

                                <Box>
                                    <Typography
                                        sx={{
                                            fontWeight: 700,
                                            fontSize: 14
                                        }}
                                    >
                                        Role-based workflow
                                    </Typography>

                                    <Typography
                                        sx={{
                                            color: 'rgba(255,255,255,0.58)',
                                            fontSize: 12.5,
                                            mt: 0.4
                                        }}
                                    >
                                        Keep review and approval processes
                                        controlled and secure.
                                    </Typography>
                                </Box>
                            </Stack>

                            <Stack direction="row" spacing={2}>
                                <PersonAddOutlined
                                    sx={{
                                        color: '#33B8AA',
                                        mt: 0.2
                                    }}
                                />

                                <Box>
                                    <Typography
                                        sx={{
                                            fontWeight: 700,
                                            fontSize: 14
                                        }}
                                    >
                                        Built for teams
                                    </Typography>

                                    <Typography
                                        sx={{
                                            color: 'rgba(255,255,255,0.58)',
                                            fontSize: 12.5,
                                            mt: 0.4
                                        }}
                                    >
                                        Give every user the right access
                                        and workflow experience.
                                    </Typography>
                                </Box>
                            </Stack>
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
                        Intelligent Document Workflow Platform
                    </Typography>
                </Box>
            </Box>
        </Box>
    );
}