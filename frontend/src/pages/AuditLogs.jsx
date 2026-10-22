
import { useEffect, useState } from 'react';
import {
    Alert,
    Box,
    Button,
    Chip,
    CircularProgress,
    MenuItem,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TextField,
    Typography,
} from '@mui/material';
import HistoryOutlinedIcon from '@mui/icons-material/HistoryOutlined';
import api from '../api/axiosConfig';

const formatDateTime = (dateTime) => {
    if (!dateTime) return '—';

    const date = new Date(dateTime);

    if (Number.isNaN(date.getTime())) return '—';

    return date.toLocaleString();
};

const getActionColor = (action) => {
    switch (action?.toUpperCase()) {
        case 'APPROVED':
            return 'success';
        case 'REJECTED':
            return 'error';
        case 'SUBMITTED':
            return 'info';
        case 'REASSIGNED':
            return 'warning';
        default:
            return 'default';
    }
};


function downloadCsv(filename, headers, rows) {
    const escapeCsv = (value) => {
        const text = String(value ?? '');
        return `"${text.replace(/"/g, '""')}"`;
    };

    const csvContent = [
        headers.map(escapeCsv).join(','),
        ...rows.map(row => row.map(escapeCsv).join(','))
    ].join('\r\n');

    const blob = new Blob(
        ['\uFEFF' + csvContent],
        { type: 'text/csv;charset=utf-8;' }
    );

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');

    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();

    URL.revokeObjectURL(url);
}


