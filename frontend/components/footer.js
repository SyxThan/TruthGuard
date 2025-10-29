class CustomFooter extends HTMLElement {
  connectedCallback() {
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.innerHTML = `
      <style>
        footer {
          background: #1F2937;
          color: white;
          padding: 3rem 1rem;
          margin-top: auto;
        }
        .footer-container {
          max-width: 1200px;
          margin: 0 auto;
          display: grid;
          grid-template-columns: repeat(1, minmax(0, 1fr));
          gap: 2rem;
        }
        .footer-logo {
          font-size: 1.5rem;
          font-weight: 700;
          color: #10B981;
          display: flex;
          align-items: center;
          margin-bottom: 1rem;
        }
        .footer-description {
          color: #D1D5DB;
          margin-bottom: 1.5rem;
          max-width: 300px;
        }
        .footer-links {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 1.5rem;
        }
        .link-group h3 {
          font-weight: 600;
          margin-bottom: 1rem;
          color: white;
        }
        .link-list {
          list-style: none;
          padding: 0;
          margin: 0;
        }
        .link-list a {
          color: #9CA3AF;
          text-decoration: none;
          display: block;
          margin-bottom: 0.5rem;
          transition: color 0.2s;
        }
        .link-list a:hover {
          color: #10B981;
        }
        .social-links {
          display: flex;
          gap: 1rem;
          margin-top: 1.5rem;
        }
        .social-links a {
          color: #9CA3AF;
          transition: color 0.2s;
        }
        .social-links a:hover {
          color: #10B981;
        }
        .copyright {
          border-top: 1px solid #374151;
          padding-top: 1.5rem;
          margin-top: 3rem;
          text-align: center;
          color: #9CA3AF;
        }
        @media (min-width: 768px) {
          .footer-container {
            grid-template-columns: repeat(4, minmax(0, 1fr));
          }
          .footer-links {
            grid-column: span 3 / span 3;
            grid-template-columns: repeat(3, minmax(0, 1fr));
          }
        }
      </style>
      <footer>
        <div class="footer-container">
          <div>
            <div class="footer-logo">
              <i data-feather="shield" class="mr-2"></i>
              TruthGuard
            </div>
            <p class="footer-description">
              AI-powered news verification platform helping you distinguish facts from fiction.
            </p>
            <div class="social-links">
              <a href="#"><i data-feather="twitter"></i></a>
              <a href="#"><i data-feather="facebook"></i></a>
              <a href="#"><i data-feather="instagram"></i></a>
              <a href="#"><i data-feather="linkedin"></i></a>
            </div>
          </div>
          
          <div class="footer-links">
            <div class="link-group">
              <h3>Company</h3>
              <ul class="link-list">
                <li><a href="/about.html">About Us</a></li>
                <li><a href="/team.html">Our Team</a></li>
                <li><a href="/careers.html">Careers</a></li>
                <li><a href="/press.html">Press</a></li>
              </ul>
            </div>
            
            <div class="link-group">
              <h3>Resources</h3>
              <ul class="link-list">
                <li><a href="/blog.html">Blog</a></li>
                <li><a href="/guides.html">Guides</a></li>
                <li><a href="/faq.html">FAQ</a></li>
                <li><a href="/contact.html">Contact</a></li>
              </ul>
            </div>
            
            <div class="link-group">
              <h3>Legal</h3>
              <ul class="link-list">
                <li><a href="/privacy.html">Privacy Policy</a></li>
                <li><a href="/terms.html">Terms of Service</a></li>
                <li><a href="/cookies.html">Cookie Policy</a></li>
              </ul>
            </div>
          </div>
        </div>
        
        <div class="copyright">
          &copy; ${new Date().getFullYear()} TruthGuard. All rights reserved.
        </div>
      </footer>
    `;
    
    // Replace icons
    setTimeout(() => {
      if (feather) {
        feather.replace();
      }
    }, 100);
  }
}
customElements.define('custom-footer', CustomFooter);