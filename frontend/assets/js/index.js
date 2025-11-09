// Index/Home page - Load and display news (index.html)
class NewsManager {
    constructor() {
        this.currentPage = 1; // 1-based
        this.pageSize = 6;
        this.currentCategory = null;
        this.searchQuery = null;
        this.loadedIds = new Set();
        this.lastPageReached = false;
        this.lastKnownLastPage = null; // set when last page known
    }

    async loadPublishedNews() {
        try {
            this.showSkeletonLoading();
            const offset = (this.currentPage - 1) * this.pageSize;
            const posts = await api.getPublishedPosts(offset, this.pageSize);
            this.displayNews(posts);
            this.updatePaginationState(posts);
        } catch (error) {
            console.error('Error loading news:', error);
            this.displayError('❌ Lỗi tải tin tức. Vui lòng tải lại trang.');
            Toast.show('❌ Lỗi tải tin tức. Vui lòng tải lại trang.', 'error');
        }
    }

    async loadNewsByCategory(categoryId) {
        try {
            this.showSkeletonLoading();
            this.currentCategory = categoryId;
            const offset = (this.currentPage - 1) * this.pageSize;
            const posts = await api.getPostsByCategory(categoryId, offset, this.pageSize);
            this.displayNews(posts);
            this.updatePaginationState(posts);
        } catch (error) {
            console.error('Error loading category news:', error);
            this.displayError('❌ Lỗi tải tin theo danh mục. Vui lòng thử lại.');
            Toast.show('❌ Lỗi tải tin theo danh mục.', 'error');
        }
    }

    async searchNews(query) {
        try {
            this.showSkeletonLoading();
            this.searchQuery = query;
            const offset = (this.currentPage - 1) * this.pageSize;
            const posts = await api.searchPosts(query, offset, this.pageSize);
            this.displayNews(posts);
            this.updatePaginationState(posts);
        } catch (error) {
            console.error('Error searching news:', error);
            this.displayError(`❌ Lỗi tìm kiếm: "${query}". Vui lòng thử lại.`);
            Toast.show('❌ Lỗi tìm kiếm tin tức.', 'error');
        }
    }

    showSkeletonLoading() {
        const container = document.getElementById('news-container');
        if (!container) return;

        container.innerHTML = `
            <div class="skeleton-loader animate-pulse">
                <div class="glass-card rounded-3xl overflow-hidden">
                    <div class="w-full h-56 bg-gray-300"></div>
                    <div class="p-6 space-y-4">
                        <div class="h-4 bg-gray-300 rounded w-1/3"></div>
                        <div class="h-6 bg-gray-300 rounded w-3/4"></div>
                        <div class="h-4 bg-gray-300 rounded w-full"></div>
                        <div class="h-4 bg-gray-300 rounded w-5/6"></div>
                    </div>
                </div>
            </div>
            <div class="skeleton-loader animate-pulse">
                <div class="glass-card rounded-3xl overflow-hidden">
                    <div class="w-full h-56 bg-gray-300"></div>
                    <div class="p-6 space-y-4">
                        <div class="h-4 bg-gray-300 rounded w-1/3"></div>
                        <div class="h-6 bg-gray-300 rounded w-3/4"></div>
                        <div class="h-4 bg-gray-300 rounded w-full"></div>
                        <div class="h-4 bg-gray-300 rounded w-5/6"></div>
                    </div>
                </div>
            </div>
            <div class="skeleton-loader animate-pulse">
                <div class="glass-card rounded-3xl overflow-hidden">
                    <div class="w-full h-56 bg-gray-300"></div>
                    <div class="p-6 space-y-4">
                        <div class="h-4 bg-gray-300 rounded w-1/3"></div>
                        <div class="h-6 bg-gray-300 rounded w-3/4"></div>
                        <div class="h-4 bg-gray-300 rounded w-full"></div>
                        <div class="h-4 bg-gray-300 rounded w-5/6"></div>
                    </div>
                </div>
            </div>
        `;
    }

    displayNews(posts, append = false) {
        const container = document.getElementById('news-container');
        if (!container) return;

        if (!posts || posts.length === 0) {
            container.innerHTML = `
                <div class="col-span-full text-center py-12">
                    <div class="text-6xl mb-4">📰</div>
                    <p class="text-xl text-gray-600 font-semibold">Chưa có bài viết nào</p>
                    <p class="text-gray-500 mt-2">Hãy quay lại sau để xem tin tức mới nhất</p>
                </div>
            `;
            return;
        }

        this.loadedIds.clear();
        const htmlCards = posts
            .filter(post => {
                if (this.loadedIds.has(post.id)) {
                    console.warn(`Duplicate article ID detected: ${post.id}`);
                    return false;
                }
                this.loadedIds.add(post.id);
                return true;
            })
            .map(post => this.createNewsCard(post))
            .join('');

        if (append) {
            container.insertAdjacentHTML('beforeend', htmlCards);
        } else {
            container.innerHTML = htmlCards;
        }
        feather.replace();
        this.renderPagination();

        container.querySelectorAll('article').forEach(card => {
            card.style.opacity = '0';
            card.style.transform = 'translateY(20px)';
            card.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        });

        setTimeout(() => {
            container.querySelectorAll('article').forEach((card, index) => {
                setTimeout(() => {
                    card.style.opacity = '1';
                    card.style.transform = 'translateY(0)';
                }, index * 100);
            });
        }, 0);
    }

