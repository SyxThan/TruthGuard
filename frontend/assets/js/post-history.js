class PostHistoryPage {
    constructor() {
        this.currentPage = 1;
        this.itemsPerPage = 10;
        this.allPosts = [];
        this.filteredPosts = [];
        this.init();
    }

    async init() {
        if (!AuthManager.isLoggedIn()) {
            Toast.show('Vui lòng đăng nhập để xem bài đăng', 'warning');
            setTimeout(() => {
                window.location.href = 'login.html';
            }, 1500);
            return;
        }

        this.setupEventListeners();
        await this.loadPosts();
    }

    setupEventListeners() {
        const applyFiltersBtn = document.getElementById('apply-filters');
        const searchInput = document.getElementById('search-input');

        applyFiltersBtn?.addEventListener('click', () => this.applyFilters());
        searchInput?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.applyFilters();
            }
        });
    }

    async loadPosts() {
        try {
            document.getElementById('loading-state')?.classList.remove('hidden');
            document.getElementById('posts-list')?.classList.add('hidden');
            document.getElementById('empty-state')?.classList.add('hidden');

            this.allPosts = await api.getUserPosts(0, 1000);

            if (!Array.isArray(this.allPosts)) {
                this.allPosts = [];
            }

            this.filteredPosts = [...this.allPosts];

            this.updateStats();
            this.displayPosts();

            document.getElementById('loading-state')?.classList.add('hidden');

            if (this.allPosts.length === 0) {
                document.getElementById('empty-state')?.classList.remove('hidden');
            } else {
                document.getElementById('posts-list')?.classList.remove('hidden');
            }
        } catch (error) {
            console.error('Error loading posts:', error);
            document.getElementById('loading-state')?.classList.add('hidden');
            
            if (error.message && error.message.includes('401')) {
                Toast.show('Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại', 'error');
                setTimeout(() => {
                    window.location.href = 'login.html';
                }, 1500);
            } else {
                document.getElementById('empty-state')?.classList.remove('hidden');
                Toast.show('Không thể tải danh sách bài đăng', 'error');
            }
        }
    }

    updateStats() {
        const total = this.allPosts.length;
        const published = this.allPosts.filter(post => post.status === 'published').length;
        const pending = total - published;
        const totalViews = this.allPosts.reduce((sum, post) => sum + (post.view_count || 0), 0);

        document.getElementById('total-posts').textContent = total;
        document.getElementById('published-count').textContent = published;
        document.getElementById('pending-count').textContent = pending;
        document.getElementById('total-views').textContent = totalViews;
    }

    applyFilters() {
        const searchTerm = document.getElementById('search-input').value.toLowerCase();
        const filterStatus = document.getElementById('filter-status').value;
        const sortBy = document.getElementById('sort-by').value;

        this.filteredPosts = this.allPosts.filter(post => {
            const matchesSearch = !searchTerm || post.title.toLowerCase().includes(searchTerm);
            const matchesStatus = !filterStatus ||
                (filterStatus === 'published' && post.status === 'published') ||
                (filterStatus === 'pending' && post.status !== 'published');
            return matchesSearch && matchesStatus;
        });

        if (sortBy === 'newest') {
            this.filteredPosts.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        } else if (sortBy === 'oldest') {
            this.filteredPosts.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
        } else if (sortBy === 'most-viewed') {
            this.filteredPosts.sort((a, b) => (b.view_count || 0) - (a.view_count || 0));
        }

        this.currentPage = 1;
        this.displayPosts();
    }

    displayPosts() {
        const container = document.getElementById('posts-container');
        if (!container) return;

        const start = (this.currentPage - 1) * this.itemsPerPage;
        const end = start + this.itemsPerPage;
        const pageItems = this.filteredPosts.slice(start, end);

        container.innerHTML = pageItems.map(post => this.createPostCard(post)).join('');

        this.renderPagination();
        feather.replace();
    }

    createPostCard(post) {
        const date = new Date(post.created_at);
        const formattedDate = date.toLocaleDateString('vi-VN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });

        const statusBadge = post.status === 'published'
            ? '<span class="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-lg text-xs font-bold">Đã xuất bản</span>'
            : '<span class="bg-orange-100 text-orange-700 px-3 py-1 rounded-lg text-xs font-bold">Chờ duyệt</span>';

        const credibilityBadge = this.getBadge(post.credibility_label, post.credibility_score);

        return `
            <article class="glass-card rounded-2xl overflow-hidden hover:shadow-xl transition">
                <div class="p-6">
                    <div class="flex items-start justify-between mb-4">
                        <div class="flex-1">
                            <div class="flex items-center gap-2 mb-2">
                                ${statusBadge}
                                ${credibilityBadge}
                            </div>
                            <h3 class="text-xl font-bold text-gray-800 mb-2 leading-tight">${this.escapeHtml(post.title)}</h3>
                            <p class="text-gray-600 mb-3 line-clamp-2">${this.escapeHtml(post.content || 'Không có nội dung').substring(0, 150)}...</p>
                        </div>
                    </div>

                    <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                        <div class="flex items-center gap-2 text-sm">
                            <i data-feather="clock" class="w-4 h-4 text-gray-400"></i>
                            <span class="text-gray-600">${formattedDate}</span>
                        </div>
                        <div class="flex items-center gap-2 text-sm">
                            <i data-feather="eye" class="w-4 h-4 text-gray-400"></i>
                            <span class="text-gray-600">${post.view_count || 0} lượt xem</span>
                        </div>
                        <div class="flex items-center gap-2 text-sm">
                            <i data-feather="tag" class="w-4 h-4 text-gray-400"></i>
                            <span class="text-gray-600">${post.category_name || 'Chưa phân loại'}</span>
                        </div>
                        <div class="flex items-center gap-2 text-sm">
                            <i data-feather="link" class="w-4 h-4 text-gray-400"></i>
                            <span class="text-gray-600 truncate">${post.source || 'Không rõ nguồn'}</span>
                        </div>
                    </div>

                    <div class="flex items-center justify-between pt-4 border-t border-gray-100">
                        <div class="flex gap-2">
                            ${post.status === 'published' ? `
                                <button onclick="postHistoryPage.viewPost('${post.id}')" class="text-emerald-600 font-semibold flex items-center gap-2 hover:text-emerald-700 transition">
                                    <i data-feather="eye" class="w-4 h-4"></i>
                                    Xem
                                </button>
                            ` : ''}
                        </div>
                        <button onclick="postHistoryPage.deletePost('${post.id}')" class="text-red-600 font-semibold flex items-center gap-2 hover:text-red-700 transition">
                            <i data-feather="trash-2" class="w-4 h-4"></i>
                            Xóa
                        </button>
                    </div>
                </div>
            </article>
        `;
    }

    getBadge(label, score) {
        if (label === 'Real') {
            return '<span class="badge-real flex items-center gap-2 text-white px-3 py-1 rounded-lg text-xs font-bold whitespace-nowrap"><i data-feather="check-circle" class="w-3 h-3"></i>THẬT</span>';
        } else if (label === 'Fake') {
            return '<span class="badge-fake flex items-center gap-2 text-white px-3 py-1 rounded-lg text-xs font-bold whitespace-nowrap"><i data-feather="x-circle" class="w-3 h-3"></i>GIẢ</span>';
        } else if (label === 'Uncertain') {
            return '<span class="badge-uncertain flex items-center gap-2 text-white px-3 py-1 rounded-lg text-xs font-bold whitespace-nowrap"><i data-feather="help-circle" class="w-3 h-3"></i>CHƯA RÕ</span>';
        }
        return '';
    }

    renderPagination() {
        const pagination = document.getElementById('pagination');
        if (!pagination) return;

        const totalPages = Math.ceil(this.filteredPosts.length / this.itemsPerPage);

        if (totalPages <= 1) {
            pagination.innerHTML = '';
            return;
        }

        let html = '';

        if (this.currentPage > 1) {
            html += `<button onclick="postHistoryPage.goToPage(${this.currentPage - 1})" class="px-4 py-2 rounded-xl bg-white border-2 border-gray-200 hover:border-emerald-500 transition">Trước</button>`;
        }

        for (let i = 1; i <= totalPages; i++) {
            if (i === 1 || i === totalPages || (i >= this.currentPage - 1 && i <= this.currentPage + 1)) {
                const active = i === this.currentPage ? 'bg-emerald-500 text-white' : 'bg-white border-2 border-gray-200';
                html += `<button onclick="postHistoryPage.goToPage(${i})" class="px-4 py-2 rounded-xl ${active} hover:border-emerald-500 transition">${i}</button>`;
            } else if (i === this.currentPage - 2 || i === this.currentPage + 2) {
                html += `<span class="px-2">...</span>`;
            }
        }

        if (this.currentPage < totalPages) {
            html += `<button onclick="postHistoryPage.goToPage(${this.currentPage + 1})" class="px-4 py-2 rounded-xl bg-white border-2 border-gray-200 hover:border-emerald-500 transition">Sau</button>`;
        }

        pagination.innerHTML = html;
    }

    goToPage(page) {
        this.currentPage = page;
        this.displayPosts();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    viewPost(postId) {
        window.location.href = `article.html?id=${postId}`;
    }

    async deletePost(postId) {
        if (!confirm('Bạn có chắc chắn muốn xóa bài đăng này?')) return;

        try {
            await api.deletePost(postId);
            Toast.show('Đã xóa bài đăng thành công', 'success');

            this.allPosts = this.allPosts.filter(post => post.id !== postId);
            this.applyFilters();
            this.updateStats();

            if (this.allPosts.length === 0) {
                document.getElementById('posts-list').classList.add('hidden');
                document.getElementById('empty-state').classList.remove('hidden');
            }
        } catch (error) {
            console.error('Error deleting post:', error);
            Toast.show('Không thể xóa bài đăng', 'error');
        }
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Initialize page
let postHistoryPage;
document.addEventListener('DOMContentLoaded', () => {
    postHistoryPage = new PostHistoryPage();
    feather.replace();
});
