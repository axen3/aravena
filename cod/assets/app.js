'use strict';

/* ================================================================
   CONFIG
   ================================================================ */
const CONFIG = {
    lang: 'ar',
    minFormTime: 3000,                // Anti-bot: minimum ms to fill form
    countdownKey: 'aravena_countdown',
    countdownDuration: 3 * 60 * 60 * 1000, // 3 hours
    reviewsPerPage: 4,
};

/* ================================================================
   SECURITY UTILITIES
   ================================================================ */
const Security = {
    sanitize(str) {
        if (typeof str !== 'string') return '';
        return str.replace(/<[^>]*>/g, '').replace(/javascript:/gi, '').replace(/on\w+=/gi, '').replace(/[<>]/g, '').trim().slice(0, 300);
    },
    validatePhone(phone) {
        const cleaned = phone.replace(/[\s\-().]/g, '');
        return /^0[5-7]\d{8}$/.test(cleaned) || /^\+212[5-7]\d{8}$/.test(cleaned);
    },
    validateName(name) {
        const cleaned = name.trim();
        if (cleaned.length < 3 || cleaned.length > 50) return false;
        return /^[\u0600-\u06FFa-zA-Z\s\-']+$/.test(cleaned);
    },
    validateAddress(addr) {
        const cleaned = addr.trim();
        return cleaned.length >= 10 && cleaned.length <= 300;
    },
    generateOrderId() {
        const ts = Date.now().toString(36).toUpperCase();
        const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
        return `ORD-${ts}${rand}`;
    },
    generateToken() {
        const arr = new Uint8Array(16);
        crypto.getRandomValues(arr);
        return Array.from(arr, b => b.toString(16).padStart(2, '0')).join('');
    }
};

/* ================================================================
   STATE
   ================================================================ */
const state = {
    product: null,
    reviews: [],
    reviewsShown: 0,
    selectedSize: null,
    selectedColor: null,
    selectedPromo: null,
    quantity: 1,
    formStartTime: Date.now(),
    cityChoices: null,
    lang: CONFIG.lang,
    translations: {},
};

/* ================================================================
   TOAST NOTIFICATIONS
   ================================================================ */
function showToast(message, type = 'info', duration = 3500) {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    const icons = { success: 'fa-circle-check', error: 'fa-circle-exclamation', info: 'fa-circle-info' };
    const icon = document.createElement('i');
    icon.className = `fa-solid ${icons[type] || icons.info}`;
    const text = document.createElement('span');
    text.textContent = message;
    toast.appendChild(icon);
    toast.appendChild(text);
    container.appendChild(toast);
    setTimeout(() => {
        toast.classList.add('fade-out');
        setTimeout(() => toast.remove(), 300);
    }, duration);
}

/* ================================================================
   DATA LOADING
   ================================================================ */
async function fetchJSON(url) {
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) throw new Error(`Failed to load ${url}: ${res.status}`);
    return res.json();
}

async function loadAllData() {
    const [dataRes, citiesRes, langsRes] = await Promise.all([
        fetchJSON('data/data.json'),
        fetchJSON('data/cities.json'),
        fetchJSON('data/langs.json'),
    ]);

    state.product = dataRes;
    state.translations = langsRes;
    
    // Cities is a flat array of strings
    state.cities = citiesRes; 

    // Generate mock reviews since data.json only provides count & rate
    const count = dataRes.reviews?.count || 5;
    const mockNames = ['أحمد م.', 'سارة ل.', 'يوسف ك.', 'فاطمة ز.', 'مريم ع.', 'خالد ب.', 'نورا د.'];
    state.reviews = Array.from({ length: Math.min(count, 10) }).map((_, i) => ({
        name: mockNames[i % mockNames.length],
        rating: 5,
        text: 'منتج ممتاز وجودة عالية، التوصيل كان سريع جداً. أنصح به بشدة!',
        date: '2024-0' + ((i % 9) + 1) + '-15',
        verified: true
    }));
}

/* ================================================================
   LANGUAGE
   ================================================================ */
function applyLanguage() {
    const lang = state.lang;
    const dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
    document.documentElement.dir = dir;

    const dict = state.translations[lang] || {};

    document.querySelectorAll('[data-key]').forEach(el => {
        const key = el.getAttribute('data-key');
        if (dict[key]) {
            // Use innerHTML only for copyright which might contain entities
            if (key === 'copyright') {
                el.innerHTML = dict[key];
            } else {
                el.textContent = dict[key];
            }
        }
    });
}

/* ================================================================
   RENDERING — PRODUCT
   ================================================================ */
