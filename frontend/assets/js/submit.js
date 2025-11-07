
class FakeNewsChecker {
    constructor() {
        this.apiClient = api;
        this.checkResult = null;
        this.resultContainer = null;
        this.init();
    }

    init() {
        this.setupForm();
        this.setupCheckButton();
        this.setDefaultDate();
        this.createResultContainer();
    }

    setDefaultDate() {
        const dateInput = document.getElementById('date');
        if (dateInput) {
            dateInput.value = new Date().toISOString().split('T')[0];
        }
    }

    createResultContainer() {
       
        const form = document.querySelector('form');
        if (form && !document.getElementById('check-result-container')) {
            const resultDiv = document.createElement('div');
            resultDiv.id = 'check-result-container';
            resultDiv.className = 'mt-8 hidden';
            form.parentNode.insertBefore(resultDiv, form.nextSibling);
            this.resultContainer = resultDiv;
        }
    }

    setupCheckButton() {
        
        const checkBtn = document.querySelector('[onclick*="checkOnly"], .check-btn, [data-action="check"]');
        if (checkBtn) {
            checkBtn.onclick = () => this.performCheck();
        } else {
            
            const submitBtn = document.querySelector('button[type="submit"]');
            if (submitBtn && !document.querySelector('.check-btn')) {
                const checkButtonHTML = `
                    <button type="button" class="check-btn w-full bg-gradient-to-r from-blue-500 via-blue-600 to-cyan-600 hover:from-blue-600 hover:via-blue-700 hover:to-cyan-700 text-white font-bold py-5 px-8 rounded-2xl transition duration-300 flex items-center justify-center gap-3 text-lg shadow-xl mb-3">
                        <i data-feather="shield" class="w-6 h-6"></i>
                        <span class="relative z-10">Kiểm tra trước khi đăng</span>
                    </button>
                `;
                submitBtn.parentNode.insertAdjacentHTML('beforeend', checkButtonHTML);
                feather.replace();
                
                const newCheckBtn = document.querySelector('.check-btn');
                if (newCheckBtn) {
                    newCheckBtn.addEventListener('click', () => this.performCheck());
                }
            }
        }
    }

    setupForm() {
        const submitForm = document.querySelector('form');
        if (submitForm) {
            
            submitForm.addEventListener('submit', (e) => {
                e.preventDefault();
                Toast.show('ℹ️ Đây là trang kiểm tra. Sử dụng nút "Kiểm tra trước khi đăng" để phân tích.', 'info');
            });
        }
    }

