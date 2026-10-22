import api from '../api/axiosConfig';

const BASE_URL = '/communications';

const communicationService = {
    createDirectConversation: async (recipientUserId) => {
        const response = await api.post(`${BASE_URL}/direct`, {
            recipientUserId,
        });
        return response.data;
    },

    createDocumentDiscussion: async (documentId) => {
        const response = await api.post(`${BASE_URL}/document`, {
            documentId,
        });
        return response.data;
    },

    searchColleagues: async (search) => {
        const response = await api.get('/users/colleagues', {
            params: { search }
        });
        return response.data;
    },

    getMyConversations: async () => {
        const response = await api.get(`${BASE_URL}/conversations`);
        return response.data;
    },

    getMessages: async (conversationId) => {
        const response = await api.get(
            `${BASE_URL}/conversations/${conversationId}/messages`
        );
        return response.data;
    },

    sendMessage: async (conversationId, content) => {
        const response = await api.post(
            `${BASE_URL}/conversations/${conversationId}/messages`,
            { content }
        );
        return response.data;
    },

};

export default communicationService;
