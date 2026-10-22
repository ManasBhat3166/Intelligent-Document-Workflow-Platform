import { useEffect, useState } from 'react';
import {
    Alert,
    Box,
    Button,
    Card,
    CardContent,
    Chip,
    CircularProgress,
    Divider,
    Grid,
    Paper,
    Stack,
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
    Cell,
    LineChart,
    Line,
    CartesianGrid,
    Legend
} from 'recharts';

import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import CancelOutlinedIcon from '@mui/icons-material/CancelOutlined';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';

import api from '../api/axiosConfig';
import { getApiErrorMessage } from '../utils/apiError';

const CHART_COLORS = [
    '#1E2761',
    '#00A896',
    '#4D5BA8',
    '#2E7D32',
    '#ED6C02',
    '#D32F2F'
];


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


function formatWaitingDuration(assignedAt) {
    if (!assignedAt) {
        return 'Unavailable';
    }

    const assignedTime = new Date(assignedAt).getTime();

    if (Number.isNaN(assignedTime)) {
        return 'Unavailable';
    }

    const elapsedMs = Math.max(0, Date.now() - assignedTime);
    const totalHours = Math.floor(elapsedMs / (1000 * 60 * 60));

    const days = Math.floor(totalHours / 24);
    const hours = totalHours % 24;

    if (days > 0) {
        return `${days} day${days !== 1 ? 's' : ''}, ${hours} hour${hours !== 1 ? 's' : ''}`;
    }

    return `${totalHours} hour${totalHours !== 1 ? 's' : ''}`;
}


function StatCard({ label, value, icon, description }) {
    return (
        <Card
            elevation={0}
            sx={{
                height: '100%',
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 3,
                transition: 'all 0.2s ease',
                '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: '0 8px 24px rgba(30, 39, 97, 0.08)'
                }
            }}
        >
            <CardContent sx={{ p: 2.5 }}>
                <Stack
                    direction="row"
                    justifyContent="space-between"
                    alignItems="flex-start"
                    spacing={2}
                >
                    <Box>
                        <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{ mb: 1 }}
                        >
                            {label}
                        </Typography>

                        <Typography
                            variant="h4"
                            fontWeight={800}
                            sx={{ lineHeight: 1.1 }}
                        >
                            {value ?? 0}
                        </Typography>

                        {description && (
                            <Typography
                                variant="caption"
                                color="text.secondary"
                                sx={{ display: 'block', mt: 1 }}
                            >
                                {description}
                            </Typography>
                        )}
                    </Box>

                    <Box
                        sx={{
                            width: 44,
                            height: 44,
                            borderRadius: 2,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            backgroundColor: 'rgba(30, 39, 97, 0.08)',
                            color: 'primary.main',
                            flexShrink: 0
                        }}
                    >
                        {icon}
                    </Box>
                </Stack>
            </CardContent>
        </Card>
    );
}

function ChartCard({ title, subtitle, children }) {
    return (
        <Paper
            elevation={0}
            sx={{
                p: { xs: 2, sm: 2.5 },
                height: '100%',
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 3
            }}
        >
            <Typography variant="h6" fontWeight={700}>
                {title}
            </Typography>

            {subtitle && (
                <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mt: 0.5, mb: 2 }}
                >
                    {subtitle}
                </Typography>
            )}

            {!subtitle && <Box sx={{ mb: 2 }} />}

            {children}
        </Paper>
    );
}

