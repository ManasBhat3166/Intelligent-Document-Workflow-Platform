
import { Client } from "@stomp/stompjs";

const WS_URL = "ws://127.0.0.1:8080/ws";

class WebSocketService {
    client = null;
    onConnectedCallback = null;
    onErrorCallback = null;
    connectionWaiters = [];


    connect(onConnected, onError) {
        const token = localStorage.getItem("token");

        if (!token) {
            const error = new Error("Authentication token not found");
            onError?.(error);
            this.rejectConnectionWaiters(error);
            return;
        }

        if (this.client?.connected) {
            onConnected?.();
            return;
        }

        if (onConnected) {
            this.onConnectedCallback = onConnected;
        }

        if (onError) {
            this.onErrorCallback = onError;
        }

        if (this.client?.active) {
            return;
        }

        this.client = new Client({
            brokerURL: WS_URL,

            connectHeaders: {
                Authorization: `Bearer ${token}`,
            },

            reconnectDelay: 5000,

            onConnect: () => {
                this.onConnectedCallback?.();

                const waiters = this.connectionWaiters.splice(0);
                waiters.forEach(({ resolve }) => resolve());
            },

            onStompError: (frame) => {
                const error = new Error(
                    frame.headers.message || "WebSocket connection failed"
                );

                this.onErrorCallback?.(error);
                this.rejectConnectionWaiters(error);
            },

            onWebSocketError: (event) => {
                this.onErrorCallback?.(event);
                this.rejectConnectionWaiters(
                    new Error("WebSocket connection failed")
                );
            },
        });

        this.client.activate();
    }


    waitUntilConnected() {
        if (this.client?.connected) {
            return Promise.resolve();
        }

        return new Promise((resolve, reject) => {
            this.connectionWaiters.push({ resolve, reject });

            if (!this.client?.active) {
                this.connect();
            }
        });
    }

    rejectConnectionWaiters(error) {
        const waiters = this.connectionWaiters.splice(0);
        waiters.forEach(({ reject }) => reject(error));
    }


    subscribe(conversationId, callback) {
        if (!this.client?.connected) {
            throw new Error("WebSocket is not connected");
        }

        return this.client.subscribe(
            `/topic/conversations/${conversationId}`,
            (frame) => {
                callback(JSON.parse(frame.body));
            }
        );
    }

    sendMessage(conversationId, content) {
        if (!this.client?.connected) {
            throw new Error("WebSocket is not connected");
        }

        this.client.publish({
            destination: `/app/chat/${conversationId}`,
            body: JSON.stringify({ content }),
        });
    }

    disconnect() {
        if (this.client) {
            this.client.deactivate();
            this.client = null;
        }
    }
}

const webSocketService = new WebSocketService();

export default webSocketService;
