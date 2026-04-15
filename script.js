/* ============================================
   DEE DAPOER - script.js
   ============================================ */

'use strict';

// ================================================
// 1. PRELOADER
// ================================================
window.addEventListener('load', () => {
    const preloader = document.getElementById('preloader');
    if (!preloader) return;
    setTimeout(() => {
        preloader.classList.add('hidden');
        document.body.style.overflow = '';
        // Trigger hero reveal on load
        triggerReveal();
    }, 1800);
    document.body.style.overflow = 'hidden';
});


// ================================================
// 2. CUSTOM CURSOR
// ================================================
const cursorDot  = document.getElementById('cursor-dot');
const cursorRing = document.getElementById('cursor-ring');

let mouseX = 0, mouseY = 0;
let ringX  = 0, ringY  = 0;

document.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
    if (cursorDot) {
        cursorDot.style.left  = mouseX + 'px';
        cursorDot.style.top   = mouseY + 'px';
    }
});

function animateRing() {
    if (cursorRing) {
        ringX += (mouseX - ringX) * 0.12;
        ringY += (mouseY - ringY) * 0.12;
        cursorRing.style.left = ringX + 'px';
        cursorRing.style.top  = ringY + 'px';
    }
    requestAnimationFrame(animateRing);
}
animateRing();

// Cursor scale on interactive elements
document.querySelectorAll('a, button, .menu-card, .filter-btn').forEach(el => {
    el.addEventListener('mouseenter', () => {
        if (cursorDot) cursorDot.style.transform = 'translate(-50%,-50%) scale(2.5)';
    });
    el.addEventListener('mouseleave', () => {
        if (cursorDot) cursorDot.style.transform = 'translate(-50%,-50%) scale(1)';
    });
});


// ================================================
// 3. HEADER – SCROLL BEHAVIOR & ACTIVE LINKS
// ================================================
const header = document.getElementById('main-header');

const handleHeaderScroll = () => {
    if (window.scrollY > 60) {
        header.classList.add('scrolled');
    } else {
        header.classList.remove('scrolled');
    }
};
window.addEventListener('scroll', handleHeaderScroll, { passive: true });
handleHeaderScroll();

// Active nav link on scroll
const sections = document.querySelectorAll('section[id], footer[id]');
const navLinks  = document.querySelectorAll('.nav-link');

const observerNav = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            const id = entry.target.id;
            navLinks.forEach(link => {
                link.classList.toggle('active', link.dataset.section === id);
            });
        }
    });
}, { threshold: 0.4 });

sections.forEach(sec => observerNav.observe(sec));


// ================================================
// 4. HAMBURGER MENU
// ================================================
const hamburgerBtn = document.getElementById('hamburger-btn');
const mobileNav    = document.getElementById('mobile-nav');

hamburgerBtn?.addEventListener('click', () => {
    const isOpen = mobileNav.classList.toggle('open');
    hamburgerBtn.classList.toggle('open', isOpen);
    document.body.style.overflow = isOpen ? 'hidden' : '';
});

// Close mobile nav on link click
document.querySelectorAll('.mobile-nav-link').forEach(link => {
    link.addEventListener('click', () => {
        mobileNav.classList.remove('open');
        hamburgerBtn?.classList.remove('open');
        document.body.style.overflow = '';
    });
});

// Close on outside click
document.addEventListener('click', (e) => {
    if (mobileNav?.classList.contains('open') &&
        !mobileNav.contains(e.target) &&
        !hamburgerBtn?.contains(e.target)) {
        mobileNav.classList.remove('open');
        hamburgerBtn?.classList.remove('open');
        document.body.style.overflow = '';
    }
});


// ================================================
// 5. SCROLL REVEAL ANIMATIONS
// ================================================
function triggerReveal() {
    const revealEls = document.querySelectorAll('.reveal-up, .reveal-right');
    const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry, i) => {
            if (entry.isIntersecting) {
                const el = entry.target;
                const siblings = [...el.parentElement.querySelectorAll('.reveal-up, .reveal-right')];
                const idx = siblings.indexOf(el);
                setTimeout(() => {
                    el.classList.add('revealed');
                }, idx * 80);
                revealObserver.unobserve(el);
            }
        });
    }, { threshold: 0.15 });
    revealEls.forEach(el => revealObserver.observe(el));
}
triggerReveal();


// ================================================
// 6. COUNTER ANIMATION (HERO STATS)
// ================================================
const counters = document.querySelectorAll('.stat-num');

const counterObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            animateCounter(entry.target);
            counterObserver.unobserve(entry.target);
        }
    });
}, { threshold: 0.8 });

counters.forEach(counter => counterObserver.observe(counter));

