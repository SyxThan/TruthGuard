/**
 * Share Page Integration
 * Handles communication between share.html and backend fake news detection API
 */

const API_BASE_URL = 'http://localhost:8000';

// ============================================
// INITIALIZATION
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    console.log('✅ Share page initialized');
    
    // Check authentication
    if (!getToken()) {
        console.warn('⚠️ User not authenticated');
        alert('❌ Vui lòng đăng nhập trước!');
        window.location.href = './login.html';
        return;
    }
    
    // Initialize event listeners
    initializeEventListeners();
    
    // Initialize UI
    feather.replace();
});

// ============================================
// EVENT LISTENERS
// ============================================

function initializeEventListeners() {
    const checkOnlyBtn = document.getElementById('check-only-btn');
    const submitShareBtn = document.getElementById('submit-share-btn');
    const toggleSwitches = document.querySelectorAll('.toggle-switch');
    
    // Check only button
    if (checkOnlyBtn) {
        checkOnlyBtn.addEventListener('click', (e) => {
            e.preventDefault();
            handleCheckOnly();
        });
    }
    
    // Submit & Share button
    if (submitShareBtn) {
        submitShareBtn.addEventListener('click', (e) => {
            e.preventDefault();
            handleSharePost();
        });
    }
    
    // Toggle switches
    toggleSwitches.forEach(toggle => {
        toggle.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            toggle.classList.toggle('active');
        });
    });
}

// ============================================
// AUTH FUNCTIONS
// ============================================

function getToken() {
    return localStorage.getItem('access_token');
}

function checkAuth(showAlert = true) {
    const token = getToken();
    if (!token || token.trim() === '') {
        if (showAlert) {
            alert('❌ Vui lòng đăng nhập trước!');
            window.location.href = './login.html';
        }
        return false;
    }
    return true;
}

// ============================================
// FORM VALIDATION
// ============================================

function validateForm() {
    const title = document.getElementById('title').value.trim();
    const content = document.getElementById('content').value.trim();
    const category = document.getElementById('category').value;
    
    if (!title) {
        alert('⚠️ Vui lòng nhập tiêu đề!');
        return null;
    }
    
    if (!content) {
        alert('⚠️ Vui lòng nhập nội dung!');
        return null;
    }
    
    if (!category) {
        alert('⚠️ Vui lòng chọn danh mục!');
        return null;
    }
    
    return { title, content, category };
}

// ============================================
// CHECK ONLY FUNCTION
// ============================================

async function handleCheckOnly() {
    console.log('🔍 Check only initiated');
    
    const formData = validateForm();
    if (!formData) return;
    
    const btn = document.getElementById('check-only-btn');
    const originalContent = btn.innerHTML;
    
    try {
        // Update button state
        btn.disabled = true;
        btn.innerHTML = '<i data-feather="loader" class="w-6 h-6 animate-spin"></i><span>Đang kiểm tra...</span>';
        feather.replace();
        
        // Call check API
        const result = await checkNews(formData.title, formData.content);
        
        // Display results
        displayCheckResults(result);
        
    } catch (error) {
        console.error('❌ Error:', error);
        alert(`❌ Lỗi: ${error.message}`);
    } finally {
        btn.disabled = false;
        btn.innerHTML = originalContent;
        feather.replace();
    }
}

// ============================================
// SHARE POST FUNCTION
// ============================================

async function handleSharePost() {
    console.log('📤 Share post initiated');
    
    if (!checkAuth()) return;
    
    const formData = validateForm();
    if (!formData) return;
    
    const btn = document.getElementById('submit-share-btn');
    const originalContent = btn.innerHTML;
    
    try {
        // Update button state
        btn.disabled = true;
        btn.innerHTML = '<i data-feather="loader" class="w-6 h-6 animate-spin"></i><span>Đang xử lý...</span>';
        feather.replace();
        
        // Call user-share API
        const result = await sharePost(formData);
        
        // Display results
        displayShareResults(result);
        
    } catch (error) {
        console.error('❌ Error:', error);
        
        if (error.message.includes('401')) {
            alert('🔒 Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại!');
            window.location.href = './login.html';
        } else {
            alert(`❌ Lỗi: ${error.message}`);
        }
    } finally {
        btn.disabled = false;
        btn.innerHTML = originalContent;
        feather.replace();
    }
}

