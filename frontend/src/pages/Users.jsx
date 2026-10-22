import { useEffect, useState } from 'react';
import {
    Alert,
    Avatar,
    Box,
    Button,
    Chip,
    CircularProgress,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    FormControl,
    Grid,
    IconButton,
    InputLabel,
    MenuItem,
    Paper,
    Select,
    Stack,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TextField,
    Tooltip,
    Typography
} from '@mui/material';

import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import DeleteOutlined from '@mui/icons-material/DeleteOutlined';
import PeopleOutlineIcon from '@mui/icons-material/PeopleOutlineOutlined';
import SearchIcon from '@mui/icons-material/Search';
import RefreshIcon from '@mui/icons-material/Refresh';
import PersonOutlineIcon from '@mui/icons-material/PersonOutlineOutlined';
import AdminPanelSettingsOutlinedIcon from '@mui/icons-material/AdminPanelSettingsOutlined';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutlineOutlined';
import BlockOutlinedIcon from '@mui/icons-material/BlockOutlined';

import api from '../api/axiosConfig';
import { useAuth } from '../context/AuthContext';
import { getApiErrorMessage } from '../utils/apiError';

const ROLES = [
    'ADMIN',
    'MANAGER',
    'REVIEWER',
    'EMPLOYEE'
];

export default function Users() {
    const { user } = useAuth();

    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState('');

    const [search, setSearch] = useState('');
    const [roleFilter, setRoleFilter] = useState('ALL');
    const [statusFilter, setStatusFilter] = useState('ALL');

    const [editOpen, setEditOpen] = useState(false);
    const [deleteOpen, setDeleteOpen] = useState(false);

    const [selectedUser, setSelectedUser] = useState(null);

    const [editForm, setEditForm] = useState({
        fullName: '',
        role: '',
        enabled: true
    });

    const [actionLoading, setActionLoading] = useState(false);
    const [actionError, setActionError] = useState('');

    const isAdmin = user?.role === 'ADMIN';

    const fetchUsers = async (showRefresh = false) => {
        if (showRefresh) {
            setRefreshing(true);
        } else {
            setLoading(true);
        }

        setError('');

        try {
            const response = await api.get('/users');

            setUsers(Array.isArray(response.data) ? response.data : []);
        } catch (err) {
            console.error(err);

            setError(
                getApiErrorMessage(
                    err,
                    'Unable to load users. Please try again.'
                )
            );
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const handleEditOpen = (selected) => {
        setSelectedUser(selected);

        setEditForm({
            fullName: selected.fullName || '',
            role: selected.role || 'EMPLOYEE',
            enabled: selected.enabled ?? true
        });

        setActionError('');
        setEditOpen(true);
    };

    const handleEditClose = () => {
        if (actionLoading) return;

        setEditOpen(false);
        setSelectedUser(null);
        setActionError('');
    };

    const handleEditSubmit = async () => {
        if (!selectedUser) return;

        setActionLoading(true);
        setActionError('');

        try {
            const response = await api.put(
                `/users/${selectedUser.id}`,
                {
                    fullName: editForm.fullName.trim(),
                    role: editForm.role,
                    enabled: editForm.enabled
                }
            );

            setUsers((currentUsers) =>
                currentUsers.map((item) =>
                    item.id === selectedUser.id
                        ? response.data
                        : item
                )
            );

            setEditOpen(false);
            setSelectedUser(null);
        } catch (err) {
            console.error(err);

            setActionError(
                getApiErrorMessage(
                    err,
                    'Unable to update the user.'
                )
            );
        } finally {
            setActionLoading(false);
        }
    };

    const handleDeleteOpen = (selected) => {
        setSelectedUser(selected);
        setActionError('');
        setDeleteOpen(true);
    };

    const handleDeleteClose = () => {
        if (actionLoading) return;

        setDeleteOpen(false);
        setSelectedUser(null);
        setActionError('');
    };

    const handleDelete = async () => {
        if (!selectedUser) return;

        setActionLoading(true);
        setActionError('');

        try {
            await api.delete(`/users/${selectedUser.id}`);

            setUsers((currentUsers) =>
                currentUsers.filter(
                    (item) => item.id !== selectedUser.id
                )
            );

            setDeleteOpen(false);
            setSelectedUser(null);
        } catch (err) {
            console.error(err);

            setActionError(
                getApiErrorMessage(
                    err,
                    'Unable to delete the user.'
                )
            );
        }finally {
            setActionLoading(false);
        }
    };

    const filteredUsers = users.filter((item) => {
        const searchValue = search.trim().toLowerCase();

        const matchesSearch =
            !searchValue ||
            item.fullName?.toLowerCase().includes(searchValue) ||
            item.email?.toLowerCase().includes(searchValue);

        const matchesRole =
            roleFilter === 'ALL' ||
            item.role === roleFilter;

        const matchesStatus =
            statusFilter === 'ALL' ||
            (statusFilter === 'ACTIVE' && item.enabled) ||
            (statusFilter === 'DISABLED' && !item.enabled);

        return matchesSearch && matchesRole && matchesStatus;
    });

    const activeCount = users.filter((item) => item.enabled).length;
    const disabledCount = users.filter((item) => !item.enabled).length;
    const adminCount = users.filter(
        (item) => item.role === 'ADMIN'
    ).length;

    const formatDate = (value) => {
        if (!value) return '—';

        return new Date(value).toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    };

    const getInitials = (name, email) => {
        const source = name?.trim() || email?.split('@')[0] || 'U';

        const parts = source.split(' ').filter(Boolean);

        if (parts.length >= 2) {
            return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
        }

        return source.substring(0, 2).toUpperCase();
    };

    const getRoleColor = (role) => {
        switch (role) {
            case 'ADMIN':
                return 'error';
            case 'MANAGER':
                return 'primary';
            case 'REVIEWER':
                return 'secondary';
            default:
                return 'default';
        }
    };

    if (loading) {
        return (
            <Box
                sx={{
                    minHeight: '60vh',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center'
                }}
            >
                <Stack alignItems="center" spacing={2}>
                    <CircularProgress />
                    <Typography color="text.secondary">
                        Loading users...
                    </Typography>
                </Stack>
            </Box>
        );
    }

    return (
        <Box sx={{ maxWidth: 1400, mx: 'auto' }}>
            {/* Header */}
            <Stack
                direction={{ xs: 'column', sm: 'row' }}
                justifyContent="space-between"
                alignItems={{ xs: 'flex-start', sm: 'center' }}
                spacing={2}
                sx={{ mb: 4 }}
            >
                <Box>
                    <Stack
                        direction="row"
                        spacing={1.5}
                        alignItems="center"
                        sx={{ mb: 1 }}
                    >
                        <Box
                            sx={{
                                width: 42,
                                height: 42,
                                borderRadius: 2,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                backgroundColor: 'primary.main',
                                color: 'white'
                            }}
                        >
                            <PeopleOutlineIcon />
                        </Box>

                        <Typography variant="h4">
                            User Management
                        </Typography>
                    </Stack>

                    <Typography
                        variant="body1"
                        color="text.secondary"
                    >
                        Manage platform users, roles, and account access.
                    </Typography>
                </Box>

                <Button
                    variant="outlined"
                    startIcon={
                        refreshing ? (
                            <CircularProgress size={18} />
                        ) : (
                            <RefreshIcon />
                        )
                    }
                    onClick={() => fetchUsers(true)}
                    disabled={refreshing}
                >
                    Refresh
                </Button>
            </Stack>

            {/* Summary */}
            <Grid
                container
                spacing={2}
                sx={{ mb: 3 }}
            >
                <Grid size={{ xs: 12, sm: 4 }}>
                    <SummaryCard
                        label="Total Users"
                        value={users.length}
                        icon={<PeopleOutlineIcon />}
                    />
                </Grid>

                <Grid size={{ xs: 12, sm: 4 }}>
                    <SummaryCard
                        label="Active Users"
                        value={activeCount}
                        icon={<CheckCircleOutlineIcon />}
                    />
                </Grid>

                <Grid size={{ xs: 12, sm: 4 }}>
                    <SummaryCard
                        label="Administrators"
                        value={adminCount}
                        icon={<AdminPanelSettingsOutlinedIcon />}
                    />
                </Grid>
            </Grid>

            {/* Error */}
            {error && (
                <Alert
                    severity="error"
                    sx={{ mb: 3 }}
                >
                    {error}
                </Alert>
            )}

            {/* Filters */}
            <Paper
                elevation={0}
                sx={{
                    p: 2,
                    mb: 3,
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 3
                }}
            >
                <Grid
                    container
                    spacing={2}
                    alignItems="center"
                >
                    <Grid size={{ xs: 12, md: 6 }}>
                        <TextField
                            fullWidth
                            size="small"
                            placeholder="Search by name or email..."
                            value={search}
                            onChange={(event) =>
                                setSearch(event.target.value)
                            }
                            InputProps={{
                                startAdornment: (
                                    <SearchIcon
                                        fontSize="small"
                                        sx={{
                                            mr: 1,
                                            color: 'text.secondary'
                                        }}
                                    />
                                )
                            }}
                        />
                    </Grid>

                    <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                        <FormControl
                            fullWidth
                            size="small"
                        >
                            <InputLabel>Role</InputLabel>

                            <Select
                                value={roleFilter}
                                label="Role"
                                onChange={(event) =>
                                    setRoleFilter(event.target.value)
                                }
                            >
                                <MenuItem value="ALL">
                                    All Roles
                                </MenuItem>

                                {ROLES.map((role) => (
                                    <MenuItem
                                        key={role}
                                        value={role}
                                    >
                                        {role}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Grid>

                    <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                        <FormControl
                            fullWidth
                            size="small"
                        >
                            <InputLabel>Status</InputLabel>

                            <Select
                                value={statusFilter}
                                label="Status"
                                onChange={(event) =>
                                    setStatusFilter(event.target.value)
                                }
                            >
                                <MenuItem value="ALL">
                                    All Status
                                </MenuItem>

                                <MenuItem value="ACTIVE">
                                    Active
                                </MenuItem>

                                <MenuItem value="DISABLED">
                                    Disabled
                                </MenuItem>
                            </Select>
                        </FormControl>
                    </Grid>
                </Grid>
            </Paper>

            {/* User Table */}
            <Paper
                elevation={0}
                sx={{
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 3,
                    overflow: 'hidden'
                }}
            >
                <Box
                    sx={{
                        p: 2.5,
                        borderBottom: '1px solid',
                        borderColor: 'divider'
                    }}
                >
                    <Stack
                        direction="row"
                        justifyContent="space-between"
                        alignItems="center"
                    >
                        <Box>
                            <Typography
                                variant="h6"
                                fontWeight={700}
                            >
                                Platform Users
                            </Typography>

                            <Typography
                                variant="body2"
                                color="text.secondary"
                            >
                                Showing {filteredUsers.length} of{' '}
                                {users.length} users
                            </Typography>
                        </Box>

                        <Chip
                            label={`${activeCount} Active`}
                            color="success"
                            variant="outlined"
                            size="small"
                        />
                    </Stack>
                </Box>

                {filteredUsers.length === 0 ? (
                    <Box
                        sx={{
                            p: 6,
                            textAlign: 'center'
                        }}
                    >
                        <PersonOutlineIcon
                            sx={{
                                fontSize: 50,
                                color: 'text.disabled',
                                mb: 1
                            }}
                        />

                        <Typography
                            variant="h6"
                            sx={{ mb: 0.5 }}
                        >
                            No users found
                        </Typography>

                        <Typography
                            variant="body2"
                            color="text.secondary"
                        >
                            Try changing your search or filters.
                        </Typography>
                    </Box>
                ) : (
                    <TableContainer>
                        <Table>
                            <TableHead>
                                <TableRow
                                    sx={{
                                        backgroundColor:
                                            'background.default'
                                    }}
                                >
                                    <TableCell>
                                        <strong>User</strong>
                                    </TableCell>

                                    <TableCell>
                                        <strong>Role</strong>
                                    </TableCell>

                                    <TableCell>
                                        <strong>Status</strong>
                                    </TableCell>

                                    <TableCell>
                                        <strong>Joined</strong>
                                    </TableCell>

                                    {isAdmin && (
                                        <TableCell align="right">
                                            <strong>Actions</strong>
                                        </TableCell>
                                    )}
                                </TableRow>
                            </TableHead>

                            <TableBody>
                                {filteredUsers.map((item) => (
                                    <TableRow
                                        key={item.id}
                                        hover
                                    >
                                        <TableCell>
                                            <Stack
                                                direction="row"
                                                spacing={1.5}
                                                alignItems="center"
                                            >
                                                <Avatar
                                                    sx={{
                                                        width: 40,
                                                        height: 40,
                                                        backgroundColor:
                                                            'primary.main',
                                                        fontSize: 14,
                                                        fontWeight: 700
                                                    }}
                                                >
                                                    {getInitials(
                                                        item.fullName,
                                                        item.email
                                                    )}
                                                </Avatar>

                                                <Box
                                                    sx={{
                                                        minWidth: 0
                                                    }}
                                                >
                                                    <Typography
                                                        variant="body2"
                                                        fontWeight={700}
                                                    >
                                                        {item.fullName ||
                                                            'Unnamed User'}
                                                    </Typography>

                                                    <Typography
                                                        variant="caption"
                                                        color="text.secondary"
                                                    >
                                                        {item.email}
                                                    </Typography>
                                                </Box>
                                            </Stack>
                                        </TableCell>

                                        <TableCell>
                                            <Chip
                                                label={
                                                    item.role ||
                                                    'EMPLOYEE'
                                                }
                                                color={getRoleColor(
                                                    item.role
                                                )}
                                                size="small"
                                                sx={{
                                                    fontWeight: 700
                                                }}
                                            />
                                        </TableCell>

                                        <TableCell>
                                            <Chip
                                                icon={
                                                    item.enabled ? (
                                                        <CheckCircleOutlineIcon />
                                                    ) : (
                                                        <BlockOutlinedIcon />
                                                    )
                                                }
                                                label={
                                                    item.enabled
                                                        ? 'Active'
                                                        : 'Disabled'
                                                }
                                                color={
                                                    item.enabled
                                                        ? 'success'
                                                        : 'default'
                                                }
                                                size="small"
                                                variant="outlined"
                                            />
                                        </TableCell>

                                        <TableCell>
                                            <Typography variant="body2">
                                                {formatDate(
                                                    item.createdAt
                                                )}
                                            </Typography>
                                        </TableCell>

                                        {isAdmin && (
                                            <TableCell align="right">
                                                <Stack
                                                    direction="row"
                                                    spacing={0.5}
                                                    justifyContent="flex-end"
                                                >
                                                    <Tooltip title="Edit user">
                                                        <IconButton
                                                            size="small"
                                                            onClick={() =>
                                                                handleEditOpen(
                                                                    item
                                                                )
                                                            }
                                                        >
                                                            <EditOutlinedIcon fontSize="small" />
                                                        </IconButton>
                                                    </Tooltip>

                                                    <Tooltip title="Delete user">
                                                        <IconButton
                                                            size="small"
                                                            color="error"
                                                            onClick={() =>
                                                                handleDeleteOpen(
                                                                    item
                                                                )
                                                            }
                                                            disabled={
                                                                item.id ===
                                                                user?.id
                                                            }
                                                        >
                                                            <DeleteOutlined  fontSize="small" />
                                                        </IconButton>
                                                    </Tooltip>
                                                </Stack>
                                            </TableCell>
                                        )}
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                )}
            </Paper>

            {/* Edit Dialog */}
            <Dialog
                open={editOpen}
                onClose={handleEditClose}
                fullWidth
                maxWidth="sm"
            >
                <DialogTitle>
                    Edit User
                </DialogTitle>

                <DialogContent>
                    <Stack spacing={2.5} sx={{ pt: 1 }}>
                        {actionError && (
                            <Alert severity="error">
                                {actionError}
                            </Alert>
                        )}

                        <TextField
                            fullWidth
                            label="Full Name"
                            value={editForm.fullName}
                            onChange={(event) =>
                                setEditForm({
                                    ...editForm,
                                    fullName: event.target.value
                                })
                            }
                            disabled={actionLoading}
                        />

                        <FormControl fullWidth>
                            <InputLabel>Role</InputLabel>

                            <Select
                                value={editForm.role}
                                label="Role"
                                onChange={(event) =>
                                    setEditForm({
                                        ...editForm,
                                        role: event.target.value
                                    })
                                }
                                disabled={actionLoading}
                            >
                                {ROLES.map((role) => (
                                    <MenuItem
                                        key={role}
                                        value={role}
                                    >
                                        {role}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>

                        <FormControl fullWidth>
                            <InputLabel>Account Status</InputLabel>

                            <Select
                                value={
                                    editForm.enabled
                                        ? 'ACTIVE'
                                        : 'DISABLED'
                                }
                                label="Account Status"
                                onChange={(event) =>
                                    setEditForm({
                                        ...editForm,
                                        enabled:
                                            event.target.value ===
                                            'ACTIVE'
                                    })
                                }
                                disabled={actionLoading}
                            >
                                <MenuItem value="ACTIVE">
                                    Active
                                </MenuItem>

                                <MenuItem value="DISABLED">
                                    Disabled
                                </MenuItem>
                            </Select>
                        </FormControl>
                    </Stack>
                </DialogContent>

                <DialogActions sx={{ px: 3, pb: 2.5 }}>
                    <Button
                        onClick={handleEditClose}
                        disabled={actionLoading}
                    >
                        Cancel
                    </Button>

                    <Button
                        variant="contained"
                        onClick={handleEditSubmit}
                        disabled={actionLoading}
                        startIcon={
                            actionLoading ? (
                                <CircularProgress
                                    size={17}
                                    color="inherit"
                                />
                            ) : (
                                <EditOutlinedIcon />
                            )
                        }
                    >
                        Save Changes
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Delete Dialog */}
            <Dialog
                open={deleteOpen}
                onClose={handleDeleteClose}
                fullWidth
                maxWidth="xs"
            >
                <DialogTitle>
                    Delete User?
                </DialogTitle>

                <DialogContent>
                    {actionError && (
                        <Alert
                            severity="error"
                            sx={{ mb: 2 }}
                        >
                            {actionError}
                        </Alert>
                    )}

                    <Typography variant="body2">
                        Are you sure you want to permanently delete{' '}
                        <strong>
                            {selectedUser?.fullName ||
                                selectedUser?.email}
                        </strong>
                        ?
                    </Typography>

                    <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ mt: 1 }}
                    >
                        This action cannot be undone.
                    </Typography>
                </DialogContent>

                <DialogActions sx={{ px: 3, pb: 2.5 }}>
                    <Button
                        onClick={handleDeleteClose}
                        disabled={actionLoading}
                    >
                        Cancel
                    </Button>

                    <Button
                        variant="contained"
                        color="error"
                        onClick={handleDelete}
                        disabled={actionLoading}
                        startIcon={
                            actionLoading ? (
                                <CircularProgress
                                    size={17}
                                    color="inherit"
                                />
                            ) : (
                                <DeleteOutlined  />
                            )
                        }
                    >
                        Delete User
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}

function SummaryCard({ label, value, icon }) {
    return (
        <Paper
            elevation={0}
            sx={{
                p: 2.5,
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 3
            }}
        >
            <Stack
                direction="row"
                justifyContent="space-between"
                alignItems="center"
            >
                <Box>
                    <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ mb: 0.5 }}
                    >
                        {label}
                    </Typography>

                    <Typography
                        variant="h5"
                        fontWeight={800}
                    >
                        {value}
                    </Typography>
                </Box>

                <Box
                    sx={{
                        width: 42,
                        height: 42,
                        borderRadius: 2,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor:
                            'rgba(0, 168, 150, 0.10)',
                        color: 'secondary.main'
                    }}
                >
                    {icon}
                </Box>
            </Stack>
        </Paper>
    );
}