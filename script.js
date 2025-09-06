// Daily Activity Management System
class ActivityOrganizer {
    constructor() {
        this.activities = this.loadFromStorage();
        this.activeFilters = {
            type: '',
            priority: ''
        };
        
        this.initializeApplication();
    }

    initializeApplication() {
        this.setupEventHandlers();
        this.renderActivities();
        this.updateSummary();
        this.toggleEmptyState();
    }

    setupEventHandlers() {
        // Activity form submission
        const activityForm = document.getElementById('activityForm');
        activityForm.addEventListener('submit', (event) => {
            event.preventDefault();
            this.createNewActivity();
        });

        // Filter controls
        const typeFilter = document.getElementById('typeFilter');
        const priorityFilter = document.getElementById('priorityFilter');
        const resetFiltersBtn = document.getElementById('resetFilters');

        typeFilter.addEventListener('change', (event) => {
            this.activeFilters.type = event.target.value;
            this.renderActivities();
        });

        priorityFilter.addEventListener('change', (event) => {
            this.activeFilters.priority = event.target.value;
            this.renderActivities();
        });

        resetFiltersBtn.addEventListener('click', () => {
            this.clearAllFilters();
        });

        // Auto-select first priority option
        const firstPriorityRadio = document.querySelector('input[name="priorityLevel"]');
        if (firstPriorityRadio) {
            firstPriorityRadio.checked = true;
        }
    }

    createNewActivity() {
        const form = document.getElementById('activityForm');
        const formData = new FormData(form);
        
        const newActivity = {
            uniqueId: this.generateUniqueId(),
            name: formData.get('activityName').trim(),
            type: formData.get('activityType'),
            priority: formData.get('priorityLevel'),
            notes: formData.get('activityNotes').trim(),
            isCompleted: false,
            createdTimestamp: new Date().toISOString(),
            completedTimestamp: null
        };

        // Validate required fields
        if (!newActivity.name || !newActivity.type || !newActivity.priority) {
            this.displayMessage('Please complete all required fields!', 'error');
            return;
        }

        this.activities.unshift(newActivity); // Add to beginning
        this.persistToStorage();
        this.renderActivities();
        this.updateSummary();
        this.toggleEmptyState();
        
        // Reset form
        form.reset();
        const firstPriorityRadio = document.querySelector('input[name="priorityLevel"]');
        if (firstPriorityRadio) {
            firstPriorityRadio.checked = true;
        }
        
        this.displayMessage('Activity created successfully!', 'success');
    }

    toggleActivityStatus(activityId) {
        const activity = this.activities.find(a => a.uniqueId === activityId);
        if (activity) {
            activity.isCompleted = !activity.isCompleted;
            activity.completedTimestamp = activity.isCompleted ? new Date().toISOString() : null;
            this.persistToStorage();
            this.renderActivities();
            this.updateSummary();
        }
    }

    removeActivity(activityId) {
        if (confirm('Are you sure you want to remove this activity?')) {
            this.activities = this.activities.filter(a => a.uniqueId !== activityId);
            this.persistToStorage();
            this.renderActivities();
            this.updateSummary();
            this.toggleEmptyState();
            this.displayMessage('Activity removed successfully!', 'success');
        }
    }

    modifyActivity(activityId) {
        const activity = this.activities.find(a => a.uniqueId === activityId);
        if (!activity) return;

        const newName = prompt('Edit activity name:', activity.name);
        if (newName !== null && newName.trim() !== '') {
            activity.name = newName.trim();
            this.persistToStorage();
            this.renderActivities();
            this.displayMessage('Activity updated successfully!', 'success');
        }
    }

    clearAllFilters() {
        this.activeFilters = { type: '', priority: '' };
        document.getElementById('typeFilter').value = '';
        document.getElementById('priorityFilter').value = '';
        this.renderActivities();
    }

    getFilteredActivities() {
        return this.activities.filter(activity => {
            const typeMatch = !this.activeFilters.type || 
                             activity.type === this.activeFilters.type;
            const priorityMatch = !this.activeFilters.priority || 
                                activity.priority === this.activeFilters.priority;
            return typeMatch && priorityMatch;
        });
    }

    renderActivities() {
        const activitiesList = document.getElementById('activitiesList');
        const filteredActivities = this.getFilteredActivities();
        
        if (filteredActivities.length === 0) {
            activitiesList.innerHTML = `
                <div class="empty-content" style="grid-column: 1 / -1; text-align: center; padding: 3rem;">
                    <div class="empty-icon">🔍</div>
                    <h3>No activities found</h3>
                    <p>Try adjusting your filters or create a new activity.</p>
                </div>
            `;
            return;
        }

        activitiesList.innerHTML = filteredActivities.map(activity => this.buildActivityCard(activity)).join('');
        
        // Add event listeners to activity cards
        this.attachActivityCardEvents();
    }

    buildActivityCard(activity) {
        const priorityColors = {
            urgent: '#e74c3c',
            important: '#f39c12',
            normal: '#27ae60',
            low: '#95a5a6'
        };

        const completedClass = activity.isCompleted ? 'completed' : '';
        const completedIcon = activity.isCompleted ? '✅' : '⭕';
        const completedText = activity.isCompleted ? 'Mark Incomplete' : 'Mark Complete';
        const completedBtnClass = activity.isCompleted ? 'edit-btn' : 'complete-btn';

        return `
            <div class="activity-card ${completedClass}" data-priority="${activity.priority}" data-activity-id="${activity.uniqueId}">
                <div class="activity-header">
                    <div>
                        <div class="activity-title">${this.sanitizeText(activity.name)}</div>
                        <div class="activity-type">${this.sanitizeText(activity.type)}</div>
                    </div>
                </div>
                
                ${activity.notes ? `<div class="activity-notes">${this.sanitizeText(activity.notes)}</div>` : ''}
                
                <div class="activity-actions">
                    <button class="action-btn ${completedBtnClass} toggle-status" data-activity-id="${activity.uniqueId}">
                        <span class="btn-icon">${completedIcon}</span> ${completedText}
                    </button>
                    <button class="action-btn edit-btn modify-activity" data-activity-id="${activity.uniqueId}">
                        <span class="btn-icon">✏️</span> Edit
                    </button>
                    <button class="action-btn delete-btn remove-activity" data-activity-id="${activity.uniqueId}">
                        <span class="btn-icon">🗑️</span> Remove
                    </button>
                </div>
            </div>
        `;
    }

