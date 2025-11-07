const API_BASE_URL = 'http://localhost:8000';

class APIClient {
    constructor(baseURL = API_BASE_URL) {
        this.baseURL = baseURL;
        this.token = localStorage.getItem('access_token');
    }

    // Get fresh token on each request
    getToken() {
        return localStorage.getItem('access_token');
    }

    getHeaders() {
        const headers = {
            'Content-Type': 'application/json',
        };
        const token = this.getToken(); // Always get fresh token
        if (token && token.trim() !== '') {
            headers['Authorization'] = `Bearer ${token}`;
        }
        return headers;
    }

    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        const token = this.getToken();
        
        if (!token || token.trim() === '') {
            throw new Error('401: Token không tồn tại. Vui lòng đăng nhập!');
        }

        const config = {
            ...options,
            headers: {
                ...this.getHeaders(),
                ...options.headers,
            },
        };

        console.log('API Request:', {
            method: config.method || 'GET',
            url: url,
            hasToken: !!token,
            headers: config.headers
        });

        try {
            const response = await fetch(url, config);
            
            console.log('API Response:', {
                status: response.status,
                statusText: response.statusText,
                url: url
            });
            
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                const errorMessage = errorData.detail || `HTTP ${response.status}`;
                
                console.error('API Error Details:', {
                    status: response.status,
                    errorData: errorData,
                    url: url
                });
                
                // Handle 401 specifically
                if (response.status === 401) {
                    throw new Error(`401: ${errorMessage}`);
                }
                
                // Handle 422 with details
                if (response.status === 422) {
                    console.error('Validation Error (422):', errorData);
                    throw new Error(`422: ${JSON.stringify(errorData)}`);
                }
                
                throw new Error(errorMessage);
            }
            
            // Handle DELETE requests or responses with no content
            const contentType = response.headers.get('content-type');
            if (response.status === 204 || !contentType || !contentType.includes('application/json')) {
                return response.status === 204 ? null : await response.text().then(text => text ? JSON.parse(text) : null);
            }
            
            return await response.json();
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    }

    async publicRequest(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;

        const config = {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                ...options.headers,
            },
        };

        try {
            const response = await fetch(url, config);
            
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                const errorMessage = errorData.detail || `HTTP ${response.status}`;
                
                console.error('API Error Details:', {
                    status: response.status,
                    errorData: errorData,
                    url: url
                });
                
                throw new Error(errorMessage);
            }
            
            // Handle DELETE requests or responses with no content
            const contentType = response.headers.get('content-type');
            if (response.status === 204 || !contentType || !contentType.includes('application/json')) {
                return response.status === 204 ? null : await response.text().then(text => text ? JSON.parse(text) : null);
            }
            
            return await response.json();
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    }

    // User endpoints
    async register(userData) {
        return this.request('/auth/register', {
            method: 'POST',
            body: JSON.stringify(userData),
        });
    }

    async login(credentials) {
        return this.request('/auth/login', {
            method: 'POST',
            body: JSON.stringify(credentials),
        });
    }

    async getUser(userId) {
        return this.request(`/users/${userId}`);
    }

    async updateUser(userId, userData) {
        return this.request(`/users/${userId}`, {
            method: 'PUT',
            body: JSON.stringify(userData),
        });
    }

    // Posts endpoints
    async getAllPosts(skip = 0, limit = 100, filters = {}) {
        const params = new URLSearchParams({
            skip,
            limit,
            ...filters,
        });
        return this.request(`/posts/?${params}`);
    }

    async getPublishedPosts(skip = 0, limit = 100) {
        return this.publicRequest(`/posts/published?skip=${skip}&limit=${limit}`);
    }

    async getPost(postId) {
        return this.publicRequest(`/posts/${postId}`);
    }

    async createPost(postData) {
        return this.request('/posts/', {
            method: 'POST',
            body: JSON.stringify(postData),
        });
    }

    async updatePost(postId, postData) {
        return this.request(`/posts/user/update/${postId}`, {
            method: 'PUT',
            body: JSON.stringify(postData),
        });
    }

    async deletePost(postId) {
        return this.request(`/posts/user/delete/${postId}`, {
            method: 'DELETE',
        });
    }

    async publishPost(postId) {
        return this.request(`/posts/${postId}/publish`, {
            method: 'POST',
        });
    }

    async addImagesToPost(postId, imageUrls) {
        return this.request(`/posts/${postId}/images`, {
            method: 'POST',
            body: JSON.stringify({ images: imageUrls }),
        });
    }

    // Prediction endpoints
    async checkAndPublishPost(postData) {
        return this.request('/posts/check-and-publish', {
            method: 'POST',
            body: JSON.stringify(postData),
        });
    }

    async predictPost(postData) {
        return this.request('/posts/predict', {
            method: 'POST',
            body: JSON.stringify(postData),
        });
    }

    async analyzePost(postData) {
        return this.publicRequest('/posts/analyze', {
            method: 'POST',
            body: JSON.stringify(postData),
        });
    }

    // User share endpoint
    async userSharePost(postData) {
        return this.request('/posts/user-share', {
            method: 'POST',
            body: JSON.stringify(postData),
        });
    }

    // Image upload endpoints
    async uploadMultipleImages(files) {
        const token = this.getToken(); // Get fresh token
        
        if (!token || token.trim() === '') {
            throw new Error('401: Token không tồn tại. Vui lòng đăng nhập!');
        }

        const formData = new FormData();
        files.forEach(file => {
            formData.append('files', file);
        });

        const url = `${this.baseURL}/images/upload-multiple`;
        const headers = {
            'Authorization': `Bearer ${token}`,
        };

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: headers,
                body: formData,
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                const errorMessage = errorData.detail || `HTTP ${response.status}`;
                
                if (response.status === 401) {
                    throw new Error(`401: ${errorMessage}`);
                }
                
                throw new Error(errorMessage);
            }

            return await response.json();
        } catch (error) {
            console.error('Upload Error:', error);
            throw error;
        }
    }

    // Filter endpoints
    async searchPosts(query, skip = 0, limit = 100) {
        return this.publicRequest(`/posts/search?q=${encodeURIComponent(query)}&skip=${skip}&limit=${limit}`);
    }

    async getPostsByCategory(categoryId, skip = 0, limit = 100) {
        return this.publicRequest(`/posts/category/${categoryId}?skip=${skip}&limit=${limit}`);
    }

    async getFakeNewsPosts(skip = 0, limit = 100) {
        return this.request(`/posts/fake-news?skip=${skip}&limit=${limit}`);
    }

    async getUserPosts(skip = 0, limit = 100) {
        return this.request(`/posts/user/my-posts?skip=${skip}&limit=${limit}`);
    }

    async getCheckHistory(skip = 0, limit = 100) {
        return this.request(`/posts/user/check-history?skip=${skip}&limit=${limit}`);
    }

    // Category endpoints
    async getAllCategories() {
        return this.request('/categories/', {
            method: 'GET',
        });
    }

    async getCategoryById(categoryId) {
        return this.request(`/categories/${categoryId}`, {
            method: 'GET',
        });
    }

    async getCategoryBySlug(slug) {
        return this.request(`/categories/slug/${slug}`, {
            method: 'GET',
        });
    }

    setToken(token) {
        this.token = token;
        localStorage.setItem('access_token', token);
    }

    clearToken() {
        this.token = null;
        localStorage.removeItem('access_token');
    }
}

const api = new APIClient();