function renderProduct() {
    const p = state.product;
    if (!p) return;

    // Name
    document.getElementById('product-name').textContent = p.productName || 'Product';
    document.getElementById('form-product-name').value = Security.sanitize(p.productName);

    // Price
    const currency = p.currency || 'درهم';
    const price = parseFloat(p.price) || 0;
    const oldPrice = parseFloat(p.originalPrice) || 0;

    document.getElementById('current-price').textContent = `${price} ${currency}`;
    document.getElementById('form-product-price').value = price;

    if (oldPrice && oldPrice > price) {
        document.getElementById('original-price').textContent = `${oldPrice} ${currency}`;
        const discount = Math.round(((oldPrice - price) / oldPrice) * 100);
        const badge = document.getElementById('discount-badge');
        badge.textContent = `-${discount}%`;
        badge.style.display = 'block';
    }

    // Gallery
    renderGallery(p.gallery || []);

    // Content images
    renderContentImages(p.contentImages || []);

    // Rating
    renderRating(p.reviews?.rate || 4.8, p.reviews?.count || 0);

    // Sizes
    if (p.sizes && p.sizes.length) {
        renderSizes(p.sizes);
        document.getElementById('size-group').style.display = '';
    }

    // Colors
    if (p.colors && p.colors.length) {
        renderColors(p.colors);
        document.getElementById('color-group').style.display = '';
    }

    // Promotions (Quantity Breaks)
    if (p.quantityBreaks && p.quantityBreaks.length) {
        renderPromotions(p.quantityBreaks);
    }

    // Remove skeleton
    document.getElementById('main-img-wrapper').classList.remove('placeholder');
}

function renderGallery(images) {
    if (!images.length) return;
    const main = document.getElementById('main-img');
    main.src = images[0];
    main.alt = 'Product image';

    const thumbsContainer = document.getElementById('thumbs-container');
    thumbsContainer.innerHTML = '';

    images.forEach((src, i) => {
        const thumb = document.createElement('div');
        thumb.className = 'thumb' + (i === 0 ? ' active' : '');
        const img = document.createElement('img');
        img.src = src;
        img.alt = `Thumbnail ${i + 1}`;
        img.loading = 'lazy';
        thumb.appendChild(img);
        thumb.addEventListener('click', () => {
            document.getElementById('main-img').src = src;
            document.querySelectorAll('.thumb').forEach(t => t.classList.remove('active'));
            thumb.classList.add('active');
        });
        thumbsContainer.appendChild(thumb);
    });
}

function renderContentImages(images) {
    const container = document.getElementById('content-images');
    container.innerHTML = '';
    images.forEach(src => {
        const img = document.createElement('img');
        img.src = src;
        img.loading = 'lazy';
        img.alt = 'Product details';
        container.appendChild(img);
    });
}

function renderRating(rating, count) {
    const container = document.getElementById('review-container');
    container.innerHTML = '';
    const full = Math.floor(rating);
    const half = rating % 1 >= 0.5;

    for (let i = 0; i < 5; i++) {
        const star = document.createElement('i');
        if (i < full) star.className = 'fa-solid fa-star star';
        else if (i === full && half) star.className = 'fa-solid fa-star-half-stroke star';
        else star.className = 'fa-regular fa-star star empty';
        container.appendChild(star);
    }

    const text = document.createElement('span');
    text.className = 'rating-text';
    text.textContent = `${rating} (${count})`;
    container.appendChild(text);
    document.getElementById('reviews-tab-count').textContent = count;
}

function renderSizes(sizes) {
    const container = document.getElementById('size-buttons');
    container.innerHTML = '';
    sizes.forEach(size => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'option-btn';
        btn.textContent = size;
        btn.addEventListener('click', () => {
            container.querySelectorAll('.option-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            state.selectedSize = size;
            document.getElementById('form-size').value = size;
            document.getElementById('summary-size').textContent = size;
            document.getElementById('summary-size-row').style.display = '';
        });
        container.appendChild(btn);
    });
}

function renderColors(colors) {
    const container = document.getElementById('color-buttons');
    container.innerHTML = '';
    
    // colors format: [{ "أسود": "#000000" }]
    colors.forEach(colorObj => {
        const name = Object.keys(colorObj)[0];
        const hex = colorObj[name];
        
        const swatch = document.createElement('div');
        swatch.className = 'color-swatch';
        swatch.style.background = hex;
        swatch.title = name;
        swatch.setAttribute('role', 'button');
        swatch.setAttribute('tabindex', '0');
        swatch.setAttribute('aria-label', name);

        swatch.addEventListener('click', () => {
            container.querySelectorAll('.color-swatch').forEach(s => s.classList.remove('active'));
            swatch.classList.add('active');
            state.selectedColor = name;
            document.getElementById('form-color').value = name;
            document.getElementById('selected-color-name').textContent = name;
            document.getElementById('summary-color').textContent = name;
            document.getElementById('summary-color-row').style.display = '';
        });
        container.appendChild(swatch);
    });
}

