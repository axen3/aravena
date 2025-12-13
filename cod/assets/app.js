function initMessages(data) {
    const messages = data.topBarText || [];
    const banner = document.getElementById('top-banner');
    const messageHeight = 36;
    let index = 0;
    let intervalId;

    // Clear banner
    banner.innerHTML = '';

    // Create ticker container
    const ticker = document.createElement('div');
    ticker.className = 'ticker';
    banner.appendChild(ticker);

    // Add messages
    messages.forEach(msg => {
        const div = document.createElement('div');
        div.className = 'message';
        div.innerHTML = msg;
        ticker.appendChild(div);
    });

    // Clone first message for seamless loop
    if (messages.length > 0) {
        ticker.appendChild(ticker.firstElementChild.cloneNode(true));
    }

    function slideNext() {
        index++;
        ticker.style.transition = 'transform 0.5s cubic-bezier(0.25, 1, 0.5, 1)';
        ticker.style.transform = `translateY(-${messageHeight * index}px)`;

        if (index >= messages.length) {
            setTimeout(() => {
                ticker.style.transition = 'none';
                index = 0;
                ticker.style.transform = `translateY(0)`;
            }, 500);
        }
    }

    intervalId = setInterval(slideNext, 3000);
}
// languages
let translations = {};

async function loadTranslations() {
    const response = await fetch("data/langs.json");
    translations = await response.json();   // step 1: load JSON

    applyLanguage();  // step 2: update all text AFTER JSON is ready
}

function applyLanguage() {
    const lang = document.documentElement.lang;  // "en" or "ar"
    const dir = lang === "ar" ? "rtl" : "ltr";
    document.documentElement.dir = dir;

    document.querySelectorAll("[data-key]").forEach(el => {
        const key = el.getAttribute("data-key");
        el.textContent = translations[lang][key] || key;
    });
}
// countdown
let time = 3 * 60 * 60; // 3 hours in seconds
const timer = document.getElementById("timer");

setInterval(() => {
  let hrs = Math.floor(time / 3600);
  let mins = Math.floor((time % 3600) / 60);
  let secs = time % 60;

  timer.innerText = 
    `${hrs < 10 ? "0" + hrs : hrs}:` +
    `${mins < 10 ? "0" + mins : mins}:` +
    `${secs < 10 ? "0" + secs : secs}`;

  if (time > 0) time--;
}, 1000);
// Fake live viewers
setInterval(() => {
  document.getElementById("viewers").innerText =
    Math.floor(25 + Math.random() * 15);
}, 3000);

// Fake decreasing stock (stops at 3)
let stock = 6;
setInterval(() => {
  if (stock > 3) {
    stock--;
    document.getElementById("stock").innerText = stock;
  }
}, 15000);
// Function to load cities and initialize searchable select
async function loadCities() {
  const select = document.getElementById('city'); // specific select

  try {
    const resp = await fetch('data/cities.json');
    if (!resp.ok) throw new Error("Failed to load cities.json");

    const cities = await resp.json();

    // Populate <select>
    cities.forEach(name => {
      const opt = document.createElement('option');
      opt.value = name;
      opt.textContent = name;
      select.appendChild(opt);
    });

    // Initialize Choices.js
    const choices = new Choices(select, {
      searchEnabled: true,
      placeholderValue: 'Select a city',
      searchPlaceholderValue: 'ابحث عن مدينة...',
      shouldSort: false,
      itemSelectText: '',
    });

    // Get the check icon inside the same form-group
    const checkIcon = select.closest('.form-group').querySelector('.check-icon');

    // Toggle check icon when selection changes
    select.addEventListener('change', () => {
      if (choices.getValue(true)) {
        checkIcon.style.opacity = '1';
      } else {
        checkIcon.style.opacity = '0';
      }
    });

  } catch (err) {
    console.error(err);
  }
}

const state = {
    productName: '',
    unitPrice: 0,
    originalPrice: 0,
    currency: '',
    rate: '',
    count: '',
    promotions: [],
    size: '',
    color: '',
    quantity: 1,
    selectedPromoId: 'single',
    selectedPromoPrice: 0,
    selectedPromoQty: 1,
    whatsappNumber: '',
    whatsappMsg: ''
};

