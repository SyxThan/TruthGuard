// Quản lý xác thực - Xử lý đăng nhập và đăng ký
class AuthenticationManager {
    constructor() {
        this.apiBaseUrl = 'http://localhost:8000';
        this.init();
    }

    init() {
        this.setupFormHandlers();
    }

    setupFormHandlers() {
        const loginForm = document.querySelector('#login-form-element');
        const registerForm = document.querySelector('#register-form-element');

        if (loginForm) {
            loginForm.addEventListener('submit', (e) => this.handleLoginSubmit(e));
        }

        if (registerForm) {
            registerForm.addEventListener('submit', (e) => this.handleRegisterSubmit(e));
        }
    }

    // ==================== ĐĂNG NHẬP ====================
    async handleLoginSubmit(e) {
        e.preventDefault();
        const form = e.target;
        
        // Lấy các trường từ form
        const usernameInput = form.querySelector('input[name="user"]');
        const passwordInput = form.querySelector('input[name="password"]');
        const submitBtn = form.querySelector('button[type="submit"]');

        if (!usernameInput || !passwordInput) {
            this.showToast('❌ Form không hợp lệ. Vui lòng tải lại trang.', 'error');
            return;
        }

        const username = usernameInput.value.trim();
        const password = passwordInput.value;

        // Kiểm tra validation
        if (!username || !password) {
            this.showToast('❌ Vui lòng nhập đầy đủ username và mật khẩu', 'error');
            return;
        }

        try {
            this.setButtonLoading(submitBtn, true);

            // Gọi API đăng nhập
            const response = await fetch(`${this.apiBaseUrl}/users/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    username: username,
                    password: password
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || 'Đăng nhập thất bại');
            }

            const result = await response.json();

            if (result.access_token) {
                // Lưu token vào localStorage
                localStorage.setItem('access_token', result.access_token);
                localStorage.setItem('user', JSON.stringify(result.user || {
                    id: result.id,
                    username: result.username,
                    email: result.email
                }));

                this.showToast('✅ Đăng nhập thành công! Đang chuyển hướng...', 'success');
                
                // Chuyển hướng sau 1.5 giây
                setTimeout(() => {
                    window.location.href = 'index.html';
                }, 1500);
            } else {
                throw new Error('Không nhận được token từ server');
            }
        } catch (error) {
            console.error('Login error:', error);
            
            let errorMessage = 'Đăng nhập thất bại';
            if (error.message.includes('not found') || error.message.includes('invalid')) {
                errorMessage = 'Username hoặc mật khẩu không chính xác';
            } else if (error.message.includes('Failed to fetch')) {
                errorMessage = 'Không thể kết nối đến server. Vui lòng kiểm tra kết nối.';
            } else {
                errorMessage = error.message;
            }
            
            this.showToast(`❌ ${errorMessage}`, 'error');
            this.setButtonLoading(submitBtn, false);
        }
    }

    // ==================== ĐĂNG KÝ ====================
    async handleRegisterSubmit(e) {
        e.preventDefault();

        const form = e.target;
        
        // Lấy các trường từ form theo name attribute
        const fullNameInput = form.querySelector('input[name="fullname"]');
        const emailInput = form.querySelector('input[name="email"]');
        const usernameInput = form.querySelector('input[name="user"]');
        const phoneInput = form.querySelector('input[name="phone"]');
        const passwordInput = form.querySelector('input[name="password"]');
        const confirmPasswordInput = form.querySelector('input[name="confirmPassword"]');
        const termsCheckbox = form.querySelector('input[name="terms"]');
        const submitBtn = form.querySelector('button[type="submit"]');

        if (!fullNameInput || !emailInput || !usernameInput || !phoneInput || !passwordInput || !confirmPasswordInput) {
            this.showToast('❌ Form không hợp lệ. Vui lòng tải lại trang.', 'error');
            return;
        }

        const fullName = fullNameInput.value.trim();
        const email = emailInput.value.trim();
        const username = usernameInput.value.trim();
        const phone = phoneInput.value.trim();
        const password = passwordInput.value;
        const confirmPassword = confirmPasswordInput.value;

        // Kiểm tra validation client-side
        const validation = this.validateRegistration({
            fullName,
            email,
            username,
            phone,
            password,
            confirmPassword,
            terms: termsCheckbox?.checked
        });

        if (!validation.valid) {
            this.showToast(validation.message, 'error');
            return;
        }

        try {
            this.setButtonLoading(submitBtn, true);

            // Gọi API đăng ký với schema PostCreateCheck
            const response = await fetch(`${this.apiBaseUrl}/users/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    full_name: fullName,
                    email: email,
                    username: username,
                    phone_number: phone,
                    password_hash: password  // Backend sẽ hash password này
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                const errorMessage = errorData.detail || `Lỗi ${response.status}`;
                throw new Error(errorMessage);
            }

            const result = await response.json();

            this.showToast('✅ Đăng ký thành công! Chuyển sang đăng nhập...', 'success');

            // Reset form
            form.reset();
            
            // Chuyển sang tab đăng nhập sau 1.5 giây
            setTimeout(() => {
                document.getElementById('login-tab').click();
                this.setButtonLoading(submitBtn, false);
            }, 1500);

        } catch (error) {
            console.error('Register error:', error);
            
            let errorMessage = 'Đăng ký thất bại';
            if (error.message.includes('already exists')) {
                errorMessage = 'Email hoặc username đã được sử dụng. Vui lòng chọn cái khác.';
            } else if (error.message.includes('validation')) {
                errorMessage = 'Dữ liệu không hợp lệ. Vui lòng kiểm tra lại.';
            } else if (error.message.includes('Failed to fetch')) {
                errorMessage = 'Không thể kết nối đến server. Vui lòng kiểm tra kết nối.';
            } else {
                errorMessage = error.message;
            }
            
            this.showToast(`❌ ${errorMessage}`, 'error');
            this.setButtonLoading(submitBtn, false);
        }
    }