function renderPromotions(breaks) {
    const container = document.getElementById('promo-buttons');
    container.innerHTML = '';

    breaks.forEach((promo, i) => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'option-btn';

        const label = document.createElement('span');
        label.textContent = promo.label;
        btn.appendChild(label);

        if (promo.badge) {
            const badge = document.createElement('span');
            badge.className = 'promo-badge';
            badge.textContent = promo.badge;
            btn.appendChild(badge);
        }

        btn.addEventListener('click', () => {
            container.querySelectorAll('.option-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            state.selectedPromo = promo;
            state.quantity = promo.quantity;
            document.getElementById('quantity').value = promo.quantity;
            document.getElementById('form-quantity').value = promo.quantity;
            document.getElementById('summary-qty').textContent = promo.quantity;
            updateSummary();
        });

        if (i === 0) setTimeout(() => btn.click(), 100); // Auto-select first
        container.appendChild(btn);
    });
}

/* ================================================================
   RENDERING — REVIEWS
   ================================================================ */
function renderReviews() {
    const container = document.getElementById('reviewsContainer');
    container.innerHTML = '';
    const toShow = state.reviews.slice(0, state.reviewsShown);
    toShow.forEach(review => container.appendChild(createReviewCard(review)));

    const loadMoreBtn = document.getElementById('loadMoreBtn');
    loadMoreBtn.style.display = state.reviewsShown >= state.reviews.length ? 'none' : '';
}

function createReviewCard(review) {
    const card = document.createElement('div');
    card.className = 'review-card';
    const initial = (review.name || '?').charAt(0).toUpperCase();
    card.innerHTML = `
        <div class="review-header">
            <div class="review-avatar">${Security.sanitize(initial)}</div>
            <div class="review-info">
                <div class="review-name">
                    ${Security.sanitize(review.name || 'Anonymous')}
                    ${review.verified ? '<span class="verified-badge"><i class="fa-solid fa-check"></i> موثّق</span>' : ''}
                </div>
                <div class="review-date">${Security.sanitize(review.date || '')}</div>
            </div>
        </div>
        <div class="review-stars">${'★'.repeat(review.rating || 5)}${'☆'.repeat(5 - (review.rating || 5))}</div>
        <div class="review-text"></div>
    `;
    card.querySelector('.review-text').textContent = review.text || '';
    return card;
}

/* ================================================================
   SUMMARY UPDATE
   ================================================================ */
function updateSummary() {
    const p = state.product;
    if (!p) return;
    const currency = p.currency || 'درهم';
    let total = 0;

    if (state.selectedPromo) {
        total = state.selectedPromo.pricePerItem * state.selectedPromo.quantity;
    } else {
        total = (parseFloat(p.price) || 0) * state.quantity;
    }

    document.getElementById('summary-total').textContent = `${total} ${currency}`;
    document.getElementById('form-total-amount').value = total;
    document.getElementById('summary-product').textContent = p.productName || 'Product';
    document.getElementById('summary-qty').textContent = state.quantity;
    document.getElementById('form-quantity').value = state.quantity;
}

/* ================================================================
   QUANTITY, COUNTDOWN, SCARCITY, TABS
   ================================================================ */
function initQuantity() {
    const input = document.getElementById('quantity');
    document.getElementById('qty-minus').addEventListener('click', () => {
        if (state.quantity > 1) { state.quantity--; input.value = state.quantity; updateSummary(); }
    });
    document.getElementById('qty-plus').addEventListener('click', () => {
        if (state.quantity < 99) { state.quantity++; input.value = state.quantity; updateSummary(); }
    });
}

function initCountdown() {
    const timerEl = document.getElementById('timer');
    let endTime = parseInt(localStorage.getItem(CONFIG.countdownKey) || '0', 10);
    if (!endTime || endTime < Date.now()) {
        endTime = Date.now() + CONFIG.countdownDuration;
        localStorage.setItem(CONFIG.countdownKey, endTime.toString());
    }
    function tick() {
        const remaining = endTime - Date.now();
        if (remaining <= 0) { endTime = Date.now() + CONFIG.countdownDuration; localStorage.setItem(CONFIG.countdownKey, endTime.toString()); return; }
        const h = Math.floor(remaining / 3600000);
        const m = Math.floor((remaining % 3600000) / 60000);
        const s = Math.floor((remaining % 60000) / 1000);
        timerEl.textContent = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    }
    tick(); setInterval(tick, 1000);
}