function calculateTotal() {
    if (state.selectedPromoId === 'single') {
        return {
            total: (state.unitPrice * state.quantity).toFixed(2),
            quantity: state.quantity
        };
    } else {
        return {
            total: state.selectedPromoPrice.toFixed(2),
            quantity: state.selectedPromoQty
        };
    }
}
let globalPrice = 0;
function updateUI() {
    const result = calculateTotal();
    globalPrice = result.total;
    // Price: value before currency
    document.getElementById('current-price').textContent =
        `${result.total} ${state.currency}`;

    if (state.originalPrice > state.unitPrice) {
        const discount = Math.round((1 - state.unitPrice / state.originalPrice) * 100);
        document.getElementById('original-price').textContent =
            `${state.originalPrice.toFixed(2)} ${state.currency}`;
        document.getElementById('discount-badge').textContent = `-${discount}%`;
        document.getElementById('discount-badge').style.display = 'inline-block';
    }

    document.getElementById('summary-product').textContent = state.productName;
    document.getElementById('summary-size').textContent = state.size || 'N/A';
    document.getElementById('summary-color').textContent = state.color || 'N/A';
    document.getElementById('summary-qty').textContent = result.quantity;
    document.getElementById('summary-total').textContent =
        `${result.total} ${state.currency}`;

    document.getElementById('form-product-name').value = state.productName;
    document.getElementById('form-product-price').value = state.unitPrice.toFixed(2);
    document.getElementById('form-size').value = state.size;
    document.getElementById('form-color').value = state.color;
    document.getElementById('form-quantity').value = result.quantity;
    document.getElementById('form-total-amount').value = `${result.total} ${state.currency}`;
const waMsg =
    `${state.whatsappMsg}\n *${state.productName}*\n• Color: *${state.color}*\n• Size: *${state.size}*\n• Qty: *${result.quantity}*\n
    ----------------------\n
    Total: *${result.total} Dhs*`;
    document.getElementById('whatsapp-link').href =
        `https://wa.me/${state.whatsappNumber}?text=${encodeURIComponent(waMsg)}`;
}

function selectPromo(id, price, qty) {
    state.selectedPromoId = id;
    state.selectedPromoPrice = price;
    state.selectedPromoQty = qty;

    document.querySelectorAll('.promo-card').forEach(b => b.classList.remove('selected'));
    document.querySelector(`[data-id="${id}"]`).classList.add('selected');

    const qtySection = document.getElementById('quantity-section');

    if (state.promotions.length === 0) {
        // No bundle promotions → always show quantity picker
        qtySection.style.display = 'flex';
        document.getElementById('quantity').value = state.quantity;
    } else {
        // Promotions exist → single = picker, bundle = hide picker
        if (id === 'single') {
            qtySection.style.display = 'flex';
            document.getElementById('quantity').value = state.quantity;
        } else {
            qtySection.style.display = 'none';
            state.quantity = qty;
        }
    }

    updateUI();
}

