import { useEffect, useMemo, useState } from 'react';
import {
    Alert,
    Box,
    Button,
    Chip,
    CircularProgress,
    FormControl,
    IconButton,
    InputAdornment,
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
    Typography,
} from '@mui/material';

import SearchIcon from '@mui/icons-material/Search';
import RefreshIcon from '@mui/icons-material/Refresh';
import VisibilityIcon from '@mui/icons-material/Visibility';
import DownloadIcon from '@mui/icons-material/Download';
import DescriptionIcon from '@mui/icons-material/Description';
import FilterListIcon from '@mui/icons-material/FilterList';

import { useNavigate } from 'react-router-dom';
import axios from '../api/axiosConfig';
import { useAuth } from '../context/AuthContext';
import { getApiErrorMessage } from '../utils/apiError';

export default function Documents() {
    const navigate = useNavigate();
    const { user } = useAuth();

    const [documents, setDocuments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState('');

    const [search, setSearch] = useState('');
    const [typeFilter, setTypeFilter] = useState('ALL');
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [approvalFilter, setApprovalFilter] = useState('ALL');

    const loadDocuments = async (isRefresh = false) => {
        try {
            setError('');

            if (isRefresh) {
                setRefreshing(true);
            } else {
                setLoading(true);
            }

            const endpoint =
                user?.role === 'EMPLOYEE'
                    ? '/documents/my'
                    : '/documents';

            const response = await axios.get(endpoint);

            setDocuments(response.data || []);
        } catch (err) {
            console.error('Failed to load documents:', err);

            setError(
                getApiErrorMessage(
                    err,
                    'Unable to load documents. Please try again.'
                )
            );
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        if (user?.role) {
            loadDocuments();
        }
    }, [user?.role]);

    const documentTypes = useMemo(() => {
        const types = documents
            .map((doc) => doc.documentType)
            .filter(Boolean);

        return [...new Set(types)];
    }, [documents]);

    const processingStatuses = useMemo(() => {
        const statuses = documents
            .map((doc) => doc.status)
            .filter(Boolean);

        return [...new Set(statuses)];
    }, [documents]);

    const approvalStatuses = useMemo(() => {
        const statuses = documents
            .map((doc) => doc.approvalStatus)
            .filter(Boolean);

        return [...new Set(statuses)];
    }, [documents]);

    const filteredDocuments = useMemo(() => {
        return documents.filter((doc) => {
            const fileName =
                doc.originalFileName?.toLowerCase() || '';

            const searchMatch =
                fileName.includes(search.toLowerCase());

            const typeMatch =
                typeFilter === 'ALL' ||
                doc.documentType === typeFilter;

            const statusMatch =
                statusFilter === 'ALL' ||
                doc.status === statusFilter;

            const approvalMatch =
                approvalFilter === 'ALL' ||
                doc.approvalStatus === approvalFilter;

            return (
                searchMatch &&
                typeMatch &&
                statusMatch &&
                approvalMatch
            );
        });
    }, [
        documents,
        search,
        typeFilter,
        statusFilter,
        approvalFilter,
    ]);

    const formatFileSize = (bytes) => {
        if (!bytes) return '0 KB';

        if (bytes < 1024) {
            return `${bytes} B`;
        }

        if (bytes < 1024 * 1024) {
            return `${(bytes / 1024).toFixed(1)} KB`;
        }

        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    };

    const formatDate = (date) => {
        if (!date) return '-';

        return new Date(date).toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
        });
    };

    const formatLabel = (value) => {
        if (!value) return '-';

        return value
            .toLowerCase()
            .replace(/_/g, ' ')
            .replace(/\b\w/g, (letter) => letter.toUpperCase());
    };

    const getProcessingChip = (status) => {
        switch (status) {
            case 'PROCESSED':
                return (
                    <Chip
                        label="Processed"
                        size="small"
                        color="success"
                    />
                );

            case 'PROCESSING':
                return (
                    <Chip
                        label="Processing"
                        size="small"
                        color="warning"
                    />
                );

            case 'FAILED':
                return (
                    <Chip
                        label="Failed"
                        size="small"
                        color="error"
                    />
                );

            case 'UPLOADED':
                return (
                    <Chip
                        label="Uploaded"
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
        if (!status) {
            return (
                <Typography
                    variant="body2"
                    color="text.secondary"
                >
                    —
                </Typography>
            );
        }

        switch (status) {
            case 'APPROVED':
                return (
                    <Chip
                        label="Approved"
                        size="small"
                        color="success"
                    />
                );

            case 'REJECTED':
                return (
                    <Chip
                        label="Rejected"
                        size="small"
                        color="error"
                    />
                );

            case 'PENDING_REVIEWER':
                return (
                    <Chip
                        label="Pending Review"
                        size="small"
                        color="warning"
                    />
                );

            case 'PENDING_MANAGER':
                return (
                    <Chip
                        label="Pending Manager"
                        size="small"
                        color="warning"
                    />
                );

            case 'NOT_SUBMITTED':
                return (
                    <Chip
                        label="Not Submitted"
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

    const handleDownload = async (id, fileName) => {
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

            const url = window.URL.createObjectURL(blob);

            const link = document.createElement('a');
            link.href = url;
            link.download = fileName || 'document';
            document.body.appendChild(link);
            link.click();

            link.remove();
            window.URL.revokeObjectURL(url);
        } catch (err) {
            console.error('Download failed:', err);

            setError(
                getApiErrorMessage(
                    err,
                    'Unable to download the document. Please try again.'
                )
            );
        }
    };

    const clearFilters = () => {
        setSearch('');
        setTypeFilter('ALL');
        setStatusFilter('ALL');
        setApprovalFilter('ALL');
    };

    return (
        <Box>
            {/* Header */}
            <Box
                sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: {
                        xs: 'flex-start',
                        sm: 'center',
                    },
                    gap: 2,
                    mb: 3,
                    flexDirection: {
                        xs: 'column',
                        sm: 'row',
                    },
                }}
            >
                <Box>
                    <Typography
                        variant="h4"
                        fontWeight={700}
                        sx={{ mb: 0.5 }}
                    >
                        Documents
                    </Typography>

                    <Typography
                        variant="body1"
                        color="text.secondary"
                    >
                        Manage and review your uploaded documents.
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
                    onClick={() => loadDocuments(true)}
                    disabled={refreshing}
                >
                    Refresh
                </Button>
            </Box>

            {/* Error */}
            {error && (
                <Alert
                    severity="error"
                    sx={{ mb: 3 }}
                    onClose={() => setError('')}
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
                    borderRadius: 3,
                }}
            >
                <Stack
                    direction={{
                        xs: 'column',
                        md: 'row',
                    }}
                    spacing={2}
                    alignItems={{
                        xs: 'stretch',
                        md: 'center',
                    }}
                >
                    <TextField
                        fullWidth
                        size="small"
                        placeholder="Search documents..."
                        value={search}
                        onChange={(e) =>
                            setSearch(e.target.value)
                        }
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <SearchIcon
                                        color="action"
                                    />
                                </InputAdornment>
                            ),
                        }}
                    />

                    <FormControl
                        size="small"
                        sx={{
                            minWidth: {
                                xs: '100%',
                                md: 180,
                            },
                        }}
                    >
                        <InputLabel>
                            Document Type
                        </InputLabel>

                        <Select
                            value={typeFilter}
                            label="Document Type"
                            onChange={(e) =>
                                setTypeFilter(e.target.value)
                            }
                        >
                            <MenuItem value="ALL">
                                All Types
                            </MenuItem>

                            {documentTypes.map((type) => (
                                <MenuItem
                                    key={type}
                                    value={type}
                                >
                                    {formatLabel(type)}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>

                    <FormControl
                        size="small"
                        sx={{
                            minWidth: {
                                xs: '100%',
                                md: 170,
                            },
                        }}
                    >
                        <InputLabel>
                            Processing
                        </InputLabel>

                        <Select
                            value={statusFilter}
                            label="Processing"
                            onChange={(e) =>
                                setStatusFilter(e.target.value)
                            }
                        >
                            <MenuItem value="ALL">
                                All Status
                            </MenuItem>

                            {processingStatuses.map(
                                (status) => (
                                    <MenuItem
                                        key={status}
                                        value={status}
                                    >
                                        {formatLabel(status)}
                                    </MenuItem>
                                )
                            )}
                        </Select>
                    </FormControl>

                    <FormControl
                        size="small"
                        sx={{
                            minWidth: {
                                xs: '100%',
                                md: 180,
                            },
                        }}
                    >
                        <InputLabel>
                            Approval
                        </InputLabel>

                        <Select
                            value={approvalFilter}
                            label="Approval"
                            onChange={(e) =>
                                setApprovalFilter(e.target.value)
                            }
                        >
                            <MenuItem value="ALL">
                                All Approvals
                            </MenuItem>

                            {approvalStatuses.map(
                                (status) => (
                                    <MenuItem
                                        key={status}
                                        value={status}
                                    >
                                        {formatLabel(status)}
                                    </MenuItem>
                                )
                            )}
                        </Select>
                    </FormControl>

                    <Tooltip title="Clear filters">
                        <IconButton
                            onClick={clearFilters}
                            sx={{
                                alignSelf: {
                                    xs: 'flex-end',
                                    md: 'center',
                                },
                            }}
                        >
                            <FilterListIcon />
                        </IconButton>
                    </Tooltip>
                </Stack>
            </Paper>

            {/* Results count */}
            <Box sx={{ mb: 1.5 }}>
                <Typography
                    variant="body2"
                    color="text.secondary"
                >
                    Showing{' '}
                    <strong>
                        {filteredDocuments.length}
                    </strong>{' '}
                    of{' '}
                    <strong>{documents.length}</strong>{' '}
                    documents
                </Typography>
            </Box>

            {/* Loading */}
            {loading ? (
                <Paper
                    elevation={0}
                    sx={{
                        minHeight: 350,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: '1px solid',
                        borderColor: 'divider',
                        borderRadius: 3,
                    }}
                >
                    <Stack
                        spacing={2}
                        alignItems="center"
                    >
                        <CircularProgress />
                        <Typography color="text.secondary">
                            Loading documents...
                        </Typography>
                    </Stack>
                </Paper>
            ) : filteredDocuments.length === 0 ? (
                /* Empty state */
                <Paper
                    elevation={0}
                    sx={{
                        minHeight: 350,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: '1px solid',
                        borderColor: 'divider',
                        borderRadius: 3,
                        p: 4,
                    }}
                >
                    <Stack
                        spacing={1.5}
                        alignItems="center"
                        textAlign="center"
                    >
                        <DescriptionIcon
                            sx={{
                                fontSize: 56,
                                color: 'text.disabled',
                            }}
                        />

                        <Typography
                            variant="h6"
                            fontWeight={600}
                        >
                            No documents found
                        </Typography>

                        <Typography
                            variant="body2"
                            color="text.secondary"
                        >
                            {documents.length === 0
                                ? 'You have not uploaded any documents yet.'
                                : 'Try changing your search or filters.'}
                        </Typography>

                        {documents.length > 0 && (
                            <Button
                                variant="outlined"
                                onClick={clearFilters}
                                sx={{ mt: 1 }}
                            >
                                Clear Filters
                            </Button>
                        )}
                    </Stack>
                </Paper>
            ) : (
                /* Documents table */
                <TableContainer
                    component={Paper}
                    elevation={0}
                    sx={{
                        border: '1px solid',
                        borderColor: 'divider',
                        borderRadius: 3,
                        overflowX: 'auto',
                    }}
                >
                    <Table
                        sx={{
                            minWidth: 950,
                        }}
                    >
                        <TableHead>
                            <TableRow>
                                <TableCell>
                                    Document
                                </TableCell>

                                <TableCell>
                                    Type
                                </TableCell>

                                <TableCell>
                                    Processing
                                </TableCell>

                                <TableCell>
                                    Approval
                                </TableCell>

                                <TableCell>
                                    Uploaded By
                                </TableCell>

                                <TableCell>
                                    Date
                                </TableCell>

                                <TableCell align="right">
                                    Actions
                                </TableCell>
                            </TableRow>
                        </TableHead>

                        <TableBody>
                            {filteredDocuments.map(
                                (doc) => (
                                    <TableRow
                                        key={doc.id}
                                        hover
                                    >
                                        <TableCell>
                                            <Stack
                                                direction="row"
                                                spacing={1.5}
                                                alignItems="center"
                                            >
                                                <Box
                                                    sx={{
                                                        width: 38,
                                                        height: 38,
                                                        borderRadius: 2,
                                                        display: 'flex',
                                                        alignItems:
                                                            'center',
                                                        justifyContent:
                                                            'center',
                                                        backgroundColor:
                                                            'rgba(30, 39, 97, 0.08)',
                                                        color: 'primary.main',
                                                        flexShrink: 0,
                                                    }}
                                                >
                                                    <DescriptionIcon fontSize="small" />
                                                </Box>

                                                <Box
                                                    sx={{
                                                        minWidth: 0,
                                                    }}
                                                >
                                                    <Typography
                                                        variant="body2"
                                                        fontWeight={600}
                                                        noWrap
                                                        sx={{
                                                            maxWidth: 220,
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
                                                        {formatFileSize(
                                                            doc.fileSizeBytes
                                                        )}
                                                    </Typography>
                                                </Box>
                                            </Stack>
                                        </TableCell>

                                        <TableCell>
                                            <Typography variant="body2">
                                                {formatLabel(
                                                    doc.documentType
                                                )}
                                            </Typography>
                                        </TableCell>

                                        <TableCell>
                                            {getProcessingChip(
                                                doc.status
                                            )}
                                        </TableCell>

                                        <TableCell>
                                            {getApprovalChip(
                                                doc.approvalStatus
                                            )}
                                        </TableCell>

                                        <TableCell>
                                            <Typography
                                                variant="body2"
                                                color="text.secondary"
                                                noWrap
                                                sx={{
                                                    maxWidth: 180,
                                                }}
                                            >
                                                {
                                                    doc.uploadedByEmail
                                                }
                                            </Typography>
                                        </TableCell>

                                        <TableCell>
                                            <Typography
                                                variant="body2"
                                                color="text.secondary"
                                                noWrap
                                            >
                                                {formatDate(
                                                    doc.uploadedAt
                                                )}
                                            </Typography>
                                        </TableCell>

                                        <TableCell align="right">
                                            <Stack
                                                direction="row"
                                                spacing={0.5}
                                                justifyContent="flex-end"
                                            >
                                                <Tooltip title="View details">
                                                    <IconButton
                                                        size="small"
                                                        color="primary"
                                                        onClick={() =>
                                                            navigate(
                                                                `/documents/${doc.id}`
                                                            )
                                                        }
                                                    >
                                                        <VisibilityIcon fontSize="small" />
                                                    </IconButton>
                                                </Tooltip>

                                                <Tooltip title="Download">
                                                    <IconButton
                                                        size="small"
                                                        color="secondary"
                                                        onClick={() =>
                                                            handleDownload(
                                                                doc.id,
                                                                doc.originalFileName
                                                            )
                                                        }
                                                    >
                                                        <DownloadIcon fontSize="small" />
                                                    </IconButton>
                                                </Tooltip>
                                            </Stack>
                                        </TableCell>
                                    </TableRow>
                                )
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}
        </Box>
    );
}