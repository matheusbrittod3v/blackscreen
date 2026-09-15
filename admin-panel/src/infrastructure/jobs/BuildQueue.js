const EventEmitter = require('events');

/**
 * Event-Driven Job Queue for Build Operations
 */
class BuildQueue extends EventEmitter {
    constructor() {
        super();
        this.queue = [];
        this.activeJob = null;
    }

    /**
     * Enqueue a new build job
     * @param {Object} jobData 
     * @returns {Object} Enqueued job metadata
     */
    enqueue(jobData) {
        const job = {
            id: jobData.buildId,
            userId: jobData.userId,
            userEmail: jobData.userEmail,
            buildName: jobData.buildName,
            passwordToUse: jobData.passwordToUse,
            messageToUse: jobData.messageToUse,
            userUtil: jobData.userUtil,
            userBuilds: jobData.userBuilds,
            ip: jobData.ip,
            status: 'queued',
            createdAt: new Date()
        };

        this.queue.push(job);
        console.log(`[BuildQueue] Job #${job.id} queued for user #${job.userId}. Queue length: ${this.queue.length}`);
        
        this.emit('job:added', job);
        return job;
    }

    /**
     * Get queue position for a given build ID
     * @param {number|string} buildId 
     * @returns {number} 1-based position or 0 if active/not found
     */
    getPosition(buildId) {
        const index = this.queue.findIndex(j => String(j.id) === String(buildId));
        return index !== -1 ? index + 1 : 0;
    }

    /**
     * Get next job in line
     * @returns {Object|null}
     */
    getNext() {
        if (this.queue.length === 0) return null;
        return this.queue.shift();
    }

    /**
     * Get status stats of the queue
     */
    getStats() {
        return {
            queuedCount: this.queue.length,
            isProcessing: !!this.activeJob,
            activeJobId: this.activeJob ? this.activeJob.id : null
        };
    }
}

// Global Singleton Instance
const buildQueue = new BuildQueue();
module.exports = buildQueue;
