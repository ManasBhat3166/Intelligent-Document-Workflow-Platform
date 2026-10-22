import { useEffect, useState } from 'react';
import {
    Alert,
    Box,
    Button,
    Chip,
    CircularProgress,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Divider,
    Checkbox,
    FormControlLabel,
    IconButton,
    Paper,
    Stack,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TextField,
    Tooltip,
    Typography,
} from '@mui/material';

import RefreshIcon from '@mui/icons-material/Refresh';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import VisibilityIcon from '@mui/icons-material/Visibility';
import DescriptionIcon from '@mui/icons-material/Description';
import PersonIcon from '@mui/icons-material/Person';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import ApprovalIcon from '@mui/icons-material/Approval';

import { useNavigate } from 'react-router-dom';
import api from '../api/axiosConfig';
import { useAuth } from '../context/AuthContext';
import { getApiErrorMessage } from '../utils/apiError';

export default function Approvals() {

    const { user } = useAuth();
    const navigate = useNavigate();

    const [docs, setDocs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const [dialogOpen, setDialogOpen] = useState(false);
    const [selectedDocument, setSelectedDocument] = useState(null);
    const [selectedDecision, setSelectedDecision] = useState('');
    const [comment, setComment] = useState('');
    const [actionLoading, setActionLoading] = useState(false);

    const [reviewChecklist, setReviewChecklist] = useState({
        informationComplete: false,
        supportingDocuments: false,
        detailsConsistent: false,
        documentReadable: false,
    });
    const isChecklistComplete =
        Object.values(reviewChecklist).every(Boolean);

    const isReviewer =
        user?.role === 'REVIEWER' ||
        user?.role === 'ADMIN';

    const isManager =
        user?.role === 'MANAGER' ||
        user?.role === 'ADMIN';

    const roleLabel =
        isReviewer ? 'Reviewer' : 'Manager';

    const actionLevel =
        isReviewer ? 'reviewer' : 'manager';

    const fetchPending = async (showRefreshLoader = false) => {

        try {

            if (showRefreshLoader) {
                setRefreshing(true);
            } else {
                setLoading(true);
            }

            setError('');

            const endpoint = isReviewer
                ? '/approvals/pending/reviewer'
                : '/approvals/pending/manager';

            const response = await api.get(endpoint);

            setDocs(response.data || []);

        } catch (err) {
            console.error(
                'Failed to load pending approvals:',
                err
            );

            setError(
                getApiErrorMessage(
                    err,
                    'Unable to load pending approvals.'
                )
            );
        } finally {

            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchPending();
    }, []);

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
                        size="small"
                    />
                );

            case 'PROCESSING':
                return (
                    <Chip
                        label="Processing"
                        color="warning"
                        size="small"
                    />
                );

            case 'FAILED':
                return (
                    <Chip
                        label="Failed"
                        color="error"
                        size="small"
                    />
                );

            default:
                return (
                    <Chip
                        label={formatLabel(status)}
                        size="small"
                    />
                );
        }
    };

    const getApprovalChip = (status) => {

        switch (status) {

            case 'PENDING_REVIEWER':
                return (
                    <Chip
                        label="Pending Reviewer"
                        color="warning"
                        size="small"
                    />
                );

            case 'PENDING_MANAGER':
                return (
                    <Chip
                        label="Pending Manager"
                        color="warning"
                        size="small"
                    />
                );

            case 'APPROVED':
                return (
                    <Chip
                        label="Approved"
                        color="success"
                        size="small"
                    />
                );

            case 'REJECTED':
                return (
                    <Chip
                        label="Rejected"
                        color="error"
                        size="small"
                    />
                );

            default:
                return (
                    <Chip
                        label={formatLabel(status)}
                        size="small"
                    />
                );
        }
    };

    const openActionDialog = (doc, decision) => {

        setSelectedDocument(doc);
        setSelectedDecision(decision);
        setComment('');
        setError('');
        setSuccess('');
        setReviewChecklist({
            informationComplete: false,
            supportingDocuments: false,
            detailsConsistent: false,
            documentReadable: false,
        });
        setDialogOpen(true);
    };

    const closeActionDialog = () => {

        if (actionLoading) {
            return;
        }

        setDialogOpen(false);
        setSelectedDocument(null);
        setSelectedDecision('');
        setComment('');
    };

    const handleAction = async () => {

        if (!selectedDocument) {
            return;
        }

        try {

            setActionLoading(true);
            setError('');
            setSuccess('');

            await api.post(
                `/approvals/${selectedDocument.id}/${actionLevel}/${selectedDecision}`,
                {
                    comment: comment.trim(),
                }
            );

            const actionText =
                selectedDecision === 'approve'
                    ? 'approved'
                    : 'rejected';

            setSuccess(
                `${selectedDocument.originalFileName} has been ${actionText} successfully.`
            );

            setDialogOpen(false);
            setSelectedDocument(null);
            setSelectedDecision('');
            setComment('');

            await fetchPending();

        } catch (err) {
            console.error(
                'Approval action failed:',
                err
            );

            setError(
                getApiErrorMessage(
                    err,
                    'Unable to complete the approval action.'
                )
            );
        } finally {

            setActionLoading(false);
        }
    };

    const renderEmptyState = () => {

        return (
            <Box
                sx={{
                    py: 8,
                    textAlign: 'center',
                }}
            >

                <Box
                    sx={{
                        width: 64,
                        height: 64,
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        mx: 'auto',
                        mb: 2,
                        backgroundColor:
                            'rgba(0, 168, 150, 0.10)',
                        color: 'secondary.main',
                    }}
                >
                    <CheckCircleIcon
                        sx={{ fontSize: 32 }}
                    />
                </Box>

                <Typography
                    variant="h6"
                    fontWeight={700}
                >
                    No pending approvals
                </Typography>

                <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{
                        mt: 0.75,
                        maxWidth: 420,
                        mx: 'auto',
                    }}
                >
                    There are currently no documents
                    waiting for {roleLabel.toLowerCase()}
                    approval.
                </Typography>

            </Box>
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
                        Loading pending approvals...
                    </Typography>
                </Stack>
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
                                color: 'primary.main',
                            }}
                        >
                            <ApprovalIcon />
                        </Box>

                        <Box>

                            <Typography
                                variant="h4"
                                fontWeight={700}
                            >
                                Approvals
                            </Typography>

                            <Typography
                                variant="body2"
                                color="text.secondary"
                                sx={{ mt: 0.25 }}
                            >
                                Review and process documents
                                awaiting {roleLabel.toLowerCase()}
                                approval.
                            </Typography>

                        </Box>

                    </Stack>

                </Box>


                <Button
                    variant="outlined"
                    size="small"
                    startIcon={
                        refreshing ? (
                            <CircularProgress size={14} />
                        ) : (
                            <RefreshIcon fontSize="small" />
                        )
                    }
                    onClick={() => fetchPending(true)}
                    disabled={refreshing}
                    sx={{
                        minWidth: 'auto',
                        px: 1.5,
                        py: 0.5,
                        ml: 'auto',
                        alignSelf: 'flex-end',
                        whiteSpace: 'nowrap'
                    }}
                >
                    Refresh
                </Button>


            </Stack>

            {/* Alerts */}

            {success && (
                <Alert
                    severity="success"
                    onClose={() => setSuccess('')}
                    sx={{ mb: 3 }}
                >
                    {success}
                </Alert>
            )}

            {error && (
                <Alert
                    severity="error"
                    onClose={() => setError('')}
                    sx={{ mb: 3 }}
                >
                    {error}
                </Alert>
            )}

            {/* Summary */}

            <Paper
                elevation={0}
                sx={{
                    p: 2.5,
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
                    spacing={2}
                    alignItems={{
                        xs: 'flex-start',
                        sm: 'center',
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
                            backgroundColor:
                                'rgba(237, 108, 2, 0.10)',
                            color: 'warning.main',
                        }}
                    >
                        <ApprovalIcon />
                    </Box>

                    <Box>

                        <Typography
                            variant="body2"
                            color="text.secondary"
                        >
                            Pending {roleLabel} Approvals
                        </Typography>

                        <Typography
                            variant="h5"
                            fontWeight={700}
                        >
                            {docs.length}
                        </Typography>

                    </Box>

                    <Box
                        sx={{
                            ml: {
                                xs: 0,
                                sm: 'auto',
                            },
                        }}
                    >
                        <Chip
                            label={`${docs.length} document${docs.length === 1 ? '' : 's'} awaiting action`}
                            color={
                                docs.length > 0
                                    ? 'warning'
                                    : 'default'
                            }
                            variant="outlined"
                        />
                    </Box>

                </Stack>

            </Paper>

            {/* Documents */}

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
                        px: 3,
                        py: 2.5,
                    }}
                >

                    <Typography
                        variant="h6"
                        fontWeight={700}
                    >
                        Documents Awaiting Review
                    </Typography>

                    <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ mt: 0.5 }}
                    >
                        Review the document details before
                        taking an approval decision.
                    </Typography>

                </Box>

                <Divider />

                {docs.length === 0 ? (

                    renderEmptyState()

                ) : (

                    <TableContainer
                        sx={{
                            overflowX: 'auto',
                        }}
                    >

                        <Table
                            sx={{
                                minWidth: 1050,
                            }}
                        >

                            <TableHead>

                                <TableRow>

                                    <TableCell
                                        sx={{
                                            fontWeight: 700,
                                            backgroundColor:
                                                'background.default',
                                        }}
                                    >
                                        Document
                                    </TableCell>

                                    <TableCell
                                        sx={{
                                            fontWeight: 700,
                                            backgroundColor:
                                                'background.default',
                                        }}
                                    >
                                        Uploaded By
                                    </TableCell>

                                    <TableCell
                                        sx={{
                                            fontWeight: 700,
                                            backgroundColor:
                                                'background.default',
                                        }}
                                    >
                                        Type
                                    </TableCell>

                                    <TableCell
                                        sx={{
                                            fontWeight: 700,
                                            backgroundColor:
                                                'background.default',
                                        }}
                                    >
                                        Status
                                    </TableCell>

                                    <TableCell
                                        sx={{
                                            fontWeight: 700,
                                            backgroundColor:
                                                'background.default',
                                        }}
                                    >
                                        Submitted
                                    </TableCell>

                                    <TableCell
                                        sx={{
                                            fontWeight: 700,
                                            backgroundColor:
                                                'background.default',
                                            minWidth: 260,
                                        }}
                                    >
                                        AI Summary
                                    </TableCell>

                                    <TableCell
                                        align="right"
                                        sx={{
                                            fontWeight: 700,
                                            backgroundColor:
                                                'background.default',
                                        }}
                                    >
                                        Actions
                                    </TableCell>

                                </TableRow>

                            </TableHead>

                            <TableBody>

                                {docs.map((doc) => (

                                    <TableRow
                                        key={doc.id}
                                        hover
                                    >

                                        {/* Document */}

                                        <TableCell>

                                            <Stack
                                                direction="row"
                                                spacing={1.5}
                                                alignItems="center"
                                            >

                                                <Box
                                                    sx={{
                                                        width: 40,
                                                        height: 40,
                                                        borderRadius: 1.5,
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        flexShrink: 0,
                                                        backgroundColor:
                                                            'rgba(30, 39, 97, 0.08)',
                                                        color:
                                                            'primary.main',
                                                    }}
                                                >
                                                    <DescriptionIcon
                                                        fontSize="small"
                                                    />
                                                </Box>

                                                <Box
                                                    sx={{
                                                        minWidth: 0,
                                                    }}
                                                >

                                                    <Typography
                                                        variant="body2"
                                                        fontWeight={700}
                                                        sx={{
                                                            maxWidth: 220,
                                                            overflow:
                                                                'hidden',
                                                            textOverflow:
                                                                'ellipsis',
                                                            whiteSpace:
                                                                'nowrap',
                                                        }}
                                                    >
                                                        {
                                                            doc.originalFileName
                                                        }
                                                    </Typography>

                                                    <Typography
                                                        variant="caption"
                                                        color="text.secondary"
                                                    >
                                                        {doc.contentType ||
                                                            'Document'}
                                                    </Typography>

                                                </Box>

                                            </Stack>

                                        </TableCell>

                                        {/* Uploaded By */}

                                        <TableCell>

                                            <Stack
                                                direction="row"
                                                spacing={0.75}
                                                alignItems="center"
                                            >

                                                <PersonIcon
                                                    fontSize="small"
                                                    sx={{
                                                        color:
                                                            'text.secondary',
                                                    }}
                                                />

                                                <Typography
                                                    variant="body2"
                                                    sx={{
                                                        maxWidth: 190,
                                                        wordBreak:
                                                            'break-word',
                                                    }}
                                                >
                                                    {
                                                        doc.uploadedByEmail ||
                                                        '-'
                                                    }
                                                </Typography>

                                            </Stack>

                                        </TableCell>

                                        {/* Type */}

                                        <TableCell>

                                            <Chip
                                                label={
                                                    formatLabel(
                                                        doc.documentType
                                                    )
                                                }
                                                size="small"
                                                variant="outlined"
                                            />

                                        </TableCell>

                                        {/* Status */}

                                        <TableCell>

                                            <Stack
                                                spacing={0.75}
                                            >

                                                {getProcessingChip(
                                                    doc.status
                                                )}

                                                {getApprovalChip(
                                                    doc.approvalStatus
                                                )}

                                            </Stack>

                                        </TableCell>

                                        {/* Submitted */}

                                        <TableCell>

                                            <Stack
                                                direction="row"
                                                spacing={0.75}
                                                alignItems="center"
                                            >

                                                <CalendarTodayIcon
                                                    fontSize="small"
                                                    sx={{
                                                        color:
                                                            'text.secondary',
                                                    }}
                                                />

                                                <Typography
                                                    variant="body2"
                                                    sx={{
                                                        whiteSpace:
                                                            'nowrap',
                                                    }}
                                                >
                                                    {formatDate(
                                                        doc.uploadedAt
                                                    )}
                                                </Typography>

                                            </Stack>

                                        </TableCell>

                                        {/* AI Summary */}

                                        <TableCell>

                                            <Typography
                                                variant="body2"
                                                color={
                                                    doc.aiSummary
                                                        ? 'text.primary'
                                                        : 'text.secondary'
                                                }
                                                sx={{
                                                    display:
                                                        '-webkit-box',
                                                    WebkitLineClamp: 3,
                                                    WebkitBoxOrient:
                                                        'vertical',
                                                    overflow: 'hidden',
                                                    lineHeight: 1.5,
                                                }}
                                            >
                                                {doc.aiSummary ||
                                                    'AI summary not available.'}
                                            </Typography>

                                        </TableCell>

                                        {/* Actions */}

                                        <TableCell align="right">

                                            <Stack
                                                direction="row"
                                                spacing={0.5}
                                                justifyContent="flex-end"
                                            >

                                                <Tooltip
                                                    title="View document details"
                                                >
                                                    <IconButton
                                                        size="small"
                                                        onClick={() =>
                                                            navigate(
                                                                `/documents/${doc.id}`
                                                            )
                                                        }
                                                    >
                                                        <VisibilityIcon
                                                            fontSize="small"
                                                        />
                                                    </IconButton>
                                                </Tooltip>

                                                <Tooltip
                                                    title="Approve document"
                                                >
                                                    <IconButton
                                                        size="small"
                                                        color="success"
                                                        onClick={() =>
                                                            openActionDialog(
                                                                doc,
                                                                'approve'
                                                            )
                                                        }
                                                    >
                                                        <CheckCircleIcon
                                                            fontSize="small"
                                                        />
                                                    </IconButton>
                                                </Tooltip>

                                                <Tooltip
                                                    title="Reject document"
                                                >
                                                    <IconButton
                                                        size="small"
                                                        color="error"
                                                        onClick={() =>
                                                            openActionDialog(
                                                                doc,
                                                                'reject'
                                                            )
                                                        }
                                                    >
                                                        <CancelIcon
                                                            fontSize="small"
                                                        />
                                                    </IconButton>
                                                </Tooltip>

                                            </Stack>

                                        </TableCell>

                                    </TableRow>

                                ))}

                            </TableBody>

                        </Table>

                    </TableContainer>

                )}

            </Paper>

            {/* Approval / Rejection Dialog */}

            <Dialog
                open={dialogOpen}
                onClose={closeActionDialog}
                fullWidth
                maxWidth="sm"
            >

                <DialogTitle
                    sx={{
                        pb: 1,
                        fontWeight: 700,
                    }}
                >
                    {selectedDecision === 'approve'
                        ? 'Approve Document'
                        : 'Reject Document'}
                </DialogTitle>

                <DialogContent>

                    <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ mb: 2 }}
                    >
                        You are about to{' '}
                        <strong>
                            {selectedDecision === 'approve'
                                ? 'approve'
                                : 'reject'}
                        </strong>{' '}
                        the following document:
                    </Typography>

                    <Paper
                        elevation={0}
                        sx={{
                            p: 2,
                            mb: 2.5,
                            backgroundColor:
                                'background.default',
                            borderRadius: 2,
                            border: '1px solid',
                            borderColor: 'divider',
                        }}
                    >

                        <Stack
                            direction="row"
                            spacing={1.5}
                            alignItems="center"
                        >

                            <DescriptionIcon
                                color="primary"
                            />

                            <Box>

                                <Typography
                                    variant="body2"
                                    fontWeight={700}
                                    sx={{
                                        wordBreak:
                                            'break-word',
                                    }}
                                >
                                    {
                                        selectedDocument?.originalFileName
                                    }
                                </Typography>

                                <Typography
                                    variant="caption"
                                    color="text.secondary"
                                >
                                    {formatLabel(
                                        selectedDocument?.documentType
                                    )}
                                </Typography>

                            </Box>

                        </Stack>

                    </Paper>


                    {selectedDecision === 'approve' && (
                        <Paper
                            elevation={0}
                            sx={{
                                p: 2,
                                mb: 2.5,
                                border: '1px solid',
                                borderColor: 'divider',
                                borderRadius: 2,
                            }}
                        >
                            <Typography variant="subtitle1" fontWeight={700}>
                                Document Verification Checklist
                            </Typography>

                            <Typography
                                variant="body2"
                                color="text.secondary"
                                sx={{ mt: 0.5, mb: 1.5 }}
                            >
                                Verify all items before approving this document.
                            </Typography>

                            <Stack spacing={0.5}>
                                <FormControlLabel
                                    control={
                                        <Checkbox
                                            checked={reviewChecklist.informationComplete}
                                            onChange={(e) =>
                                                setReviewChecklist(prev => ({
                                                    ...prev,
                                                    informationComplete: e.target.checked,
                                                }))
                                            }
                                        />
                                    }
                                    label="Required information is complete"
                                />

                                <FormControlLabel
                                    control={
                                        <Checkbox
                                            checked={reviewChecklist.supportingDocuments}
                                            onChange={(e) =>
                                                setReviewChecklist(prev => ({
                                                    ...prev,
                                                    supportingDocuments: e.target.checked,
                                                }))
                                            }
                                        />
                                    }
                                    label="Required supporting documents are attached"
                                />

                                <FormControlLabel
                                    control={
                                        <Checkbox
                                            checked={reviewChecklist.detailsConsistent}
                                            onChange={(e) =>
                                                setReviewChecklist(prev => ({
                                                    ...prev,
                                                    detailsConsistent: e.target.checked,
                                                }))
                                            }
                                        />
                                    }
                                   label="Document details are consistent"
                                />

                                <FormControlLabel
                                    control={
                                        <Checkbox
                                            checked={reviewChecklist.documentReadable}
                                            onChange={(e) =>
                                                setReviewChecklist(prev => ({
                                                    ...prev,
                                                    documentReadable: e.target.checked,
                                                }))
                                            }
                                        />
                                    }
                                    label="Document is readable and valid"
                                />
                            </Stack>

                            <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{ mt: 1 }}
                            >
                                {Object.values(reviewChecklist).filter(Boolean).length} of 4
                                checks completed
                            </Typography>

                            {!isChecklistComplete && (
                                <Alert severity="info" sx={{ mt: 1.5 }}>
                                    Complete all four verification checks before approving.
                                </Alert>
                            )}

                        </Paper>
                    )}


            <TextField
                        fullWidth
                        multiline
                        minRows={4}
                        label={
                            selectedDecision === 'reject'
                                ? 'Rejection Reason'
                                : 'Comment'
                        }
                        placeholder={
                            selectedDecision === 'reject'
                                ? 'Enter the reason for rejecting this document...'
                                : 'Add an optional approval comment...'
                        }
                        value={comment}
                        onChange={(event) =>
                            setComment(
                                event.target.value
                            )
                        }
                    />

                    {selectedDecision === 'reject' && (
                        <Typography
                            variant="caption"
                            color="text.secondary"
                            sx={{
                                display: 'block',
                                mt: 1,
                            }}
                        >
                            Providing a clear rejection reason
                            helps the uploader understand what
                            needs to be corrected.
                        </Typography>
                    )}

                </DialogContent>


                <DialogActions
                    sx={{
                        px: 3,
                        pb: 2.5,
                    }}
                >
                    <Button

                        onClick={closeActionDialog}
                        disabled={actionLoading}
                    >
                        Cancel
                    </Button>

                    <Button
                        variant="contained"
                        color={
                            selectedDecision === 'approve'
                                ? 'success'
                                : 'error'
                        }
                        startIcon={
                            actionLoading ? (
                                <CircularProgress size={18} color="inherit" />
                            ) : selectedDecision === 'approve' ? (
                                <CheckCircleIcon />
                            ) : (
                                <CancelIcon />
                            )
                        }
                        onClick={handleAction}
                        disabled={
                            actionLoading ||
                            (
                                selectedDecision === 'approve' &&
                                !isChecklistComplete
                            )
                        }
                    >
                        {actionLoading
                            ? 'Processing...'
                            : selectedDecision === 'approve'
                                ? 'Approve'
                                : 'Reject'}
                    </Button>
                </DialogActions>

            </Dialog>

        </Box>
    );
}