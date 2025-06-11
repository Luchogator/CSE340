document.addEventListener('DOMContentLoaded', function() {
    const menuToggle = document.getElementById('menu-toggle');
    const primaryNav = document.getElementById('primary-nav');
    
    // Toggle mobile menu
    if (menuToggle && primaryNav) {
        menuToggle.addEventListener('click', function() {
            const isExpanded = this.getAttribute('aria-expanded') === 'true' || false;
            this.setAttribute('aria-expanded', !isExpanded);
            primaryNav.setAttribute('data-visible', !isExpanded);
            
            // Toggle body scroll when menu is open
            if (!isExpanded) {
                document.body.style.overflow = 'hidden';
            } else {
                document.body.style.overflow = '';
            }
        });
        
        // Close menu when clicking on a nav link
        const navLinks = primaryNav.querySelectorAll('a[role="menuitem"]');
        navLinks.forEach(link => {
            link.addEventListener('click', function() {
                menuToggle.setAttribute('aria-expanded', 'false');
                primaryNav.setAttribute('data-visible', 'false');
                document.body.style.overflow = '';
            });
        });
        
        // Close menu when clicking outside
        document.addEventListener('click', function(event) {
            if (!primaryNav.contains(event.target) && !menuToggle.contains(event.target)) {
                menuToggle.setAttribute('aria-expanded', 'false');
                primaryNav.setAttribute('data-visible', 'false');
                document.body.style.overflow = '';
            }
        });
        
        // Close menu on escape key
        document.addEventListener('keydown', function(event) {
            if (event.key === 'Escape') {
                menuToggle.setAttribute('aria-expanded', 'false');
                primaryNav.setAttribute('data-visible', 'false');
                document.body.style.overflow = '';
                menuToggle.focus();
            }
        });
    }
});