export default function AuditLogs() {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [actionFilter, setActionFilter] = useState('ALL');
    const [emailFilter, setEmailFilter] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');


    const filteredLogs = logs.filter((log) => {
        const matchesAction =
            actionFilter === 'ALL' ||
            log.action?.toUpperCase() === actionFilter;

        const matchesEmail = (
            log.actionByEmail || ''
        )
            .toLowerCase()
            .includes(emailFilter.toLowerCase().trim());

        const logDate = log.actionAt
            ? new Date(log.actionAt)
            : null;

        const matchesStartDate =
            !startDate ||
            (logDate &&
                !Number.isNaN(logDate.getTime()) &&
                logDate >= new Date(`${startDate}T00:00:00`));

        const matchesEndDate =
            !endDate ||
            (logDate &&
                !Number.isNaN(logDate.getTime()) &&
                logDate <= new Date(`${endDate}T23:59:59.999`));

        return (
            matchesAction &&
            matchesEmail &&
            matchesStartDate &&
            matchesEndDate
        );
    });


    useEffect(() => {
        const fetchAuditLogs = async () => {
            try {
                setLoading(true);
                setError('');

                const response = await api.get('/approvals/admin/audit-logs');
                setLogs(Array.isArray(response.data) ? response.data : []);
            } catch (err) {
                console.error('Failed to load audit logs:', err);
                setError(
                    err.response?.data?.message ||
                    'Unable to load audit logs. Please try again.'
                );
            } finally {
                setLoading(false);
            }
        };

        fetchAuditLogs();
    }, []);

    return (
        <Box sx={{ p: { xs: 2, md: 3 } }}>
            <Box
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1.5,
                    mb: 1,
                }}
            >
                <HistoryOutlinedIcon sx={{ fontSize: 30, color: '#14b8a6' }} />

                <Typography variant="h4" fontWeight={700}>
                    Audit Logs
                </Typography>
            </Box>

            <Typography color="text.secondary" sx={{ mb: 3 }}>
                Review document workflow actions and administrative activity.
            </Typography>


            {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                    {error}
                </Alert>
            )}

            <Paper
                elevation={0}
                sx={{
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 3,
                    overflow: 'hidden',
                }}
            >
                <Box
                    sx={{
                        p: 2.5,
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        gap: 2,
                    }}
                >
                    <Box>
                        <Typography variant="h6" fontWeight={700}>
                            Activity History
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            {filteredLogs.length} matching{' '}
                            {filteredLogs.length === 1 ? 'action' : 'actions'}
                        </Typography>
                    </Box>
                </Box>


                <Box
                    sx={{
                        px: 2.5,
                        pb: 2.5,
                        display: 'flex',
                        gap: 2,
                        flexWrap: 'wrap',
                        alignItems: 'center',
                    }}
                >
                    <TextField
                        select
                        label="Action Type"
                        value={actionFilter}
                        onChange={(e) => setActionFilter(e.target.value)}
                        size="small"
                        sx={{ minWidth: 180 }}
                    >
                        <MenuItem value="ALL">All Actions</MenuItem>
                        <MenuItem value="SUBMITTED">Submitted</MenuItem>
                        <MenuItem value="APPROVED">Approved</MenuItem>
                        <MenuItem value="REJECTED">Rejected</MenuItem>
                        <MenuItem value="REASSIGNED">Reassigned</MenuItem>
                    </TextField>

                    <TextField
                        label="Search User Email"
                        value={emailFilter}
                        onChange={(e) => setEmailFilter(e.target.value)}
                        size="small"
                        sx={{ minWidth: 220 }}
                    />

                    <TextField
                        label="Start Date"
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        size="small"
                        slotProps={{ inputLabel: { shrink: true } }}
                    />

                    <TextField
                        label="End Date"
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        size="small"
                        slotProps={{ inputLabel: { shrink: true } }}
                    />

                    <Button
                        variant="outlined"
                        onClick={() => {
                            setActionFilter('ALL');
                            setEmailFilter('');
                            setStartDate('');
                            setEndDate('');
                        }}
                    >
                        Reset Filters
                    </Button>


                    <Button
                        variant="contained"
                        size="small"
                        onClick={() =>
                            downloadCsv(
                                'audit-log-report.csv',
                                [
                                    'Document ID',
                                    'Action',
                                    'Action By',
                                    'User Role',
                                    'Comment',
                                    'Action Date'
                                ],
                                (logs || []).map(item => [
                                    item.documentId,
                                    item.action,
                                    item.actionByUserEmail,
                                    item.actionByUserRole,
                                    item.comment,
                                    item.actionAt
                                ])
                            )
                        }
                    >
                        Export Audit Log CSV
                    </Button>

                </Box>



                {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', p: 6 }}>
                        <CircularProgress />
                    </Box>
                ) : (
                    <TableContainer>
                        <Table>
                            <TableHead>
                                <TableRow sx={{ backgroundColor: 'action.hover' }}>
                                    <TableCell>
                                        <strong>Action</strong>
                                    </TableCell>
                                    <TableCell>
                                        <strong>Performed By</strong>
                                    </TableCell>
                                    <TableCell>
                                        <strong>Role</strong>
                                    </TableCell>
                                    <TableCell>
                                        <strong>Document ID</strong>
                                    </TableCell>
                                    <TableCell>
                                        <strong>Comment</strong>
                                    </TableCell>
                                    <TableCell>
                                        <strong>Date &amp; Time</strong>
                                    </TableCell>
                                </TableRow>
                            </TableHead>

                            <TableBody>
                                {filteredLogs.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} align="center" sx={{ py: 6 }}>
                                            <Typography color="text.secondary">
                                                {logs.length === 0
                                                    ? 'No audit activity recorded yet.'
                                                    : 'No audit logs match your filters.'}
                                            </Typography>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredLogs.map((log, index) => (
                                        <TableRow
                                            key={log.id || `${log.documentId}-${log.actionAt}-${index}`}
                                            hover
                                        >
                                            <TableCell>
                                                <Chip
                                                    label={log.action || 'UNKNOWN'}
                                                    color={getActionColor(log.action)}
                                                    size="small"
                                                />
                                            </TableCell>

                                            <TableCell>
                                                <Typography variant="body2">
                                                    {log.actionByEmail || log.actionByUserId || '—'}
                                                </Typography>
                                            </TableCell>

                                            <TableCell>
                                                {log.actionByRole ? (
                                                    <Chip
                                                        label={log.actionByRole}
                                                        size="small"
                                                        variant="outlined"
                                                    />
                                                ) : (
                                                    '—'
                                                )}
                                            </TableCell>

                                            <TableCell>
                                                <Typography
                                                    variant="body2"
                                                    sx={{
                                                        maxWidth: 180,
                                                        overflowWrap: 'anywhere',
                                                    }}
                                                >
                                                    {log.documentId || '—'}
                                                </Typography>
                                            </TableCell>

                                            <TableCell>
                                                <Typography
                                                    variant="body2"
                                                    sx={{ minWidth: 150, maxWidth: 280 }}
                                                >
                                                    {log.comment || '—'}
                                                </Typography>
                                            </TableCell>

                                            <TableCell sx={{ minWidth: 180 }}>
                                                {formatDateTime(log.actionAt)}
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>
                )}
            </Paper>
        </Box>
    );
}
