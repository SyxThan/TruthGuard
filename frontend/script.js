

function toggleMobileMenu() {
    const menu = document.getElementById('mobile-menu');
    menu?.classList.toggle('active');
}

async function submitNewsForm(formData) {
    try {
       
        const response = await fetch('/api/submit-news', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });
        
        return await response.json();
    } catch (error) {
        console.error('Error submitting news:', error);
        throw error;
    }
}


document.addEventListener('DOMContentLoaded', () => {
    
    if (feather) {
        feather.replace();
    }
    
    
    const mobileMenuButton = document.getElementById('mobile-menu-button');
    if (mobileMenuButton) {
        mobileMenuButton.addEventListener('click', toggleMobileMenu);
    }
    
    
    document.querySelectorAll('.nav-link').forEach(link => {
        if (link.getAttribute('href') === window.location.pathname) {
            link.classList.add('active');
        }
    });
});

async function fetchNews() {
    try {
        const response = await fetch('/api/news');
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching news:', error);
        return [];
    }
}