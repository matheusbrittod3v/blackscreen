class Build {
    constructor({
        id = null,
        userId,
        buildName = null,
        passwordUsed = null,
        customMessage = null,
        logoType = 'png',
        status = 'pending',
        fileSize = 0,
        downloadCount = 0,
        createdAt = new Date(),
        completedAt = null
    }) {
        this.id = id;
        this.userId = userId;
        this.buildName = buildName;
        this.passwordUsed = passwordUsed;
        this.customMessage = customMessage;
        this.logoType = logoType;
        this.status = status;
        this.fileSize = fileSize;
        this.downloadCount = downloadCount;
        this.createdAt = createdAt;
        this.completedAt = completedAt;
    }

    markAsBuilding() {
        this.status = 'building';
    }

    markAsCompleted(fileSize = 0) {
        this.status = 'completed';
        this.fileSize = fileSize;
        this.completedAt = new Date();
    }

    markAsFailed() {
        this.status = 'failed';
        this.completedAt = new Date();
    }

    incrementDownload() {
        this.downloadCount++;
    }

    toJSON() {
        return {
            id: this.id,
            userId: this.userId,
            buildName: this.buildName,
            passwordUsed: this.passwordUsed,
            customMessage: this.customMessage,
            logoType: this.logoType,
            status: this.status,
            fileSize: this.fileSize,
            downloadCount: this.downloadCount,
            createdAt: this.createdAt,
            completedAt: this.completedAt
        };
    }

    static fromDatabase(row) {
        return new Build({
            id: row.id,
            userId: row.user_id,
            buildName: row.build_name,
            passwordUsed: row.password_used,
            customMessage: row.custom_message,
            logoType: row.logo_type,
            status: row.status,
            fileSize: row.file_size,
            downloadCount: row.download_count,
            createdAt: row.created_at,
            completedAt: row.completed_at
        });
    }
}

module.exports = Build;