    // ==================== VALIDATION ====================
    validateRegistration(data) {
        // Kiểm tra tên đầy đủ
        if (!data.fullName || data.fullName.length < 2) {
            return { valid: false, message: '⚠️ Vui lòng nhập tên đầy đủ (tối thiểu 2 ký tự)' };
        }

        // Kiểm tra email
        if (!data.email || !this.isValidEmail(data.email)) {
            return { valid: false, message: '⚠️ Vui lòng nhập email hợp lệ' };
        }

        // Kiểm tra username
        if (!data.username || data.username.length < 3) {
            return { valid: false, message: '⚠️ Username phải có tối thiểu 3 ký tự' };
        }

        // Kiểm tra username chỉ có chữ, số, gạch dưới
        if (!/^[a-zA-Z0-9_]+$/.test(data.username)) {
            return { valid: false, message: '⚠️ Username chỉ có thể chứa chữ, số và gạch dưới' };
        }

        // Kiểm tra số điện thoại
        if (!data.phone || !this.isValidPhone(data.phone)) {
            return { valid: false, message: '⚠️ Vui lòng nhập số điện thoại hợp lệ (10-11 chữ số)' };
        }

        // Kiểm tra mật khẩu
        if (!data.password || data.password.length < 8) {
            return { valid: false, message: '⚠️ Mật khẩu phải có tối thiểu 8 ký tự' };
        }

        // Kiểm tra mật khẩu có chữ hoa
        if (!/[A-Z]/.test(data.password)) {
            return { valid: false, message: '⚠️ Mật khẩu phải chứa ít nhất 1 chữ hoa' };
        }

        // Kiểm tra mật khẩu có chữ thường
        if (!/[a-z]/.test(data.password)) {
            return { valid: false, message: '⚠️ Mật khẩu phải chứa ít nhất 1 chữ thường' };
        }

        // Kiểm tra mật khẩu có số
        if (!/[0-9]/.test(data.password)) {
            return { valid: false, message: '⚠️ Mật khẩu phải chứa ít nhất 1 số' };
        }

        // Kiểm tra mật khẩu xác nhận
        if (!data.confirmPassword) {
            return { valid: false, message: '⚠️ Vui lòng xác nhận mật khẩu' };
        }

        if (data.password !== data.confirmPassword) {
            return { valid: false, message: '⚠️ Mật khẩu xác nhận không trùng khớp' };
        }

        // Kiểm tra điều khoản dịch vụ
        if (!data.terms) {
            return { valid: false, message: '⚠️ Vui lòng đồng ý với điều khoản dịch vụ' };
        }

        return { valid: true };
    }

    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    isValidPhone(phone) {
        // Xóa tất cả ký tự không phải số
        const digitsOnly = phone.replace(/\D/g, '');
        return /^[0-9]{10,11}$/.test(digitsOnly);
    }

    isStrongPassword(password) {
        const hasUpperCase = /[A-Z]/.test(password);
        const hasLowerCase = /[a-z]/.test(password);
        const hasNumber = /[0-9]/.test(password);
        return hasUpperCase && hasLowerCase && hasNumber;
    }

    // ==================== UI HELPERS ====================
    setButtonLoading(button, isLoading) {
        if (isLoading) {
            button.disabled = true;
            button.innerHTML = '<span class="relative z-10 flex items-center justify-center gap-2"><i data-feather="loader" class="w-5 h-5 animate-spin"></i>Đang xử lý...</span>';
            feather.replace();
        } else {
            button.disabled = false;
            
            // Khôi phục text button dựa trên form
            const form = button.closest('form');
            const isRegister = form.closest('#register-form');
            
            if (isRegister) {
                button.innerHTML = '<span class="relative z-10 flex items-center justify-center gap-2"><i data-feather="user-plus" class="w-5 h-5"></i>Đăng ký ngay</span>';
            } else {
                button.innerHTML = '<span class="relative z-10 flex items-center justify-center gap-2"><i data-feather="log-in" class="w-5 h-5"></i>Đăng nhập</span>';
            }
            feather.replace();
        }
    }

    // Hiển thị toast notification
    showToast(message, type = 'info') {
        // Tạo container nếu chưa có
        let toastContainer = document.getElementById('toast-container-auth');
        if (!toastContainer) {
            toastContainer = document.createElement('div');
            toastContainer.id = 'toast-container-auth';
            toastContainer.className = 'fixed top-4 right-4 z-50 space-y-2';
            document.body.appendChild(toastContainer);
        }

        // Tạo toast element
        const toast = document.createElement('div');
        const bgColor = type === 'success' ? 'bg-green-500' : type === 'error' ? 'bg-red-500' : 'bg-blue-500';
        
        toast.className = `${bgColor} text-white px-6 py-4 rounded-xl shadow-lg flex items-start gap-3 animate-fade-in-up max-w-sm`;
        toast.innerHTML = `
            <i data-feather="alert-circle" class="w-5 h-5 flex-shrink-0 mt-0.5"></i>
            <span>${message}</span>
        `;
        
        toastContainer.appendChild(toast);
        feather.replace();
        
        // Xóa toast sau 4 giây
        setTimeout(() => {
            toast.remove();
        }, 4000);
    }
}

// Khởi tạo AuthenticationManager khi trang đã tải
document.addEventListener('DOMContentLoaded', () => {
    window.authManager = new AuthenticationManager();
    console.log('✅ Authentication system initialized');
});

