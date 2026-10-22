import { useEffect, useState } from 'react';

import {
    Alert,
    Box,
    Button,
    Chip,
    CircularProgress,
    Divider,
    Grid,
    Paper,
    Stack,
    Typography,
} from '@mui/material';

import ReplayIcon from '@mui/icons-material/Replay';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import DownloadIcon from '@mui/icons-material/Download';
import DescriptionIcon from '@mui/icons-material/Description';
import PersonIcon from '@mui/icons-material/Person';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import StorageIcon from '@mui/icons-material/Storage';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import ApprovalIcon from '@mui/icons-material/Approval';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import HistoryIcon from '@mui/icons-material/History';
import CancelIcon from '@mui/icons-material/Cancel';
import ScheduleIcon from '@mui/icons-material/Schedule';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import TaskAltIcon from '@mui/icons-material/TaskAlt';
import SendIcon from '@mui/icons-material/Send';
import ErrorIcon from '@mui/icons-material/Error';
import { useAuth } from '../context/AuthContext';

import { useNavigate, useParams } from 'react-router-dom';
import axios from '../api/axiosConfig';
import { getApiErrorMessage } from '../utils/apiError';

export default function DocumentDetails() {

    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();

    const [document, setDocument] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const [approvalHistory, setApprovalHistory] = useState([]);
    const [historyLoading, setHistoryLoading] = useState(true);

    const [rejection, setRejection] = useState(null);
    const [resubmitting, setResubmitting] = useState(false);

    useEffect(() => {
        loadDocument();
    }, [id]);

    useEffect(() => {
        loadApprovalHistory();
    }, [id]);

    const loadDocument = async () => {
        try {
            setLoading(true);
            setError('');

            const response = await axios.get(
                `/documents/${id}`
            );

            setDocument(response.data);

            // Load rejection details if document was rejected
            if (response.data.approvalStatus === 'REJECTED') {
                try {
                    const rejectionResponse = await axios.get(
                        `/approvals/${id}/latest-rejection`
                    );

                    setRejection(rejectionResponse.data);
                } catch (rejectionError) {
                    console.error(
                        'Failed to load rejection details:',
                        rejectionError
                    );

                    setRejection(null);
                }
            } else {
                setRejection(null);
            }

        } catch (err) {
            console.error(
                'Failed to load document:',
                err
            );

            setError(
                getApiErrorMessage(
                    err,
                    'Unable to load document details.'
                )
            );
        } finally {
            setLoading(false);
        }
    };

    const loadApprovalHistory = async () => {
        try {
            setHistoryLoading(true);

            const response = await axios.get(
                `/approvals/${id}/history`
            );

            setApprovalHistory(response.data || []);

        } catch (err) {
            console.error(
                'Failed to load approval history:',
                err
            );

            setApprovalHistory([]);

            setError(
                getApiErrorMessage(
                    err,
                    'Unable to load approval history.'
                )
            );
        } finally {
            setHistoryLoading(false);
        }
    };

    const handleResubmit = () => {
        navigate(`/upload?resubmit=${id}`);
    };


    const handleDownload = async () => {
        try {
            const response = await axios.get(
                `/documents/${id}/download`,
                {
                    responseType: 'blob',
                }
            );

            const blob = new Blob(
                [response.data],
                {
                    type:
                        response.headers['content-type'] ||
                        'application/octet-stream',
                }
            );

            const url =
                window.URL.createObjectURL(blob);

            /*
             * Use window.document here because
             * "document" is also our React state variable.
             */
            const link =
                window.document.createElement('a');

            link.href = url;

            link.download =
                document.originalFileName ||
                'document';

            window.document.body.appendChild(link);

            link.click();

            link.remove();

            window.URL.revokeObjectURL(url);

        } catch (err) {
            console.error(
                'Download failed:',
                err
            );

            setError(
                getApiErrorMessage(
                    err,
                    'Unable to download the document.'
                )
            );
        }
    };

    const formatFileSize = (bytes) => {

        if (!bytes) {
            return '0 KB';
        }

        if (bytes < 1024) {
            return `${bytes} B`;
        }

        if (bytes < 1024 * 1024) {
            return `${(
                bytes / 1024
            ).toFixed(1)} KB`;
        }

        return `${(
            bytes /
            (1024 * 1024)
        ).toFixed(1)} MB`;
    };

    const formatDate = (date) => {

        if (!date) {
            return '-';
        }

        return new Date(date).toLocaleString(
            'en-IN',
            {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
            }
        );
    };

    const formatLabel = (value) => {

        if (!value) {
            return '-';
        }

        return value
            .toLowerCase()
            .replace(/_/g, ' ')
            .replace(/\b\w/g, (letter) =>
                letter.toUpperCase()
            );
    };

    const getProcessingChip = (status) => {

        switch (status) {

            case 'PROCESSED':
                return (
                    <Chip
                        label="Processed"
                        color="success"
                    />
                );

            case 'PROCESSING':
                return (
                    <Chip
                        label="Processing"
                        color="warning"
                    />
                );

            case 'FAILED':
                return (
                    <Chip
                        label="Failed"
                        color="error"
                    />
                );

            case 'UPLOADED':
                return (
                    <Chip
                        label="Uploaded"
                    />
                );

            default:
                return (
                    <Chip
                        label={formatLabel(status)}
                    />
                );
        }
    };

    const getApprovalChip = (status) => {

        switch (status) {

            case 'APPROVED':
                return (
                    <Chip
                        label="Approved"
                        color="success"
                    />
                );

            case 'REJECTED':
                return (
                    <Chip
                        label="Rejected"
                        color="error"
                    />
                );

            case 'PENDING_REVIEWER':
                return (
                    <Chip
                        label="Pending Reviewer"
                        color="warning"
                    />
                );

            case 'PENDING_MANAGER':
                return (
                    <Chip
                        label="Pending Manager"
                        color="warning"
                    />
                );

            case 'NOT_SUBMITTED':
                return (
                    <Chip
                        label="Not Submitted"
                    />
                );

            default:
                return (
                    <Chip
                        label={formatLabel(status)}
                    />
                );
        }
    };

    const getHistoryAction = (action) => {
        const value = String(action || '').toUpperCase();

        switch (value) {

            case 'UPLOADED':
                return {
                    icon: (
                        <UploadFileIcon
                            sx={{
                                fontSize: 20,
                                color: 'primary.main',
                            }}
                        />
                    ),
                    background: 'primary.light',
                };

            case 'PROCESSING_STARTED':
                return {
                    icon: (
                        <PlayArrowIcon
                            sx={{
                                fontSize: 20,
                                color: 'warning.main',
                            }}
                        />
                    ),
                    background: 'warning.light',
                };

            case 'AI_ANALYSIS_COMPLETED':
                return {
                    icon: (
                        <AutoAwesomeIcon
                            sx={{
                                fontSize: 20,
                                color: 'secondary.main',
                            }}
                        />
                    ),
                    background: 'secondary.light',
                };

            case 'PROCESSING_COMPLETED':
                return {
                    icon: (
                        <TaskAltIcon
                            sx={{
                                fontSize: 20,
                                color: 'success.main',
                            }}
                        />
                    ),
                    background: 'success.light',
                };

            case 'SUBMITTED':
                return {
                    icon: (
                        <SendIcon
                            sx={{
                                fontSize: 20,
                                color: 'primary.main',
                            }}
                        />
                    ),
                    background: 'primary.light',
                };

            case 'APPROVED':
                return {
                    icon: (
                        <CheckCircleIcon
                            sx={{
                                fontSize: 20,
                                color: 'success.main',
                            }}
                        />
                    ),
                    background: 'success.light',
                };

            case 'REJECTED':
                return {
                    icon: (
                        <CancelIcon
                            sx={{
                                fontSize: 20,
                                color: 'error.main',
                            }}
                        />
                    ),
                    background: 'error.light',
                };

            case 'RESUBMITTED':
                return {
                    icon: (
                        <ReplayIcon
                            sx={{
                                fontSize: 20,
                                color: 'info.main',
                            }}
                        />
                    ),
                    background: 'info.light',
                };

            case 'PROCESSING_FAILED':
                return {
                    icon: (
                        <ErrorIcon
                            sx={{
                                fontSize: 20,
                                color: 'error.main',
                            }}
                        />
                    ),
                    background: 'error.light',
                };

            default:
                return {
                    icon: (
                        <ScheduleIcon
                            sx={{
                                fontSize: 20,
                                color: 'text.secondary',
                            }}
                        />
                    ),
                    background: 'action.hover',
                };
        }
    };

    const renderEntities = () => {

        if (!document?.aiExtractedEntities) {
            return (
                <Typography
                    color="text.secondary"
                >
                    No entities detected.
                </Typography>
            );
        }

        let entities;

        try {

            entities =
                typeof document.aiExtractedEntities ===
                'string'
                    ? JSON.parse(
                        document.aiExtractedEntities
                    )
                    : document.aiExtractedEntities;

        } catch {

            return (
                <Typography
                    variant="body2"
                    sx={{
                        whiteSpace: 'pre-wrap',
                    }}
                >
                    {document.aiExtractedEntities}
                </Typography>
            );
        }

        if (
            !entities ||
            Object.keys(entities).length === 0
        ) {
            return (
                <Typography
                    color="text.secondary"
                >
                    No entities detected.
                </Typography>
            );
        }

        return (
            <Stack spacing={1.5}>

                {Object.entries(entities).map(
                    ([key, value]) => (
                        <Box
                            key={key}
                            sx={{
                                display: 'flex',
                                justifyContent:
                                    'space-between',
                                gap: 2,
                                p: 1.5,
                                borderRadius: 2,
                                backgroundColor:
                                    'background.default',
                            }}
                        >
                            <Typography
                                variant="body2"
                                fontWeight={600}
                            >
                                {formatLabel(key)}
                            </Typography>

                            <Typography
                                variant="body2"
                                color="text.secondary"
                                textAlign="right"
                            >
                                {String(value)}
                            </Typography>
                        </Box>
                    )
                )}

            </Stack>
        );
    };

    const renderApprovalHistory = () => {

        if (historyLoading) {
            return (
                <Box
                    sx={{
                        display: 'flex',
                        justifyContent: 'center',
                        py: 4,
                    }}
                >
                    <CircularProgress size={28} />
                </Box>
            );
        }

        if (approvalHistory.length === 0) {
            return (
                <Box
                    sx={{
                        py: 4,
                        textAlign: 'center',
                        color: 'text.secondary',
                    }}
                >
                    <ScheduleIcon
                        sx={{
                            fontSize: 42,
                            mb: 1,
                            opacity: 0.5,
                        }}
                    />

                    <Typography
                        variant="body1"
                        fontWeight={600}
                    >
                        No activity yet
                    </Typography>

                    <Typography
                        variant="body2"
                        sx={{ mt: 0.5 }}
                    >
                        Document activity will appear here as it moves
                        through the workflow.
                    </Typography>
                </Box>
            );
        }

        return (
            <Stack spacing={0}>

                {approvalHistory.map(
                    (action, index) => {

                        const isLast =
                            index ===
                            approvalHistory.length - 1;

                        const actionText =
                            action.action ||
                            'Approval Action';

                        const historyAction =
                            getHistoryAction(
                                actionText
                            );

                        return (
                            <Box
                                key={
                                    action.id ||
                                    index
                                }
                                sx={{
                                    display: 'flex',
                                    position: 'relative',
                                    pb: isLast
                                        ? 0
                                        : 3,
                                }}
                            >

                                {/* Timeline connector */}

                                {!isLast && (
                                    <Box
                                        sx={{
                                            position:
                                                'absolute',
                                            left: 15,
                                            top: 32,
                                            bottom: 0,
                                            width: 2,
                                            bgcolor:
                                                'divider',
                                        }}
                                    />
                                )}

                                {/* Action icon */}

                                <Box
                                    sx={{
                                        width: 32,
                                        height: 32,
                                        borderRadius:
                                            '50%',
                                        display:
                                            'flex',
                                        alignItems:
                                            'center',
                                        justifyContent:
                                            'center',
                                        backgroundColor:
                                        historyAction.background,
                                        zIndex: 1,
                                        flexShrink: 0,
                                    }}
                                >
                                    {
                                        historyAction.icon
                                    }
                                </Box>

                                {/* Action details */}

                                <Box
                                    sx={{
                                        ml: 2,
                                        flex: 1,
                                    }}
                                >

                                    <Typography
                                        variant="subtitle1"
                                        fontWeight={700}
                                    >
                                        {formatLabel(
                                            actionText
                                        )}
                                    </Typography>

                                    <Stack
                                        direction={{
                                            xs: 'column',
                                            sm: 'row',
                                        }}
                                        spacing={{
                                            xs: 0.25,
                                            sm: 1,
                                        }}
                                        sx={{
                                            mt: 0.25,
                                        }}
                                    >

                                        {action.actionByEmail && (
                                            <Typography
                                                variant="body2"
                                                color="text.secondary"
                                            >
                                                By {
                                                action.actionByEmail
                                            }
                                            </Typography>
                                        )}

                                        {action.actionByRole && (
                                            <Typography
                                                variant="body2"
                                                color="text.secondary"
                                            >
                                                • {
                                                formatLabel(
                                                    action.actionByRole
                                                )
                                            }
                                            </Typography>
                                        )}

                                    </Stack>

                                    {action.comment && (
                                        <Box
                                            sx={{
                                                mt: 1,
                                                p: 1.5,
                                                bgcolor:
                                                    'background.default',
                                                borderRadius:
                                                    1.5,
                                                border:
                                                    '1px solid',
                                                borderColor:
                                                    'divider',
                                            }}
                                        >
                                            <Typography
                                                variant="body2"
                                                sx={{
                                                    whiteSpace:
                                                        'pre-wrap',
                                                }}
                                            >
                                                {action.comment}
                                            </Typography>
                                        </Box>
                                    )}

                                    {action.actionAt && (
                                        <Typography
                                            variant="caption"
                                            color="text.secondary"
                                            sx={{
                                                display:
                                                    'block',
                                                mt: 1,
                                            }}
                                        >
                                            {formatDate(
                                                action.actionAt
                                            )}
                                        </Typography>
                                    )}

                                </Box>

                            </Box>
                        );
                    }
                )}

            </Stack>
        );
    };

    if (loading) {

        return (
            <Box
                sx={{
                    minHeight: 500,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                }}
            >
                <Stack
                    spacing={2}
                    alignItems="center"
                >
                    <CircularProgress />

                    <Typography
                        color="text.secondary"
                    >
                        Loading document...
                    </Typography>
                </Stack>
            </Box>
        );
    }

    if (error || !document) {

        return (
            <Box>

                <Button
                    startIcon={<ArrowBackIcon />}
                    onClick={() =>
                        navigate('/documents')
                    }
                    sx={{ mb: 3 }}
                >
                    Back to Documents
                </Button>

                <Alert severity="error">
                    {error ||
                        'Document not found.'}
                </Alert>

            </Box>
        );
    }

    return (
        <Box>

            {/* Header */}

            <Stack
                direction={{
                    xs: 'column',
                    sm: 'row',
                }}
                justifyContent="space-between"
                alignItems={{
                    xs: 'flex-start',
                    sm: 'center',
                }}
                spacing={2}
                sx={{ mb: 3 }}
            >

                <Box>

                    <Button
                        startIcon={
                            <ArrowBackIcon />
                        }
                        onClick={() =>
                            navigate('/documents')
                        }
                        sx={{ mb: 1 }}
                    >
                        Back to Documents
                    </Button>

                    <Stack
                        direction="row"
                        spacing={1.5}
                        alignItems="center"
                    >

                        <Box
                            sx={{
                                width: 48,
                                height: 48,
                                borderRadius: 2,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                backgroundColor:
                                    'rgba(30, 39, 97, 0.08)',
                                color:
                                    'primary.main',
                            }}
                        >
                            <DescriptionIcon />
                        </Box>

                        <Box>

                            <Typography
                                variant="h4"
                                fontWeight={700}
                                sx={{
                                    wordBreak:
                                        'break-word',
                                }}
                            >
                                {
                                    document.originalFileName
                                }
                            </Typography>

                            <Typography
                                variant="body2"
                                color="text.secondary"
                            >
                                Document details and
                                AI analysis
                            </Typography>

                        </Box>

                    </Stack>

                </Box>

                <Button
                    variant="contained"
                    startIcon={
                        <DownloadIcon />
                    }
                    onClick={
                        handleDownload
                    }
                >
                    Download
                </Button>

            </Stack>

            {error && (
                <Alert
                    severity="error"
                    sx={{ mb: 3 }}
                >
                    {error}
                </Alert>
            )}

            {/* Status */}

            <Paper
                elevation={0}
                sx={{
                    p: 3,
                    mb: 3,
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 3,
                }}
            >

                <Stack
                    direction={{
                        xs: 'column',
                        sm: 'row',
                    }}
                    spacing={3}
                    alignItems={{
                        xs: 'flex-start',
                        sm: 'center',
                    }}
                >

                    <Box
                        sx={{
                            flex: 1,
                        }}
                    >

                        <Typography
                            variant="caption"
                            color="text.secondary"
                        >
                            PROCESSING STATUS
                        </Typography>

                        <Box sx={{ mt: 1 }}>
                            {getProcessingChip(
                                document.status
                            )}
                        </Box>

                    </Box>

                    <Divider
                        orientation="vertical"
                        flexItem
                        sx={{
                            display: {
                                xs: 'none',
                                sm: 'block',
                            },
                        }}
                    />

                    <Box
                        sx={{
                            flex: 1,
                        }}
                    >

                        <Typography
                            variant="caption"
                            color="text.secondary"
                        >
                            APPROVAL STATUS
                        </Typography>

                        <Box sx={{ mt: 1 }}>
                            {getApprovalChip(
                                document.approvalStatus
                            )}
                        </Box>

                    </Box>

                    <Divider
                        orientation="vertical"
                        flexItem
                        sx={{
                            display: {
                                xs: 'none',
                                sm: 'block',
                            },
                        }}
                    />

                    <Box
                        sx={{
                            flex: 1,
                        }}
                    >

                        <Typography
                            variant="caption"
                            color="text.secondary"
                        >
                            DOCUMENT TYPE
                        </Typography>

                        <Typography
                            variant="body1"
                            fontWeight={600}
                            sx={{ mt: 1 }}
                        >
                            {formatLabel(
                                document.documentType
                            )}
                        </Typography>

                    </Box>

                </Stack>

            </Paper>

            {/* Information cards */}

            <Grid
                container
                spacing={3}
                sx={{ mb: 3 }}
            >

                {/* File Information */}

                <Grid
                    size={{
                        xs: 12,
                        md: 6,
                    }}
                >

                    <Paper
                        elevation={0}
                        sx={{
                            p: 3,
                            height: '100%',
                            border:
                                '1px solid',
                            borderColor:
                                'divider',
                            borderRadius: 3,
                        }}
                    >

                        <Stack
                            direction="row"
                            spacing={1}
                            alignItems="center"
                            sx={{ mb: 3 }}
                        >

                            <StorageIcon
                                color="primary"
                            />

                            <Typography
                                variant="h6"
                                fontWeight={700}
                            >
                                File Information
                            </Typography>

                        </Stack>

                        <Stack spacing={2.5}>

                            <InfoRow
                                label="File Name"
                                value={
                                    document.originalFileName
                                }
                            />

                            <InfoRow
                                label="File Size"
                                value={formatFileSize(
                                    document.fileSizeBytes
                                )}
                            />

                            <InfoRow
                                label="Content Type"
                                value={
                                    document.contentType
                                }
                            />

                            <InfoRow
                                label="Document Type"
                                value={formatLabel(
                                    document.documentType
                                )}
                            />

                        </Stack>

                    </Paper>
                </Grid>

                {/* Upload Information */}

                <Grid
                    size={{
                        xs: 12,
                        md: 6,
                    }}
                >

                    <Paper
                        elevation={0}
                        sx={{
                            p: 3,
                            height: '100%',
                            border:
                                '1px solid',
                            borderColor:
                                'divider',
                            borderRadius: 3,
                        }}
                    >

                        <Stack
                            direction="row"
                            spacing={1}
                            alignItems="center"
                            sx={{ mb: 3 }}
                        >

                            <PersonIcon
                                color="primary"
                            />

                            <Typography
                                variant="h6"
                                fontWeight={700}
                            >
                                Upload Information
                            </Typography>

                        </Stack>

                        <Stack spacing={2.5}>

                            <InfoRow
                                label="Uploaded By"
                                value={
                                    document.uploadedByEmail
                                }
                            />

                            <InfoRow
                                label="Uploaded At"
                                value={formatDate(
                                    document.uploadedAt
                                )}
                                icon={
                                    <CalendarTodayIcon
                                        fontSize="small"
                                    />
                                }
                            />

                        </Stack>


                        {document.approvalStatus === 'REJECTED' && (
                            document.resubmitted ? (
                                <Alert severity="info">
                                    This document has already been resubmitted for review.
                                </Alert>
                            ) : (
                                <Alert severity="error">
                                    <Typography fontWeight={700}>
                                        Document Rejected
                                    </Typography>

                                    <Typography variant="body2">
                                        Reason: {rejection?.comment || 'No reason provided'}
                                    </Typography>

                                    {user?.role === 'EMPLOYEE' &&
                                        document.uploadedById === user.id && (
                                            <Button
                                                variant="contained"
                                                startIcon={<ReplayIcon />}
                                                sx={{ mt: 2 }}
                                                onClick={() =>
                                                    navigate(`/upload?resubmit=${document.id}`)
                                                }
                                            >
                                                Resubmit for Review
                                            </Button>
                                        )}
                                </Alert>
                            )
                        )}


                    </Paper>

                </Grid>

            </Grid>
            {/* Approval History */}

            {/* AI Analysis */}

            <Paper
                elevation={0}
                sx={{
                    p: 3,
                    mb: 3,
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 3,
                }}
            >

                <Stack
                    direction="row"
                    spacing={1}
                    alignItems="center"
                    sx={{ mb: 3 }}
                >

                    <SmartToyIcon
                        color="secondary"
                    />

                    <Typography
                        variant="h6"
                        fontWeight={700}
                    >
                        AI Analysis
                    </Typography>

                </Stack>

                <Stack spacing={3}>

                    <Box>

                        <Typography
                            variant="subtitle2"
                            fontWeight={700}
                            sx={{ mb: 1 }}
                        >
                            AI Summary
                        </Typography>

                        <Box
                            sx={{
                                p: 2,
                                borderRadius: 2,
                                backgroundColor:
                                    'background.default',
                            }}
                        >

                            <Typography
                                variant="body2"
                                color={
                                    document.aiSummary
                                        ? 'text.primary'
                                        : 'text.secondary'
                                }
                                sx={{
                                    lineHeight: 1.8,
                                    whiteSpace:
                                        'pre-wrap',
                                }}
                            >
                                {document.aiSummary ||
                                    'AI summary is not available yet.'}
                            </Typography>

                        </Box>

                    </Box>

                    <Box>

                        <Typography
                            variant="subtitle2"
                            fontWeight={700}
                            sx={{ mb: 1 }}
                        >
                            AI Document Type
                        </Typography>

                        <Chip
                            label={
                                document.aiDocumentTypeGuess ||
                                'Not available'
                            }
                            variant="outlined"
                            color="secondary"
                        />

                    </Box>

                    <Box>

                        <Typography
                            variant="subtitle2"
                            fontWeight={700}
                            sx={{ mb: 1.5 }}
                        >
                            Detected Entities
                        </Typography>

                        {renderEntities()}

                    </Box>

                </Stack>

            </Paper>

            {/* Approval */}

            <Paper
                elevation={0}
                sx={{
                    p: 3,
                    mb: 3,
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 3,
                }}
            >

                <Stack
                    direction="row"
                    spacing={1}
                    alignItems="center"
                    sx={{ mb: 2 }}
                >

                    <ApprovalIcon
                        color="primary"
                    />

                    <Typography
                        variant="h6"
                        fontWeight={700}
                    >
                        Approval
                    </Typography>

                </Stack>

                <Stack
                    direction="row"
                    spacing={2}
                    alignItems="center"
                >

                    {getApprovalChip(
                        document.approvalStatus
                    )}

                    {document.approvalStatus ===
                        'APPROVED' && (
                            <Stack
                                direction="row"
                                spacing={0.5}
                                alignItems="center"
                            >

                                <CheckCircleIcon
                                    color="success"
                                    fontSize="small"
                                />

                                <Typography
                                    variant="body2"
                                    color="text.secondary"
                                >
                                    Document approved
                                </Typography>

                            </Stack>
                        )}

                </Stack>

            </Paper>

            {/* Approval History */}

            <Paper
                elevation={0}
                sx={{
                    p: 3,
                    mb: 3,
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 3,
                }}
            >

                <Stack
                    direction="row"
                    spacing={1}
                    alignItems="center"
                    sx={{ mb: 3 }}
                >

                    <HistoryIcon color="primary" />

                    <Typography
                        variant="h6"
                        fontWeight={700}
                    >
                        Document Activity
                    </Typography>

                </Stack>

                {renderApprovalHistory()}

            </Paper>

        </Box>
    );
}

function InfoRow({
                     label,
                     value,
                     icon,
                 }) {

    return (
        <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
            spacing={2}
        >

            <Typography
                variant="body2"
                color="text.secondary"
            >
                {label}
            </Typography>

            <Stack
                direction="row"
                spacing={0.75}
                alignItems="center"
                sx={{
                    maxWidth: '65%',
                }}
            >

                {icon}

                <Typography
                    variant="body2"
                    fontWeight={600}
                    textAlign="right"
                    sx={{
                        wordBreak:
                            'break-word',
                    }}
                >
                    {value || '-'}
                </Typography>

            </Stack>

        </Stack>
    );
}