function initProduct(data) {
  //initMessages(data);
    state.productName = data.productName;
    state.unitPrice = parseFloat(data.price);
    state.originalPrice = data.originalPrice ? parseFloat(data.originalPrice) : state.unitPrice;
    state.rate = data.reviews.rate || 0;
    state.count = data.reviews.count || 0;
    state.currency = data.currency;
    state.whatsappNumber = data.whatsappNumber || '+21206';
    state.whatsappMsg = data.whatsappMsg || '';

    state.promotions = Array.isArray(data.promotions)
        ? data.promotions.map((p, i) => ({
            ...p,
            id: `promo_${i}`,
            price: parseFloat(p.price)
        }))
        : [];

    state.selectedPromoPrice = state.unitPrice;
    state.selectedPromoQty = 1;
    document.getElementById('product-name').textContent = data.productName;

// add reviews
const reviewContainer = document.getElementById('review-container');

    // Create star elements
    let starsHTML = '';
    for (let i = 1; i <= 5; i++) {
        if (state.rate >= i) {
            starsHTML += '<i class="fas fa-star"></i>'; // Full star
        } else if (state.rate >= i - 0.5) {
            starsHTML += '<i class="fas fa-star-half-alt"></i>'; // Half star
        } else {
            starsHTML += '<i class="far fa-star"></i>'; // Empty star
        }
    }

    // Add star rating and count
    reviewContainer.innerHTML = starsHTML + `<span class="review-count">(${state.count})</span>`;
/* ============================================================
   UNIVERSAL PLACEHOLDER FOR ALL IMAGES ON THE PAGE
   ============================================================ */
function applyImagePlaceholders() {
    const images = document.querySelectorAll('img');

    images.forEach(img => {
        if (img.dataset.placeholderApplied) return;

        img.dataset.placeholderApplied = "true";
        img.classList.add("placeholder");

        img.addEventListener("load", () => {
            img.classList.remove("placeholder");
            img.classList.add("loaded");
        });

        img.addEventListener("error", () => {
            img.classList.add("placeholder");
        });
    });
}

// Apply on load
applyImagePlaceholders();

// Apply to any new images added later
const observer = new MutationObserver(applyImagePlaceholders);
observer.observe(document.body, { childList: true, subtree: true });



// ====== GALLERY ==============
const mainImg = document.getElementById('main-img');
const wrapper = document.getElementById('main-img-wrapper'); // Get the wrapper
const thumbsContainer = document.getElementById('thumbs-container');

// Helper function to safely switch images with shimmer
function setMainImage(url) {
    // 1. Reset state: Show shimmer, hide image
    wrapper.classList.add('placeholder');
    mainImg.classList.remove('loaded');

    // 2. Set new source
    mainImg.src = url;

    // 3. Listen for load event
    // Note: If image is cached, this fires almost instantly
    mainImg.onload = () => {
        wrapper.classList.remove('placeholder'); // Stop shimmer
        mainImg.classList.add('loaded'); // Fade in image
    };

    // Handle error case (optional but recommended)
    mainImg.onerror = () => {
        wrapper.classList.remove('placeholder');
        // You could set a placeholder error image here
    };
}

if (data.gallery?.length) {
    thumbsContainer.innerHTML = "";

    // 1. Load the first image using our helper
    setMainImage(data.gallery[0]);

    // 2. Build Thumbnails
    data.gallery.forEach((src, i) => {
        const thumb = document.createElement("img");
        thumb.src = src;
        thumb.className = "thumb";
        if (i === 0) thumb.classList.add("active");

        thumb.addEventListener("click", () => {
            if (mainImg.src.includes(src)) return; // Prevent clicking same image

            // Update active state visuals
            Array.from(thumbsContainer.children).forEach(t => t.classList.remove("active"));
            thumb.classList.add("active");

            // Load the new image with shimmer effect
            setMainImage(src);
        });

        thumbsContainer.appendChild(thumb);
    });
}

    // Sizes
    if (data.sizes && data.sizes.length > 0) {
        document.getElementById('size-group').style.display = 'block';
        state.size = data.sizes[0];
        const container = document.getElementById('size-buttons');
        container.innerHTML = '';
        data.sizes.forEach((size, i) => {
            const btn = document.createElement('div');
            btn.textContent = size;
            btn.classList.add('option-btn');
            if (i === 0) btn.classList.add('selected');
            btn.addEventListener('click', () => {
                container.querySelectorAll('.option-btn').forEach(b => b.classList.remove('selected'));
                btn.classList.add('selected');
                state.size = size;
                updateUI();
            });
            container.appendChild(btn);
        });
    }

    // Colors
    if (data.colors && data.colors.length > 0) {
        document.getElementById('color-group').style.display = 'block';

        // Helper to extract key/value from the specific JSON format: {"Red": "#FF0000"}
        const getFirstColorData = (colorObj) => {
            const name = Object.keys(colorObj)[0];
            return { name: name, hex: colorObj[name] };
        };

        // Set initial state
        const firstColor = getFirstColorData(data.colors[0]);
        state.color = firstColor.name;
        document.getElementById('selected-color-name').textContent = `${firstColor.name}`;

        const container = document.getElementById('color-buttons');
        container.innerHTML = '';

        data.colors.forEach((colorObj, i) => {
            const { name, hex } = getFirstColorData(colorObj);

            const btn = document.createElement('div');
            btn.classList.add('color-btn'); // Use the new CSS class
            btn.style.backgroundColor = hex; // Apply Hex code
            btn.title = name; // Tooltip on hover

            if (i === 0) btn.classList.add('selected');

            btn.addEventListener('click', () => {
                container.querySelectorAll('.color-btn').forEach(b => b.classList.remove('selected'));
                btn.classList.add('selected');

                // Update State
                state.color = name;

                // Update the text label next to "Color"
                document.getElementById('selected-color-name').textContent = `${name}`;

                updateUI();
            });
            container.appendChild(btn);
        });
    }

    // Promotions
    const promoContainer = document.getElementById('promo-buttons');
    promoContainer.innerHTML = '';
    // calculate promotion percentage
function getPromotionPercentage(unitPrice, promo) {
  const normalTotal = unitPrice * promo.quantity;

  // Guard against invalid data
  if (normalTotal <= 0 || promo.price >= normalTotal) {
    return 0;
  }

  const discountPercent =
    ((normalTotal - promo.price) / normalTotal) * 100;

  return Math.round(discountPercent);
}
    // Always add single unit
    const singleBtn = document.createElement('div');
    singleBtn.classList.add('promo-card');
    singleBtn.setAttribute('data-id', 'single');
    singleBtn.innerHTML = `
        <div class="promo-label" data-key="single_unit">Single Unit</div>
        <div class="promo-price">${state.unitPrice.toFixed(2)} ${state.currency}</div>
        <div class="promo-desc" data-key="per_item">Per item</div>
    `;
    singleBtn.addEventListener('click', () => selectPromo('single', state.unitPrice, 1));
    promoContainer.appendChild(singleBtn);

    if (state.promotions.length > 0) {
        // Show bundle options
        state.promotions.forEach(promo => {
            const unitCost = (promo.price / promo.quantity).toFixed(2);
            const btn = document.createElement('div');
            btn.classList.add('promo-card');
            const promoPercent = getPromotionPercentage(state.unitPrice, promo);
  
            btn.setAttribute('data-id', promo.id);
            btn.innerHTML = `
                <div class="promo-label">${promo.label}</div>
                <div class="promo-price">${promo.price.toFixed(2)} ${state.currency}</div>
                <div class="promo-desc">${unitCost} ${state.currency}<span data-key="item"></span></div>
                <div class="promo-percent">${promoPercent > 0 ? `-${promoPercent}%` : ''}</div>
            `;
            btn.addEventListener('click', () => selectPromo(promo.id, promo.price, promo.quantity));
            promoContainer.appendChild(btn);
        });

        // Default select first promo
        const firstPromoId = promoContainer.querySelector('.promo-card').getAttribute('data-id');
        selectPromo(firstPromoId,
            firstPromoId === 'single' ? state.unitPrice : state.promotions[0].price,
            firstPromoId === 'single' ? 1 : state.promotions[0].quantity
        );

        document.getElementById('promo-group').style.display = 'block';
    } else {
        // No promotions → hide promo section, show quantity picker
        document.getElementById('promo-group').style.display = 'none';
        document.getElementById('quantity-section').style.display = 'flex';
    }

    // Cities
 /*   const citySelect = document.getElementById('city');
    citySelect.innerHTML = '<option value="" disabled selected data-key="select_city">Select your city</option>';
    MOROCCAN_CITIES.forEach(city => {
        const option = document.createElement('option');
        option.value = city;
        option.textContent = city;
        citySelect.appendChild(option);
    });*/

    // Content images
    const contentContainer = document.getElementById('content-images');
    contentContainer.innerHTML = '';
    if (data.contentImages && data.contentImages.length > 0) {
        data.contentImages.forEach(src => {
            const img = document.createElement('img');
            img.src = src;
            contentContainer.appendChild(img);
        });
    }

    updateUI();
}

