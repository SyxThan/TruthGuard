// Index/Home page - Load and display news (index.html)
class NewsManager {
    constructor() {
        this.currentPage = 0;
        this.pageSize = 6;
        this.currentCategory = null;
        this.searchQuery = null;
        this.loadedIds = new Set();
    }

    async loadPublishedNews() {
        try {
            this.showSkeletonLoading();
            const posts = await api.getPublishedPosts(this.currentPage * this.pageSize, this.pageSize);
            this.displayNews(posts);
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
            const posts = await api.getPostsByCategory(categoryId, this.currentPage * this.pageSize, this.pageSize);
            this.displayNews(posts);
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
            const posts = await api.searchPosts(query, this.currentPage * this.pageSize, this.pageSize);
            this.displayNews(posts);
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

    displayNews(posts) {
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

        container.innerHTML = htmlCards;
        feather.replace();

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
                    <img src="https://images.unsplash.com/photo-1509391366360-2e959784a276?w=800&h=450&fit=crop" alt="News" class="w-full h-56 object-cover">
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
}

const newsManager = new NewsManager();

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
                newsManager.searchNews(query);
            } else {
                Toast.show('⚠️ Vui lòng nhập từ khóa tìm kiếm', 'warning');
            }
        });

        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                const query = searchInput.value.trim();
                if (query) {
                    newsManager.searchNews(query);
                } else {
                    Toast.show('⚠️ Vui lòng nhập từ khóa tìm kiếm', 'warning');
                }
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
                newsManager.currentPage = 0;
                newsManager.loadPublishedNews();
            } else {
                newsManager.currentPage = 0;
                newsManager.loadNewsByCategory(index);
            }
        });
    });
});