function animateCounter(el) {
    const target = parseInt(el.dataset.count, 10);
    const duration = 1500;
    const start = performance.now();

    function update(now) {
        const elapsed = now - start;
        const progress = Math.min(elapsed / duration, 1);
        // Ease out
        const eased = 1 - Math.pow(1 - progress, 3);
        el.textContent = Math.round(eased * target);
        if (progress < 1) requestAnimationFrame(update);
        else el.textContent = target;
    }
    requestAnimationFrame(update);
}


// ================================================
// 7. MENU FILTER
// ================================================
const filterBtns  = document.querySelectorAll('.filter-btn');
const menuCards   = document.querySelectorAll('.menu-card');

filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        // Active state
        filterBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        const filter = btn.dataset.filter;

        menuCards.forEach(card => {
            const category = card.dataset.category;
            const show = filter === 'all' || category === filter;

            if (show) {
                card.classList.remove('hidden');
                card.style.animation = 'fadeInCard 0.4s ease forwards';
            } else {
                card.classList.add('hidden');
            }
        });
    });
});

// Inject fade-in keyframe
const style = document.createElement('style');
style.textContent = `
    @keyframes fadeInCard {
        from { opacity: 0; transform: translateY(16px) scale(0.97); }
        to   { opacity: 1; transform: none; }
    }
`;
document.head.appendChild(style);


// ================================================
// 8. SHOPPING CART
// ================================================
let cart = [];

const cartSidebar  = document.getElementById('cart-sidebar');
const cartOverlay  = document.getElementById('cart-overlay');
const cartClose    = document.getElementById('cart-close');
const cartItems    = document.getElementById('cart-items');
const cartEmpty    = document.getElementById('cart-empty');
const cartFooter   = document.getElementById('cart-footer');
const cartTotal    = document.getElementById('cart-total-price');
const cartCount    = document.getElementById('cart-count');
const cartFloatBtn = document.getElementById('cart-float-btn');
const btnCheckout  = document.getElementById('btn-checkout');

// Open cart
function openCart() {
    cartSidebar?.classList.add('open');
    cartOverlay?.classList.add('active');
    document.body.style.overflow = 'hidden';
}

// Close cart
function closeCart() {
    cartSidebar?.classList.remove('open');
    cartOverlay?.classList.remove('active');
    document.body.style.overflow = '';
}

cartClose?.addEventListener('click', closeCart);
cartOverlay?.addEventListener('click', closeCart);
cartFloatBtn?.addEventListener('click', openCart);

// Add to cart
document.querySelectorAll('.btn-add-cart').forEach(btn => {
    btn.addEventListener('click', () => {
        const name  = btn.dataset.name;
        const price = parseInt(btn.dataset.price, 10);

        const existing = cart.find(i => i.name === name);
        if (existing) {
            existing.qty++;
        } else {
            cart.push({ name, price, qty: 1 });
        }

        updateCart();
        openCart();

        // Visual feedback
        btn.style.transform = 'rotate(135deg) scale(1.3)';
        btn.style.background = '#FFD700';
        btn.style.color = '#0A0A0A';
        setTimeout(() => {
            btn.style.transform = '';
            btn.style.background = '';
            btn.style.color = '';
        }, 500);
    });
});

// Update cart UI
function updateCart() {
    if (!cartItems) return;

    const totalItems = cart.reduce((sum, i) => sum + i.qty, 0);
    const totalPrice = cart.reduce((sum, i) => sum + i.price * i.qty, 0);

    // Count badge
    if (cartCount) cartCount.textContent = totalItems;
    if (cartFloatBtn) cartFloatBtn.style.display = totalItems > 0 ? 'block' : 'none';

    // Total
    if (cartTotal) cartTotal.textContent = 'Rp ' + totalPrice.toLocaleString('id-ID');

    // Empty state
    if (cart.length === 0) {
        if (cartEmpty) cartEmpty.style.display = 'block';
        if (cartFooter) cartFooter.style.display = 'none';
        cartItems.innerHTML = '';
        return;
    }

    if (cartEmpty) cartEmpty.style.display = 'none';
    if (cartFooter) cartFooter.style.display = 'block';

    // Render items
    cartItems.innerHTML = cart.map(item => `
        <div class="cart-item" data-name="${item.name}">
            <div class="cart-item-info">
                <div class="cart-item-name">${item.name}</div>
                <div class="cart-item-price">Rp ${(item.price * item.qty).toLocaleString('id-ID')}</div>
            </div>
            <div class="cart-item-controls">
                <button class="cart-qty-btn" data-action="decrease" data-name="${item.name}">−</button>
                <span class="cart-qty">${item.qty}</span>
                <button class="cart-qty-btn" data-action="increase" data-name="${item.name}">+</button>
            </div>
        </div>
    `).join('');

    // Qty button listeners
    cartItems.querySelectorAll('.cart-qty-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const name   = btn.dataset.name;
            const action = btn.dataset.action;
            const item   = cart.find(i => i.name === name);
            if (!item) return;

            if (action === 'increase') {
                item.qty++;
            } else {
                item.qty--;
                if (item.qty <= 0) cart = cart.filter(i => i.name !== name);
            }
            updateCart();
        });
    });
}