// Quantity controls
document.getElementById('qty-minus').addEventListener('click', () => {
    if (state.selectedPromoId === 'single' && state.quantity > 1) {
        state.quantity--;
        document.getElementById('quantity').value = state.quantity;
        updateUI();
    }
});

document.getElementById('qty-plus').addEventListener('click', () => {
    if (state.selectedPromoId === 'single') {
        state.quantity++;
        document.getElementById('quantity').value = state.quantity;
        updateUI();
    }
});

// Scroll to order form
document.getElementById('buy-now-btn').addEventListener('click', (e) => {
    e.preventDefault();
    document.querySelector('.order-section').scrollIntoView({ behavior: 'smooth' });
});

document.getElementById('cod-form').addEventListener('submit', (e) => {
    // Keep this line for UI updates, but the main submission logic is below
    updateUI();
});
let webhook;
// Load JSON
fetch('data/data.json')
    .then(response => {
        if (!response.ok) throw new Error('Failed to load data');
        return response.json();
    })
    .then(data => {
      initMessages(data);
      initProduct(data);
      loadTranslations();
      webhook = data.webhook;
      loadCities();
    })
    .catch(error => {
        console.error('Error loading product data:', error);
        document.getElementById('product-name').textContent = 'Error loading product';
        document.getElementById('current-price').textContent = 'Please use a web server';
    });