// ============================================
// API FUNCTIONS
// ============================================

/**
 * Check news without saving to database
 * Endpoint: POST /posts/analyze
 */
async function checkNews(title, content) {
    console.log('📤 Calling /posts/analyze...');
    
    const payload = {
        title: title,
        content: content
    };
    
    const response = await fetch(`${API_BASE_URL}/posts/analyze`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
    });
    
    if (!response.ok) {
        const error = await response.json().catch(() => ({ detail: 'Unknown error' }));
        throw new Error(error.detail || `API Error: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('✅ Response:', data);
    return data;
}

/**
 * Share post and save to database
 * Endpoint: POST /posts/user-share
 */
async function sharePost(formData) {
    console.log('📤 Calling /posts/user-share...');
    
    const token = getToken();
    
    const payload = {
        title: formData.title,
        content: formData.content,
        category_id: parseInt(formData.category),
        images: []
    };
    
    const response = await fetch(`${API_BASE_URL}/posts/user-share`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
    });
    
    if (!response.ok) {
        if (response.status === 401) {
            throw new Error('401 Unauthorized');
        }
        const error = await response.json().catch(() => ({ detail: 'Unknown error' }));
        throw new Error(error.detail || `API Error: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('✅ Response:', data);
    return data;
}

// ============================================
// RESULT DISPLAY FUNCTIONS
// ============================================

function displayCheckResults(result) {
    console.log('🎯 Displaying check results');
    
    const container = document.getElementById('results-container');
    const content = document.getElementById('results-content');
    
    const confidence = Math.round(result.confidence_score * 100);
    const label = result.label || 'Unknown';
    const credibility = result.credibility_label || 'Unknown';
    
    const statusColor = result.is_fake ? 'red' : 'green';
    const statusIcon = result.is_fake ? '⚠️' : '✅';
    
    const html = `
        <div class="text-center">
            <h2 class="text-3xl font-bold mb-6 text-gray-800">📊 Kết quả kiểm chứng</h2>
            
            <div class="bg-${statusColor}-50 border-l-4 border-${statusColor}-500 p-6 rounded-lg mb-6">
                <p class="text-2xl font-bold text-${statusColor}-600 mb-2">
                    ${statusIcon} ${label === 'Fake' ? 'TIN GIẢ' : 'TIN THẬT'}
                </p>
                <p class="text-gray-600">
                    Độ tin cậy: <strong>${confidence}%</strong>
                </p>
                <p class="text-gray-600">
                    Nhận định: <strong>${credibility}</strong>
                </p>
            </div>
            
            <div class="grid grid-cols-2 gap-4 text-center">
                <div class="p-4 bg-gray-50 rounded-lg">
                    <p class="text-sm text-gray-600">Xác suất Tin Thật</p>
                    <p class="text-2xl font-bold text-green-600">
                        ${Math.round((result.probabilities?.Real || 0) * 100)}%
                    </p>
                </div>
                <div class="p-4 bg-gray-50 rounded-lg">
                    <p class="text-sm text-gray-600">Xác suất Tin Giả</p>
                    <p class="text-2xl font-bold text-red-600">
                        ${Math.round((result.probabilities?.Fake || 0) * 100)}%
                    </p>
                </div>
            </div>
            
            <div class="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <p class="text-xs text-gray-500 mb-2">Văn bản đã xử lý:</p>
                <p class="text-sm text-gray-700 italic">
                    "${result.preprocessed_text?.substring(0, 150)}${result.preprocessed_text?.length > 150 ? '...' : ''}"
                </p>
            </div>
            
            <p class="text-sm text-gray-500 mt-4">
                ℹ️ Đây là kết quả kiểm chứng riêng. Kết quả không được lưu trữ.
            </p>
        </div>
    `;
    
    content.innerHTML = html;
    container.classList.remove('hidden');
    
    // Scroll to results
    container.scrollIntoView({ behavior: 'smooth' });
}

function displayShareResults(result) {
    console.log('🎯 Displaying share results');
    
    const container = document.getElementById('results-container');
    const content = document.getElementById('results-content');
    
    const confidence = Math.round(result.confidence_score * 100);
    const label = result.label || 'Unknown';
    const credibility = result.credibility_label || 'Unknown';
    const status = result.post?.status || 'unknown';
    
    const isPublished = status === 'published';
    const statusText = isPublished ? '✅ Đã đăng công khai' : '💾 Lưu nháp';
    const statusColor = isPublished ? 'green' : 'yellow';
    
    const html = `
        <div class="text-center">
            <h2 class="text-3xl font-bold mb-6 text-gray-800">📊 Kết quả Chia Sẻ</h2>
            
            <div class="bg-${statusColor}-50 border-l-4 border-${statusColor}-500 p-6 rounded-lg mb-6">
                <p class="text-2xl font-bold text-${statusColor}-600 mb-2">
                    ${isPublished ? '🎉 Thành công!' : '⚠️ Cảnh báo'}
                </p>
                <p class="text-gray-600">
                    Độ tin cậy: <strong>${confidence}%</strong>
                </p>
                <p class="text-gray-600">
                    Nhận định: <strong>${credibility}</strong>
                </p>
                <p class="text-gray-600">
                    Trạng thái: <strong>${statusText}</strong>
                </p>
            </div>
            
            ${isPublished ? `
                <div class="p-4 bg-green-100 border border-green-300 rounded-lg mb-4">
                    <p class="text-green-700">✓ Tin tức đã được chia sẻ lên cộng đồng!</p>
                    <p class="text-sm text-green-600 mt-1">Cảm ơn bạn đã đóng góp thông tin đáng tin cậy!</p>
                </div>
            ` : `
                <div class="p-4 bg-yellow-100 border border-yellow-300 rounded-lg mb-4">
                    <p class="text-yellow-700">ℹ️ Tin tức chưa đủ điều kiện chia sẻ công khai</p>
                    <p class="text-sm text-yellow-600 mt-1">Được lưu nháp. Bạn có thể chỉnh sửa và gửi lại sau!</p>
                </div>
            `}
            
            <div class="grid grid-cols-2 gap-4 text-center mt-4">
                <div class="p-4 bg-gray-50 rounded-lg">
                    <p class="text-sm text-gray-600">Xác suất Tin Thật</p>
                    <p class="text-2xl font-bold text-green-600">
                        ${Math.round((result.probabilities?.Real || 0) * 100)}%
                    </p>
                </div>
                <div class="p-4 bg-gray-50 rounded-lg">
                    <p class="text-sm text-gray-600">Xác suất Tin Giả</p>
                    <p class="text-2xl font-bold text-red-600">
                        ${Math.round((result.probabilities?.Fake || 0) * 100)}%
                    </p>
                </div>
            </div>
            
            <div class="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <p class="text-xs text-gray-500 mb-2">Văn bản đã xử lý:</p>
                <p class="text-sm text-gray-700 italic">
                    "${result.preprocessed_text?.substring(0, 150)}${result.preprocessed_text?.length > 150 ? '...' : ''}"
                </p>
            </div>
        </div>
    `;
    
    content.innerHTML = html;
    container.classList.remove('hidden');
    
    // Auto-redirect after 3 seconds if published
    if (isPublished) {
        setTimeout(() => {
            alert('✅ Cảm ơn! Bạn sẽ được chuyển về trang chủ...');
            window.location.href = 'index.html';
        }, 3000);
    }
    
    // Scroll to results
    container.scrollIntoView({ behavior: 'smooth' });
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

function formatDate(dateString) {
    if (!dateString) return 'N/A';
    const options = { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleDateString('vi-VN', options);
}
