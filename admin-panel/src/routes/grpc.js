const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const buildQueue = require('../infrastructure/jobs/BuildQueue');
const buildRepository = require('../infrastructure/repositories/BuildRepository');

// Store active gRPC streaming connections per user ID
const clients = new Map();

/**
 * gRPC Event Broadcaster helper
 */
function broadcastGrpcEvent(userId, eventName, payload) {
    const userClients = clients.get(String(userId));
    if (userClients && userClients.length > 0) {
        const data = JSON.stringify({ event: eventName, payload, timestamp: Date.now() });
        userClients.forEach(res => {
            try {
                res.write(`data: ${data}\n\n`);
            } catch (e) {}
        });
    }
}

/**
 * Broadcast to all connected admin clients
 */
function broadcastAdminGrpcEvent(eventName, payload) {
    for (const [userId, userClients] of clients.entries()) {
        const data = JSON.stringify({ event: eventName, payload, timestamp: Date.now() });
        userClients.forEach(res => {
            try {
                res.write(`data: ${data}\n\n`);
            } catch (e) {}
        });
    }
}

// Hook into BuildQueue events to stream gRPC updates in real-time
buildQueue.on('job:added', (job) => {
    const queuePosition = buildQueue.getPosition(job.id);
    const payload = {
        buildId: job.id,
        buildName: job.buildName,
        status: 'queued',
        queuePosition
    };
    broadcastGrpcEvent(job.userId, 'grpc.build.update', payload);
});

buildQueue.on('job:start', (job) => {
    const payload = {
        buildId: job.id,
        buildName: job.buildName,
        status: 'building',
        queuePosition: 0
    };
    broadcastGrpcEvent(job.userId, 'grpc.build.update', payload);
});

buildQueue.on('job:completed', ({ job, fileSize }) => {
    const payload = {
        buildId: job.id,
        buildName: job.buildName,
        status: 'completed',
        fileSize,
        downloadUrl: `/api/build/download/${job.id}`
    };
    broadcastGrpcEvent(job.userId, 'grpc.build.update', payload);
    broadcastAdminGrpcEvent('grpc.history.refresh', {});
});

buildQueue.on('job:failed', ({ job, error }) => {
    const payload = {
        buildId: job.id,
        buildName: job.buildName,
        status: 'failed',
        error
    };
    broadcastGrpcEvent(job.userId, 'grpc.build.update', payload);
    broadcastAdminGrpcEvent('grpc.history.refresh', {});
});

// Apply auth middleware for stream connection (supports query param token for EventSource)
router.use((req, res, next) => {
    if (req.query.token && !req.headers.authorization) {
        req.headers.authorization = `Bearer ${req.query.token}`;
    }
    authMiddleware(req, res, next);
});

// gRPC Real-time Event Streaming Endpoint
router.get('/stream', (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders && res.flushHeaders();

    const userId = String(req.user.id);
    if (!clients.has(userId)) {
        clients.set(userId, []);
    }
    clients.get(userId).push(res);

    // Initial connection ack message
    res.write(`data: ${JSON.stringify({ event: 'grpc.connected', userId, status: 'online' })}\n\n`);

    // Keep connection alive with periodic heartbeats
    const heartbeat = setInterval(() => {
        try {
            res.write(`: heartbeat\n\n`);
        } catch (e) {}
    }, 15000);

    req.on('close', () => {
        clearInterval(heartbeat);
        const userClients = clients.get(userId) || [];
        const index = userClients.indexOf(res);
        if (index !== -1) {
            userClients.splice(index, 1);
        }
        if (userClients.length === 0) {
            clients.delete(userId);
        }
    });
});

module.exports = router;