function initScarcity() {
    const viewersEl = document.getElementById('viewers');
    const stockEl = document.getElementById('stock');
    let viewers = 30 + Math.floor(Math.random() * 25);
    viewersEl.textContent = viewers;
    setInterval(() => {
        const delta = Math.floor(Math.random() * 7) - 3;
        viewers = Math.max(20, Math.min(60, viewers + delta));
        viewersEl.textContent = viewers;
        viewersEl.classList.add('flash'); setTimeout(() => viewersEl.classList.remove('flash'), 400);
    }, 8000);
    let stock = 6;
    setInterval(() => {
        if (stock > 2 && Math.random() < 0.3) { stock--; stockEl.textContent = stock; stockEl.classList.add('flash'); setTimeout(() => stockEl.classList.remove('flash'), 400); }
    }, 15000);
}

function initTabs() {
    const tabs = document.querySelectorAll('.tab-btn');
    const contents = document.querySelectorAll('.tab-content');
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const target = tab.dataset.tab;
            tabs.forEach(t => t.classList.remove('active'));
            contents.forEach(c => c.classList.remove('active'));
            tab.classList.add('active');
            document.getElementById(target).classList.add('active');
        });
    });
}

function initLoadMore() {
    document.getElementById('loadMoreBtn').addEventListener('click', (e) => {
        const btn = e.currentTarget;
        btn.classList.add('loading');
        setTimeout(() => { state.reviewsShown += CONFIG.reviewsPerPage; renderReviews(); btn.classList.remove('loading'); }, 600);
    });
}

function initCities() {
    const select = document.getElementById('city');
    state.cities.forEach(city => {
        const opt = document.createElement('option');
        opt.value = city; opt.textContent = city;
        select.appendChild(opt);
    });
    state.cityChoices = new Choices(select, {
        searchEnabled: true, searchPlaceholderValue: 'ابحث عن مدينتك...', itemSelectText: '', noResultsText: 'لا توجد نتائج', shouldSort: false
    });
}

function initTicker() {
    const track = document.getElementById('ticker-track');
    const messages = state.product.topBarText || ['توصيل مجاني', 'الدفع عند الاستلام'];
    const all = [...messages, ...messages];
    all.forEach(msg => { const span = document.createElement('span'); span.textContent = msg; track.appendChild(span); });
}

/* ================================================================
   FORM VALIDATION & SUBMISSION (Secure)
   ================================================================ */
function validateField(field) {
    const group = field.closest('.form-group');
    const errorEl = group.querySelector('.error-message');
    const t = state.translations[state.lang] || {};
    let valid = true, errorMsg = '';
    const value = field.value.trim();

    if (field.id === 'fullname') {
        if (!value) { valid = false; errorMsg = t.required_name || 'الاسم مطلوب'; }
        else if (!Security.validateName(value)) { valid = false; errorMsg = t.name_regx || 'الاسم غير صحيح'; }
    }
    if (field.id === 'phone') {
        if (!value) { valid = false; errorMsg = t.required_phone || 'الهاتف مطلوب'; }
        else if (!Security.validatePhone(value)) { valid = false; errorMsg = t.phone_regx || 'الهاتف غير صحيح'; }
    }
    if (field.id === 'city') { if (!value) { valid = false; errorMsg = 'يرجى اختيار المدينة'; } }
    if (field.id === 'address') {
        if (!value) { valid = false; errorMsg = t.required_address || 'العنوان مطلوب'; }
        else if (!Security.validateAddress(value)) { valid = false; errorMsg = t.address_regx || 'العنوان غير صحيح'; }
    }

    group.classList.remove('valid', 'invalid');
    group.classList.add(valid ? 'valid' : 'invalid');
    errorEl.textContent = errorMsg;
    return valid;
}

function initFormValidation() {
    ['fullname', 'phone', 'city', 'address'].forEach(id => {
        const el = document.getElementById(id);
        el.addEventListener('blur', () => validateField(el));
        el.addEventListener('input', () => {
            const group = el.closest('.form-group');
            if (group.classList.contains('invalid')) validateField(el);
        });
    });
}