    attachActivityCardEvents() {
        // Toggle completion status
        document.querySelectorAll('.toggle-status').forEach(button => {
            button.addEventListener('click', (event) => {
                const activityId = event.target.closest('.toggle-status').dataset.activityId;
                this.toggleActivityStatus(activityId);
            });
        });

        // Modify activity
        document.querySelectorAll('.modify-activity').forEach(button => {
            button.addEventListener('click', (event) => {
                const activityId = event.target.closest('.modify-activity').dataset.activityId;
                this.modifyActivity(activityId);
            });
        });

        // Remove activity
        document.querySelectorAll('.remove-activity').forEach(button => {
            button.addEventListener('click', (event) => {
                const activityId = event.target.closest('.remove-activity').dataset.activityId;
                this.removeActivity(activityId);
            });
        });
    }

    updateSummary() {
        const totalActivities = this.activities.length;
        const completedActivities = this.activities.filter(a => a.isCompleted).length;
        const pendingActivities = totalActivities - completedActivities;

        document.getElementById('totalActivities').textContent = totalActivities;
        document.getElementById('completedActivities').textContent = completedActivities;
        document.getElementById('pendingActivities').textContent = pendingActivities;
    }

    toggleEmptyState() {
        const emptyMessage = document.getElementById('emptyMessage');
        const displayPanel = document.querySelector('.display-panel');
        
        if (this.activities.length === 0) {
            emptyMessage.style.display = 'block';
            displayPanel.style.display = 'none';
        } else {
            emptyMessage.style.display = 'none';
            displayPanel.style.display = 'block';
        }
    }

    persistToStorage() {
        localStorage.setItem('dailyActivities', JSON.stringify(this.activities));
    }

    loadFromStorage() {
        const stored = localStorage.getItem('dailyActivities');
        return stored ? JSON.parse(stored) : [];
    }

    generateUniqueId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    displayMessage(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `activity-notification notification-${type}`;
        notification.innerHTML = `
            <span class="notification-icon">${type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️'}</span>
            <span class="notification-text">${message}</span>
        `;

        // Add styles
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'success' ? '#27ae60' : type === 'error' ? '#e74c3c' : '#3498db'};
            color: white;
            padding: 1rem 1.5rem;
            border-radius: 12px;
            box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);
            z-index: 1000;
            display: flex;
            align-items: center;
            gap: 0.75rem;
            font-weight: 500;
            animation: slideInRight 0.4s ease-out;
            max-width: 400px;
        `;

        // Add animation keyframes
        if (!document.querySelector('#notification-styles')) {
            const style = document.createElement('style');
            style.id = 'notification-styles';
            style.textContent = `
                @keyframes slideInRight {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
                @keyframes slideOutRight {
                    from { transform: translateX(0); opacity: 1; }
                    to { transform: translateX(100%); opacity: 0; }
                }
            `;
            document.head.appendChild(style);
        }

        document.body.appendChild(notification);

        // Remove notification after 4 seconds
        setTimeout(() => {
            notification.style.animation = 'slideOutRight 0.4s ease-out';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 400);
        }, 4000);
    }

    sanitizeText(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new ActivityOrganizer();
});

// Optional: Add sample data for demonstration
function addSampleActivities() {
    const sampleActivities = [
        {
            uniqueId: Date.now().toString(36) + '1',
            name: "Complete project presentation",
            type: "Professional",
            priority: "urgent",
            notes: "Prepare slides for the quarterly review meeting with updated metrics",
            isCompleted: false,
            createdTimestamp: new Date().toISOString(),
            completedTimestamp: null
        },
        {
            uniqueId: Date.now().toString(36) + '2',
            name: "Study JavaScript fundamentals",
            type: "Academic",
            priority: "important",
            notes: "Review ES6+ features, async programming, and DOM manipulation",
            isCompleted: true,
            createdTimestamp: new Date(Date.now() - 86400000).toISOString(),
            completedTimestamp: new Date().toISOString()
        },
        {
            uniqueId: Date.now().toString(36) + '3',
            name: "Grocery shopping",
            type: "Shopping",
            priority: "normal",
            notes: "Buy vegetables, fruits, household items, and pet food",
            isCompleted: false,
            createdTimestamp: new Date().toISOString(),
            completedTimestamp: null
        },
        {
            uniqueId: Date.now().toString(36) + '4',
            name: "Morning workout routine",
            type: "Fitness",
            priority: "normal",
            notes: "30 minutes cardio, strength training, and stretching",
            isCompleted: false,
            createdTimestamp: new Date().toISOString(),
            completedTimestamp: null
        }
    ];

    // Only add sample data if no activities exist
    const existingActivities = JSON.parse(localStorage.getItem('dailyActivities')) || [];
    if (existingActivities.length === 0) {
        localStorage.setItem('dailyActivities', JSON.stringify(sampleActivities));
        location.reload(); // Reload to show sample data
    }
}

// Uncomment the line below to add sample data for demonstration
// addSampleActivities();