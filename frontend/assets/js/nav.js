// Quản lý thanh điều hướng - Hiển thị thông tin người dùng sau đăng nhập
class NavigationManager {
    constructor() {
        this.apiBaseUrl = 'http://localhost:8000/api';
        this.navPlaceholder = document.getElementById('nav-placeholder');
        this.init();
    }

    init() {
        // Kiểm tra trạng thái đăng nhập khi trang tải
        this.checkAuthStatus();

        // Lắng nghe sự kiện storage (khi đăng nhập ở tab khác)
        window.addEventListener('storage', () => this.checkAuthStatus());
    }

    // Kiểm tra trạng thái đăng nhập
    checkAuthStatus() {
        const isLoggedIn = AuthManager.isLoggedIn();
        const user = AuthManager.currentUser;

        if (isLoggedIn && user) {
            this.renderUserNav(user);
        } else {
            this.renderGuestNav();
        }
    }

    // Render navigation cho khách (chưa đăng nhập)
    renderGuestNav() {
        if (!this.navPlaceholder) return;

        this.navPlaceholder.innerHTML = `
            <nav class="relative z-10 glass-card border-b border-gray-200">
        <div class="container mx-auto px-4 py-4">
            <div class="flex items-center justify-between">
                <a href="index.html" class="flex items-center gap-3 hover:opacity-80 transition">
                    <div class="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center shadow-lg animate-float">
                        <i data-feather="share-2" class="w-7 h-7 text-white"></i>
                    </div>
                    <span class="text-2xl font-extrabold gradient-text">TruthGuard</span>
                </a>
                <div class="hidden md:flex items-center gap-8">
                    <a href="index.html" class="nav-link text-gray-700 hover:text-emerald-600 font-semibold flex items-center gap-2">
                        <i data-feather="home" class="w-5 h-5"></i>
                        Trang chủ
                    </a>
                    
                    <a href="submit.html" class="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-6 py-3 rounded-xl font-bold hover:shadow-xl transition flex items-center gap-2">
                        <i data-feather="plus" class="w-5 h-5"></i>
                        Kiểm tra tin 
                    </a>
                    <a href="share.html" class="bg-gradient-to-r from-orange-500 to-orange-600 text-white px-6 py-3 rounded-xl font-bold hover:shadow-xl transition flex items-center gap-2">
                        <i data-feather="plus" class="w-5 h-5"></i>
                        Đăng tin
                    </a>
                    <a href="login.html" class="bg-gradient-to-r from-emerald-500 to-teal-600 text-white px-6 py-3 rounded-xl font-bold hover:shadow-xl transition flex items-center gap-2">
                        <i data-feather="log-in" class="w-5 h-5"></i>
                        Đăng nhập
                    </a>
                    
                </div>
                <button class="md:hidden text-gray-700">
                    <i data-feather="menu" class="w-6 h-6"></i>
                </button>
            </div>
        </div>
    </nav>
        `;

        feather.replace();
        this.setupMobileMenu();
    }