    updatePaginationState(posts) {
        // Determine if last page
        this.lastPageReached = posts.length < this.pageSize;
        if (this.lastPageReached) {
            this.lastKnownLastPage = Math.max(this.lastKnownLastPage || 0, this.currentPage);
        }
    }

    renderPagination() {
        const container = document.getElementById('pagination-container');
        if (!container) return;
        const current = this.currentPage;
        const total = this.lastKnownLastPage || current + (this.lastPageReached ? 0 : 1); // optimistic next

        const pages = [];
        const add = p => { if (p >= 1 && !pages.includes(p)) pages.push(p); };
        add(1);
        if (current - 1 > 2) pages.push('...left');
        add(current - 1);
        add(current);
        add(current + 1);
        if (total - (current + 1) > 1) pages.push('...right');
        if (this.lastKnownLastPage) add(this.lastKnownLastPage);

        const btnClass = 'mx-1 px-3 py-2 rounded-lg border text-sm font-semibold transition';
        const activeClass = 'bg-emerald-600 text-white border-emerald-600';
        const normalClass = 'bg-white text-emerald-700 border-emerald-200 hover:bg-emerald-50';
        const disabledClass = 'opacity-50 cursor-not-allowed';

        const prevDisabled = current === 1;
        const nextDisabled = !!this.lastPageReached && (!!this.lastKnownLastPage ? current >= this.lastKnownLastPage : true);

        let html = '';
        html += `<button data-action="prev" class="${btnClass} ${prevDisabled ? disabledClass : normalClass}">← Previous</button>`;
        pages.forEach(p => {
            if (typeof p === 'string') {
                html += `<span class="mx-1 px-2 text-gray-400">…</span>`;
            } else {
                const isActive = p === current;
                html += `<button data-page="${p}" class="${btnClass} ${isActive ? activeClass : normalClass}">${p}</button>`;
            }
        });
        html += `<button data-action="next" class="${btnClass} ${nextDisabled ? disabledClass : normalClass}">Next →</button>`;
        container.innerHTML = html;
    }

    displayError(message) {
        const container = document.getElementById('news-container');
        if (!container) return;

        container.innerHTML = `
            <div class="col-span-full text-center py-12">
                <div class="text-6xl mb-4">⚠️</div>
                <p class="text-xl text-red-600 font-semibold">${message}</p>
                <button onclick="newsManager.loadPublishedNews()" class="mt-4 bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2 rounded-lg font-semibold transition">
                    Thử lại
                </button>
            </div>
        `;
    }

    createNewsCard(post) {
        const isFake = post.credibility_label === 'Giả';
        const badgeClass = isFake ? 'badge-fake' : 'badge-real';
        const badgeText = isFake ? 'GIẢ' : 'THẬT';
        const badgeIcon = isFake ? 'x-circle' : 'check-circle';
        const categoryName = this.getCategoryName(post.category_id);
        const credibilityPercentage = post.credibility_score 
            ? Math.round(post.credibility_score * 100) 
            : '?';

        return `
            <article class="glass-card rounded-3xl overflow-hidden shine-effect">
                <div class="relative">
                    <img src="${this.getThumbnailUrl(post.category_id)}" onerror="this.src='./assets/img/thumbnails/default.jpg'" alt="${categoryName}" class="w-full h-56 object-cover">
                    <span class="${badgeClass} absolute top-4 right-4 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2">
                        <i data-feather="${badgeIcon}" class="w-4 h-4"></i>
                        ${badgeText}
                    </span>
                </div>
                <div class="p-6">
                    <div class="flex items-center gap-2 mb-3">
                        <span class="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-lg text-xs font-bold">${categoryName}</span>
                        <span class="text-xs text-gray-500">${credibilityPercentage}% tin cậy</span>
                    </div>
                    <h3 class="text-xl font-bold text-gray-800 mb-3 leading-tight line-clamp-2">${post.title}</h3>
                    <p class="text-gray-600 mb-4 leading-relaxed line-clamp-2">${post.content.substring(0, 100)}...</p>
                    <div class="flex items-center justify-between text-sm text-gray-500">
                        <div class="flex items-center gap-2">
                            <i data-feather="calendar" class="w-4 h-4"></i>
                            <span>${UIHelpers.formatDate(post.published_at || post.created_at)}</span>
                        </div>
                        <a href="article.html?id=${post.id}" class="inline-flex items-center gap-2 text-emerald-600 font-semibold hover:gap-3 transition-all group">
                            Đọc thêm
                            <i data-feather="arrow-right" class="w-4 h-4 group-hover:translate-x-1 transition-transform"></i>
                        </a>
                    </div>
                </div>
            </article>
        `;
    }