    async performCheck() {
        const formData = this.getFormData();

        
        if (!formData.title || formData.title.length < 1) {
            Toast.show(`⚠️ Vui lòng nhập tiêu đề bài viết`, 'warning');
            return;
        }
        if (!formData.content || formData.content.length < 1) {
            Toast.show(`⚠️ Vui lòng nhập nội dung bài viết`, 'warning');
            return;
        }

        try {
            
            const checkBtn = document.querySelector('.check-btn, [onclick*="checkOnly"]') || 
                           document.querySelector('button[data-action="check"]');
            const originalContent = checkBtn?.innerHTML || '';
            
            if (checkBtn) {
                checkBtn.disabled = true;
                checkBtn.innerHTML = '<i data-feather="loader" class="w-6 h-6 animate-spin"></i><span class="relative z-10">Đang kiểm tra...</span>';
                feather.replace();
            }

            
            const response = await fetch('http://localhost:8000/posts/analyze', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    title: formData.title,
                    content: formData.content
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || `Lỗi ${response.status}: ${response.statusText}`);
            }

            const result = await response.json();
            
            this.checkResult = result;

           
            this.displayCheckResult(result);

            if (checkBtn) {
                checkBtn.disabled = false;
                checkBtn.innerHTML = originalContent;
                feather.replace();
            }

        } catch (error) {
            console.error('Check error:', error);
            Toast.show(`❌ ${error.message || 'Lỗi kiểm tra. Vui lòng thử lại.'}`, 'error');
            
            const checkBtn = document.querySelector('.check-btn, [onclick*="checkOnly"]');
            if (checkBtn) {
                checkBtn.disabled = false;
                checkBtn.innerHTML = originalContent;
                feather.replace();
            }
        }
    }

    displayCheckResult(result) {
        if (!this.resultContainer) return;

        const isReal = !result.is_fake;
        const confidence = Math.round((result.confidence || result.confidence_score || 0) * 100);
        const status = result.credibility_label || (isReal ? 'Thật' : 'Giả');

        let resultHTML = '';

        if (isReal) {
            // Real news - green
            resultHTML = `
                <div class="check-result glass-effect rounded-2xl p-8 border-2 border-emerald-500 shadow-lg">
                    <div class="flex items-start gap-4">
                        <div class="flex-shrink-0 w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center">
                            <i data-feather="check-circle" class="w-10 h-10 text-emerald-600"></i>
                        </div>
                        <div class="flex-1">
                            <h3 class="text-2xl font-bold text-emerald-700 mb-2">✅ Tin tức đáng tin cậy</h3>
                            <p class="text-gray-700 text-lg mb-4">
                                Bài viết này được xác định là <strong>TIN THẬT</strong> với độ tin cậy cao.
                            </p>
                            <div class="bg-emerald-50 p-4 rounded-xl mb-4">
                                <div class="flex items-center justify-between mb-2">
                                    <span class="text-sm font-semibold text-gray-700">Độ tin cậy</span>
                                    <span class="text-2xl font-bold text-emerald-600">${confidence}%</span>
                                </div>
                                <div class="w-full bg-gray-300 rounded-full h-3">
                                    <div class="bg-emerald-500 h-3 rounded-full" style="width: ${confidence}%"></div>
                                </div>
                            </div>
                            <p class="text-sm text-gray-600 mb-4">
                                <strong>Trạng thái:</strong> ${status}
                            </p>
                            ${result.message ? `<p class="text-gray-700 italic border-l-4 border-emerald-500 pl-4">💬 ${result.message}</p>` : ''}
                            <div class="mt-6">
                                <button type="button" onclick="fakeNewsChecker.resetCheck()" 
                                    class="w-full bg-gray-400 hover:bg-gray-500 text-white font-bold py-3 px-6 rounded-xl transition flex items-center justify-center gap-2">
                                    <i data-feather="refresh-cw" class="w-5 h-5"></i>
                                    Kiểm tra bài viết khác
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        } else {
            // Fake news - red
            resultHTML = `
                <div class="check-result glass-effect rounded-2xl p-8 border-2 border-red-500 shadow-lg">
                    <div class="flex items-start gap-4">
                        <div class="flex-shrink-0 w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center">
                            <i data-feather="alert-circle" class="w-10 h-10 text-red-600"></i>
                        </div>
                        <div class="flex-1">
                            <h3 class="text-2xl font-bold text-red-700 mb-2">⚠️ Cảnh báo: Tin giả</h3>
                            <p class="text-gray-700 text-lg mb-4">
                                Bài viết này được xác định là <strong>TIN GIẢ</strong> với mức cảnh báo cao.
                            </p>
                            <div class="bg-red-50 p-4 rounded-xl mb-4">
                                <div class="flex items-center justify-between mb-2">
                                    <span class="text-sm font-semibold text-gray-700">Độ tin cậy</span>
                                    <span class="text-2xl font-bold text-red-600">${100 - confidence}%</span>
                                </div>
                                <div class="w-full bg-gray-300 rounded-full h-3">
                                    <div class="bg-red-500 h-3 rounded-full" style="width: ${100 - confidence}%"></div>
                                </div>
                            </div>
                            <p class="text-sm text-gray-600 mb-4">
                                <strong>Trạng thái:</strong> ${status}
                            </p>
                            ${result.message ? `<p class="text-gray-700 italic border-l-4 border-red-500 pl-4">💬 ${result.message}</p>` : ''}
                            <div class="mt-6">
                                <button type="button" onclick="fakeNewsChecker.resetCheck()" 
                                    class="w-full bg-gray-400 hover:bg-gray-500 text-white font-bold py-3 px-6 rounded-xl transition flex items-center justify-center gap-2">
                                    <i data-feather="refresh-cw" class="w-5 h-5"></i>
                                    Kiểm tra bài viết khác
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }

        this.resultContainer.innerHTML = resultHTML;
        this.resultContainer.classList.remove('hidden');
        feather.replace();

        
        this.resultContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    resetCheck() {
        this.checkResult = null;
        if (this.resultContainer) {
            this.resultContainer.classList.add('hidden');
            this.resultContainer.innerHTML = '';
        }
       
        const form = document.querySelector('form');
        if (form) {
            form.reset();
            this.setDefaultDate();
        }
        Toast.show('✅ Đã xóa kết quả. Sẵn sàng kiểm tra bài viết mới', 'info');
    }

    getFormData() {
        return {
            title: (document.getElementById('title')?.value || '').trim(),
            content: (document.getElementById('content')?.value || '').trim(),
        };
    }

    validateFormData(data) {
        
        if (!data.title) {
            return { valid: false, message: 'Vui lòng nhập tiêu đề bài viết' };
        }
        if (!data.content) {
            return { valid: false, message: 'Vui lòng nhập nội dung bài viết' };
        }
        return { valid: true };
    }
}


document.addEventListener('DOMContentLoaded', () => {
    window.fakeNewsChecker = new FakeNewsChecker();
    console.log('✅ Fake News Checker initialized');
});