// Checkout via WhatsApp
btnCheckout?.addEventListener('click', (e) => {
    e.preventDefault();
    if (cart.length === 0) return;

    const total = cart.reduce((sum, i) => sum + i.price * i.qty, 0);
let msgBody = 'Halo DEE DAPOER! Saya ingin memesan:\n\n';

cart.forEach(item => {
    msgBody += `- ${item.name} x${item.qty} = Rp ${(item.price * item.qty).toLocaleString('id-ID')}\n`;
});

msgBody += `\nTotal: *Rp ${total.toLocaleString('id-ID')}*\n\nMohon dikonfirmasi. Terima kasih!`;

// Gunakan encodeURIComponent di sini juga
window.open(`https://wa.me/6281295539569?text=${encodeURIComponent(msgBody)}`, '_blank');
});


// ================================================
// 9. SMOOTH ANCHOR SCROLLING
// ================================================
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
        const href = this.getAttribute('href');
        if (href === '#') return;
        const target = document.querySelector(href);
        if (!target) return;
        e.preventDefault();
        const headerOffset = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--header-h'), 10) || 76;
        const top = target.getBoundingClientRect().top + window.scrollY - headerOffset;
        window.scrollTo({ top, behavior: 'smooth' });
    });
});


// ================================================
// 10. LAZY IMAGE LOAD (performance)
// ================================================
// Exclude logo images and preloader images from lazy load fade
const lazyImages = document.querySelectorAll('img[src]:not(.logo-icon):not(.logo-text-img):not(.pre-logo-imgs img)');
if ('IntersectionObserver' in window) {
    const imageObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                // If already loaded (cached), skip the fade effect
                if (img.complete && img.naturalWidth > 0) {
                    imageObserver.unobserve(img);
                    return;
                }
                img.style.opacity = '0';
                img.style.transition = 'opacity 0.5s ease';
                img.onload = () => {
                    img.style.opacity = '1';
                };
                // Fallback: if onload doesn't fire, show after short delay
                setTimeout(() => { img.style.opacity = '1'; }, 800);
                imageObserver.unobserve(img);
            }
        });
    }, { rootMargin: '200px' });
    lazyImages.forEach(img => imageObserver.observe(img));
}


// ================================================
// 11. TICKER PAUSE ON HOVER
// ================================================
const tickerTrack = document.querySelector('.ticker-track');
tickerTrack?.closest('.ticker-wrap')?.addEventListener('mouseenter', () => {
    tickerTrack.style.animationPlayState = 'paused';
});
tickerTrack?.closest('.ticker-wrap')?.addEventListener('mouseleave', () => {
    tickerTrack.style.animationPlayState = 'running';
});


// ================================================
// 12. BACK TO TOP (scroll progress in header)
// ================================================
const progressBar = document.createElement('div');
progressBar.style.cssText = `
    position: fixed; top: 0; left: 0; height: 3px;
    background: var(--yellow); z-index: 9999;
    width: 0%; transition: width 0.1s linear;
    pointer-events: none;
`;
document.body.appendChild(progressBar);

window.addEventListener('scroll', () => {
    const scrollTop = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const progress  = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
    progressBar.style.width = progress + '%';
}, { passive: true });


// ================================================
// 13. CARD TILT EFFECT (Desktop only)
// ================================================
if (window.innerWidth > 900) {
    document.querySelectorAll('.menu-card, .layanan-card, .testi-card').forEach(card => {
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left - rect.width  / 2;
            const y = e.clientY - rect.top  - rect.height / 2;
            const tiltX =  (y / rect.height) * 6;
            const tiltY = -(x / rect.width)  * 6;
            card.style.transform = `perspective(800px) rotateX(${tiltX}deg) rotateY(${tiltY}deg) translateY(-6px)`;
        });
        card.addEventListener('mouseleave', () => {
            card.style.transform = '';
        });
    });
}

console.log('%c🍱 DEE DAPOER', 'font-size:22px; font-weight:900; color:#FFD700; background:#0A0A0A; padding:8px 20px; border-radius:8px;');
console.log('%cWebsite loaded successfully!', 'color:#888; font-size:12px;');