    getCategoryName(categoryId) {
        const categories = {
            1: '🏛️ Chính trị',
            2: '🏥 Sức khỏe',
            3: '💻 Công nghệ',
            4: '🔬 Khoa học',
            5: '💼 Kinh doanh',
            6: '🎬 Giải trí',
            7: '⚽ Thể thao',
            8: '📚 Giáo dục',
            9: '🌍 Môi trường',
        };
        return categories[categoryId] || '📌 Khác';
    }

    getThumbnailUrl(categoryId) {
        const thumbnails = {
            1: './assets/img/thumbnails/1.jpg',
            2: './assets/img/thumbnails/2.jpg',
            3: './assets/img/thumbnails/3.jpg',
            4: './assets/img/thumbnails/4.jpg',
            5: './assets/img/thumbnails/5.jpg',
            6: './assets/img/thumbnails/6.jpg',
        };
        return thumbnails[categoryId] || './assets/img/thumbnails/default.jpg';
    }
}

const newsManager = new NewsManager();

NewsManager.prototype.resetAll = function () {
    this.currentPage = 1;
    this.searchQuery = null;
    this.currentCategory = null;
    this.lastPageReached = false;
    this.lastKnownLastPage = null;
    const searchInput = document.querySelector('.search-input');
    if (searchInput) searchInput.value = '';
    document.querySelectorAll('.category-pill').forEach((b, i) => b.classList.toggle('active', i === 0));
    this.loadPublishedNews();
};

NewsManager.prototype.goToPage = function (page) {
    if (page < 1) return;
    if (this.lastKnownLastPage && page > this.lastKnownLastPage) return;
    this.currentPage = page;
    if (this.searchQuery) {
        this.searchNews(this.searchQuery);
    } else if (this.currentCategory) {
        this.loadNewsByCategory(this.currentCategory);
    } else {
        this.loadPublishedNews();
    }
    // Removed auto scroll for better UX on page change
    Toast.show(`✅ Went to page ${page}`, 'info');
};

document.addEventListener('DOMContentLoaded', async () => {
    // Load published news on page load
    newsManager.loadPublishedNews();

    // Search functionality
    const searchBtn = document.querySelector('.search-btn');
    const searchInput = document.querySelector('.search-input');

    if (searchBtn && searchInput) {
        searchBtn.addEventListener('click', () => {
            const query = searchInput.value.trim();
            if (query) {
                newsManager.currentPage = 1;
                newsManager.lastKnownLastPage = null;
                newsManager.lastPageReached = false;
                newsManager.searchNews(query);
            } else {
                Toast.show('⚠️ Vui lòng nhập từ khóa tìm kiếm', 'warning');
            }
        });

        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                const query = searchInput.value.trim();
                if (query) {
                    newsManager.currentPage = 1;
                    newsManager.lastKnownLastPage = null;
                    newsManager.lastPageReached = false;
                    newsManager.searchNews(query);
                } else {
                    Toast.show('⚠️ Vui lòng nhập từ khóa tìm kiếm', 'warning');
                }
            }
        });
    }

    // View all button logic
    const viewAllBtn = document.getElementById('view-all-btn');
    if (viewAllBtn) {
        viewAllBtn.addEventListener('click', () => newsManager.resetAll());
    }

    // Pagination click handling (event delegation)
    const paginationContainer = document.getElementById('pagination-container');
    if (paginationContainer) {
        paginationContainer.addEventListener('click', (e) => {
            const target = e.target.closest('button');
            if (!target) return;
            const page = target.getAttribute('data-page');
            const action = target.getAttribute('data-action');
            if (page) {
                newsManager.goToPage(parseInt(page, 10));
            } else if (action === 'prev') {
                if (newsManager.currentPage > 1) newsManager.goToPage(newsManager.currentPage - 1);
            } else if (action === 'next') {
                if (!newsManager.lastPageReached) newsManager.goToPage(newsManager.currentPage + 1);
            }
        });
    }

    // Category filter
    const categoryBtns = document.querySelectorAll('.category-pill');
    categoryBtns.forEach((btn, index) => {
        btn.addEventListener('click', function () {
            categoryBtns.forEach(b => b.classList.remove('active'));
            this.classList.add('active');

            if (index === 0) {
                newsManager.currentPage = 1;
                newsManager.lastKnownLastPage = null;
                newsManager.lastPageReached = false;
                newsManager.loadPublishedNews();
                newsManager.searchQuery = null;
                newsManager.currentCategory = null;
            } else {
                newsManager.currentPage = 1;
                newsManager.currentCategory = index;
                newsManager.searchQuery = null;
                newsManager.lastKnownLastPage = null;
                newsManager.lastPageReached = false;
                newsManager.loadNewsByCategory(index);
            }
        });
    });
});