// ======== Form Validation =============
function debounce(fn, delay = 500) {
    let timeout;
    return (...args) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => fn.apply(null, args), delay);
    };
}
function validateField(fieldId, message, scroll = false) {
    const inputElement = document.getElementById(fieldId);
    const errorElement = document.getElementById(`error-${fieldId}`);

    if (message) {
       // errorElement.textContent = message;
       errorElement.dataset.key = message;
      //  errorElement.setAttribute("data-key", message);
      applyLanguage();
        inputElement.classList.remove('success');
        inputElement.classList.add('error');

        // Only scroll when asked (used on submit only)
        if (scroll) {
            inputElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    } else {
        //errorElement.textContent = '';
        errorElement.dataset.key = '';
        applyLanguage();
        inputElement.classList.remove('error');
        inputElement.classList.add('success');
    }
}
function validateFullname() {
    const input = document.getElementById('fullname');
    const value = input.value.trim();
    const regex = /^(?=.{3,})[\u0600-\u06FFA-Za-z]+(?:[ '-][\u0600-\u06FFA-Za-z]+)*$/;

    if (!value) {
        validateField('fullname', 'required_name');
        return false;
    }
    if (!regex.test(value)) {
        validateField('fullname', 'name_regx');
        return false;
    }

    validateField('fullname', '');
    return true;
}
function validatePhone() {
    const input = document.getElementById('phone');
    const value = input.value.trim();
    const regex = /^0\d{9}$/;
    if (!value) {
        validateField('phone', 'required_phone');
        return false;
    }
    if (!regex.test(value)) {
        validateField('phone', 'phone_regx');
        return false;
    }

    validateField('phone', '');
    return true;
}
function validateCity() {
    const value = document.getElementById('city').value;

    if (!value) {
        validateField('city', 'select_city');
        return false;
    }

    validateField('city', '');
    return true;
}
function validateAddress() {
    const input = document.getElementById('address');
    const value = input.value.trim();
    if (!value) {
        validateField('address', 'required_address');
        return false;
    }
    if (value.length < 5) {
        validateField('address', 'address_regx');
        return false;
    }

    validateField('address', '');
    return true;
}
function validateForm() {
    let firstError = false;

    function run(fn, id) {
        const valid = fn();
        if (!valid && !firstError) {
            validateField(id, document.getElementById(`error-${id}`).textContent, true);
            firstError = true;
        }
        return valid;
    }

    const a = run(validateFullname, 'fullname');
    const b = run(validatePhone, 'phone');
    const c = run(validateCity, 'city');
    const d = run(validateAddress, 'address');

    return a && b && c && d;
}
document.getElementById('fullname')
    .addEventListener('blur', debounce(validateFullname, 50));

document.getElementById('phone')
    .addEventListener('blur', debounce(validatePhone, 50));

document.getElementById('address')
    .addEventListener('blur', debounce(validateAddress, 50));

document.getElementById('city')
    .addEventListener('change', validateCity);
// handle form submission
document.getElementById('cod-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    updateUI(); // Update final summary before validation/submission

    // --- Validation Check ---
    if (!validateForm()) {
        // If validation fails, stop the submission
        return;
    }

    const submitBtn = document.querySelector('.submit-btn');
    const originalHTML = submitBtn.innerHTML;

    // 🔄 Change icon to spinner
    submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Processing...';
    submitBtn.disabled = true;

    // --- Validation Passed ---

    const formData = new FormData();
    formData.append('fullname', document.getElementById('fullname').value.trim());
    formData.append('phone', document.getElementById('phone').value.trim());
    formData.append('city', document.getElementById('city').value);
    formData.append('address', document.getElementById('address').value.trim());
    formData.append('itemOptions', `${state.size} • ${state.color} • Qty: ${state.quantity}`);
   formData.append('totalPrice',globalPrice );
   /* formData.append('totalPrice', document.getElementById('summary-total').textContent);*/

    try {
        const response = await fetch(webhook, {
            method: 'POST',
            body: formData
        });

        const result = await response.json();
        if (result.status === 'success') {
            const orderId = result.data[1];

            const params = new URLSearchParams({
                product_name: state.productName,
                product_price: document.getElementById('summary-total').textContent.replace(state.currency, '').trim(),
                currency: state.currency,
                final_size: state.size,
                final_color: state.color,
                phone: document.getElementById('phone').value.trim(),
                quantity: state.quantity,
                order_id: orderId
            });
document.getElementById('cod-form').reset();
            window.location.href = `thankyou.html?${params.toString()}`;
        } else {
            console.log(result);
           
        }

    } catch (err) {
        console.error(err);
       
    }
});
// tabs handler.
document.querySelectorAll(".tab").forEach(tab => {
  tab.addEventListener("click", () => {
    // Remove active states
    document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
    document.querySelectorAll(".tab-content").forEach(c => c.classList.remove("active"));

    // Apply new active states
    tab.classList.add("active");
    document.getElementById(tab.dataset.target).classList.add("active");
  });
});
// reviews
const reviewsData = [
      { name: "نعيمة سكاسيك", date: "2025-02-14", rating: 4, text: "برودوي زوين خديتو وغنعاود ناخذو لختي." },
      { name: "حميد برشان", date: "2025-01-29", rating: 4, text: "برودوي غزال عجبني بزاف 💜❤" },
      { name: "طارق زعتان", date: "2024-12-03", rating: 4, text: "شكرا. توصلت بيه ليوما " },
      { name: "Milo Grant", date: "2025-03-01", rating: 4, text: "Top, Très satisfait" },
      { name: "Priya Singh", date: "2025-04-08", rating: 5, text: "Je recommande ce produit. C'est très bien." }
    ];

    const colors = ['#ef4444','#f97316','#f59e0b','#eab308','#10b981','#06b6d4','#3b82f6','#6366f1','#8b5cf6','#ec4899','#84cc16','#06b6d4'];

    function nameToIndex(name){
      let h=0;
      for(let i=0;i<name.length;i++){ h=(h<<5)-h+name.charCodeAt(i); h|=0; }
      return Math.abs(h) % colors.length;
    }

    function renderReviews(){
      const container = document.getElementById('reviewsContainer');
      reviewsData.forEach((r, idx) => {
        const card = document.createElement('article');
        card.className='review-card';
        card.setAttribute('aria-labelledby',`review-${idx}-name`);

        const avatar = document.createElement('div');
        avatar.className='avatar';
        const initial = r.name ? r.name.split(' ')[0][0].toUpperCase() : '?';
        avatar.textContent=initial;
        avatar.style.background=colors[nameToIndex(r.name||'?')];
        avatar.setAttribute('aria-label',`Avatar for ${r.name}`);

        const body=document.createElement('div'); body.className='review-body';
        const meta=document.createElement('div'); meta.className='meta';
        const nameEl=document.createElement('div'); nameEl.className='name'; nameEl.id=`review-${idx}-name`; nameEl.textContent=r.name;
        const dateEl=document.createElement('div'); dateEl.className='date'; dateEl.textContent=new Date(r.date).toLocaleDateString(undefined,{year:'numeric',month:'short',day:'numeric'});
        const ratingEl=document.createElement('div'); ratingEl.className='rating'; ratingEl.textContent='★'.repeat(r.rating)+'☆'.repeat(5-r.rating);
        meta.append(nameEl,dateEl,ratingEl);

        const textEl=document.createElement('p'); textEl.className='text'; textEl.textContent=r.text;
        body.append(meta,textEl);
        card.append(avatar,body);
        container.appendChild(card);
      });
    }

    renderReviews();
    const loadMoreBtn = document.getElementById('loadMoreBtn');
    loadMoreBtn.addEventListener('click', () => {
      loadMoreBtn.classList.add('loading');
    });