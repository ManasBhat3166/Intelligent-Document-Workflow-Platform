import { useEffect, useState } from 'react';
import {
    Badge,
    Box,
    Divider,
    IconButton,
    List,
    ListItemButton,
    ListItemText,
    Popover,
    Typography
} from '@mui/material';

import NotificationsNoneIcon from '@mui/icons-material/NotificationsNone';
import api from '../api/axiosConfig';
import { useNavigate } from 'react-router-dom';

export default function NotificationBell() {
    const [notifications, setNotifications] = useState([]);
    const [anchorEl, setAnchorEl] = useState(null);

    const navigate = useNavigate();

    const loadNotifications = async () => {
        try {
            const res = await api.get('/notifications');
            setNotifications(res.data);
        } catch (error) {
            console.error('Failed to load notifications:', error);
        }
    };

    useEffect(() => {
        loadNotifications();
    }, []);

    const unreadCount = notifications.filter(
        (notification) => !notification.read
    ).length;

    const handleOpen = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    const handleNotificationClick = async (notification) => {
        try {
            if (!notification.read) {
                await api.put(`/notifications/${notification.id}/read`);
            }

            setNotifications((prev) =>
                prev.map((item) =>
                    item.id === notification.id
                        ? { ...item, read: true }
                        : item
                )
            );

            handleClose();

            if (notification.documentId) {
                navigate(`/documents/${notification.documentId}`);
            }
        } catch (error) {
            console.error('Failed to mark notification as read:', error);
        }
    };

    const markAllAsRead = async () => {
        try {
            await api.put('/notifications/read-all');

            setNotifications((prev) =>
                prev.map((notification) => ({
                    ...notification,
                    read: true
                }))
            );
        } catch (error) {
            console.error('Failed to mark all as read:', error);
        }
    };

    return (
        <>
            <IconButton onClick={handleOpen}>
                <Badge badgeContent={unreadCount} color="error">
                    <NotificationsNoneIcon />
                </Badge>
            </IconButton>

            <Popover
                open={Boolean(anchorEl)}
                anchorEl={anchorEl}
                onClose={handleClose}
                anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'right'
                }}
                transformOrigin={{
                    vertical: 'top',
                    horizontal: 'right'
                }}
            >
                <Box sx={{ width: 380, maxWidth: '90vw' }}>

                    <Box
                        sx={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            px: 2,
                            py: 1.5
                        }}
                    >
                        <Typography fontWeight={700}>
                            Notifications
                        </Typography>

                        {unreadCount > 0 && (
                            <Typography
                                variant="caption"
                                sx={{
                                    color: '#00A896',
                                    cursor: 'pointer',
                                    fontWeight: 600
                                }}
                                onClick={markAllAsRead}
                            >
                                Mark all as read
                            </Typography>
                        )}
                    </Box>

                    <Divider />

                    <List sx={{ p: 0, maxHeight: 420, overflowY: 'auto' }}>

                        {notifications.length === 0 ? (
                            <Box sx={{ p: 3, textAlign: 'center' }}>
                                <NotificationsNoneIcon
                                    sx={{
                                        fontSize: 40,
                                        color: 'text.secondary'
                                    }}
                                />

                                <Typography
                                    variant="body2"
                                    color="text.secondary"
                                >
                                    No notifications
                                </Typography>
                            </Box>
                        ) : (
                            notifications.map((notification) => (
                                <ListItemButton
                                    key={notification.id}
                                    onClick={() =>
                                        handleNotificationClick(notification)
                                    }
                                    sx={{
                                        backgroundColor: notification.read
                                            ? 'transparent'
                                            : '#F0FAF8',
                                        alignItems: 'flex-start',
                                        py: 1.5
                                    }}
                                >
                                    <ListItemText
                                        primary={
                                            <Typography
                                                variant="body2"
                                                fontWeight={
                                                    notification.read
                                                        ? 500
                                                        : 700
                                                }
                                            >
                                                {notification.title}
                                            </Typography>
                                        }
                                        secondary={
                                            <Box>
                                                <Typography
                                                    variant="caption"
                                                    color="text.secondary"
                                                >
                                                    {notification.message}
                                                </Typography>

                                                <Typography
                                                    variant="caption"
                                                    display="block"
                                                    color="text.secondary"
                                                    sx={{ mt: 0.5 }}
                                                >
                                                    {new Date(
                                                        notification.createdAt
                                                    ).toLocaleString()}
                                                </Typography>
                                            </Box>
                                        }
                                    />
                                </ListItemButton>
                            ))
                        )}

                    </List>
                </Box>
            </Popover>
        </>
    );
}