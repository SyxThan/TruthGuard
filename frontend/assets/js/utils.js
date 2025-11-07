// Auth utilities
// Category Manager
class CategoryManager {
    constructor() {
        this.categories = [
            { id: 1, name: '🏛️ Chính trị' },
            { id: 2, name: '🏥 Sức khỏe' },
            { id: 3, name: '💻 Công nghệ' },
            { id: 4, name: '🔬 Khoa học' },
            { id: 5, name: '💼 Kinh doanh' },
            { id: 6, name: '⚽ Thể thao' }
        ];
    }

    populateSelect(selector, options = {}) {
        const select = document.querySelector(selector);
        if (!select) return;

        // Keep existing options if any
        const existingOptions = select.innerHTML;
        
        // Add categories
        this.categories.forEach(cat => {
            const option = document.createElement('option');
            option.value = cat.id;
            option.textContent = cat.name;
            if (options.defaultValue && cat.id == options.defaultValue) {
                option.selected = true;
            }
            select.appendChild(option);
        });
    }

    validateSelect(selectElement) {
        const value = selectElement.value;
        if (!value || value === '') {
            return { valid: false, error: 'Vui lòng chọn danh mục' };
        }
        return { valid: true, id: parseInt(value) };
    }
}

// Initialize globally
window.categoryManager = new CategoryManager();
class AuthManager {
    static get currentUser() {
        const user = localStorage.getItem('user');
        return user ? JSON.parse(user) : null;
    }

    static setUser(user) {
        localStorage.setItem('user', JSON.stringify(user));
    }

    static clearUser() {
        localStorage.removeItem('user');
        localStorage.removeItem('access_token');
    }

    static isLoggedIn() {
        return !!this.currentUser && !!localStorage.getItem('access_token');
    }
}

// UI Utilities
class UIHelpers {
    static showLoading(button) {
        button.disabled = true;
        button.innerHTML = '<i data-feather="loader" class="w-6 h-6 animate-spin"></i><span class="relative z-10">Đang xử lý...</span>';
        feather.replace();
    }

    static resetButton(button, originalText) {
        button.disabled = false;
        button.innerHTML = originalText;
        feather.replace();
    }

    static showSuccess(message) {
        alert(`✅ ${message}`);
    }

    static showError(message) {
        alert(`❌ ${message}`);
    }

    static showWarning(message) {
        alert(`⚠️ ${message}`);
    }

    static formatDate(dateString) {
        const date = new Date(dateString);
        return new Intl.DateTimeFormat('vi-VN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
        }).format(date);
    }

    static getCredibilityBadge(label) {
        if (label === 'Thật' || label === 'Real') {
            return '<span class="badge-real inline-flex items-center gap-2 text-white px-4 py-2 rounded-xl text-sm font-bold"><i data-feather="check-circle" class="w-4 h-4"></i>THẬT</span>';
        } else if (label === 'Giả' || label === 'Fake') {
            return '<span class="badge-fake inline-flex items-center gap-2 text-white px-4 py-2 rounded-xl text-sm font-bold"><i data-feather="x-circle" class="w-4 h-4"></i>GIẢ</span>';
        } else {
            return '<span class="badge-uncertain inline-flex items-center gap-2 text-white px-4 py-2 rounded-xl text-sm font-bold"><i data-feather="help-circle" class="w-4 h-4"></i>CHƯA RÕ</span>';
        }
    }
}

// Toast notification
class Toast {
    static show(message, type = 'info', duration = 3000) {
        const toast = document.createElement('div');
        const bgColor = {
            success: 'bg-emerald-500',
            error: 'bg-red-500',
            warning: 'bg-orange-500',
            info: 'bg-blue-500',
        }[type] || 'bg-blue-500';

        toast.className = `fixed bottom-4 right-4 ${bgColor} text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-fade-in`;
        toast.textContent = message;
        document.body.appendChild(toast);

        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transition = 'opacity 0.3s';
            setTimeout(() => toast.remove(), 300);
        }, duration);
    }
}
