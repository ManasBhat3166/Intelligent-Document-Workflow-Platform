
import { useEffect, useRef, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
    Box,
    Button,
    MenuItem,
    TextField,
    Typography,
    Alert,
    LinearProgress,
    Paper,
    Stack,
    Chip,
    IconButton,
    Divider,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    Tooltip
} from '@mui/material';

import CloudUploadOutlinedIcon from '@mui/icons-material/CloudUploadOutlined';
import InsertDriveFileOutlinedIcon from '@mui/icons-material/InsertDriveFileOutlined';
import DeleteIcon from '@mui/icons-material/Delete';
import AutoAwesomeOutlinedIcon from '@mui/icons-material/AutoAwesomeOutlined';
import DocumentScannerOutlinedIcon from '@mui/icons-material/DocumentScannerOutlined';
import FactCheckOutlinedIcon from '@mui/icons-material/FactCheckOutlined';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import HistoryOutlinedIcon from '@mui/icons-material/HistoryOutlined';
import api from '../api/axiosConfig';
import { getApiErrorMessage } from '../utils/apiError';

const TYPES = ['CONTRACT', 'INVOICE', 'RESUME', 'REPORT', 'OTHER'];
const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ALLOWED_EXTENSIONS = ['pdf', 'doc', 'docx', 'png', 'jpg', 'jpeg'];