    // Render navigation cho người dùng đã đăng nhập
    renderUserNav(user) {
        if (!this.navPlaceholder) return;

        const avatarInitial = (user.full_name || user.username || 'U')[0].toUpperCase();

        this.navPlaceholder.innerHTML = `
            <nav class="relative z-50 glass-effect border-b border-gray-200">
                <div class="container mx-auto px-4 py-4">
                    <div class="flex items-center justify-between">
                        <!-- Logo -->
                        <a href="index.html" class="flex items-center gap-3 hover:opacity-80 transition">
                            <div class="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center shadow-lg animate-float">
                                <i data-feather="share-2" class="w-7 h-7 text-white"></i>
                            </div>
                            <span class="text-2xl font-extrabold gradient-text">TruthGuard</span>
                        </a>

                        <!-- Desktop Navigation -->
                        <div class="hidden md:flex items-center gap-8">
                            <a href="index.html" class="nav-link text-gray-700 hover:text-emerald-600 font-semibold flex items-center gap-2">
                        <i data-feather="home" class="w-5 h-5"></i>
                        Trang chủ
                    </a>
                    
                    <a href="submit.html" class="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-6 py-3 rounded-xl font-bold hover:shadow-xl transition flex items-center gap-2">
                        <i data-feather="plus" class="w-5 h-5"></i>
                        Kiểm tra tin 
                    </a>
                    <a href="share.html" class="bg-gradient-to-r from-orange-500 to-orange-600 text-white px-6 py-3 rounded-xl font-bold hover:shadow-xl transition flex items-center gap-2">
                        <i data-feather="plus" class="w-5 h-5"></i>
                        Đăng tin
                    </a>

                            <!-- User Profile Dropdown -->
                            <div class="relative" id="user-dropdown-container">
                                <button id="user-menu-btn" class="flex items-center gap-3 px-4 py-2 rounded-xl hover:bg-gray-100 transition focus:outline-none">
                                    <div class="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full flex items-center justify-center text-white font-bold shadow-lg">
                                        ${avatarInitial}
                                    </div>
                                    <span class="hidden md:block text-gray-800 font-semibold">${this.escapeHtml(user.full_name || user.username)}</span>
                                    <i data-feather="chevron-down" class="w-5 h-5 text-gray-600"></i>
                                </button>

                                <!-- Dropdown Menu -->
                                <div id="user-dropdown-menu" class="hidden absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden z-50 animate-dropdown">
                                    <!-- User Info -->
                                    <div class="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-emerald-50 to-teal-50">
                                        <div class="flex items-center gap-3 mb-3">
                                            <div class="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full flex items-center justify-center text-white font-bold">
                                                ${avatarInitial}
                                            </div>
                                            <div class="flex-1">
                                                <p class="font-bold text-gray-800 text-sm">${this.escapeHtml(user.full_name || user.username)}</p>
                                                <p class="text-xs text-gray-600">${this.escapeHtml(user.email || 'user@example.com')}</p>
                                            </div>
                                        </div>
                                        <p class="text-xs text-gray-500 flex items-center gap-1">
                                            <i data-feather="check-circle" class="w-3 h-3 text-green-500"></i>
                                            Đã xác minh
                                        </p>
                                    </div>

                                    <!-- Menu Items -->
                                    <div class="py-2">
                                        <a href="#profile" onclick="event.preventDefault(); alert('🎯 Tính năng hồ sơ sẽ sớm ra mắt');" class="flex items-center gap-3 px-6 py-3 text-gray-700 hover:bg-gray-50 transition">
                                            <i data-feather="user" class="w-5 h-5 text-gray-400"></i>
                                            <span class="font-medium">Hồ sơ cá nhân</span>
                                        </a>
                                        <a href="post-history.html" class="flex items-center gap-3 px-6 py-3 text-gray-700 hover:bg-gray-50 transition">
                                            <i data-feather="file-text" class="w-5 h-5 text-gray-400"></i>
                                            <span class="font-medium">Bài đăng của tôi</span>
                                        </a>
                                        <a href="#settings" onclick="event.preventDefault(); alert('⚙️ Tính năng cài đặt sẽ sớm ra mắt');" class="flex items-center gap-3 px-6 py-3 text-gray-700 hover:bg-gray-50 transition">
                                            <i data-feather="settings" class="w-5 h-5 text-gray-400"></i>
                                            <span class="font-medium">Cài đặt</span>
                                        </a>
                                    </div>

                                    <!-- Logout -->
                                    <div class="py-2 border-t border-gray-100">
                                        <button id="logout-btn" class="w-full flex items-center gap-3 px-6 py-3 text-red-600 hover:bg-red-50 transition font-medium">
                                            <i data-feather="log-out" class="w-5 h-5"></i>
                                            <span>Đăng xuất</span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Mobile Menu Button -->
                        <button class="md:hidden text-gray-700 hover:text-emerald-600 transition" id="mobile-menu-btn">
                            <i data-feather="menu" class="w-6 h-6"></i>
                        </button>
                    </div>

                    <!-- Mobile Navigation -->
                    <div id="mobile-menu" class="hidden md:hidden mt-4 pb-4 space-y-3">
                        <a href="index.html" class="block text-gray-700 hover:text-emerald-600 font-semibold py-2 transition">
                            <i data-feather="home" class="w-5 h-5 inline mr-2"></i>
                            Trang chủ
                        </a>
                        <a href="submit.html" class="block text-gray-700 hover:text-emerald-600 font-semibold py-2 transition">
                            <i data-feather="shield-check" class="w-5 h-5 inline mr-2"></i>
                            Kiểm tra tin
                        </a>
                        <a href="share.html" class="block text-gray-700 hover:text-emerald-600 font-semibold py-2 transition">
                            <i data-feather="share-2" class="w-5 h-5 inline mr-2"></i>
                            Đăng tin
                        </a>
                        <div class="border-t border-gray-200 pt-3 mt-3">
                            <p class="text-sm font-semibold text-gray-600 mb-2">👤 ${this.escapeHtml(user.full_name || user.username)}</p>
                            <a href="#" onclick="event.preventDefault(); alert('🎯 Tính năng hồ sơ sẽ sớm ra mắt');" class="block text-gray-700 py-2 text-sm">
                                <i data-feather="user" class="w-4 h-4 inline mr-2"></i>
                                Hồ sơ cá nhân
                            </a>

                            <a href="post-history.html" class="block text-gray-700 py-2 text-sm">
                                <i data-feather="file-text" class="w-4 h-4 inline mr-2"></i>
                                Bài đăng của tôi
                            </a>
                            <a href="#" onclick="event.preventDefault(); alert('⚙️ Tính năng cài đặt sẽ sớm ra mắt');" class="block text-gray-700 py-2 text-sm">
                                <i data-feather="settings" class="w-4 h-4 inline mr-2"></i>
                                Cài đặt
                            </a>
                            <button id="mobile-logout-btn" class="w-full text-left text-red-600 py-2 text-sm font-medium mt-2">
                                <i data-feather="log-out" class="w-4 h-4 inline mr-2"></i>
                                Đăng xuất
                            </button>
                        </div>
                    </div>
                </div>
            </nav>
        `;

        feather.replace();
        this.setupUserDropdown();
        this.setupMobileMenu();
        this.setupLogout();
    }