function initFormSubmission() {
    const form = document.getElementById('cod-form');
    const btn = document.getElementById('submit-btn');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        // 1. Honeypot
        const honeypot = form.querySelector('input[name="website"]');
        if (honeypot && honeypot.value.trim() !== '') {
            showToast('تم إرسال طلبك بنجاح!', 'success');
            setTimeout(() => window.location.href = 'thankyou.html', 1500);
            return;
        }

        // 2. Time-trap
        if (Date.now() - state.formStartTime < CONFIG.minFormTime) {
            showToast('يرجى إكمال النموذج ببطء والمحاولة مرة أخرى.', 'error');
            return;
        }

        // 3. Validate
        let allValid = true;
        ['fullname', 'phone', 'city', 'address'].forEach(id => {
            if (!validateField(document.getElementById(id))) allValid = false;
        });
        if (!allValid) {
            showToast('يرجى تصحيح الأخطاء في النموذج.', 'error');
            const firstInvalid = document.querySelector('.form-group.invalid');
            if (firstInvalid) firstInvalid.scrollIntoView({ behavior: 'smooth', block: 'center' });
            return;
        }

        // 4. Prepare Data
        const orderData = {
            orderId: Security.generateOrderId(),
            token: Security.generateToken(),
            product: Security.sanitize(document.getElementById('form-product-name').value),
            price: parseFloat(document.getElementById('form-product-price').value) || 0,
            currency: state.product?.currency || 'درهم',
            size: Security.sanitize(document.getElementById('form-size').value),
            color: Security.sanitize(document.getElementById('form-color').value),
            quantity: parseInt(document.getElementById('form-quantity').value) || 1,
            total: parseFloat(document.getElementById('form-total-amount').value) || 0,
            fullname: Security.sanitize(document.getElementById('fullname').value),
            phone: Security.sanitize(document.getElementById('phone').value),
            city: Security.sanitize(document.getElementById('city').value),
            address: Security.sanitize(document.getElementById('address').value),
            timestamp: Date.now(),
        };

        try {
            sessionStorage.setItem('orderData', JSON.stringify(orderData));
        } catch (err) {
            showToast('خطأ في حفظ البيانات. حاول مرة أخرى.', 'error');
            return;
        }

        // 5. Submit
        btn.classList.add('loading');
        btn.disabled = true;

        try {
            const webhookUrl = state.product.webhook;
            if (webhookUrl) {
                // Send to Google Apps Script (no-cors mode to avoid CORS preflight issues)
                await fetch(webhookUrl, {
                    method: 'POST',
                    mode: 'no-cors',
                    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
                    body: JSON.stringify(orderData),
                });
            } else {
                await new Promise(r => setTimeout(r, 800));
            }
            // Redirect
            window.location.href = 'thankyou.html';
        } catch (err) {
            btn.classList.remove('loading');
            btn.disabled = false;
            showToast('حدث خطأ أثناء إرسال الطلب. حاول مرة أخرى.', 'error');
        }
    });
}

/* ================================================================
   STICKY BAR & REVEAL
   ================================================================ */
function initStickyBar() {
    const bar = document.getElementById('sticky-bar');
    const orderSection = document.getElementById('order-section');
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) bar.classList.remove('visible');
            else if (window.scrollY > 400) bar.classList.add('visible');
        });
    }, { threshold: 0.1 });
    observer.observe(orderSection);

    const waLink = document.getElementById('whatsapp-link');
    const waNumber = (state.product.whatsappNumber || '').replace(/\D/g, '');
    const waMsg = encodeURIComponent(state.product.whatsappMsg || 'مرحباً، أريد الاستفسار عن المنتج');
    waLink.href = `https://wa.me/${waNumber}?text=${waMsg}`;

    document.getElementById('buy-now-btn').addEventListener('click', (e) => {
        e.preventDefault();
        orderSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
}

function initScrollReveal() {
    const elements = document.querySelectorAll('.option-group, .order-summary, .scarcity-item, .tabs-container');
    elements.forEach(el => {
        el.style.opacity = '0'; el.style.transform = 'translateY(20px)'; el.style.transition = 'opacity .5s, transform .5s';
    });
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) { entry.target.style.opacity = '1'; entry.target.style.transform = 'translateY(0)'; }
        });
    }, { threshold: 0.1 });
    elements.forEach(el => observer.observe(el));
}

/* ================================================================
   INIT
   ================================================================ */
async function init() {
    try {
        await loadAllData();
        applyLanguage();
        renderProduct();
        initCities();
        initTicker();
        state.reviewsShown = CONFIG.reviewsPerPage;
        renderReviews();
        updateSummary();
        initQuantity();
        initCountdown();
        initScarcity();
        initTabs();
        initLoadMore();
        initFormValidation();
        initFormSubmission();
        initStickyBar();
        initScrollReveal();
    } catch (err) {
        console.error('Init error:', err);
        showToast('حدث خطأ أثناء تحميل الصفحة. يرجى التحديث.', 'error', 5000);
    }
}

document.addEventListener('DOMContentLoaded', init);
