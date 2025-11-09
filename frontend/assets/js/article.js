// Article page - Load and display single article (article.html)
class ArticleManager {
    async loadArticle(postId) {
        try {
            const post = await api.getPost(postId);
            this.displayArticle(post);
        } catch (error) {
            console.error('Error loading article:', error);
            Toast.show(' Lỗi tải bài viết. Vui lòng tải lại trang.', 'error');
        }
    }

    displayArticle(post) {
        const isFake = post.credibility_label === 'Giả';
        const credibilityPercentage = post.credibility_score 
            ? Math.round(post.credibility_score) 
            : 0;

        // Update page title
        document.title = `${post.title} - TruthGuard`;

        // Update hero section
        const titleElement = document.querySelector('h1');
        if (titleElement) {
            titleElement.textContent = post.title;
        }

        // Update verification badge
        const verificationBadge = document.querySelector('.verification-badge');
        if (verificationBadge) {
            const categoryName = this.getCategoryName(post.category_id);
            const heroImg = document.querySelector('header img');
            if (heroImg) {
                heroImg.src = this.getThumbnailUrl(post.category_id);
                heroImg.alt = categoryName;
                heroImg.onerror = () => { heroImg.src = './assets/img/thumbnails/default.jpg'; };
            }
            verificationBadge.innerHTML = `
                <div class="flex items-start gap-4">
                    <div class="flex-shrink-0">
                        <div class="bg-emerald-500 text-white p-3 rounded-full">
                            <i data-feather="check-circle" class="w-7 h-7"></i>
                        </div>
                    </div>
                    <div class="flex-1">
                        <h3 class="font-bold text-xl text-gray-800 mb-2">Đã xác minh bởi TruthGuard AI</h3>
                        <p class="text-gray-700 mb-4 leading-relaxed">
                            Bài viết này đã được phân tích bởi hệ thống xác minh của chúng tôi và có 
                            <span class="font-bold text-emerald-600">${credibilityPercentage}% khả năng là ${isFake ? 'GIẢ' : 'THẬT'}</span> dựa trên nhiều nguồn đáng tin cậy và kiểm chứng sự thật.
                        </p>
                        
                        <div class="mb-4">
                            <div class="flex justify-between text-xs font-semibold text-gray-600 mb-2">
                                <span>GIẢ</span>
                                <span>THẬT</span>
                            </div>
                            <div class="confidence-bar">
                                <div class="confidence-marker" style="left: ${credibilityPercentage}%;"></div>
                            </div>
                        </div>
                        
                        <div class="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                            <div class="flex items-center gap-2">
                                <i data-feather="clock" class="w-4 h-4"></i>
                                <span>Xác minh vừa xong</span>
                            </div>
                            <a href="#verification-details" class="text-emerald-600 hover:text-emerald-700 font-semibold flex items-center gap-1">
                                Xem chi tiết xác minh
                                <i data-feather="arrow-right" class="w-4 h-4"></i>
                            </a>
                        </div>
                    </div>
                </div>
            `;
        }

        
        const articleContent = document.querySelector('.prose');
        if (articleContent) {
            articleContent.innerHTML = `
                <p class="lead">${post.content.substring(0, 200)}...</p>
                <p>${post.content}</p>
            `;
        }

        feather.replace();
    }

    getCategoryName(categoryId) {
        const categories = {
            1: '🏛️ Chính trị',
            2: '🏥 Sức Khỏe',
            3: '💻 Công Nghệ',
            4: '💼 Kinh Doanh',
            5: '⚽ Thể thao',
            6: '🔬 Khoa học',
        };
        return categories[categoryId] || '📌 Khác';
    }
}

ArticleManager.prototype.getThumbnailUrl = function(categoryId) {
    const thumbnails = {
        1: './assets/img/thumbnails/1.jpg', // Politics
        2: './assets/img/thumbnails/2.jpg', // Health
        3: './assets/img/thumbnails/3.jpg', // Technology
        4: './assets/img/thumbnails/4.jpg', // Science
        5: './assets/img/thumbnails/5.jpg', // Business
        6: './assets/img/thumbnails/6.jpg', // Sports
    };
    return thumbnails[categoryId] || './assets/img/thumbnails/default.jpg';
};
const articleManager = new ArticleManager();

document.addEventListener('DOMContentLoaded', async () => {
    // Get post ID from URL
    const urlParams = new URLSearchParams(window.location.search);
    const postId = urlParams.get('id');

    if (postId) {
        articleManager.loadArticle(postId);
    } else {
        // If no ID provided, use default article (ID 1)
        articleManager.loadArticle(1);
    }

    // Article action buttons
    const likeBtn = document.querySelector('[onclick*="like"]')?.parentElement || document.querySelectorAll('[data-feather="thumbs-up"]')[0]?.parentElement;
    const commentBtn = document.querySelector('[onclick*="comment"]')?.parentElement || document.querySelectorAll('[data-feather="message-square"]')[0]?.parentElement;
    const shareBtn = document.querySelector('[onclick*="share"]')?.parentElement || document.querySelectorAll('[data-feather="share-2"]')[0]?.parentElement;
    const reportBtn = document.querySelector('[onclick*="report"]')?.parentElement || document.querySelectorAll('[data-feather="flag"]')[0]?.parentElement;

    if (likeBtn) {
        likeBtn.addEventListener('click', () => {
            Toast.show(' Bạn đã thích bài viết này!', 'success');
        });
    }

    if (commentBtn) {
        commentBtn.addEventListener('click', () => {
            Toast.show(' Tính năng bình luận sẽ ra mắt sớm!', 'info');
        });
    }

    if (shareBtn) {
        shareBtn.addEventListener('click', () => {
            const url = window.location.href;
            if (navigator.share) {
                navigator.share({
                    title: document.title,
                    url: url,
                });
            } else {
                navigator.clipboard.writeText(url);
                Toast.show('Đã sao chép liên kết!', 'success');
            }
        });
    }

    if (reportBtn) {
        reportBtn.addEventListener('click', () => {
            Toast.show(' Bạn đã báo cáo bài viết này. Cảm ơn phản hồi!', 'info');
        });
    }
});