    // Setup dropdown menu
    setupUserDropdown() {
        const userMenuBtn = document.getElementById('user-menu-btn');
        const userDropdownMenu = document.getElementById('user-dropdown-menu');
        const userDropdownContainer = document.getElementById('user-dropdown-container');

        if (!userMenuBtn || !userDropdownMenu) return;

        // Toggle dropdown
        userMenuBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            userDropdownMenu.classList.toggle('hidden');
        });

        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if (!userDropdownContainer?.contains(e.target)) {
                userDropdownMenu.classList.add('hidden');
            }
        });

        // Close dropdown when clicking on a menu item
        userDropdownMenu.querySelectorAll('a, button').forEach(item => {
            item.addEventListener('click', () => {
                setTimeout(() => {
                    userDropdownMenu.classList.add('hidden');
                }, 300);
            });
        });
    }

    // Setup mobile menu
    setupMobileMenu() {
        const mobileMenuBtn = document.getElementById('mobile-menu-btn');
        const mobileMenu = document.getElementById('mobile-menu');

        if (!mobileMenuBtn || !mobileMenu) return;

        mobileMenuBtn.addEventListener('click', () => {
            mobileMenu.classList.toggle('hidden');
        });

        // Close menu when clicking on a link
        mobileMenu.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                mobileMenu.classList.add('hidden');
            });
        });
    }

    // Setup logout functionality
    setupLogout() {
        const logoutBtn = document.getElementById('logout-btn');
        const mobileLogoutBtn = document.getElementById('mobile-logout-btn');

        const handleLogout = () => {
            // Xác nhận trước khi đăng xuất
            if (confirm('⚠️ Bạn có chắc chắn muốn đăng xuất?')) {
                AuthManager.clearUser();
                Toast.show('✅ Đã đăng xuất thành công!', 'success');
                setTimeout(() => {
                    window.location.href = 'index.html';
                }, 1000);
            }
        };

        if (logoutBtn) {
            logoutBtn.addEventListener('click', handleLogout);
        }

        if (mobileLogoutBtn) {
            mobileLogoutBtn.addEventListener('click', handleLogout);
        }
    }

    // Escape HTML để tránh XSS
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Khởi tạo NavigationManager khi trang tải
document.addEventListener('DOMContentLoaded', () => {
    window.navManager = new NavigationManager();
    console.log('✅ Navigation Manager initialized');
});