export default function Analytics() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [overdueDocuments, setOverdueDocuments] = useState([]);
    const [overdueError, setOverdueError] = useState('');

    const fetchAnalytics = async () => {
        setLoading(true);
        setError('');

        try {
            const response = await api.get('/analytics/summary');
            setData(response.data);
            try {
                const overdueResponse = await api.get(
                    '/approvals/manager/overdue-reviewer'
                );
                setOverdueDocuments(overdueResponse.data || []);
            } catch (err) {
                console.error('Failed to load overdue reviews:', err);
                setOverdueError('Unable to load overdue reviews.');
            }
        } catch (err) {
            console.error('Failed to load analytics:', err);

            setError(
                getApiErrorMessage(
                    err,
                    'Unable to load analytics data. Please try again.'
                )
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAnalytics();
    }, []);

    if (loading) {
        return (
            <Box
                sx={{
                    minHeight: '60vh',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}
            >
                <Stack alignItems="center" spacing={2}>
                    <CircularProgress />
                    <Typography color="text.secondary">
                        Loading analytics...
                    </Typography>
                </Stack>
            </Box>
        );
    }

    if (error) {
        return (
            <Box>
                <Alert severity="error" sx={{ mb: 2 }}>
                    {error}
                </Alert>
            </Box>
        );
    }

    if (!data) {
        return null;
    }

    const typeData = Object.entries(
        data.documentsByType || {}
    ).map(([name, value]) => ({
        name,
        value
    }));

    const statusData = Object.entries(
        data.documentsByStatus || {}
    ).map(([name, value]) => ({
        name,
        value
    }));

    const uploadsData = (data.uploadsLast7Days || []).map((item) => ({
        date: item.date,
        count: item.count
    }));

    const processedPercentage =
        data.totalDocuments > 0
            ? Math.round(
                (data.processedDocuments / data.totalDocuments) * 100
            )
            : 0;

    const approvalPercentage =
        data.totalDocuments > 0
            ? Math.round(
                (data.approvedDocuments / data.totalDocuments) * 100
            )
            : 0;

    return (
        <Box sx={{ maxWidth: 1400, mx: 'auto' }}>
            {/* Header */}
            <Box sx={{ mb: 4 }}>
                <Stack
                    direction={{ xs: 'column', sm: 'row' }}
                    justifyContent="space-between"
                    alignItems={{ xs: 'flex-start', sm: 'center' }}
                    spacing={2}
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
                                <TrendingUpIcon />
                            </Box>

                            <Typography variant="h4">
                                Analytics
                            </Typography>
                        </Stack>

                        <Typography
                            variant="body1"
                            color="text.secondary"
                        >
                            Monitor document processing, approvals, and upload
                            activity across the platform.
                        </Typography>
                    </Box>

                    <Chip
                        icon={<AutoAwesomeIcon />}
                        label="Live Platform Insights"
                        color="secondary"
                        variant="outlined"
                        sx={{ fontWeight: 600 }}
                    />
                </Stack>
            </Box>

            {/* Summary Cards */}
            <Grid
                container
                spacing={2}
                sx={{ mb: 3 }}
            >
                <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2 }}>
                    <StatCard
                        label="Total Documents"
                        value={data.totalDocuments}
                        description="All uploaded documents"
                        icon={<DescriptionOutlinedIcon />}
                    />
                </Grid>

                <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2 }}>
                    <StatCard
                        label="Processed"
                        value={data.processedDocuments}
                        description={`${processedPercentage}% of total`}
                        icon={<DescriptionOutlinedIcon />}
                    />
                </Grid>

                <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2 }}>
                    <StatCard
                        label="Failed"
                        value={data.failedDocuments}
                        description="Processing failures"
                        icon={<DescriptionOutlinedIcon />}
                    />
                </Grid>

                <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2 }}>
                    <StatCard
                        label="Pending Approval"
                        value={data.pendingApprovalDocuments}
                        description="Awaiting action"
                        icon={<DescriptionOutlinedIcon />}
                    />
                </Grid>

                <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2 }}>
                    <StatCard
                        label="Approved"
                        value={data.approvedDocuments}
                        description={`${approvalPercentage}% of total`}
                        icon={<DescriptionOutlinedIcon />}
                    />
                </Grid>

                <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2 }}>
                    <StatCard
                        label="Rejected"
                        value={data.rejectedDocuments}
                        description="Rejected documents"
                        icon={<CancelOutlinedIcon />}
                    />
                </Grid>
            </Grid>

            {/* Main Charts */}
            <Grid
                container
                spacing={3}
                sx={{ mb: 3 }}
            >
                {/* Documents by Type */}
                <Grid size={{ xs: 12, md: 6 }}>
                    <ChartCard
                        title="Documents by Type"
                        subtitle="Distribution of uploaded document categories"
                    >
                        <Button
                            variant="outlined"
                            size="small"
                            sx={{ mb: 2 }}
                            onClick={() =>
                                downloadCsv(
                                    'documents-by-type.csv',
                                    ['Document Type', 'Count'],
                                    typeData.map(item => [item.name, item.value])
                                )
                            }
                        >
                            Download CSV
                        </Button>
                        {typeData.length > 0 ? (
                            <ResponsiveContainer
                                width="100%"
                                height={320}
                            >
                                <PieChart>
                                    <Pie
                                        data={typeData}
                                        dataKey="value"
                                        nameKey="name"
                                        cx="50%"
                                        cy="45%"
                                        outerRadius={95}
                                        innerRadius={50}
                                        paddingAngle={2}
                                        label
                                    >
                                        {typeData.map((_, index) => (
                                            <Cell
                                                key={index}
                                                fill={
                                                    CHART_COLORS[
                                                    index %
                                                    CHART_COLORS.length
                                                        ]
                                                }
                                            />
                                        ))}
                                    </Pie>

                                    <Tooltip />

                                    <Legend
                                        verticalAlign="bottom"
                                        height={36}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <EmptyChart message="No document type data available." />
                        )}
                    </ChartCard>
                </Grid>

                {/* Documents by Status */}
                <Grid size={{ xs: 12, md: 6 }}>
                    <ChartCard
                        title="Documents by Processing Status"
                        subtitle="Current processing state of documents"
                    >

                        <Button
                            variant="outlined"
                            size="small"
                            sx={{ mb: 2 }}
                            onClick={() =>
                                downloadCsv(
                                    'documents-by-status.csv',
                                    ['Processing Status', 'Count'],
                                    statusData.map(item => [item.name, item.value])
                                )
                            }
                        >
                            Download CSV
                        </Button>

                        {statusData.length > 0 ? (
                            <ResponsiveContainer
                                width="100%"
                                height={320}
                            >
                                <BarChart
                                    data={statusData}
                                    margin={{
                                        top: 10,
                                        right: 10,
                                        left: -15,
                                        bottom: 10
                                    }}
                                >
                                    <CartesianGrid
                                        strokeDasharray="3 3"
                                    />

                                    <XAxis
                                        dataKey="name"
                                        tick={{ fontSize: 12 }}
                                    />

                                    <YAxis
                                        allowDecimals={false}
                                        tick={{ fontSize: 12 }}
                                    />

                                    <Tooltip />

                                    <Bar
                                        dataKey="value"
                                        name="Documents"
                                        fill="#1E2761"
                                        radius={[6, 6, 0, 0]}
                                    />
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <EmptyChart message="No processing status data available." />
                        )}
                    </ChartCard>
                </Grid>

                {/* Upload Trend */}
                <Grid size={{ xs: 12 }}>
                    <ChartCard
                        title="Upload Activity"
                        subtitle="Document uploads over the last 7 days"
                    >

                        <Button
                            variant="outlined"
                            size="small"
                            sx={{ mb: 2 }}
                            onClick={() =>
                                downloadCsv(
                                    'upload-activity-last-7-days.csv',
                                    ['Date', 'Uploads'],
                                    uploadsData.map(item => [item.date, item.count])
                                )
                            }
                        >
                            Download CSV
                        </Button>

                        {uploadsData.length > 0 ? (
                            <ResponsiveContainer
                                width="100%"
                                height={330}
                            >
                                <LineChart
                                    data={uploadsData}
                                    margin={{
                                        top: 10,
                                        right: 20,
                                        left: -15,
                                        bottom: 10
                                    }}
                                >
                                    <CartesianGrid
                                        strokeDasharray="3 3"
                                    />

                                    <XAxis
                                        dataKey="date"
                                        tick={{ fontSize: 12 }}
                                    />

                                    <YAxis
                                        allowDecimals={false}
                                        tick={{ fontSize: 12 }}
                                    />

                                    <Tooltip />

                                    <Legend />

                                    <Line
                                        type="monotone"
                                        dataKey="count"
                                        name="Uploads"
                                        stroke="#00A896"
                                        strokeWidth={3}
                                        dot={{ r: 4 }}
                                        activeDot={{ r: 6 }}
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        ) : (
                            <EmptyChart message="No upload activity available." />
                        )}
                    </ChartCard>
                </Grid>
            </Grid>

            {/* Reviewer Workload */}
            <Paper
                elevation={0}
                sx={{
                    p: { xs: 2, sm: 3 },
                    mb: 3,
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 3
                }}
            >
                <Typography variant="h6" fontWeight={700}>
                    Reviewer Workload
                </Typography>

                <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mt: 0.5, mb: 2 }}
                >
                    Monitor pending documents and completed reviewer-stage work.
                </Typography>


                <Button
                    variant="outlined"
                    size="small"
                    sx={{ mb: 2 }}
                    onClick={() =>
                        downloadCsv(
                            'reviewer-workload.csv',
                            [
                                'Reviewer Email',
                                'Pending Documents',
                                'Completed Reviews'
                            ],
                            (data.reviewerWorkload || []).map(item => [
                                item.reviewerEmail,
                                item.pendingDocuments,
                                item.completedReviews
                            ])
                        )
                    }
                >
                    Download CSV
                </Button>


                <Divider sx={{ mb: 2 }} />

                {(data.reviewerWorkload || []).length > 0 ? (
                    <Box sx={{ overflowX: 'auto' }}>
                        <Box sx={{ minWidth: 500 }}>
                            <Grid
                                container
                                spacing={2}
                                sx={{
                                    pb: 1.5,
                                    borderBottom: '1px solid',
                                    borderColor: 'divider'
                                }}
                            >
                                <Grid size={{ xs: 6 }}>
                                    <Typography
                                        variant="subtitle2"
                                        fontWeight={700}
                                    >
                                        Reviewer
                                    </Typography>
                                </Grid>

                                <Grid size={{ xs: 3 }}>
                                    <Typography
                                        variant="subtitle2"
                                        fontWeight={700}
                                    >
                                        Pending
                                    </Typography>
                                </Grid>

                                <Grid size={{ xs: 3 }}>
                                    <Typography
                                        variant="subtitle2"
                                        fontWeight={700}
                                    >
                                        Completed
                                    </Typography>
                                </Grid>
                            </Grid>

                            {data.reviewerWorkload.map((reviewer) => (
                                <Grid
                                    container
                                    spacing={2}
                                    key={reviewer.reviewerId}
                                    alignItems="center"
                                    sx={{
                                        py: 2,
                                        borderBottom: '1px solid',
                                        borderColor: 'divider',
                                        '&:last-child': {
                                            borderBottom: 0
                                        }
                                    }}
                                >
                                    <Grid size={{ xs: 6 }}>
                                        <Typography
                                            variant="body2"
                                            sx={{
                                                overflowWrap: 'anywhere'
                                            }}
                                        >
                                            {reviewer.reviewerEmail}
                                        </Typography>
                                    </Grid>

                                    <Grid size={{ xs: 3 }}>
                                        <Chip
                                            label={reviewer.pendingDocuments}
                                            color={
                                                reviewer.pendingDocuments > 0
                                                    ? 'warning'
                                                    : 'success'
                                            }
                                            size="small"
                                        />
                                    </Grid>

                                    <Grid size={{ xs: 3 }}>
                                        <Chip
                                            label={reviewer.completedReviews}
                                            color="primary"
                                            size="small"
                                        />
                                    </Grid>
                                </Grid>
                            ))}
                        </Box>
                    </Box>
                ) : (
                    <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ py: 2 }}
                    >
                        No active reviewers found.
                    </Typography>
                )}
            </Paper>

            {/* Reviewer Workload Comparison Chart */}
            <Box sx={{ mb: 3 }}>
                <ChartCard
                    title="Reviewer Workload Comparison"
                    subtitle="Compare pending documents against completed reviewer-stage documents"
                >
                    {(data.reviewerWorkload || []).length > 0 ? (
                        <ResponsiveContainer width="100%" height={350}>
                            <BarChart
                                data={data.reviewerWorkload.map((reviewer) => ({
                                    reviewer: reviewer.reviewerEmail,
                                    pending: reviewer.pendingDocuments,
                                    completed: reviewer.completedReviews
                                }))}
                                margin={{
                                    top: 10,
                                    right: 20,
                                    left: 0,
                                    bottom: 60
                                }}
                            >
                                <CartesianGrid strokeDasharray="3 3" />

                                <XAxis
                                    dataKey="reviewer"
                                    interval={0}
                                    angle={-25}
                                    textAnchor="end"
                                    height={80}
                                    tick={{ fontSize: 11 }}
                                />

                                <YAxis
                                    allowDecimals={false}
                                    tick={{ fontSize: 12 }}
                                />

                                <Tooltip />

                                <Legend />

                                <Bar
                                    dataKey="pending"
                                    name="Pending Documents"
                                    fill="#ED6C02"
                                    radius={[4, 4, 0, 0]}
                                />

                                <Bar
                                    dataKey="completed"
                                    name="Completed Reviews"
                                    fill="#00A896"
                                    radius={[4, 4, 0, 0]}
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <EmptyChart message="No reviewer workload data available." />
                    )}
                </ChartCard>
            </Box>


            {/* Overdue Reviewer Documents */}
            <Paper
                elevation={0}
                sx={{
                    p: { xs: 2, sm: 3 },
                    mb: 3,
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 3
                }}
            >
                <Stack
                    direction={{ xs: 'column', sm: 'row' }}
                    justifyContent="space-between"
                    alignItems={{ xs: 'flex-start', sm: 'center' }}
                    spacing={1}
                    sx={{ mb: 1 }}
                >
                    <Typography variant="h6" fontWeight={700}>
                        Overdue Reviewer Documents
                    </Typography>

                    <Chip
                        label={`${overdueDocuments.length} overdue`}
                        color={overdueDocuments.length > 0 ? 'error' : 'success'}
                    />
                </Stack>

                <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mb: 2 }}
                >
                    Documents awaiting reviewer action for more than 24 hours.
                </Typography>


                <Button
                    variant="outlined"
                    size="small"
                    sx={{ mb: 2 }}
                    onClick={() =>
                        downloadCsv(
                            'overdue-reviewer-documents.csv',
                            [
                                'Document ID',
                                'File Name',
                                'Reviewer Email',
                                'Assigned At'
                            ],
                            (overdueDocuments || []).map(item => [
                                item.id,
                                item.originalFileName,
                                item.assignedReviewerEmail,
                                item.assignedReviewerAt
                            ])
                        )
                    }
                >
                    Download CSV
                </Button>


                <Divider sx={{ mb: 2 }} />

                {overdueError ? (
                    <Alert severity="warning">{overdueError}</Alert>
                ) : overdueDocuments.length === 0 ? (
                    <Alert severity="success">
                        No overdue reviewer documents found.
                    </Alert>
                ) : (
                    <Box sx={{ overflowX: 'auto' }}>
                        <Box sx={{ minWidth: 600 }}>
                            <Grid
                                container
                                spacing={2}
                                sx={{
                                    pb: 1.5,
                                    borderBottom: '1px solid',
                                    borderColor: 'divider'
                                }}
                            >
                                <Grid size={{ xs: 5 }}>
                                    <Typography variant="subtitle2" fontWeight={700}>
                                        Document
                                    </Typography>
                                </Grid>

                                <Grid size={{ xs: 4 }}>
                                    <Typography variant="subtitle2" fontWeight={700}>
                                        Assigned Reviewer
                                    </Typography>
                                </Grid>

                                <Grid size={{ xs: 3 }}>
                                    <Typography variant="subtitle2" fontWeight={700}>
                                        Waiting Time
                                    </Typography>
                                </Grid>
                            </Grid>

                            {overdueDocuments.map((doc) => (
                                <Grid
                                    container
                                    spacing={2}
                                    key={doc.id}
                                    alignItems="center"
                                    sx={{
                                        py: 2,
                                        borderBottom: '1px solid',
                                        borderColor: 'divider',
                                        '&:last-child': { borderBottom: 0 }
                                    }}
                                >
                                    <Grid size={{ xs: 5 }}>
                                        <Typography
                                            variant="body2"
                                            fontWeight={600}
                                            sx={{ overflowWrap: 'anywhere' }}
                                        >
                                            {doc.originalFileName || 'Unnamed document'}
                                        </Typography>

                                        <Chip
                                            label="Overdue > 24h"
                                            color="error"
                                            size="small"
                                            sx={{ mt: 0.75 }}
                                        />
                                    </Grid>

                                    <Grid size={{ xs: 4 }}>
                                        <Typography
                                            variant="body2"
                                            sx={{ overflowWrap: 'anywhere' }}
                                        >
                                            {doc.assignedReviewerEmail || 'Unassigned'}
                                        </Typography>
                                    </Grid>

                                    <Grid size={{ xs: 3 }}>
                                        <Typography variant="body2" fontWeight={600}>
                                            {formatWaitingDuration(doc.assignedReviewerAt)}
                                        </Typography>
                                    </Grid>
                                </Grid>
                            ))}
                        </Box>
                    </Box>
                )}
            </Paper>



            {/* Insights */}
            <Paper
                elevation={0}
                sx={{
                    p: { xs: 2, sm: 3 },
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 3
                }}
            >
                <Typography
                    variant="h6"
                    fontWeight={700}
                    sx={{ mb: 2 }}
                >
                    Platform Overview
                </Typography>

                <Divider sx={{ mb: 2 }} />

                <Grid container spacing={2}>
                    <Grid size={{ xs: 12, md: 4 }}>
                        <InsightItem
                            label="Processing Rate"
                            value={`${processedPercentage}%`}
                            description="Documents successfully processed"
                        />
                    </Grid>

                    <Grid size={{ xs: 12, md: 4 }}>
                        <InsightItem
                            label="Approval Rate"
                            value={`${approvalPercentage}%`}
                            description="Documents that reached approval"
                        />
                    </Grid>

                    <Grid size={{ xs: 12, md: 4 }}>
                        <InsightItem
                            label="Needs Attention"
                            value={
                                (data.failedDocuments || 0) +
                                (data.pendingApprovalDocuments || 0)
                            }
                            description="Failed or awaiting approval"
                        />
                    </Grid>
                </Grid>
            </Paper>
        </Box>
    );
}

function EmptyChart({ message }) {
    return (
        <Box
            sx={{
                height: 320,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
            }}
        >
            <Typography
                variant="body2"
                color="text.secondary"
            >
                {message}
            </Typography>
        </Box>
    );
}

function InsightItem({ label, value, description }) {
    return (
        <Box
            sx={{
                p: 2,
                borderRadius: 2,
                backgroundColor: 'background.default'
            }}
        >
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

            <Typography
                variant="caption"
                color="text.secondary"
            >
                {description}
            </Typography>
        </Box>
    );
}