export default function Upload() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const fileInputRef = useRef(null);

    const resubmitOf = searchParams.get('resubmit');

    const [file, setFile] = useState(null);
    const [type, setType] = useState('OTHER');
    const [status, setStatus] = useState('');
    const [loading, setLoading] = useState(false);
    const [rejection, setRejection] = useState(null);
    const [dragging, setDragging] = useState(false);
    const [recentUploads, setRecentUploads] = useState([]);

    useEffect(() => {
        if (!resubmitOf) return;

        const loadRejection = async () => {
            try {
                const response = await api.get(
                    `/approvals/${resubmitOf}/latest-rejection`
                );
                setRejection(response.data);
            } catch (error) {
                console.error('Failed to load rejection details:', error);
            }
        };

        const loadOriginalDocument = async () => {
            try {
                const response = await api.get(`/documents/${resubmitOf}`);
                if (response.data.documentType) {
                    setType(response.data.documentType);
                }
            } catch (error) {
                console.error('Failed to load original document:', error);
            }
        };

        loadRejection();
        loadOriginalDocument();
    }, [resubmitOf]);

    const loadRecentUploads = async () => {
        try {
            const response = await api.get('/documents/my');
            const documents = Array.isArray(response.data)
                ? response.data
                : response.data?.content || [];

            setRecentUploads(documents.slice(0, 5));
        } catch (error) {
            console.error('Failed to load recent uploads:', error);
        }
    };

    useEffect(() => {
        loadRecentUploads();
    }, []);

    const validateFile = (selectedFile) => {
        if (!selectedFile) return false;

        const extension = selectedFile.name.split('.').pop().toLowerCase();

        if (!ALLOWED_EXTENSIONS.includes(extension)) {
            setStatus(
                'error:Unsupported file format. Choose PDF, DOC, DOCX, PNG, JPG, or JPEG.'
            );
            return false;
        }

        if (selectedFile.size > MAX_FILE_SIZE) {
            setStatus('error:File size must not exceed 10 MB.');
            return false;
        }

        if (selectedFile.size === 0) {
            setStatus('error:The selected file is empty.');
            return false;
        }

        setStatus('');
        setFile(selectedFile);
        return true;
    };

    const handleFileChange = (event) => {
        const selectedFile = event.target.files?.[0];
        if (selectedFile) validateFile(selectedFile);

        // Allows selecting the same file again after removing it.
        event.target.value = '';
    };

    const handleDrop = (event) => {
        event.preventDefault();
        setDragging(false);

        if (loading) return;

        const droppedFile = event.dataTransfer.files?.[0];

        if (event.dataTransfer.files?.length > 1) {
            setStatus('error:Please upload one document at a time.');
            return;
        }

        if (droppedFile) validateFile(droppedFile);
    };

    const formatSize = (bytes) => {
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) {
            return `${(bytes / 1024).toFixed(1)} KB`;
        }
        return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
    };

    const handleUpload = async () => {
        if (!file) {
            setStatus('error:Please select a file first.');
            return;
        }

        setLoading(true);
        setStatus('');

        const formData = new FormData();
        formData.append('file', file);
        formData.append('type', type);

        try {
            const uploadUrl = resubmitOf
                ? `/documents/upload?resubmitOf=${encodeURIComponent(resubmitOf)}`
                : '/documents/upload';

            const response = await api.post(uploadUrl, formData);

            if (resubmitOf) {
                setStatus(
                    'success:Corrected document uploaded successfully. Processing has started and it will be sent for review automatically.'
                );
                setFile(null);
                await loadRecentUploads();

                setTimeout(() => navigate('/dashboard'), 1200);
                return;
            }

            setStatus(
                `success:Document uploaded successfully. Processing has started. Document ID: ${response.data.id}`
            );
            setFile(null);
            await loadRecentUploads();
        } catch (error) {
            console.error('Upload failed:', error);
            setStatus(
                'error:' +
                getApiErrorMessage(error, 'Upload failed. Please try again.')
            );
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (documentStatus) => {
        const value = String(documentStatus || '').toUpperCase();

        if (['PROCESSED', 'APPROVED', 'COMPLETED'].includes(value)) {
            return 'success';
        }
        if (['FAILED', 'REJECTED'].includes(value)) {
            return 'error';
        }
        if (['PROCESSING', 'PENDING_REVIEWER', 'PENDING'].includes(value)) {
            return 'warning';
        }
        return 'default';
    };

    return (
        <Box sx={{ maxWidth: 1100, mx: 'auto', pb: 4 }}>
            <Box sx={{ mb: 3 }}>
                <Typography variant="h4" fontWeight={750} sx={{ mb: 1 }}>
                    {resubmitOf ? 'Upload Corrected Document' : 'Upload Document'}
                </Typography>

                <Typography color="text.secondary">
                    {resubmitOf
                        ? 'Upload the corrected version for another review.'
                        : 'Upload a document to start AI-powered processing and approval.'}
                </Typography>
            </Box>

            {resubmitOf && (
                <Alert severity="warning" sx={{ mb: 3, borderRadius: 2 }}>
                    <Typography fontWeight={700}>
                        Resubmitting a rejected document
                    </Typography>

                    <Typography variant="body2" sx={{ mt: 0.5 }}>
                        Upload the corrected version of the original document.
                    </Typography>

                    {rejection?.comment && (
                        <Typography variant="body2" sx={{ mt: 1 }}>
                            <strong>Reviewer feedback:</strong>{' '}
                            {rejection.comment}
                        </Typography>
                    )}
                </Alert>
            )}

            {status && (
                <Alert
                    severity={status.startsWith('error') ? 'error' : 'success'}
                    onClose={() => setStatus('')}
                    sx={{ mb: 3, borderRadius: 2 }}
                >
                    {status.split(':').slice(1).join(':')}
                </Alert>
            )}

            <Box
                sx={{
                    display: 'grid',
                    gridTemplateColumns: { xs: '1fr', md: 'minmax(0, 1.7fr) minmax(280px, 1fr)' },
                    gap: 3,
                    alignItems: 'start'
                }}
            >
                <Paper
                    elevation={0}
                    sx={{
                        p: { xs: 2, sm: 3 },
                        border: '1px solid',
                        borderColor: 'divider',
                        borderRadius: 3
                    }}
                >
                    <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
                        Document details
                    </Typography>

                    <TextField
                        select
                        fullWidth
                        label="Document Type"
                        value={type}
                        onChange={(event) => setType(event.target.value)}
                        sx={{ mb: 3 }}
                    >
                        {TYPES.map((documentType) => (
                            <MenuItem key={documentType} value={documentType}>
                                {documentType}
                            </MenuItem>
                        ))}
                    </TextField>

                    <Box
                        onDragEnter={(event) => {
                            event.preventDefault();
                            if (!loading) setDragging(true);
                        }}
                        onDragOver={(event) => event.preventDefault()}
                        onDragLeave={(event) => {
                            if (!event.currentTarget.contains(event.relatedTarget)) {
                                setDragging(false);
                            }
                        }}
                        onDrop={handleDrop}
                        onClick={() => {
                            if (!loading) fileInputRef.current?.click();
                        }}
                        sx={{
                            border: '2px dashed',
                            borderColor: dragging ? 'success.main' : 'divider',
                            bgcolor: dragging ? 'action.hover' : 'background.default',
                            borderRadius: 3,
                            p: { xs: 3, sm: 5 },
                            textAlign: 'center',
                            cursor: loading ? 'default' : 'pointer',
                            transition: 'all 0.2s ease',
                            '&:hover': {
                                borderColor: loading ? 'divider' : 'primary.main'
                            }
                        }}
                    >
                        <input
                            ref={fileInputRef}
                            type="file"
                            hidden
                            accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
                            onChange={handleFileChange}
                            disabled={loading}
                        />

                        <CloudUploadOutlinedIcon
                            sx={{ fontSize: 54, color: 'primary.main', mb: 1 }}
                        />

                        <Typography variant="h6" fontWeight={700}>
                            Drag and drop your document
                        </Typography>

                        <Typography color="text.secondary" sx={{ my: 1 }}>
                            or click here to browse files
                        </Typography>

                        <Typography variant="caption" color="text.secondary">
                            PDF, DOC, DOCX, PNG, JPG or JPEG · Maximum 10 MB
                        </Typography>
                    </Box>

                    {file && (
                        <Paper
                            variant="outlined"
                            sx={{
                                mt: 2,
                                p: 2,
                                borderRadius: 2
                            }}
                        >
                            <Stack direction="row" alignItems="center" spacing={2}>
                                <InsertDriveFileOutlinedIcon
                                    color="primary"
                                    sx={{ fontSize: 36 }}
                                />

                                <Box sx={{ flex: 1, minWidth: 0 }}>
                                    <Typography fontWeight={650} noWrap>
                                        {file.name}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        {formatSize(file.size)}
                                    </Typography>
                                </Box>

                                <Tooltip title="Remove selected file">
                                    <span>
                                        <IconButton
                                            color="error"
                                            disabled={loading}
                                            onClick={(event) => {
                                                event.stopPropagation();
                                                setFile(null);
                                                setStatus('');
                                            }}
                                        >
                                            <DeleteIcon />
                                        </IconButton>
                                    </span>
                                </Tooltip>
                            </Stack>
                        </Paper>
                    )}

                    {loading && (
                        <Box sx={{ mt: 2 }}>
                            <LinearProgress />
                            <Typography
                                variant="body2"
                                color="text.secondary"
                                sx={{ mt: 1 }}
                            >
                                Uploading document...
                            </Typography>
                        </Box>
                    )}

                    <Button
                        variant="contained"
                        fullWidth
                        size="large"
                        startIcon={<CloudUploadOutlinedIcon />}
                        onClick={handleUpload}
                        disabled={loading || !file}
                        sx={{
                            mt: 3,
                            py: 1.4,
                            borderRadius: 2,
                            fontWeight: 700,
                            textTransform: 'none'
                        }}
                    >
                        {loading
                            ? 'Uploading...'
                            : resubmitOf
                                ? 'Upload Corrected Document'
                                : 'Upload Document'}
                    </Button>
                </Paper>

                <Stack spacing={3}>
                    <Paper
                        elevation={0}
                        sx={{
                            p: 3,
                            border: '1px solid',
                            borderColor: 'divider',
                            borderRadius: 3
                        }}
                    >
                        <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
                            <AutoAwesomeOutlinedIcon color="primary" />
                            <Typography variant="h6" fontWeight={700}>
                                What happens next?
                            </Typography>
                        </Stack>

                        <List disablePadding>
                            <ListItem disableGutters alignItems="flex-start">
                                <ListItemIcon sx={{ minWidth: 38, mt: 0.5 }}>
                                    <DocumentScannerOutlinedIcon color="primary" />
                                </ListItemIcon>
                                <ListItemText
                                    primary="Text extraction"
                                    secondary="OCR extracts readable text from the uploaded document."
                                    slotProps={{
                                        primary: { fontWeight: 650 },
                                        secondary: { sx: { lineHeight: 1.5 } }
                                    }}
                                />
                            </ListItem>

                            <Divider sx={{ my: 1 }} />

                            <ListItem disableGutters alignItems="flex-start">
                                <ListItemIcon sx={{ minWidth: 38, mt: 0.5 }}>
                                    <AutoAwesomeOutlinedIcon color="primary" />
                                </ListItemIcon>
                                <ListItemText
                                    primary="AI analysis"
                                    secondary="The platform generates a summary and identifies document information."
                                    slotProps={{
                                        primary: { fontWeight: 650 },
                                        secondary: { sx: { lineHeight: 1.5 } }
                                    }}
                                />
                            </ListItem>

                            <Divider sx={{ my: 1 }} />

                            <ListItem disableGutters alignItems="flex-start">
                                <ListItemIcon sx={{ minWidth: 38, mt: 0.5 }}>
                                    <FactCheckOutlinedIcon color="primary" />
                                </ListItemIcon>
                                <ListItemText
                                    primary="Review and approval"
                                    secondary="The document proceeds through the configured approval workflow."
                                    slotProps={{
                                        primary: { fontWeight: 650 },
                                        secondary: { sx: { lineHeight: 1.5 } }
                                    }}
                                />
                            </ListItem>
                        </List>

                        <Alert severity="info" sx={{ mt: 2 }}>
                            Processing happens in the background. You can track the document from your Documents page.
                        </Alert>
                    </Paper>

                    <Paper
                        elevation={0}
                        sx={{
                            p: 3,
                            border: '1px solid',
                            borderColor: 'divider',
                            borderRadius: 3
                        }}
                    >
                        <Stack
                            direction="row"
                            alignItems="center"
                            justifyContent="space-between"
                            sx={{ mb: 1 }}
                        >
                            <Stack direction="row" alignItems="center" spacing={1}>
                                <HistoryOutlinedIcon color="primary" />
                                <Typography variant="h6" fontWeight={700}>
                                    Recent uploads
                                </Typography>
                            </Stack>

                            <Button
                                size="small"
                                onClick={() => navigate('/documents')}
                                sx={{ textTransform: 'none' }}
                            >
                                View all
                            </Button>
                        </Stack>

                        {recentUploads.length === 0 ? (
                            <Box sx={{ py: 2, textAlign: 'center' }}>
                                <CheckCircleIcon
                                    sx={{ fontSize: 36, color: 'text.disabled', mb: 1 }}
                                />
                                <Typography variant="body2" color="text.secondary">
                                    Your recent documents will appear here.
                                </Typography>
                            </Box>
                        ) : (
                            <List disablePadding>
                                {recentUploads.map((document, index) => (
                                    <Box key={document.id}>
                                        {index > 0 && <Divider />}
                                        <ListItem
                                            disableGutters
                                            sx={{ py: 1.5, alignItems: 'flex-start' }}
                                        >
                                            <ListItemIcon sx={{ minWidth: 36, mt: 0.5 }}>
                                                <InsertDriveFileOutlinedIcon color="action" />
                                            </ListItemIcon>

                                            <ListItemText
                                                primary={
                                                    <Typography
                                                        variant="body2"
                                                        fontWeight={650}
                                                        sx={{ overflowWrap: 'anywhere' }}
                                                    >
                                                        {document.originalFileName || 'Untitled document'}
                                                    </Typography>
                                                }
                                                secondary={
                                                    <Stack
                                                        direction="row"
                                                        spacing={1}
                                                        alignItems="center"
                                                        flexWrap="wrap"
                                                        sx={{ mt: 0.75 }}
                                                    >
                                                        <Chip
                                                            size="small"
                                                            label={document.status || 'UPLOADED'}
                                                            color={getStatusColor(document.status)}
                                                            variant="outlined"
                                                        />
                                                        {document.uploadedAt && (
                                                            <Typography
                                                                variant="caption"
                                                                color="text.secondary"
                                                            >
                                                                {new Date(document.uploadedAt).toLocaleDateString()}
                                                            </Typography>
                                                        )}
                                                    </Stack>
                                                }
                                            />

                                            <Button
                                                size="small"
                                                onClick={() => navigate(`/documents/${document.id}`)}
                                                sx={{ ml: 1, textTransform: 'none' }}
                                            >
                                                View
                                            </Button>
                                        </ListItem>
                                    </Box>
                                ))}
                            </List>
                        )}
                    </Paper>
                </Stack>
            </Box>
        </Box>
    );
}
