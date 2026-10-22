import { useEffect, useState } from 'react';

import {
    Alert,
    Avatar,
    Box,
    Button,
    CircularProgress,
    Divider,
    IconButton,
    Paper,
    Stack,
    Typography,
} from '@mui/material';

import DescriptionIcon from '@mui/icons-material/Description';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PendingIcon from '@mui/icons-material/Pending';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import SearchIcon from '@mui/icons-material/Search';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import RefreshIcon from '@mui/icons-material/Refresh';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import FolderOpenIcon from '@mui/icons-material/FolderOpen';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import ReplayIcon from '@mui/icons-material/Replay';

import { useLocation, useNavigate } from 'react-router-dom';

import api from '../api/axiosConfig';
import { useAuth } from '../context/AuthContext';
import { getApiErrorMessage } from '../utils/apiError';


function StatCard({
                      title,
                      value,
                      subtitle,
                      icon,
                      iconBg,
                  }) {
    return (
        <Paper
            sx={{
                p: 2.5,
                height: '100%',
                border: '1px solid #E7EAF0',
                transition: 'all 0.2s ease',

                '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow:
                        '0 8px 24px rgba(30, 39, 97, 0.08)',
                },
            }}
        >
            <Box
                sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                }}
            >
                <Box>
                    <Typography
                        variant="body2"
                        sx={{
                            color: 'text.secondary',
                            fontWeight: 600,
                            mb: 1,
                        }}
                    >
                        {title}
                    </Typography>

                    <Typography
                        variant="h4"
                        sx={{
                            fontWeight: 700,
                            color: 'text.primary',
                        }}
                    >
                        {value}
                    </Typography>

                    <Typography
                        variant="caption"
                        sx={{
                            color: 'text.secondary',
                        }}
                    >
                        {subtitle}
                    </Typography>
                </Box>

                <Box
                    sx={{
                        width: 44,
                        height: 44,
                        borderRadius: 2,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        bgcolor: iconBg,
                    }}
                >
                    {icon}
                </Box>
            </Box>
        </Paper>
    );
}


function QuickAction({
                         icon,
                         title,
                         description,
                         onClick,
                     }) {
    return (
        <Paper
            onClick={onClick}
            sx={{
                p: 2,
                cursor: 'pointer',
                border: '1px solid #E7EAF0',
                transition: 'all 0.2s ease',

                '&:hover': {
                    borderColor: '#00A896',
                    transform: 'translateY(-2px)',
                    boxShadow:
                        '0 8px 20px rgba(0, 168, 150, 0.08)',
                },
            }}
        >
            <Box
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 2,
                }}
            >
                <Box
                    sx={{
                        width: 42,
                        height: 42,
                        borderRadius: 2,
                        bgcolor: '#E8F7F5',
                        color: '#00A896',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}
                >
                    {icon}
                </Box>

                <Box sx={{ flexGrow: 1 }}>
                    <Typography
                        variant="subtitle2"
                        sx={{ fontWeight: 700 }}
                    >
                        {title}
                    </Typography>

                    <Typography
                        variant="caption"
                        color="text.secondary"
                    >
                        {description}
                    </Typography>
                </Box>

                <ArrowForwardIcon
                    sx={{
                        color: '#9CA3AF',
                        fontSize: 20,
                    }}
                />
            </Box>
        </Paper>
    );
}


function StatusBadge({ status }) {
    let color = '#6B7280';
    let background = '#F3F4F6';

    if (status === 'PROCESSED') {
        color = '#2E7D32';
        background = '#E8F5E9';
    }

    if (status === 'PROCESSING') {
        color = '#ED6C02';
        background = '#FFF3E0';
    }

    if (status === 'FAILED') {
        color = '#D32F2F';
        background = '#FFEBEE';
    }

    if (status === 'UPLOADED') {
        color = '#1E2761';
        background = '#E9ECF8';
    }

    return (
        <Box
            sx={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 0.7,
                px: 1.2,
                py: 0.5,
                borderRadius: 5,
                bgcolor: background,
                color,
                fontSize: 12,
                fontWeight: 700,
            }}
        >
            <Box
                sx={{
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    bgcolor: color,
                }}
            />

            {status || 'UNKNOWN'}
        </Box>
    );
}


