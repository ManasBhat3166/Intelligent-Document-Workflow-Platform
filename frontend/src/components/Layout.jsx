import React from 'react';
import {
    AppBar,
    Avatar,
    Box,
    Button,
    Divider,
    Drawer,
    IconButton,
    List,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    Toolbar,
    Tooltip,
    Typography,
} from '@mui/material';

import { useLocation, useNavigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

import DashboardOutlinedIcon from '@mui/icons-material/DashboardOutlined';
import UploadFileOutlinedIcon from '@mui/icons-material/UploadFileOutlined';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import FactCheckOutlinedIcon from '@mui/icons-material/FactCheckOutlined';
import SearchOutlinedIcon from '@mui/icons-material/SearchOutlined';
import BarChartOutlinedIcon from '@mui/icons-material/BarChartOutlined';
import PeopleOutlinedIcon from '@mui/icons-material/PeopleOutlined';
import HistoryOutlinedIcon from '@mui/icons-material/HistoryOutlined';
import ForumOutlinedIcon from '@mui/icons-material/ForumOutlined';
import LogoutOutlinedIcon from '@mui/icons-material/Logout';
import MenuIcon from '@mui/icons-material/Menu';
import AccountCircleOutlinedIcon from '@mui/icons-material/AccountCircleOutlined';
import CloseIcon from '@mui/icons-material/Close';
import AutoAwesomeOutlinedIcon from '@mui/icons-material/AutoAwesomeOutlined';
import NotificationBell from './NotificationBell';


const DRAWER_WIDTH = 250;


const NAV_ITEMS = [
    {
        label: 'Overview',
        path: '/dashboard',
        icon: <DashboardOutlinedIcon />,
        roles: ['EMPLOYEE', 'REVIEWER', 'MANAGER', 'ADMIN'],
    },

    {
        label: 'Upload',
        path: '/upload',
        icon: <UploadFileOutlinedIcon />,
        roles: ['EMPLOYEE'],
    },

    {
        label: 'Documents',
        path: '/documents',
        icon: <DescriptionOutlinedIcon />,
        roles: ['EMPLOYEE', 'REVIEWER', 'MANAGER', 'ADMIN'],
    },

    {
        label: 'Approvals',
        path: '/approvals',
        icon: <FactCheckOutlinedIcon />,
        roles: ['REVIEWER', 'MANAGER', 'ADMIN'],
    },

    {
        label: 'Semantic Search',
        path: '/search',
        icon: <SearchOutlinedIcon />,
        roles: ['EMPLOYEE', 'REVIEWER', 'MANAGER', 'ADMIN'],
    },

    {
        label: 'Analytics',
        path: '/analytics',
        icon: <BarChartOutlinedIcon />,
        roles: ['MANAGER', 'ADMIN'],
    },

    {
        label: 'Users',
        path: '/users',
        icon: <PeopleOutlinedIcon />,
        roles: ['ADMIN'],
    },

    {
        label: 'Audit Logs',
        path: '/audit-logs',
        icon: <HistoryOutlinedIcon />,
        roles: ['ADMIN'],
    },

    {
        label: 'Profile',
        path: '/profile',
        icon: <AccountCircleOutlinedIcon />,
        roles: ['EMPLOYEE', 'REVIEWER', 'MANAGER', 'ADMIN'],
    },

    {
        label: 'Messages',
        path: '/messages',
        icon: <ForumOutlinedIcon />,
        roles: ['EMPLOYEE', 'REVIEWER', 'MANAGER', 'ADMIN'],
    },

];


export default function Layout() {

    const { user, logout } = useAuth();

    const navigate = useNavigate();

    const location = useLocation();

    const [mobileOpen, setMobileOpen] = React.useState(false);


    const filteredItems = NAV_ITEMS.filter((item) =>
        item.roles.includes(user?.role)
    );


    const handleLogout = () => {
        logout();
        navigate('/login');
    };


    const handleNavigation = (path) => {
        navigate(path);
        setMobileOpen(false);
    };


    const initials =
        user?.email
            ? user.email.charAt(0).toUpperCase()
            : '?';


    const isActive = (path) => {
        if (path === '/dashboard') {
            return location.pathname === '/dashboard';
        }

        return location.pathname.startsWith(path);
    };


    const drawer = (
        <Box
            sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                bgcolor: '#1E2761',
                color: '#FFFFFF',
            }}
        >

            {/* BRAND */}
            <Box
                sx={{
                    px: 2.5,
                    py: 2.5,
                }}
            >
                <Box
                    sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1.5,
                    }}
                >
                    <Box
                        sx={{
                            width: 40,
                            height: 40,
                            borderRadius: 2,
                            bgcolor: '#00A896',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}
                    >
                        <AutoAwesomeOutlinedIcon />
                    </Box>

                    <Box>
                        <Typography
                            variant="h6"
                            sx={{
                                fontWeight: 800,
                                lineHeight: 1,
                            }}
                        >
                            IDWP
                        </Typography>

                        <Typography
                            variant="caption"
                            sx={{
                                color: '#B8C0E8',
                                fontSize: 10,
                            }}
                        >
                            Intelligent Document Platform
                        </Typography>
                    </Box>
                </Box>
            </Box>


            <Divider
                sx={{
                    borderColor: 'rgba(255,255,255,0.12)',
                }}
            />


            {/* NAVIGATION */}
            <Box
                sx={{
                    px: 1.5,
                    pt: 2,
                    flexGrow: 1,
                }}
            >
                <Typography
                    variant="caption"
                    sx={{
                        px: 1,
                        color: '#858FBE',
                        fontWeight: 700,
                        letterSpacing: 1,
                    }}
                >
                    WORKSPACE
                </Typography>

                <List sx={{ mt: 1 }}>
                    {filteredItems
                        .filter(
                            (item) => !['Users', 'Audit Logs'].includes(item.label)
                        )
                        .map((item) => {

                            const active = isActive(item.path);

                            return (
                                <ListItemButton
                                    key={item.path}
                                    selected={active}
                                    onClick={() =>
                                        handleNavigation(item.path)
                                    }
                                    sx={{
                                        minHeight: 46,
                                        mb: 0.5,
                                        borderRadius: 2,

                                        color: active
                                            ? '#FFFFFF'
                                            : '#C6CBE5',

                                        bgcolor: active
                                            ? 'rgba(255,255,255,0.12)'
                                            : 'transparent',

                                        '&:hover': {
                                            bgcolor:
                                                'rgba(255,255,255,0.08)',
                                        },

                                        '&.Mui-selected': {
                                            bgcolor:
                                                'rgba(255,255,255,0.12)',
                                        },

                                        '&.Mui-selected:hover': {
                                            bgcolor:
                                                'rgba(255,255,255,0.16)',
                                        },
                                    }}
                                >
                                    <ListItemIcon
                                        sx={{
                                            minWidth: 40,
                                            color: active
                                                ? '#00A896'
                                                : '#AEB6DA',
                                        }}
                                    >
                                        {item.icon}
                                    </ListItemIcon>

                                    <ListItemText
                                        primary={item.label}
                                        primaryTypographyProps={{
                                            fontSize: 14,
                                            fontWeight: active
                                                ? 700
                                                : 500,
                                        }}
                                    />
                                </ListItemButton>
                            );
                        })}
                </List>


                {/* ADMIN */}
                {user?.role === 'ADMIN' && (
                    <>
                        <Typography
                            variant="caption"
                            sx={{
                                px: 1,
                                color: '#858FBE',
                                fontWeight: 700,
                                letterSpacing: 1,
                                display: 'block',
                                mt: 2,
                            }}
                        >
                            ADMINISTRATION
                        </Typography>

                        <List sx={{ mt: 1 }}>
                            {filteredItems
                                .filter((item) =>
                                    ['Users', 'Audit Logs'].includes(item.label)
                                )
                                .map((item) => {

                                    const active = isActive(item.path);

                                    return (
                                        <ListItemButton
                                            key={item.path}
                                            selected={active}
                                            onClick={() =>
                                                handleNavigation(item.path)
                                            }
                                            sx={{
                                                minHeight: 46,
                                                borderRadius: 2,
                                                color: '#C6CBE5',

                                                '&:hover': {
                                                    bgcolor:
                                                        'rgba(255,255,255,0.08)',
                                                },
                                            }}
                                        >
                                            <ListItemIcon
                                                sx={{
                                                    minWidth: 40,
                                                    color: active
                                                        ? '#00A896'
                                                        : '#AEB6DA',
                                                }}
                                            >
                                                {item.icon}
                                            </ListItemIcon>

                                            <ListItemText
                                                primary={item.label}
                                                primaryTypographyProps={{
                                                    fontSize: 14,
                                                    fontWeight: active
                                                        ? 700
                                                        : 500,
                                                }}
                                            />
                                        </ListItemButton>
                                    );
                                })}
                        </List>
                    </>
                )}
            </Box>


            {/* USER AREA */}
            <Box
                sx={{
                    p: 1.5,
                }}
            >
                <Box
                    sx={{
                        p: 1.5,
                        borderRadius: 2,
                        bgcolor: 'rgba(255,255,255,0.06)',
                    }}
                >
                    <Box
                        sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1.5,
                        }}
                    >
                        <Avatar
                            sx={{
                                width: 36,
                                height: 36,
                                bgcolor: '#00A896',
                                fontSize: 14,
                                fontWeight: 700,
                            }}
                        >
                            {initials}
                        </Avatar>

                        <Box
                            sx={{
                                minWidth: 0,
                                flexGrow: 1,
                            }}
                        >
                            <Typography
                                variant="body2"
                                sx={{
                                    fontWeight: 700,
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap',
                                }}
                            >
                                {user?.email}
                            </Typography>

                            <Typography
                                variant="caption"
                                sx={{
                                    color: '#AEB6DA',
                                }}
                            >
                                {user?.role}
                            </Typography>
                        </Box>
                    </Box>


                    <Button
                        fullWidth
                        startIcon={<LogoutOutlinedIcon />}
                        onClick={handleLogout}

                        sx={{
                            mt: 1.5,
                            color: '#C6CBE5',
                            justifyContent: 'flex-start',
                            fontSize: 13,

                            '& .MuiButton-startIcon': {
                                color: '#C6CBE5',
                            },

                            '&:hover': {
                                bgcolor: 'rgba(255,255,255,0.08)',
                                color: '#FFFFFF',
                            },
                        }}

                    >
                        Logout
                    </Button>

                </Box>
            </Box>
        </Box>
    );


    return (
        <Box
            sx={{
                display: 'flex',
                minHeight: '100vh',
            }}
        >

            {/* DESKTOP DRAWER */}
            <Drawer
                variant="permanent"
                sx={{
                    display: {
                        xs: 'none',
                        md: 'block',
                    },

                    width: DRAWER_WIDTH,

                    flexShrink: 0,

                    '& .MuiDrawer-paper': {
                        width: DRAWER_WIDTH,
                        boxSizing: 'border-box',
                        border: 'none',
                    },
                }}
                open
            >
                {drawer}
            </Drawer>


            {/* MOBILE DRAWER */}
            <Drawer
                variant="temporary"
                open={mobileOpen}
                onClose={() => setMobileOpen(false)}
                ModalProps={{
                    keepMounted: true,
                }}
                sx={{
                    display: {
                        xs: 'block',
                        md: 'none',
                    },

                    '& .MuiDrawer-paper': {
                        width: DRAWER_WIDTH,
                        boxSizing: 'border-box',
                        border: 'none',
                    },
                }}
            >
                {drawer}
            </Drawer>


            {/* MAIN CONTENT */}
            <Box
                sx={{
                    flexGrow: 1,
                    minWidth: 0,
                    display: 'flex',
                    flexDirection: 'column',
                }}
            >

                {/* TOP BAR */}
                <AppBar
                    position="sticky"
                    elevation={0}
                    color="inherit"
                    sx={{
                        bgcolor: '#FFFFFF',
                        borderBottom: '1px solid #E5E7EB',
                    }}
                >
                    <Toolbar
                        sx={{
                            minHeight: {
                                xs: 64,
                                md: 70,
                            },
                            px: {
                                xs: 2,
                                md: 3,
                            },
                        }}
                    >

                        {/* MOBILE MENU */}
                        <IconButton
                            onClick={() => setMobileOpen(true)}
                            sx={{
                                display: {
                                    xs: 'flex',
                                    md: 'none',
                                },
                                mr: 1,
                            }}
                        >
                            <MenuIcon />
                        </IconButton>


                        {/* PAGE TITLE */}
                        <Box sx={{ flexGrow: 1 }}>
                            <Typography
                                variant="body2"
                                sx={{
                                    color: 'text.secondary',
                                    fontWeight: 500,
                                }}
                            >
                                Intelligent Document Workflow Platform
                            </Typography>
                        </Box>


                        {/* USER */}
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>

                            <NotificationBell />

                            <Tooltip title={user?.email || ''}>
                                <Box
                                    sx={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 1,
                                    }}
                                >
                                    <Avatar
                                        sx={{
                                            width: 36,
                                            height: 36,
                                            bgcolor: '#00A896',
                                            fontSize: 14,
                                            fontWeight: 700,
                                        }}
                                    >
                                        {initials}
                                    </Avatar>

                                    <Box
                                        sx={{
                                            display: {
                                                xs: 'none',
                                                sm: 'block',
                                            },
                                        }}
                                    >
                                        <Typography
                                            variant="body2"
                                            sx={{
                                                fontWeight: 700,
                                                lineHeight: 1.2,
                                            }}
                                        >
                                            {user?.email}
                                        </Typography>

                                        <Typography
                                            variant="caption"
                                            color="text.secondary"
                                        >
                                            {user?.role}
                                        </Typography>
                                    </Box>
                                </Box>
                            </Tooltip>

                        </Box>

                    </Toolbar>
                </AppBar>


                {/* PAGE AREA */}
                <Box
                    component="main"
                    sx={{
                        flexGrow: 1,
                        p: {
                            xs: 2,
                            sm: 3,
                            md: 4,
                        },
                        bgcolor: '#F4F6FA',
                    }}
                >
                    <Outlet />
                </Box>

            </Box>
        </Box>
    );
}