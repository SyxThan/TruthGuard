
class CustomNavbar extends HTMLElement {
  connectedCallback() {
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          --primary-color: #10B981;
          --primary-hover: #059669;
          --text-color: #1F2937;
          --text-muted: #6B7280;
          --bg-color: white;
          --shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
        }
        
        nav {
          background: var(--bg-color);
          padding: 0.8rem 2rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
          box-shadow: var(--shadow);
          position: sticky;
          top: 0;
          z-index: 50;
          border-bottom: 1px solid #E5E7EB;
        }
        
        .logo-container {
          display: flex;
          align-items: center;
          gap: 0.8rem;
        }
        
        .logo {
          font-weight: 700;
          font-size: 1.5rem;
          color: var(--primary-color);
          display: flex;
          align-items: center;
          transition: transform 0.2s;
        }
        
        .logo:hover {
          transform: scale(1.02);
        }
        
        .logo-icon {
          margin-right: 0.5rem;
          color: var(--primary-color);
        }
        
        .nav-container {
          display: flex;
          align-items: center;
          gap: 2rem;
        }
        
        .nav-links {
          display: flex;
          gap: 1.8rem;
          list-style: none;
          margin: 0;
          padding: 0;
        }
        
        .nav-link {
          position: relative;
          color: var(--text-muted);
          text-decoration: none;
          font-weight: 500;
          transition: color 0.2s;
          padding: 0.5rem 0;
        }
        
        .nav-link:hover {
          color: var(--primary-color);
        }
        
        .nav-link::after {
          content: '';
          position: absolute;
          bottom: 0;
          left: 0;
          width: 0;
          height: 2px;
          background: var(--primary-color);
          transition: width 0.3s;
        }
        
        .nav-link:hover::after {
          width: 100%;
        }
        
        .active {
          color: var(--primary-color);
          font-weight: 600;
        }
        
        .active::after {
          width: 100%;
        }
        
        .auth-buttons {
          display: flex;
          gap: 1rem;
          align-items: center;
        }
        
        .btn {
          padding: 0.6rem 1.2rem;
          border-radius: 0.5rem;
          font-weight: 500;
          transition: all 0.2s;
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
        }
        
        .btn-primary {
          background-color: var(--primary-color);
          color: white;
          box-shadow: 0 1px 2px 0 rgba(16, 185, 129, 0.2);
        }
        
        .btn-primary:hover {
          background-color: var(--primary-hover);
          transform: translateY(-1px);
          box-shadow: 0 4px 6px -1px rgba(16, 185, 129, 0.2), 0 2px 4px -1px rgba(16, 185, 129, 0.1);
        }
        
        .btn-outline {
          border: 1px solid #D1D5DB;
          color: var(--text-muted);
        }
        
        .btn-outline:hover {
          background-color: #F3F4F6;
          border-color: var(--primary-color);
          color: var(--primary-color);
        }
        
        .mobile-menu-button {
          display: none;
          background: none;
          border: none;
          cursor: pointer;
          color: var(--text-muted);
        }
        
        .mobile-menu {
          display: none;
          position: absolute;
          top: 100%;
          left: 0;
          right: 0;
          background: var(--bg-color);
          padding: 1.5rem;
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
          z-index: 40;
        }
        
        .mobile-menu.active {
          display: block;
        }
        
        .mobile-links {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }
        
        .mobile-links .nav-link {
          padding: 0.8rem 0;
          border-bottom: 1px solid #E5E7EB;
        }
        
        .mobile-auth {
          margin-top: 1.5rem;
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }
        
        .user-profile {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem;
          border-radius: 0.5rem;
          cursor: pointer;
          transition: background 0.2s;
        }
        
        .user-profile:hover {
          background: #F3F4F6;
        }
        
        .user-avatar {
          width: 2rem;
          height: 2rem;
          border-radius: 50%;
          object-fit: cover;
        }
        
        .user-name {
          font-weight: 500;
          color: var(--text-color);
        }
        
        @media (max-width: 768px) {
          .nav-links, .auth-buttons {
            display: none;
          }
          
          .mobile-menu-button {
            display: block;
          }
        }
      </style>
      
      <nav>
        <div class="logo-container">
          <a href="/" class="logo">
            <i data-feather="shield" class="logo-icon"></i>
            TruthGuard
          </a>
        </div>
        
        <div class="nav-container">
          <ul class="nav-links">
            <li><a href="/" class="nav-link ${window.location.pathname === '/' ? 'active' : ''}">Home</a></li>
            <li><a href="/submit.html" class="nav-link ${window.location.pathname === '/submit.html' ? 'active' : ''}">Submit News</a></li>
            <li><a href="/about.html" class="nav-link ${window.location.pathname === '/about.html' ? 'active' : ''}">About</a></li>
          </ul>
          
          <div class="auth-buttons">
            <a href="/login.html" class="btn btn-outline">
              <i data-feather="log-in"></i>
              Log In
            </a>
            <a href="/register.html" class="btn btn-primary">
              <i data-feather="user-plus"></i>
              Sign Up
            </a>
          </div>
          
          <button id="mobile-menu-button" class="mobile-menu-button">
            <i data-feather="menu"></i>
          </button>
        </div>
      </nav>
      
      <div id="mobile-menu" class="mobile-menu">
        <div class="mobile-links">
          <a href="/" class="nav-link ${window.location.pathname === '/' ? 'active' : ''}">
            <i data-feather="home" class="w-4 h-4 mr-2"></i>
            Home
          </a>
          <a href="/submit.html" class="nav-link ${window.location.pathname === '/submit.html' ? 'active' : ''}">
            <i data-feather="edit-3" class="w-4 h-4 mr-2"></i>
            Submit News
          </a>
          <a href="/about.html" class="nav-link ${window.location.pathname === '/about.html' ? 'active' : ''}">
            <i data-feather="info" class="w-4 h-4 mr-2"></i>
            About
          </a>
        </div>
        
        <div class="mobile-auth">
          <a href="/login.html" class="btn btn-outline w-full">
            <i data-feather="log-in" class="w-4 h-4 mr-2"></i>
            Log In
          </a>
          <a href="/register.html" class="btn btn-primary w-full">
            <i data-feather="user-plus" class="w-4 h-4 mr-2"></i>
            Sign Up
          </a>
        </div>
      </div>
`;
    
    // Add event listener for mobile menu
    const mobileMenuButton = this.shadowRoot.getElementById('mobile-menu-button');
    const mobileMenu = this.shadowRoot.getElementById('mobile-menu');
    
    if (mobileMenuButton && mobileMenu) {
      mobileMenuButton.addEventListener('click', () => {
        mobileMenu.classList.toggle('hidden');
        feather.replace();
      });
    }
  }
}
customElements.define('custom-navbar', CustomNavbar);