export default function Dashboard() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const [documents, setDocuments] = useState([]);
    const [pendingApprovals, setPendingApprovals] = useState(0);
    const [myPendingReviews, setMyPendingReviews] = useState([]);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const loadDashboard = async () => {
        setLoading(true);
        setError('');

        try {
            const role = user?.role;

            const documentEndpoint =
                ['ADMIN', 'MANAGER', 'REVIEWER'].includes(role)
                    ? '/documents'
                    : '/documents/my';

            const documentResponse =
                await api.get(documentEndpoint);

            const docs = Array.isArray(documentResponse.data)
                ? documentResponse.data
                : [];

            console.log("========== RESUBMISSION DEBUG ==========");

            docs.forEach((doc) => {
                console.log({
                    id: doc.id,
                    file: doc.originalFileName,
                    approvalStatus: doc.approvalStatus,
                    resubmissionOfDocumentId: doc.resubmissionOfDocumentId,
                    resubmitted: doc.resubmitted,
                    resubmittedDocumentId: doc.resubmittedDocumentId,
                    resubmissionCount: doc.resubmissionCount
                });
            });

            console.log("========================================");

            setDocuments(docs);

            if (role === 'REVIEWER') {
                const response = await api.get(
                    '/approvals/pending/reviewer'
                );

                const assignedDocuments = Array.isArray(response.data)
                    ? response.data
                    : [];

                setMyPendingReviews(assignedDocuments);
                setPendingApprovals(assignedDocuments.length);
            } else if (
                role === 'MANAGER' ||
                role === 'ADMIN'
            ) {
                const response = await api.get(
                    '/approvals/pending/manager'
                );

                setPendingApprovals(
                    response.data?.length || 0
                );
            } else {
                setMyPendingReviews([]);
                setPendingApprovals(0);
            }
        } catch (err) {
            console.error(err);

            setError(
                getApiErrorMessage(
                    err,
                    'Unable to load dashboard data.'
                )
            );
        } finally {
            setLoading(false);
        }
    };

    const handleResubmit = (documentId) => {
        navigate(`/upload?resubmit=${documentId}`);
    };


    useEffect(() => {
        loadDashboard();
    }, [user?.role, location.key]);


    const totalDocuments = documents.length;

    const processingDocuments = documents.filter(
        (doc) =>
            doc.status === 'PROCESSING' ||
            doc.status === 'UPLOADED'
    ).length;

    const underReviewDocuments = documents.filter(
        (doc) =>
            doc.approvalStatus === 'PENDING_REVIEWER' ||
            doc.approvalStatus === 'PENDING_MANAGER'
    ).length;

    const approvedDocuments = documents.filter(
        (doc) => doc.approvalStatus === 'APPROVED'
    ).length;

    const rejectedDocuments = documents.filter(
        (doc) =>
            doc.approvalStatus === 'REJECTED' &&
            !doc.resubmitted
    ).length;

    const recentDocuments = [...documents]
        .sort((a, b) => {
            return (
                new Date(b.uploadedAt || 0) -
                new Date(a.uploadedAt || 0)
            );
        })
        .slice(0, 5);


    const displayName =
        user?.email?.split('@')[0] || 'User';

    const formattedName =
        displayName.charAt(0).toUpperCase() +
        displayName.slice(1);


    if (loading) {
        return (
            <Box
                sx={{
                    minHeight: '60vh',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                }}
            >
                <Stack
                    alignItems="center"
                    spacing={2}
                >
                    <CircularProgress
                        size={36}
                        sx={{
                            color: '#00A896',
                        }}
                    />

                    <Typography color="text.secondary">
                        Loading your workspace...
                    </Typography>
                </Stack>
            </Box>
        );
    }


    return (
        <Box>

            {/* HEADER */}

            <Box
                sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: {
                        xs: 'flex-start',
                        sm: 'center',
                    },
                    flexDirection: {
                        xs: 'column',
                        sm: 'row',
                    },
                    gap: 2,
                    mb: 3,
                }}
            >
                <Box>
                    <Typography
                        variant="h4"
                        sx={{
                            fontSize: {
                                xs: 26,
                                sm: 30,
                            },
                            mb: 0.5,
                        }}
                    >
                        Good morning, {formattedName} 👋
                    </Typography>

                    <Typography
                        variant="body2"
                        color="text.secondary"
                    >
                        Here's what's happening with your
                        documents today.
                    </Typography>
                </Box>

                <Box
                    sx={{
                        display: 'flex',
                        gap: 1,
                    }}
                >
                    <IconButton
                        onClick={loadDashboard}
                        sx={{
                            bgcolor: '#FFFFFF',
                            border: '1px solid #E1E5EC',

                            '&:hover': {
                                bgcolor: '#F8F9FC',
                            },
                        }}
                    >
                        <RefreshIcon />
                    </IconButton>

                    {user?.role === 'EMPLOYEE' && (
                        <Button
                            variant="contained"
                            startIcon={<CloudUploadIcon />}
                            onClick={() => navigate('/upload')}
                        >
                            Upload Document
                        </Button>
                    )}

                </Box>
            </Box>


            {/* ERROR */}

            {error && (
                <Alert
                    severity="error"
                    sx={{ mb: 3 }}
                    action={
                        <Button
                            color="inherit"
                            size="small"
                            onClick={loadDashboard}
                        >
                            Retry
                        </Button>
                    }
                >
                    {error}
                </Alert>
            )}


            {/* MY DOCUMENT WORKSPACE */}

            <Box sx={{ mb: 3 }}>
                <Box sx={{ mb: 2 }}>
                    <Typography
                        variant="h6"
                        sx={{
                            fontSize: 20,
                            fontWeight: 700,
                        }}
                    >
                        My Document Workspace
                    </Typography>

                    <Typography
                        variant="body2"
                        color="text.secondary"
                    >
                        Track your documents throughout the workflow.
                    </Typography>
                </Box>

                <Box
                    sx={{
                        display: 'grid',
                        gridTemplateColumns: {
                            xs: '1fr',
                            sm: 'repeat(2, 1fr)',
                            md: 'repeat(3, 1fr)',
                            lg: 'repeat(5, 1fr)',
                        },
                        gap: 2,
                    }}
                >
                    <StatCard
                        title="Total"
                        value={totalDocuments}
                        subtitle="All your documents"
                        icon={
                            <DescriptionIcon
                                sx={{ color: '#1E2761' }}
                            />
                        }
                        iconBg="#E9ECF8"
                    />

                    <StatCard
                        title="Processing"
                        value={processingDocuments}
                        subtitle="Being processed"
                        icon={
                            <PendingIcon
                                sx={{ color: '#ED6C02' }}
                            />
                        }
                        iconBg="#FFF3E0"
                    />

                    <StatCard
                        title="Under Review"
                        value={underReviewDocuments}
                        subtitle="Awaiting approval"
                        icon={
                            <AccessTimeIcon
                                sx={{ color: '#1976D2' }}
                            />
                        }
                        iconBg="#E3F2FD"
                    />

                    <StatCard
                        title="Approved"
                        value={approvedDocuments}
                        subtitle="Successfully approved"
                        icon={
                            <CheckCircleIcon
                                sx={{ color: '#2E7D32' }}
                            />
                        }
                        iconBg="#E8F5E9"
                    />

                    <StatCard
                        title="Rejected"
                        value={rejectedDocuments}
                        subtitle="Needs attention"
                        icon={
                            <FolderOpenIcon
                                sx={{ color: '#D32F2F' }}
                            />
                        }
                        iconBg="#FFEBEE"
                    />
                </Box>
            </Box>


            {/* REVIEWER WORK QUEUE */}

            {user?.role === 'REVIEWER' && (
                <Paper
                    elevation={0}
                    sx={{
                        p: 3,
                        mb: 3,
                        border: '1px solid #D9EDE9',
                        borderRadius: 3,
                        backgroundColor: '#F8FCFB',
                    }}
                >
                    <Box
                        sx={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            flexWrap: 'wrap',
                            gap: 2,
                            mb: 2,
                        }}
                    >
                        <Box>
                            <Typography variant="h6" fontWeight={700}>
                                Pending My Review
                            </Typography>

                            <Typography variant="body2" color="text.secondary">
                                Documents specifically assigned to you.
                            </Typography>
                        </Box>

                        <Button
                            variant="contained"
                            onClick={() => navigate('/approvals')}
                            sx={{
                                bgcolor: '#00A896',
                                '&:hover': { bgcolor: '#008F80' },
                            }}
                        >
                            Open Review Workspace
                        </Button>
                    </Box>

                    {myPendingReviews.length === 0 ? (
                        <Box sx={{ py: 3, textAlign: 'center' }}>
                            <CheckCircleIcon
                                sx={{ fontSize: 38, color: '#00A896', mb: 1 }}
                            />

                            <Typography fontWeight={600}>
                                You're all caught up
                            </Typography>

                            <Typography variant="body2" color="text.secondary">
                                No documents are currently assigned to you.
                            </Typography>
                        </Box>
                    ) : (
                        <Stack spacing={1.5}>
                            {myPendingReviews.slice(0, 5).map((doc) => (
                                <Box
                                    key={doc.id}
                                    sx={{
                                        p: 2,
                                        bgcolor: '#FFFFFF',
                                        border: '1px solid #E7EAF0',
                                        borderRadius: 2,
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        gap: 2,
                                        flexWrap: 'wrap',
                                    }}
                                >
                                    <Box sx={{ minWidth: 0, flex: 1 }}>
                                        <Typography
                                            variant="subtitle2"
                                            fontWeight={700}
                                            sx={{
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis',
                                                whiteSpace: 'nowrap',
                                            }}
                                        >
                                            {doc.originalFileName || 'Untitled document'}
                                        </Typography>

                                        <Typography
                                            variant="caption"
                                            color="text.secondary"
                                        >
                                            {doc.documentType || 'OTHER'} ·{' '}
                                            {doc.uploadedByEmail || 'Unknown uploader'}
                                        </Typography>
                                    </Box>

                                    <Button
                                        variant="outlined"
                                        onClick={() => navigate(`/documents/${doc.id}`)}
                                    >
                                        View
                                    </Button>
                                </Box>
                            ))}

                            {myPendingReviews.length > 5 && (
                                <Typography variant="caption" color="text.secondary">
                                    Showing 5 of {myPendingReviews.length} assigned documents.
                                    Open the Review Workspace to see the rest.
                                </Typography>
                            )}
                        </Stack>
                    )}
                </Paper>
            )}


            {/* NEEDS YOUR ATTENTION */}

            {user?.role === 'EMPLOYEE' && rejectedDocuments > 0 && (
                <Paper
                    elevation={0}
                    sx={{
                        p: 3,
                        mb: 3,
                        border: '1px solid',
                        borderColor: '#F5C2C7',
                        borderRadius: 3,
                        backgroundColor: '#FFF8F8',
                    }}
                >
                    <Stack
                        direction="row"
                        spacing={1}
                        alignItems="center"
                        sx={{ mb: 2 }}
                    >
                        <WarningAmberIcon color="error" />

                        <Typography
                            variant="h6"
                            fontWeight={700}
                        >
                            Needs Your Attention
                        </Typography>
                    </Stack>

                    <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ mb: 2 }}
                    >
                        These documents need your attention before they
                        can continue through the approval process.
                    </Typography>

                    <Stack spacing={2}>
                        {documents
                            .filter(
                                (doc) =>
                                    doc.approvalStatus === 'REJECTED' &&
                                    !doc.resubmitted
                            )
                            .map((doc) => (
                                <Box
                                    key={doc.id}
                                    sx={{
                                        p: 2,
                                        border: '1px solid',
                                        borderColor: '#F5C2C7',
                                        borderRadius: 2,
                                        backgroundColor: '#FFFFFF',
                                    }}
                                >
                                    <Box
                                        sx={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: {
                                                xs: 'flex-start',
                                                sm: 'center',
                                            },
                                            gap: 2,
                                            flexDirection: {
                                                xs: 'column',
                                                sm: 'row',
                                            },
                                        }}
                                    >
                                        <Box>
                                            <Typography
                                                variant="subtitle1"
                                                fontWeight={700}
                                            >
                                                {doc.originalFileName}
                                            </Typography>

                                            <Typography
                                                variant="body2"
                                                color="error.main"
                                                sx={{ mt: 0.5 }}
                                            >
                                                Document rejected
                                            </Typography>
                                        </Box>

                                        <Stack
                                            direction="row"
                                            spacing={1}
                                        >
                                            <Button
                                                variant="outlined"
                                                onClick={() =>
                                                    navigate(
                                                        `/documents/${doc.id}`
                                                    )
                                                }
                                            >
                                                View
                                            </Button>

                                            <Button
                                                variant="contained"
                                                startIcon={
                                                    <ReplayIcon />
                                                }
                                                onClick={() =>
                                                    handleResubmit(doc.id)
                                                }
                                                sx={{
                                                    backgroundColor:
                                                        '#00A896',
                                                    '&:hover': {
                                                        backgroundColor:
                                                            '#008F80',
                                                    },
                                                }}
                                            >
                                                Resubmit
                                            </Button>
                                        </Stack>
                                    </Box>
                                </Box>
                            ))}
                    </Stack>
                </Paper>
            )}



            {/* MAIN GRID */}

            <Box
                sx={{
                    display: 'grid',
                    gridTemplateColumns: {
                        xs: '1fr',
                        lg: '1.5fr 1fr',
                    },
                    gap: 3,
                    mb: 3,
                }}
            >

                {/* RECENT DOCUMENTS */}

                <Paper
                    sx={{
                        border: '1px solid #E7EAF0',
                        overflow: 'hidden',
                    }}
                >
                    <Box
                        sx={{
                            p: 2.5,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                        }}
                    >
                        <Box>
                            <Typography
                                variant="h6"
                                sx={{ fontSize: 17 }}
                            >
                                Recent Documents
                            </Typography>

                            <Typography
                                variant="caption"
                                color="text.secondary"
                            >
                                Your latest document activity
                            </Typography>
                        </Box>

                        <Button
                            size="small"
                            endIcon={<ArrowForwardIcon />}
                            onClick={() =>
                                navigate('/documents')
                            }
                        >
                            View all
                        </Button>
                    </Box>

                    <Divider />

                    {recentDocuments.length === 0 ? (
                        <Box
                            sx={{
                                p: 5,
                                textAlign: 'center',
                            }}
                        >
                            <FolderOpenIcon
                                sx={{
                                    fontSize: 42,
                                    color: '#B7BDCA',
                                    mb: 1,
                                }}
                            />

                            <Typography
                                variant="subtitle1"
                                sx={{ fontWeight: 700 }}
                            >
                                No documents yet
                            </Typography>

                            <Typography
                                variant="body2"
                                color="text.secondary"
                                sx={{ mb: 2 }}
                            >
                                Upload your first document to
                                start your workflow.
                            </Typography>

                            <Button
                                variant="contained"
                                size="small"
                                onClick={() =>
                                    navigate('/upload')
                                }
                            >
                                Upload Document
                            </Button>
                        </Box>
                    ) : (
                        <Box>
                            {recentDocuments.map(
                                (doc, index) => (
                                    <Box
                                        key={doc.id}
                                        sx={{
                                            px: 2.5,
                                            py: 1.8,
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 2,

                                            '&:hover': {
                                                bgcolor: '#F8F9FC',
                                            },

                                            borderBottom:
                                                index !==
                                                recentDocuments.length -
                                                1
                                                    ? '1px solid #EEF0F4'
                                                    : 'none',
                                        }}
                                    >
                                        <Avatar
                                            variant="rounded"
                                            sx={{
                                                width: 40,
                                                height: 40,
                                                bgcolor: '#E9ECF8',
                                                color: '#1E2761',
                                            }}
                                        >
                                            <DescriptionIcon fontSize="small" />
                                        </Avatar>

                                        <Box
                                            sx={{
                                                flexGrow: 1,
                                                minWidth: 0,
                                            }}
                                        >
                                            <Typography
                                                variant="body2"
                                                sx={{
                                                    fontWeight: 700,
                                                    overflow:
                                                        'hidden',
                                                    textOverflow:
                                                        'ellipsis',
                                                    whiteSpace:
                                                        'nowrap',
                                                }}
                                            >
                                                {doc.originalFileName ||
                                                    'Untitled document'}
                                            </Typography>

                                            <Typography
                                                variant="caption"
                                                color="text.secondary"
                                            >
                                                {doc.documentType ||
                                                    'OTHER'}
                                            </Typography>
                                        </Box>

                                        <StatusBadge
                                            status={doc.status}
                                        />
                                    </Box>
                                )
                            )}
                        </Box>
                    )}
                </Paper>


                {/* QUICK ACTIONS */}

                <Paper
                    sx={{
                        p: 2.5,
                        border: '1px solid #E7EAF0',
                    }}
                >
                    <Typography
                        variant="h6"
                        sx={{ fontSize: 17 }}
                    >
                        Quick Actions
                    </Typography>

                    <Typography
                        variant="caption"
                        color="text.secondary"
                    >
                        Jump directly into your workflow
                    </Typography>

                    <Stack
                        spacing={1.5}
                        sx={{ mt: 2.5 }}
                    >
                        <QuickAction
                            icon={<CloudUploadIcon />}
                            title="Upload Document"
                            description="Add a new document"
                            onClick={() =>
                                navigate('/upload')
                            }
                        />

                        <QuickAction
                            icon={<FolderOpenIcon />}
                            title="View Documents"
                            description="Manage your documents"
                            onClick={() =>
                                navigate('/documents')
                            }
                        />

                        <QuickAction
                            icon={<SearchIcon />}
                            title="AI Semantic Search"
                            description="Search by meaning"
                            onClick={() =>
                                navigate('/search')
                            }
                        />

                        {(user?.role === 'REVIEWER' ||
                            user?.role === 'MANAGER' ||
                            user?.role === 'ADMIN') && (
                            <QuickAction
                                icon={
                                    <CheckCircleIcon />
                                }
                                title="Review Approvals"
                                description={
                                    pendingApprovals > 0
                                        ? `${pendingApprovals} waiting for review`
                                        : 'No pending approvals'
                                }
                                onClick={() =>
                                    navigate('/approvals')
                                }
                            />
                        )}
                    </Stack>
                </Paper>
            </Box>


            {/* WORKFLOW INFO */}

            <Paper
                sx={{
                    p: {
                        xs: 2.5,
                        md: 3,
                    },
                    border: '1px solid #E7EAF0',
                    background:
                        'linear-gradient(135deg, #FFFFFF 0%, #F8FAFF 100%)',
                }}
            >
                <Box
                    sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                        gap: 2,
                        flexDirection: {
                            xs: 'column',
                            md: 'row',
                        },
                    }}
                >
                    <Box>
                        <Typography
                            variant="h6"
                            sx={{ fontSize: 17 }}
                        >
                            Intelligent Document Workflow
                        </Typography>

                        <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{
                                mt: 0.5,
                                maxWidth: 650,
                            }}
                        >
                            Documents move through upload,
                            processing, AI analysis and approval
                            automatically.
                        </Typography>
                    </Box>

                    <Box
                        sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1,
                            color: '#00A896',
                        }}
                    >
                        <AccessTimeIcon fontSize="small" />

                        <Typography
                            variant="caption"
                            sx={{ fontWeight: 700 }}
                        >
                            Automated workflow
                        </Typography>
                    </Box>
                </Box>

                <Box
                    sx={{
                        display: 'grid',
                        gridTemplateColumns: {
                            xs: '1fr',
                            sm: 'repeat(4, 1fr)',
                        },
                        gap: 1.5,
                        mt: 3,
                    }}
                >
                    {[
                        ['01', 'Upload', 'Document added'],
                        ['02', 'Process', 'OCR & extraction'],
                        ['03', 'AI Analysis', 'Smart insights'],
                        ['04', 'Approval', 'Review & decision'],
                    ].map(
                        ([
                             number,
                             title,
                             description,
                         ]) => (
                            <Box
                                key={number}
                                sx={{
                                    p: 2,
                                    borderRadius: 2,
                                    bgcolor: '#FFFFFF',
                                    border: '1px solid #E7EAF0',
                                }}
                            >
                                <Typography
                                    variant="caption"
                                    sx={{
                                        color: '#00A896',
                                        fontWeight: 800,
                                    }}
                                >
                                    {number}
                                </Typography>

                                <Typography
                                    variant="subtitle2"
                                    sx={{
                                        mt: 0.5,
                                        fontWeight: 700,
                                    }}
                                >
                                    {title}
                                </Typography>

                                <Typography
                                    variant="caption"
                                    color="text.secondary"
                                >
                                    {description}
                                </Typography>
                            </Box>
                        )
                    )}
                </Box>
            </Paper>
        </Box>
    );
}