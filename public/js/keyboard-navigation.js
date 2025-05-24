/**
 * Keyboard Navigation for Accessible Menu
 * This script enhances keyboard navigation for the main menu
 */
document.addEventListener('DOMContentLoaded', function() {
    // Get all menu items
    const menu = document.querySelector('nav[aria-label="Main navigation"]');
    if (!menu) return;

    const menuItems = Array.from(menu.querySelectorAll('[role="menuitem"]'));
    if (menuItems.length === 0) return;

    // Set tabindex for better keyboard navigation
    menuItems.forEach((item, index) => {
        item.setAttribute('tabindex', '-1');
        if (index === 0) {
            item.setAttribute('tabindex', '0');
        }
    });

    // Handle keyboard navigation
    menu.addEventListener('keydown', function(e) {
        const currentItem = e.target.closest('[role="menuitem"]');
        if (!currentItem) return;

        const currentIndex = menuItems.indexOf(currentItem);
        if (currentIndex === -1) return;

        let nextItem = null;

        switch (e.key) {
            case 'ArrowRight':
            case 'ArrowDown':
                e.preventDefault();
                nextItem = menuItems[(currentIndex + 1) % menuItems.length];
                break;
            case 'ArrowLeft':
            case 'ArrowUp':
                e.preventDefault();
                nextItem = menuItems[(currentIndex - 1 + menuItems.length) % menuItems.length];
                break;
            case 'Home':
                e.preventDefault();
                nextItem = menuItems[0];
                break;
            case 'End':
                e.preventDefault();
                nextItem = menuItems[menuItems.length - 1];
                break;
            case ' ':
            case 'Enter':
                e.preventDefault();
                currentItem.click();
                break;
        }

        if (nextItem) {
            currentItem.setAttribute('tabindex', '-1');
            nextItem.setAttribute('tabindex', '0');
            nextItem.focus();
        }
    });

    // Handle focus management for mouse users
    menuItems.forEach(item => {
        item.addEventListener('focus', function() {
            menuItems.forEach(i => i.setAttribute('tabindex', '-1'));
            this.setAttribute('tabindex', '0');
        });
    });
});

/**
 * Smooth scrolling for anchor links
 */
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
        const targetId = this.getAttribute('href');
        if (targetId === '#') return;
        
        const targetElement = document.querySelector(targetId);
        if (targetElement) {
            e.preventDefault();
            targetElement.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
            
            // Update URL without scrolling
            history.pushState(null, null, targetId);
        }
    });
});
