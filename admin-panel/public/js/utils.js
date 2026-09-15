/**
 * Utils Class - Security & Data Formatting Helpers
 */
class Utils {
    /**
     * Escape HTML special characters to prevent XSS attacks
     * @param {string|number} str 
     * @returns {string}
     */
    static escapeHtml(str) {
        if (str === null || str === undefined) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    /**
     * Format ISO date string into PT-BR locale format
     * @param {string} dateString 
     * @returns {string}
     */
    static formatDate(dateString) {
        if (!dateString) return '-';
        try {
            const date = new Date(dateString);
            if (isNaN(date.getTime())) return '-';
            return date.toLocaleDateString('pt-BR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch (e) {
            return '-';
        }
    }

    /**
     * Format bytes into human-readable size
     * @param {number} bytes 
     * @returns {string}
     */
    static formatFileSize(bytes) {
        if (!bytes || isNaN(bytes) || bytes === 0) return '-';
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(1024));
        return (bytes / Math.pow(1024, i)).toFixed(2) + ' ' + sizes[i];
    }

    /**
     * Display toast notifications safely
     * @param {string} message 
     * @param {string} type 
     */
    static showToast(message, type = 'info') {
        const toast = document.getElementById('toast');
        if (!toast) return;

        toast.textContent = String(message || '');
        toast.className = `toast ${type} show`;

        if (this._toastTimer) clearTimeout(this._toastTimer);
        this._toastTimer = setTimeout(() => {
            toast.classList.remove('show');
        }, 3500);
    }
}

// Global helper functions
function showToast(message, type = 'info') {
    Utils.showToast(message, type);
}
function formatDate(dateString) {
    return Utils.formatDate(dateString);
}
function formatFileSize(bytes) {
    return Utils.formatFileSize(bytes);
}
