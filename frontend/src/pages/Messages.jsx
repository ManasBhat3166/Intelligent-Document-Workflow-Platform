
import React, { useEffect, useState } from 'react';
import {
    Alert,
    Box,
    Button,
    CircularProgress,
    Divider,
    List,
    ListItemButton,
    ListItemText,
    Paper,
    Stack,
    TextField,
    Typography,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Autocomplete,
} from '@mui/material';

import ForumOutlinedIcon from '@mui/icons-material/ForumOutlined';
import SendOutlinedIcon from '@mui/icons-material/SendOutlined';
import webSocketService from "../services/webSocketService";
import AddCommentOutlinedIcon from '@mui/icons-material/AddCommentOutlined';
import Avatar from '@mui/material/Avatar';
import PersonSearchOutlinedIcon from '@mui/icons-material/PersonSearchOutlined';
import SearchOutlinedIcon from '@mui/icons-material/SearchOutlined';

import { useAuth } from '../context/AuthContext';
import communicationService from '../services/communicationService';

export default function Messages() {
    const { user } = useAuth();

    const [conversations, setConversations] = useState([]);
    const [selectedConversation, setSelectedConversation] = useState(null);
    const [messages, setMessages] = useState([]);
    const [content, setContent] = useState('');
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [error, setError] = useState('');
    const [newMessageOpen, setNewMessageOpen] = useState(false);
    const [colleagueSearch, setColleagueSearch] = useState('');
    const [colleagues, setColleagues] = useState([]);
    const [selectedColleague, setSelectedColleague] = useState(null);
    const [searchingColleagues, setSearchingColleagues] = useState(false);
    const [creatingConversation, setCreatingConversation] = useState(false);



    const handleCreateDirectConversation = async () => {
        const recipientId = selectedColleague?.id;

        if (!recipientId || creatingConversation) {
            return;
        }

        try {
            setCreatingConversation(true);
            setError('');

            const conversation =
                await communicationService.createDirectConversation(recipientId);

            await loadConversations();

            setNewMessageOpen(false);
            setColleagueSearch('');
            setSelectedColleague(null);
            setColleagues([]);

            await loadMessages(conversation);
        } catch (err) {
            setError(
                err.response?.data?.message ||
                'Unable to start the conversation.'
            );
        } finally {
            setCreatingConversation(false);
        }
    };

    const loadConversations = async () => {
        try {
            setError('');
            const data = await communicationService.getMyConversations();
            setConversations(data);

            if (selectedConversation) {
                const updated = data.find(
                    (item) => item.id === selectedConversation.id
                );

                if (updated) {
                    setSelectedConversation(updated);
                }
            }
        } catch (err) {
            setError(
                err.response?.data?.message ||
                'Unable to load conversations.'
            );
        } finally {
            setLoading(false);
        }
    };

    const loadMessages = async (conversation) => {
        try {
            setError('');
            setSelectedConversation(conversation);

            const data = await communicationService.getMessages(
                conversation.id
            );

            setMessages(data);
        } catch (err) {
            setError(
                err.response?.data?.message ||
                'Unable to load messages.'
            );
        }
    };

    useEffect(() => {
        loadConversations();
    }, []);

    useEffect(() => {
        const conversationId = selectedConversation?.id;

        if (!conversationId) return;

        let active = true;
        let subscription = null;

        const subscribeToConversation = () => {
            if (!active) return;

            try {
                subscription?.unsubscribe();

                subscription = webSocketService.subscribe(
                    conversationId,
                    (incomingMessage) => {
                        if (!active) return;

                        setMessages((previousMessages) => {
                            const alreadyExists = previousMessages.some(
                                (message) => message.id === incomingMessage.id
                            );

                            if (alreadyExists) {
                                return previousMessages;
                            }

                            return [...previousMessages, incomingMessage];
                        });

                        setConversations((previousConversations) =>
                            previousConversations.map((conversation) =>
                                conversation.id === conversationId
                                    ? {
                                        ...conversation,
                                        lastMessage: incomingMessage.content,
                                        lastMessageAt: incomingMessage.sentAt,
                                        updatedAt: incomingMessage.sentAt,
                                    }
                                    : conversation
                            )
                        );
                    }
                );
            } catch (err) {
                setError(
                    err.message || "Failed to subscribe to conversation."
                );
            }
        };

        webSocketService.connect(
            subscribeToConversation,
            (err) => {
                if (active) {
                    setError(
                        err.message || "WebSocket connection failed."
                    );
                }
            }
        );


        const getConversationDisplay = (conversation) => {
            if (conversation.type === 'DOCUMENT') {
                return {
                    name: 'Document discussion',
                    initials: 'D',
                };
            }

            const participants = conversation.participants || [];

            const otherParticipant = participants.find(
                (participant) => participant.id !== user?.id
            );

            const name =
                otherParticipant?.fullName ||
                otherParticipant?.email ||
                'Unknown user';

            return {
                name,
                initials: name
                    .trim()
                    .split(/\s+/)
                    .slice(0, 2)
                    .map((part) => part.charAt(0))
                    .join('')
                    .toUpperCase(),
            };
        };


        return () => {
            active = false;
            subscription?.unsubscribe();
        };
    }, [selectedConversation?.id]);

    useEffect(() => {
        if (!newMessageOpen || colleagueSearch.trim().length < 2) {
            setColleagues([]);
            return;
        }

        let active = true;

        const search = async () => {
            try {
                setSearchingColleagues(true);
                const results = await communicationService.searchColleagues(
                    colleagueSearch.trim()
                );

                if (active) {
                    setColleagues(results);
                }
            } catch (err) {
                if (active) {
                    setColleagues([]);
                    setError(
                        err.response?.data?.message ||
                        'Unable to search colleagues.'
                    );
                }
            } finally {
                if (active) {
                    setSearchingColleagues(false);
                }
            }
        };

        search();

        return () => {
            active = false;
        };
    }, [colleagueSearch, newMessageOpen]);

    const handleSend = async (event) => {
        event.preventDefault();

        const text = content.trim();

        if (!text || !selectedConversation || sending) {
            return;
        }

        setSending(true);
        setError("");

        try {
            await webSocketService.waitUntilConnected();

            webSocketService.sendMessage(
                selectedConversation.id,
                text
            );

            setContent("");
        } catch (err) {
            setError(err.message || "Failed to send message.");
        } finally {
            setSending(false);
        }
    };



    const getConversationDisplay = (conversation) => {
        if (conversation.type === 'DOCUMENT') {
            return {
                name: 'Document discussion',
                initials: 'D',
            };
        }

        const participants = Array.isArray(conversation.participants)
            ? conversation.participants
            : [];

        const currentUserId = user?.id ?? user?._id ?? user?.userId;
        const currentUserEmail = user?.email?.trim().toLowerCase();

        const otherParticipant = participants.find((participant) => {
            const sameId =
                currentUserId != null &&
                String(participant.id) === String(currentUserId);

            const sameEmail =
                currentUserEmail &&
                participant.email?.trim().toLowerCase() === currentUserEmail;

            return !sameId && !sameEmail;
        });

        const name =
            otherParticipant?.fullName ||
            otherParticipant?.email ||
            'Unknown user';

        return {
            name,
            initials: name
                .split(/\s+/)
                .map((part) => part[0])
                .join('')
                .slice(0, 2)
                .toUpperCase(),
        };
    };


    return (
        <Box>
            <Stack
                direction="row"
                alignItems="center"
                spacing={1.5}
                sx={{ mb: 3 }}
            >
                <ForumOutlinedIcon
                    sx={{ fontSize: 30, color: '#00A896' }}
                />

                <Box>
                    <Typography variant="h5" fontWeight={800}>
                        Messages
                    </Typography>

                    <Typography variant="body2" color="text.secondary">
                        Direct messages and document discussions
                    </Typography>
                </Box>
            </Stack>

            {error && (
                <Alert
                    severity="error"
                    sx={{ mb: 2 }}
                    onClose={() => setError('')}
                >
                    {error}
                </Alert>
            )}

            <Paper
                elevation={0}
                sx={{
                    display: 'flex',
                    minHeight: 520,
                    overflow: 'hidden',
                    border: '1px solid #E5E7EB',
                    borderRadius: 3,
                }}
            >
                <Box
                    sx={{
                        width: { xs: '38%', sm: 280 },
                        minWidth: 130,
                        borderRight: '1px solid #E5E7EB',
                    }}
                >

                    <Box
                        sx={{
                            p: 2,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: 1,
                        }}
                    >
                        <Typography fontWeight={700}>
                            Conversations
                        </Typography>

                        <Button
                            size="small"
                            variant="contained"
                            startIcon={<AddCommentOutlinedIcon />}
                            onClick={() => setNewMessageOpen(true)}
                            sx={{
                                textTransform: 'none',
                                fontWeight: 600,
                                borderRadius: 2,
                                px: 1.5,
                                py: 0.8,
                                whiteSpace: 'nowrap',
                                bgcolor: '#00A896',
                                boxShadow: 'none',
                                '&:hover': {
                                    bgcolor: '#008F80',
                                    boxShadow: 'none',
                                },
                            }}
                        >
                            New message
                        </Button>
                    </Box>


                    <Divider />

                    {loading ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                            <CircularProgress size={26} />
                        </Box>
                    ) : conversations.length === 0 ? (
                        <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{ p: 2 }}
                        >
                            No conversations yet.
                        </Typography>
                    ) : (
                        <List disablePadding>

                            {conversations.map((conversation) => {
                                const display = getConversationDisplay(conversation);

                                return (
                                    <ListItemButton
                                        key={conversation.id}
                                        selected={selectedConversation?.id === conversation.id}
                                        onClick={() => loadMessages(conversation)}
                                        sx={{
                                            alignItems: 'center',
                                            py: 1.5,
                                            px: 1.5,
                                            gap: 1.5,
                                        }}
                                    >
                                        <Avatar
                                            sx={{
                                                width: 42,
                                                height: 42,
                                                bgcolor:
                                                    conversation.type === 'DOCUMENT'
                                                        ? '#E0F2FE'
                                                        : '#DDF7F2',
                                                color:
                                                    conversation.type === 'DOCUMENT'
                                                        ? '#075985'
                                                        : '#008F80',
                                                fontWeight: 700,
                                                fontSize: 14,
                                            }}
                                        >
                                            {display.initials}
                                        </Avatar>

                                        <ListItemText
                                            primary={display.name}
                                            secondary={
                                                conversation.lastMessage || 'No messages yet'
                                            }
                                            primaryTypographyProps={{
                                                fontWeight: 700,
                                                fontSize: 13,
                                                noWrap: true,
                                            }}
                                            secondaryTypographyProps={{
                                                noWrap: true,
                                                fontSize: 12,
                                                color: 'text.secondary',
                                            }}
                                        />
                                    </ListItemButton>
                                );
                            })}

                        </List>
                    )}
                </Box>

                <Box
                    sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        flex: 1,
                        minWidth: 0,
                    }}
                >
                    {selectedConversation ? (
                        <>
                            <Box sx={{ p: 2 }}>
                                <Typography fontWeight={700}>
                                    {selectedConversation.type === 'DOCUMENT'
                                        ? `Document discussion · ${selectedConversation.documentId}`
                                        : 'Direct conversation'}
                                </Typography>
                            </Box>

                            <Divider />

                            <Box
                                sx={{
                                    flex: 1,
                                    p: 2,
                                    overflowY: 'auto',
                                    bgcolor: '#F8FAFC',
                                }}
                            >
                                {messages.map((message) => {
                                    const ownMessage =
                                        message.senderUserId === user?.id;

                                    return (
                                        <Box
                                            key={message.id}
                                            sx={{
                                                display: 'flex',
                                                justifyContent: ownMessage
                                                    ? 'flex-end'
                                                    : 'flex-start',
                                                mb: 1.5,
                                            }}
                                        >
                                            <Box
                                                sx={{
                                                    maxWidth: '80%',
                                                    px: 1.75,
                                                    py: 1.25,
                                                    borderRadius: 2,
                                                    bgcolor: ownMessage
                                                        ? '#D9F5EF'
                                                        : '#FFFFFF',
                                                    border: '1px solid #E5E7EB',
                                                }}
                                            >
                                                <Typography
                                                    variant="caption"
                                                    color="text.secondary"
                                                >
                                                    {message.senderEmail}
                                                </Typography>

                                                <Typography sx={{ overflowWrap: 'anywhere' }}>
                                                    {message.content}
                                                </Typography>

                                                <Typography
                                                    variant="caption"
                                                    color="text.secondary"
                                                >
                                                    {message.sentAt
                                                        ? new Date(message.sentAt).toLocaleString()
                                                        : ''}
                                                </Typography>
                                            </Box>
                                        </Box>
                                    );
                                })}

                                {messages.length === 0 && (
                                    <Typography
                                        color="text.secondary"
                                        variant="body2"
                                    >
                                        No messages yet. Start the conversation.
                                    </Typography>
                                )}
                            </Box>

                            <Divider />

                            <Box
                                component="form"
                                onSubmit={handleSend}
                                sx={{ display: 'flex', gap: 1, p: 2 }}
                            >
                                <TextField
                                    fullWidth
                                    size="small"
                                    placeholder="Type a message..."
                                    value={content}
                                    onChange={(event) => setContent(event.target.value)}
                                    inputProps={{ maxLength: 5000 }}
                                />

                                <Button
                                    type="submit"
                                    variant="contained"
                                    disabled={!content.trim() || sending}
                                    sx={{
                                        bgcolor: '#00A896',
                                        '&:hover': { bgcolor: '#008F80' },
                                    }}
                                >
                                    {sending ? (
                                        <CircularProgress size={20} color="inherit" />
                                    ) : (
                                        <SendOutlinedIcon />
                                    )}
                                </Button>
                            </Box>
                        </>
                    ) : (
                        <Box
                            sx={{
                                flex: 1,
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                p: 3,
                                textAlign: 'center',
                            }}
                        >
                            <ForumOutlinedIcon
                                sx={{ fontSize: 48, color: '#AEB6DA', mb: 1 }}
                            />

                            <Typography fontWeight={700}>
                                Select a conversation
                            </Typography>

                            <Typography variant="body2" color="text.secondary">
                                Choose a conversation on the left to view its messages.
                            </Typography>
                        </Box>
                    )}
                </Box>
            </Paper>



            <Dialog
                open={newMessageOpen}
                onClose={() => {
                    if (!creatingConversation) {
                        setNewMessageOpen(false);
                        setColleagueSearch('');
                        setSelectedColleague(null);
                    }
                }}
                fullWidth
                maxWidth="sm"
                PaperProps={{
                    sx: {
                        borderRadius: 3,
                        p: 1,
                    },
                }}
            >
                <DialogTitle sx={{ pb: 1 }}>
                    <Stack direction="row" spacing={1.5} alignItems="center">
                        <Avatar
                            sx={{
                                bgcolor: '#DDF7F2',
                                color: '#008F80',
                                width: 44,
                                height: 44,
                            }}
                        >
                            <PersonSearchOutlinedIcon />
                        </Avatar>

                        <Box>
                            <Typography variant="h6" fontWeight={700}>
                                New message
                            </Typography>

                            <Typography variant="body2" color="text.secondary">
                                Start a conversation with a colleague
                            </Typography>
                        </Box>
                    </Stack>
                </DialogTitle>

                <DialogContent sx={{ pt: 2 }}>
                    <Typography
                        variant="subtitle2"
                        fontWeight={600}
                        sx={{ mb: 1 }}
                    >
                        To
                    </Typography>

                    <Autocomplete
                        autoHighlight
                        options={Array.isArray(colleagues) ? colleagues : []}
                        value={selectedColleague}
                        inputValue={colleagueSearch}
                        loading={searchingColleagues}
                        getOptionLabel={(option) =>
                            option
                                ? `${option.fullName || 'Unnamed'} (${option.email || ''})`
                                : ''
                        }
                        isOptionEqualToValue={(option, value) =>
                            Boolean(option && value && option.id === value.id)
                        }
                        onInputChange={(event, newInputValue) => {
                            setColleagueSearch(newInputValue);
                        }}
                        onChange={(event, newValue) => {
                            setSelectedColleague(newValue);
                        }}
                        filterOptions={(options) => options}
                        noOptionsText={
                            colleagueSearch.trim().length < 2
                                ? 'Type at least 2 characters to search'
                                : 'No colleagues found'
                        }
                        renderOption={(props, option) => (
                            <Box
                                component="li"
                                {...props}
                                key={option.id}
                                sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 1.5,
                                    py: 1.25,
                                }}
                            >
                                <Avatar
                                    sx={{
                                        width: 40,
                                        height: 40,
                                        bgcolor: '#E0F2FE',
                                        color: '#075985',
                                        fontSize: 14,
                                        fontWeight: 700,
                                    }}
                                >
                                    {(option.fullName || option.email || '?')
                                        .trim()
                                        .charAt(0)
                                        .toUpperCase()}
                                </Avatar>

                                <Box sx={{ minWidth: 0 }}>
                                    <Typography
                                        variant="body2"
                                        fontWeight={600}
                                    >
                                        {option.fullName || 'Unnamed employee'}
                                    </Typography>

                                    <Typography
                                        variant="caption"
                                        color="text.secondary"
                                        sx={{ overflowWrap: 'anywhere' }}
                                    >
                                        {option.email || 'No email available'}
                                    </Typography>
                                </Box>
                            </Box>
                        )}
                        renderInput={(params) => (
                            <TextField
                                {...params}
                                autoFocus
                                fullWidth
                                placeholder="Search by employee name or email"
                            />
                        )}
                    />

                    <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ display: 'block', mt: 1.5 }}
                    >
                        Enter at least two characters to find colleagues.
                    </Typography>

                    {selectedColleague && (
                        <Box
                            sx={{
                                mt: 2,
                                p: 1.5,
                                display: 'flex',
                                alignItems: 'center',
                                gap: 1.5,
                                border: '1px solid #BFE8DF',
                                bgcolor: '#F0FDFA',
                                borderRadius: 2,
                            }}
                        >
                            <Avatar sx={{ bgcolor: '#CCFBF1', color: '#115E59' }}>
                                {(selectedColleague.fullName || '?')
                                    .trim()
                                    .charAt(0)
                                    .toUpperCase()}
                            </Avatar>

                            <Box sx={{ flex: 1, minWidth: 0 }}>
                                <Typography fontWeight={600} variant="body2">
                                    {selectedColleague.fullName || 'Unnamed employee'}
                                </Typography>

                                <Typography
                                    variant="caption"
                                    color="text.secondary"
                                >
                                    {selectedColleague.email}
                                </Typography>
                            </Box>
                        </Box>
                    )}
                </DialogContent>

                <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
                    <Button
                        onClick={() => {
                            setNewMessageOpen(false);
                            setColleagueSearch('');
                            setSelectedColleague(null);
                        }}
                        disabled={creatingConversation}
                        sx={{ textTransform: 'none', color: 'text.secondary' }}
                    >
                        Cancel
                    </Button>

                    <Button
                        variant="contained"
                        onClick={handleCreateDirectConversation}
                        disabled={!selectedColleague || creatingConversation}
                        sx={{
                            textTransform: 'none',
                            fontWeight: 600,
                            px: 2.5,
                            borderRadius: 2,
                            bgcolor: '#00A896',
                            '&:hover': { bgcolor: '#008F80' },
                        }}
                    >
                        {creatingConversation ? (
                            <CircularProgress size={20} color="inherit" />
                        ) : (
                            'Start conversation'
                        )}
                    </Button>
                </DialogActions>
            </Dialog>

        </Box>

    );
}
