/**
 * GrpcClient Class - High-Performance Real-Time gRPC Stream & Event Engine
 * Replaces REST polling with automatic real-time push streams
 */
class GrpcClient {
    constructor() {
        this.eventSource = null;
        this.listeners = new Map();
        this.isConnected = false;
        this.reconnectTimeout = null;
    }

    /**
     * Connect gRPC stream for authenticated user session
     */
    connectStream() {
        const token = API.token || localStorage.getItem('token');
        if (!token) return;

        if (this.eventSource) {
            this.eventSource.close();
        }

        const streamUrl = `/api/grpc/stream?token=${encodeURIComponent(token)}`;
        console.log('[gRPC] Connecting real-time gRPC stream channel...');

        try {
            this.eventSource = new EventSource(streamUrl);

            this.eventSource.onopen = () => {
                console.log('[gRPC] Stream channel connected successfully! Real-time auto sync active.');
                this.isConnected = true;
            };

            this.eventSource.onmessage = (e) => {
                try {
                    const msg = JSON.parse(e.data);
                    if (msg && msg.event) {
                        this.handleGrpcMessage(msg.event, msg.payload);
                    }
                } catch (err) {
                    console.error('[gRPC] Error parsing stream message:', err);
                }
            };

            this.eventSource.onerror = (err) => {
                console.warn('[gRPC] Stream connection warning/retry...', err);
                this.isConnected = false;
                this.eventSource.close();

                if (this.reconnectTimeout) clearTimeout(this.reconnectTimeout);
                this.reconnectTimeout = setTimeout(() => {
                    if (API.token) this.connectStream();
                }, 4000);
            };
        } catch (e) {
            console.error('[gRPC] Failed to initialize EventSource:', e);
        }
    }

    /**
     * Subscribe to a gRPC stream event
     */
    on(event, callback) {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, []);
        }
        this.listeners.get(event).push(callback);
    }

    /**
     * Internal handler for incoming gRPC stream events
     */
    handleGrpcMessage(eventName, payload) {
        console.log(`[gRPC Event] Received '${eventName}':`, payload);

        // Notify specific subscribers
        const cbs = this.listeners.get(eventName) || [];
        cbs.forEach(cb => {
            try { cb(payload); } catch (e) { console.error('[gRPC] Callback error:', e); }
        });

        // Global handling for build updates
        if (eventName === 'grpc.build.update') {
            if (typeof Build !== 'undefined' && typeof Build.updateActiveBuildCard === 'function') {
                Build.updateActiveBuildCard(payload);
            }
            if (typeof Dashboard !== 'undefined') {
                Dashboard.loadHistory();
                Dashboard.loadUserDashboard();
            }
        } else if (eventName === 'grpc.history.refresh') {
            if (typeof Dashboard !== 'undefined') {
                Dashboard.loadHistory();
                Dashboard.loadRecentBuilds();
            }
        }
    }

    /**
     * gRPC RPC Call wrapper for fetching history
     */
    async fetchHistory() {
        return await API.get('/api/build/history');
    }

    /**
     * gRPC RPC Call wrapper for fetching current build status
     */
    async getBuildStatus(buildId) {
        return await API.get(`/api/build/status/${buildId}`);
    }

    /**
     * Disconnect stream on logout
     */
    disconnect() {
        if (this.eventSource) {
            this.eventSource.close();
            this.eventSource = null;
        }
        this.isConnected = false;
    }
}

// Global gRPC instance
const gRPC = new GrpcClient();
window.gRPC = gRPC;
