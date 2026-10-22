import { useState } from 'react';
import {
    Alert,
    Box,
    Button,
    Card,
    CardContent,
    Chip,
    CircularProgress,
    Divider,
    InputAdornment,
    Paper,
    Stack,
    TextField,
    Typography
} from '@mui/material';

import SearchIcon from '@mui/icons-material/Search';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import CloseIcon from '@mui/icons-material/Close';

import { useNavigate } from 'react-router-dom';
import api from '../api/axiosConfig';
import { getApiErrorMessage } from '../utils/apiError';

export default function Search() {
    const navigate = useNavigate();

    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searched, setSearched] = useState(false);
    const [error, setError] = useState('');


    const handleSearch = async () => {
        const trimmedQuery = query.trim();

        if (!trimmedQuery) {
            setError('Please enter a search query.');
            return;
        }

        if (trimmedQuery.length < 3) {
            setResults([]);
            setSearched(false);
            setError('Please enter at least 3 characters to search.');
            return;
        }

        setLoading(true);
        setSearched(true);
        setError('');
        setResults([]);

        try {
            const res = await api.post('/search/semantic', {
                query: trimmedQuery,
                limit: 5
            });

            const searchResults = Array.isArray(res.data)
                ? res.data
                : [];

            setResults(searchResults);
        } catch (err) {
            console.error('Semantic search failed:', err);

            setResults([]);
            setError(
                getApiErrorMessage(
                    err,
                    'Unable to search documents. Please try again.'
                )
            );
        } finally {
            setLoading(false);
        }
    };

    const handleClear = () => {
        setQuery('');
        setResults([]);
        setSearched(false);
        setError('');
        setLoading(false);
    };


    const handleKeyDown = (event) => {
        if (event.key === 'Enter' && !loading) {
            handleSearch();
        }
    };


    const getScoreLabel = (score) => {
        if (score >= 0.8) return 'Highly Relevant';
        if (score >= 0.6) return 'Relevant';
        return 'Possible Match';
    };

    const getScoreColor = (score) => {
        if (score >= 0.8) return 'success';
        if (score >= 0.6) return 'primary';
        return 'default';
    };

    const formatScore = (score) => {
        if (typeof score !== 'number' || !Number.isFinite(score)) {
            return 'N/A';
        }

        return `${Math.round(score * 100)}%`;
    };


    return (
        <Box sx={{ maxWidth: 1100, mx: 'auto' }}>
            {/* Header */}
            <Box sx={{ mb: 4 }}>
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
                        <AutoAwesomeIcon />
                    </Box>

                    <Typography variant="h4">
                        AI Document Search
                    </Typography>
                </Stack>

                <Typography
                    variant="body1"
                    color="text.secondary"
                    sx={{ maxWidth: 720 }}
                >
                    Search your documents by meaning instead of exact keywords.
                    Our semantic search uses vector embeddings to find the
                    documents most relevant to your query.
                </Typography>
            </Box>

            {/* Search Box */}
            <Paper
                elevation={0}
                sx={{
                    p: { xs: 2, sm: 3 },
                    mb: 4,
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 3
                }}
            >
                <Stack spacing={2}>
                    <TextField
                        fullWidth
                        value={query}
                        onChange={(event) => setQuery(event.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Try: payment terms, employee leave policy, invoice requirements..."
                        label="Search documents"
                        variant="outlined"
                        disabled={loading}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <SearchIcon color="action" />
                                </InputAdornment>
                            ),
                            endAdornment: query && !loading ? (
                                <InputAdornment position="end">
                                    <Button
                                        onClick={handleClear}
                                        size="small"
                                        sx={{
                                            minWidth: 32,
                                            width: 32,
                                            height: 32,
                                            borderRadius: 2
                                        }}
                                    >
                                        <CloseIcon fontSize="small" />
                                    </Button>
                                </InputAdornment>
                            ) : null
                        }}
                    />

                    <Stack
                        direction={{ xs: 'column', sm: 'row' }}
                        spacing={1.5}
                        justifyContent="space-between"
                        alignItems={{ xs: 'stretch', sm: 'center' }}
                    >
                        <Typography
                            variant="caption"
                            color="text.secondary"
                        >
                            Press Enter to search
                        </Typography>

                        <Button
                            variant="contained"
                            startIcon={
                                loading ? (
                                    <CircularProgress
                                        size={18}
                                        color="inherit"
                                    />
                                ) : (
                                    <SearchIcon />
                                )
                            }
                            onClick={handleSearch}
                            disabled={loading || query.trim().length < 3}
                            sx={{
                                minWidth: 140,
                                py: 1.2
                            }}
                        >
                            {loading ? 'Searching...' : 'Search'}
                        </Button>
                    </Stack>
                </Stack>
            </Paper>

            {/* Error */}
            {error && (
                <Alert
                    severity="error"
                    sx={{ mb: 3 }}
                >
                    {error}
                </Alert>
            )}

            {/* Loading */}
            {loading && (
                <Paper
                    elevation={0}
                    sx={{
                        p: 5,
                        textAlign: 'center',
                        border: '1px solid',
                        borderColor: 'divider',
                        borderRadius: 3
                    }}
                >
                    <CircularProgress
                        size={38}
                        sx={{ mb: 2 }}
                    />

                    <Typography variant="h6" sx={{ mb: 0.5 }}>
                        Searching your documents
                    </Typography>

                    <Typography
                        variant="body2"
                        color="text.secondary"
                    >
                        Finding documents with similar meaning...
                    </Typography>
                </Paper>
            )}

            {/* Results Header */}
            {!loading && searched && !error && (
                <Box sx={{ mb: 2.5 }}>
                    <Stack
                        direction={{ xs: 'column', sm: 'row' }}
                        justifyContent="space-between"
                        alignItems={{ xs: 'flex-start', sm: 'center' }}
                        spacing={1}
                    >
                        <Box>
                            <Typography variant="h6">
                                Search Results
                            </Typography>

                            <Typography
                                variant="body2"
                                color="text.secondary"
                            >
                                {results.length === 0
                                    ? 'No matching documents found'
                                    : `${results.length} matching document${results.length !== 1 ? 's' : ''} found`}
                            </Typography>
                        </Box>

                        {results.length > 0 && (
                            <Chip
                                icon={<AutoAwesomeIcon />}
                                label="Semantic Search"
                                color="secondary"
                                variant="outlined"
                            />
                        )}
                    </Stack>
                </Box>
            )}

            {/* No Results */}
            {!loading &&
                searched &&
                !error &&
                results.length === 0 && (
                    <Paper
                        elevation={0}
                        sx={{
                            p: 5,
                            textAlign: 'center',
                            border: '1px solid',
                            borderColor: 'divider',
                            borderRadius: 3
                        }}
                    >
                        <SearchIcon
                            sx={{
                                fontSize: 52,
                                color: 'text.disabled',
                                mb: 1
                            }}
                        />


                        <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{ maxWidth: 520, mx: 'auto', lineHeight: 1.8 }}
                        >
                            We couldn't find any matching documents in your search results.
                            Try describing the information you need in different words.

                            <Box component="span" sx={{ display: 'block', mt: 1 }}>
                                Examples: payment invoices, employee leave policy,
                                project contracts, or salary details.
                            </Box>
                        </Typography>


                        <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{ maxWidth: 500, mx: 'auto' }}
                        >
                            Try using different words or describe what you are
                            looking for in a more natural way.
                        </Typography>
                    </Paper>
                )}

            {/* Results */}
            {!loading && results.length > 0 && (
                <Stack spacing={2}>
                    {results.map((result, index) => {
                        const score =
                            typeof result.score === 'number'
                                ? result.score
                                : 0;

                        return (
                            <Card
                                key={result.documentId || index}
                                elevation={0}
                                sx={{
                                    border: '1px solid',
                                    borderColor: 'divider',
                                    borderRadius: 3,
                                    transition: 'all 0.2s ease',
                                    '&:hover': {
                                        borderColor: 'primary.main',
                                        boxShadow:
                                            '0 6px 20px rgba(30, 39, 97, 0.08)'
                                    }
                                }}
                            >
                                <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                                    <Stack spacing={2}>
                                        {/* Top row */}
                                        <Stack
                                            direction={{
                                                xs: 'column',
                                                sm: 'row'
                                            }}
                                            justifyContent="space-between"
                                            alignItems={{
                                                xs: 'flex-start',
                                                sm: 'center'
                                            }}
                                            spacing={1.5}
                                        >
                                            <Stack
                                                direction="row"
                                                spacing={1.5}
                                                alignItems="center"
                                                sx={{
                                                    minWidth: 0,
                                                    flex: 1
                                                }}
                                            >
                                                <Box
                                                    sx={{
                                                        width: 42,
                                                        height: 42,
                                                        flexShrink: 0,
                                                        borderRadius: 2,
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent:
                                                            'center',
                                                        backgroundColor:
                                                            'rgba(30, 39, 97, 0.08)',
                                                        color: 'primary.main'
                                                    }}
                                                >
                                                    <DescriptionOutlinedIcon />
                                                </Box>

                                                <Box sx={{ minWidth: 0 }}>
                                                    <Typography
                                                        variant="subtitle1"
                                                        fontWeight={700}
                                                        noWrap
                                                    >
                                                        {result.fileName ||
                                                            'Untitled document'}
                                                    </Typography>

                                                    <Typography
                                                        variant="caption"
                                                        color="text.secondary"
                                                    >
                                                        Semantic match #{index + 1}
                                                    </Typography>
                                                </Box>
                                            </Stack>

                                            <Chip
                                                label={`${formatScore(score)} match`}
                                                color={getScoreColor(score)}
                                                size="small"
                                                sx={{
                                                    fontWeight: 700
                                                }}
                                            />
                                        </Stack>

                                        <Divider />

                                        {/* Summary */}
                                        <Box>
                                            <Typography
                                                variant="caption"
                                                color="text.secondary"
                                                fontWeight={700}
                                                sx={{
                                                    textTransform: 'uppercase',
                                                    letterSpacing: 0.5
                                                }}
                                            >
                                                AI Summary
                                            </Typography>

                                            <Typography
                                                variant="body2"
                                                sx={{
                                                    mt: 0.75,
                                                    lineHeight: 1.7,
                                                    color: 'text.primary'
                                                }}
                                            >
                                                {result.summary &&
                                                typeof result.summary === 'string' &&
                                                result.summary.trim() &&
                                                !result.summary.toLowerCase().includes("i can't fulfill this request")
                                                    ? result.summary
                                                    : 'AI summary is unavailable for this document. You can still open the document to review its contents.'}
                                            </Typography>
                                        </Box>

                                        {/* Bottom row */}
                                        <Stack
                                            direction={{
                                                xs: 'column',
                                                sm: 'row'
                                            }}
                                            justifyContent="space-between"
                                            alignItems={{
                                                xs: 'stretch',
                                                sm: 'center'
                                            }}
                                            spacing={1.5}
                                        >
                                            <Chip
                                                label={getScoreLabel(score)}
                                                size="small"
                                                variant="outlined"
                                                color={getScoreColor(score)}
                                            />

                                            <Button
                                                variant="outlined"
                                                size="small"
                                                endIcon={<ArrowForwardIcon />}
                                                onClick={() =>
                                                    navigate(
                                                        `/documents/${result.documentId}`
                                                    )
                                                }
                                                disabled={!result.documentId}
                                            >
                                                View Document
                                            </Button>
                                        </Stack>
                                    </Stack>
                                </CardContent>
                            </Card>
                        );
                    })}
                </Stack>
            )}

            {/* Initial State */}
            {!searched && !loading && (
                <Paper
                    elevation={0}
                    sx={{
                        p: { xs: 4, sm: 6 },
                        textAlign: 'center',
                        border: '1px solid',
                        borderColor: 'divider',
                        borderRadius: 3
                    }}
                >
                    <Box
                        sx={{
                            width: 64,
                            height: 64,
                            mx: 'auto',
                            mb: 2,
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            backgroundColor: 'rgba(0, 168, 150, 0.10)',
                            color: 'secondary.main'
                        }}
                    >
                        <AutoAwesomeIcon sx={{ fontSize: 32 }} />
                    </Box>

                    <Typography variant="h6" sx={{ mb: 1 }}>
                        Search your knowledge base
                    </Typography>

                    <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ maxWidth: 560, mx: 'auto' }}
                    >
                        Ask a question or describe the information you need.
                        Semantic search will find relevant documents even when
                        they don't contain the exact words you searched for.
                    </Typography>
                </Paper>
            )}
        </Box>
    );
}