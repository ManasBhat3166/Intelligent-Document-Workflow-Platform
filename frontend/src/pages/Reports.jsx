
import { useEffect, useState } from 'react';
import {
    Alert,
    Box,
    Button,
    Card,
    CardContent,
    CircularProgress,
    Grid,
    MenuItem,
    Paper,
    Stack,
    TextField,
    Typography
} from '@mui/material';

import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell
} from 'recharts';

import DownloadIcon from '@mui/icons-material/Download';
import RefreshIcon from '@mui/icons-material/Refresh';
import api from '../api/axiosConfig';

const COLORS = ['#1E2761', '#00A896', '#ED6C02', '#D32F2F', '#4D5BA8'];

export default function Reports() {
    const [data, setData] = useState(null);
    const [overdue, setOverdue] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [reportType, setReportType] = useState('ALL');

    const loadReports = async () => {
        setLoading(true);
        setError('');

        try {
            const [analyticsResponse, overdueResponse] = await Promise.all([
                api.get('/analytics/summary'),
                api.get('/approvals/manager/overdue-reviewer').catch(() => ({
                    data: []
                }))
            ]);

            setData(analyticsResponse.data);
            setOverdue(overdueResponse.data || []);
        } catch (err) {
            setError(
                err.response?.data?.message ||
                'Unable to load reports. Please try again.'
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadReports();
    }, []);

    const exportCsv = () => {
        if (!data) return;

        const rows = [
            ['IDWP Platform Report', 'Value'],
            ['Report generated', new Date().toLocaleString()],
            ['Total documents', data.totalDocuments ?? 0],
            ['Processed documents', data.processedDocuments ?? 0],
            ['Failed documents', data.failedDocuments ?? 0],
            ['Pending approvals', data.pendingApprovalDocuments ?? 0],
            ['Approved documents', data.approvedDocuments ?? 0],
            ['Rejected documents', data.rejectedDocuments ?? 0],
            ['Overdue reviewer documents', overdue.length]
        ];

        const csv = rows
            .map(row => row.map(value =>
                `"${String(value).replace(/"/g, '""')}"`
            ).join(','))
            .join('\r\n');

        const blob = new Blob(['\uFEFF' + csv], {
            type: 'text/csv;charset=utf-8;'
        });

        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');

        link.href = url;
        link.download = 'IDWP-Report.csv';
        link.click();

        URL.revokeObjectURL(url);
    };

    if (loading) {
        return (
            <Box sx={{ py: 8, textAlign: 'center' }}>
                <CircularProgress />
                <Typography sx={{ mt: 2 }}>
                    Loading reports...
                </Typography>
            </Box>
        );
    }

    if (error) {
        return (
            <Alert
                severity="error"
                action={
                    <Button color="inherit" onClick={loadReports}>
                        Retry
                    </Button>
                }
            >
                {error}
            </Alert>
        );
    }

    if (!data) return null;

    const summaryCards = [
        { label: 'Total Documents', value: data.totalDocuments },
        { label: 'Processed', value: data.processedDocuments },
        { label: 'Failed', value: data.failedDocuments },
        { label: 'Pending Approval', value: data.pendingApprovalDocuments },
        { label: 'Approved', value: data.approvedDocuments },
        { label: 'Rejected', value: data.rejectedDocuments }
    ];

    const statusData = Object.entries(data.documentsByStatus || {})
        .map(([name, value]) => ({ name, value }));

    const typeData = Object.entries(data.documentsByType || {})
        .map(([name, value]) => ({ name, value }));

    const filteredUploads = (data.uploadsLast7Days || []).filter(item => {
        if (startDate && item.date < startDate) return false;
        if (endDate && item.date > endDate) return false;
        return true;
    });

    const reviewers = data.reviewerWorkload || [];

    return (
        <Box sx={{ maxWidth: 1400, mx: 'auto' }}>
            <Stack
                direction={{ xs: 'column', sm: 'row' }}
                justifyContent="space-between"
                alignItems={{ xs: 'flex-start', sm: 'center' }}
                spacing={2}
                sx={{ mb: 3 }}
            >
                <Box>
                    <Typography variant="h4" fontWeight={800}>
                        Reports
                    </Typography>
                    <Typography color="text.secondary" sx={{ mt: 1 }}>
                        Document processing, approvals and team performance.
                    </Typography>
                </Box>

                <Stack direction="row" spacing={1}>
                    <Button
                        variant="outlined"
                        startIcon={<RefreshIcon />}
                        onClick={loadReports}
                    >
                        Refresh
                    </Button>
                    <Button
                        variant="contained"
                        startIcon={<DownloadIcon />}
                        onClick={exportCsv}
                    >
                        Export CSV
                    </Button>
                </Stack>
            </Stack>

            <Paper
                variant="outlined"
                sx={{ p: 2, borderRadius: 3, mb: 3 }}
            >
                <Typography fontWeight={700} sx={{ mb: 2 }}>
                    Report Filters
                </Typography>

                <Grid container spacing={2}>
                    <Grid size={{ xs: 12, sm: 4 }}>
                        <TextField
                            fullWidth
                            select
                            label="Report Type"
                            value={reportType}
                            onChange={e => setReportType(e.target.value)}
                        >
                            <MenuItem value="ALL">All Reports</MenuItem>
                            <MenuItem value="PROCESSING">Processing</MenuItem>
                            <MenuItem value="APPROVAL">Approvals</MenuItem>
                            <MenuItem value="REVIEWER">Reviewer Workload</MenuItem>
                        </TextField>
                    </Grid>

                    <Grid size={{ xs: 12, sm: 4 }}>
                        <TextField
                            fullWidth
                            type="date"
                            label="Start Date"
                            InputLabelProps={{ shrink: true }}
                            value={startDate}
                            onChange={e => setStartDate(e.target.value)}
                        />
                    </Grid>

                    <Grid size={{ xs: 12, sm: 4 }}>
                        <TextField
                            fullWidth
                            type="date"
                            label="End Date"
                            InputLabelProps={{ shrink: true }}
                            value={endDate}
                            onChange={e => setEndDate(e.target.value)}
                        />
                    </Grid>
                </Grid>

                {startDate && endDate && startDate > endDate && (
                    <Alert severity="warning" sx={{ mt: 2 }}>
                        Start date must be before or equal to end date.
                    </Alert>
                )}
            </Paper>

            {(reportType === 'ALL' ||
                reportType === 'PROCESSING' ||
                reportType === 'APPROVAL') && (
                <Grid container spacing={2} sx={{ mb: 3 }}>
                    {summaryCards
                        .filter((_, index) =>
                            reportType === 'ALL' ||
                            (reportType === 'PROCESSING' && [0, 1, 2].includes(index)) ||
                            (reportType === 'APPROVAL' && [0, 3, 4, 5].includes(index))
                        )
                        .map(card => (
                            <Grid
                                size={{ xs: 12, sm: 6, md: 4, lg: 2 }}
                                key={card.label}
                            >
                                <Card
                                    elevation={0}
                                    sx={{
                                        height: '100%',
                                        border: '1px solid',
                                        borderColor: 'divider',
                                        borderRadius: 3
                                    }}
                                >
                                    <CardContent>
                                        <Typography
                                            variant="body2"
                                            color="text.secondary"
                                        >
                                            {card.label}
                                        </Typography>
                                        <Typography variant="h4" fontWeight={800}>
                                            {card.value ?? 0}
                                        </Typography>
                                    </CardContent>
                                </Card>
                            </Grid>
                        ))}
                </Grid>
            )}

            {(reportType === 'ALL' || reportType === 'PROCESSING') && (
                <Grid container spacing={3} sx={{ mb: 3 }}>
                    <Grid size={{ xs: 12, md: 6 }}>
                        <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 3 }}>
                            <Typography variant="h6" fontWeight={700}>
                                Documents by Processing Status
                            </Typography>

                            <Box sx={{ height: 320, mt: 2 }}>
                                {statusData.length ? (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={statusData}>
                                            <XAxis dataKey="name" />
                                            <YAxis allowDecimals={false} />
                                            <Tooltip />
                                            <Bar
                                                dataKey="value"
                                                name="Documents"
                                                fill="#1E2761"
                                                radius={[5, 5, 0, 0]}
                                            />
                                        </BarChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <Typography color="text.secondary">
                                        No status data available.
                                    </Typography>
                                )}
                            </Box>
                        </Paper>
                    </Grid>

                    <Grid size={{ xs: 12, md: 6 }}>
                        <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 3 }}>
                            <Typography variant="h6" fontWeight={700}>
                                Documents by Type
                            </Typography>

                            <Box sx={{ height: 320, mt: 2 }}>
                                {typeData.length ? (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={typeData}
                                                dataKey="value"
                                                nameKey="name"
                                                outerRadius={100}
                                                label
                                            >
                                                {typeData.map((item, index) => (
                                                    <Cell
                                                        key={item.name}
                                                        fill={COLORS[index % COLORS.length]}
                                                    />
                                                ))}
                                            </Pie>
                                            <Tooltip />
                                        </PieChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <Typography color="text.secondary">
                                        No document type data available.
                                    </Typography>
                                )}
                            </Box>
                        </Paper>
                    </Grid>

                    <Grid size={{ xs: 12 }}>
                        <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 3 }}>
                            <Typography variant="h6" fontWeight={700}>
                                Upload Activity
                            </Typography>

                            <Typography variant="body2" color="text.secondary">
                                Available upload history from the analytics API.
                            </Typography>

                            <Box sx={{ height: 300, mt: 2 }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={filteredUploads}>
                                        <XAxis dataKey="date" />
                                        <YAxis allowDecimals={false} />
                                        <Tooltip />
                                        <Bar
                                            dataKey="count"
                                            name="Uploads"
                                            fill="#00A896"
                                            radius={[5, 5, 0, 0]}
                                        />
                                    </BarChart>
                                </ResponsiveContainer>
                            </Box>
                        </Paper>
                    </Grid>
                </Grid>
            )}

            {(reportType === 'ALL' || reportType === 'REVIEWER') && (
                <Paper
                    variant="outlined"
                    sx={{ p: 2.5, borderRadius: 3, mb: 3 }}
                >
                    <Typography variant="h6" fontWeight={700}>
                        Reviewer Performance Report
                    </Typography>

                    <Typography color="text.secondary" variant="body2" sx={{ mb: 2 }}>
                        Pending assignments and completed reviewer-stage work.
                    </Typography>

                    {reviewers.length === 0 ? (
                        <Alert severity="info">No reviewer workload data available.</Alert>
                    ) : (
                        <Box sx={{ overflowX: 'auto' }}>
                            <Box
                                component="table"
                                sx={{
                                    width: '100%',
                                    borderCollapse: 'collapse',
                                    '& th, & td': {
                                        p: 1.5,
                                        textAlign: 'left',
                                        borderBottom: '1px solid',
                                        borderColor: 'divider'
                                    }
                                }}
                            >
                                <thead>
                                <tr>
                                    <th>Reviewer</th>
                                    <th>Pending</th>
                                    <th>Completed</th>
                                </tr>
                                </thead>
                                <tbody>
                                {reviewers.map(reviewer => (
                                    <tr key={reviewer.reviewerId}>
                                        <td>{reviewer.reviewerEmail}</td>
                                        <td>{reviewer.pendingDocuments}</td>
                                        <td>{reviewer.completedReviews}</td>
                                    </tr>
                                ))}
                                </tbody>
                            </Box>
                        </Box>
                    )}
                </Paper>
            )}

            {(reportType === 'ALL' || reportType === 'REVIEWER') && (
                <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 3 }}>
                    <Stack
                        direction={{ xs: 'column', sm: 'row' }}
                        justifyContent="space-between"
                        spacing={1}
                    >
                        <Box>
                            <Typography variant="h6" fontWeight={700}>
                                Overdue Reviewer Report
                            </Typography>
                            <Typography color="text.secondary" variant="body2">
                                Documents awaiting reviewer action for more than 24 hours.
                            </Typography>
                        </Box>
                        <Typography fontWeight={700}>
                            Total overdue: {overdue.length}
                        </Typography>
                    </Stack>

                    {overdue.length === 0 ? (
                        <Alert severity="success" sx={{ mt: 2 }}>
                            No overdue reviewer documents found, or none were returned by the API.
                        </Alert>
                    ) : (
                        <Box sx={{ overflowX: 'auto', mt: 2 }}>
                            <Box
                                component="table"
                                sx={{
                                    width: '100%',
                                    borderCollapse: 'collapse',
                                    '& th, & td': {
                                        p: 1.5,
                                        textAlign: 'left',
                                        borderBottom: '1px solid',
                                        borderColor: 'divider'
                                    }
                                }}
                            >
                                <thead>
                                <tr>
                                    <th>Document</th>
                                    <th>Assigned Reviewer</th>
                                    <th>Assigned At</th>
                                </tr>
                                </thead>
                                <tbody>
                                {overdue.map(doc => (
                                    <tr key={doc.id}>
                                        <td>{doc.originalFileName || 'Unnamed document'}</td>
                                        <td>{doc.assignedReviewerEmail || 'Unassigned'}</td>
                                        <td>
                                            {doc.assignedReviewerAt
                                                ? new Date(doc.assignedReviewerAt).toLocaleString()
                                                : 'Unavailable'}
                                        </td>
                                    </tr>
                                ))}
                                </tbody>
                            </Box>
                        </Box>
                    )}
                </Paper>
            )}
        </Box>
    );
}
