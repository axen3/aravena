function initMessages(data) {
    const messages = data.topBarText || [];
    const banner = document.getElementById('top-banner');
    const messageHeight = 36;
    let index = 0;
    let intervalId;
    banner.innerHTML = '';

    const ticker = document.createElement('div');
    ticker.className = 'ticker';
    banner.appendChild(ticker);

    messages.forEach(msg => {
        const div = document.createElement('div');
        div.className = 'message';
        div.innerHTML = msg;
        ticker.appendChild(div);
    });

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
    translations = await response.json();

    applyLanguage();
}

function applyLanguage() {
    const lang = document.documentElement.lang;
    const dir = lang === "ar" ? "rtl" : "ltr";
    document.documentElement.dir = dir;

    document.querySelectorAll("[data-key]").forEach(el => {
        const key = el.getAttribute("data-key");
        el.textContent = translations[lang][key] || key;
    });
}
// countdown
let time = 3 * 60 * 60;
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

/* ======== UPDATED STATE ========== */
const state = {
    productName: '',
    unitPrice: 0,
    originalPrice: 0,
    currency: '',
    rate: '',
    count: '',
    quantityBreaks: [],
    size: '',
    color: '',
    quantity: 1, 
    currentPricePerItem: 0, // Changes based on Tier or Base Price
    whatsappNumber: '',
    whatsappMsg: ''
};

function calculateTotal() {
    const total = state.quantity * state.currentPricePerItem;
    return {
        total: total.toFixed(2),
        quantity: state.quantity
    };
}
/* ======== UPDATED UI UPDATE ======== */
let globalPrice = 0;
function updateUI() {
    const result = calculateTotal();
    globalPrice = result.total;

    // Update Big Price Display
    // We show the TOTAL price here, or you can show Price Per Item if you prefer
    document.getElementById('current-price').textContent =
        `${result.total} ${state.currency}`;

    // Calculate generic discount based on original price vs current effective unit price
    if (state.originalPrice > state.currentPricePerItem) {
        const discount = Math.round((1 - state.currentPricePerItem / state.originalPrice) * 100);
        document.getElementById('original-price').textContent =
            `${(state.originalPrice * state.quantity).toFixed(2)} ${state.currency}`; // Show Total Original
        document.getElementById('discount-badge').textContent = `-${discount}%`;
        document.getElementById('discount-badge').style.display = 'inline-block';
    } else {
         document.getElementById('discount-badge').style.display = 'none';
         document.getElementById('original-price').textContent = '';
    }

    // Summary Section
    document.getElementById('summary-product').textContent = state.productName;
    document.getElementById('summary-size').textContent = state.size || 'N/A';
    document.getElementById('summary-color').textContent = state.color || 'N/A';
    document.getElementById('summary-qty').textContent = result.quantity;
    document.getElementById('summary-total').textContent =
        `${result.total} ${state.currency}`;

    // Hidden Form Inputs
    document.getElementById('form-product-name').value = state.productName;
    document.getElementById('form-product-price').value = state.currentPricePerItem.toFixed(2);
    document.getElementById('form-size').value = state.size;
    document.getElementById('form-color').value = state.color;
    document.getElementById('form-quantity').value = result.quantity;
    document.getElementById('form-total-amount').value = `${result.total} ${state.currency}`;

    // WhatsApp
    const waMsg =
        `${state.whatsappMsg}\n *${state.productName}*\n• Color: *${state.color}*\n• Size: *${state.size}*\n• Qty: *${result.quantity}*\n
    ----------------------\n
    Total: *${result.total} Dhs*`;
    document.getElementById('whatsapp-link').href =
        `https://wa.me/${state.whatsappNumber}?text=${encodeURIComponent(waMsg)}`;
}

/* ================= NEW TIER SELECTION LOGIC ================= */
function selectTier(qty, pricePerItem) {
    state.quantity = qty;
    state.currentPricePerItem = pricePerItem;

    // Visual Update for Cards
    document.querySelectorAll('.qty-tier-card').forEach(card => {
        card.classList.remove('selected');
        // Check if this card matches the clicked quantity
        if(parseInt(card.dataset.qty) === qty) {
            card.classList.add('selected');
        }
    });

    // Hide the standard quantity picker because the tier selects quantity
    const qtySection = document.getElementById('quantity-section');
    if (qtySection) qtySection.classList.add('hidden');

    updateUI();
}
function initProduct(data) {
    // 1. Initialize State
    state.productName = data.productName;
    state.unitPrice = parseFloat(data.price);
    state.currentPricePerItem = state.unitPrice; // Default to base price
    state.originalPrice = data.originalPrice ? parseFloat(data.originalPrice) : state.unitPrice;
    state.rate = data.reviews?.rate || 0;
    state.count = data.reviews?.count || 0;
    state.currency = data.currency;
    state.whatsappNumber = data.whatsappNumber || '+21206';
    state.whatsappMsg = data.whatsappMsg || '';
    state.quantityBreaks = Array.isArray(data.quantityBreaks) ? data.quantityBreaks : [];

    // Set Product Name
    document.getElementById('product-name').textContent = data.productName;

    const promoContainer = document.getElementById('promo-buttons');
    const qtySection = document.getElementById('quantity-section');

    // Reset container
    promoContainer.innerHTML = '';

    if (state.quantityBreaks.length > 0) {
        qtySection.classList.add('hidden'); 
        qtySection.style.display = 'none';

        // Show the list container
        document.getElementById('promo-group').style.display = 'block';
        promoContainer.className = 'qty-break-container';
        promoContainer.style.display = 'flex';

        state.quantityBreaks.forEach((tier, index) => {
            const btn = document.createElement('div');
            btn.className = 'qty-tier-card';
            btn.dataset.qty = tier.quantity;

            // Calculations for display
            const totalPrice = tier.pricePerItem * tier.quantity;
            // Calculate savings against the base unit price
            const savings = (state.unitPrice - tier.pricePerItem) * tier.quantity;
            
            let badgeHTML = tier.badge ? `<div class="tier-badge">${tier.badge}</div>` : '';

            btn.innerHTML = `
                ${badgeHTML}
                <div style="display:flex; align-items:center;">
                    <div class="tier-radio"></div>
                    <div class="tier-info">
                        <span class="tier-title">${tier.label}</span>
                        ${index > 0 && savings > 0 ? `<span class="tier-savings">وفر ${savings.toFixed(0)} ${state.currency}</span>` : ''}
                    </div>
                </div>
                <div class="tier-pricing">
                    <span class="tier-total">${totalPrice.toFixed(2)} ${state.currency}</span>
                    <span class="tier-per-item">${tier.pricePerItem} ${state.currency} / للقطعة</span>
                </div>
            `;

            btn.addEventListener('click', () => {
                // Update State
                state.quantity = tier.quantity;
                state.currentPricePerItem = tier.pricePerItem;

                // Update Visual Selection
                document.querySelectorAll('.qty-tier-card').forEach(c => c.classList.remove('selected'));
                btn.classList.add('selected');

                updateUI();
            });

            promoContainer.appendChild(btn);
        });

        // Automatically select the first option
        if (state.quantityBreaks.length > 0) {
            const first = state.quantityBreaks[0];
            state.quantity = first.quantity;
            state.currentPricePerItem = first.pricePerItem;
            // Manually add class to first element
            promoContainer.firstChild.classList.add('selected');
        }

    } else {
        qtySection.classList.remove('hidden');
        qtySection.style.display = 'flex';
        
        // Hide the list container
        document.getElementById('promo-group').style.display = 'none';
        promoContainer.style.display = 'none';

        // Reset to defaults
        state.quantity = 1;
        state.currentPricePerItem = state.unitPrice;
        document.getElementById('quantity').value = 1;
    }
// reviews
    const reviewContainer = document.getElementById('review-container');
    let starsHTML = '';
    for (let i = 1; i <= 5; i++) {
        if (state.rate >= i) {
            starsHTML += '<i class="fas fa-star"></i>';
        } else if (state.rate >= i - 0.5) {
            starsHTML += '<i class="fas fa-star-half-alt"></i>';
        } else {
            starsHTML += '<i class="far fa-star"></i>';
        }
    }
    reviewContainer.innerHTML = starsHTML + `<span class="review-count">(${state.count})</span>`;
// gallery
    const mainImg = document.getElementById('main-img');
    const wrapper = document.getElementById('main-img-wrapper');
    const thumbsContainer = document.getElementById('thumbs-container');

    function setMainImage(url) {
        wrapper.classList.add('placeholder');
        mainImg.classList.remove('loaded');
        mainImg.src = url;
        mainImg.onload = () => {
            wrapper.classList.remove('placeholder');
            mainImg.classList.add('loaded');
        };
    }

    if (data.gallery && data.gallery.length > 0) {
        thumbsContainer.innerHTML = "";
        
        // Set first image
        setMainImage(data.gallery[0]);

        // Build Thumbs
        data.gallery.forEach((src, i) => {
            const thumb = document.createElement("img");
            thumb.src = src;
            thumb.className = "thumb";
            if (i === 0) thumb.classList.add("active");

            thumb.addEventListener("click", () => {
                if (mainImg.src.includes(src)) return;
                Array.from(thumbsContainer.children).forEach(t => t.classList.remove("active"));
                thumb.classList.add("active");
                setMainImage(src);
            });

            thumbsContainer.appendChild(thumb);
        });
    }
// Sizes
    if (data.sizes && data.sizes.length > 0) {
        document.getElementById('size-group').style.display = 'block';
        state.size = data.sizes[0]; // Select first by default
        
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
    } else {
        document.getElementById('size-group').style.display = 'none';
    }
// Colors
    if (data.colors && data.colors.length > 0) {
        document.getElementById('color-group').style.display = 'block';

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
            btn.classList.add('color-btn');
            btn.style.backgroundColor = hex;
            btn.title = name;

            if (i === 0) btn.classList.add('selected');

            btn.addEventListener('click', () => {
                container.querySelectorAll('.color-btn').forEach(b => b.classList.remove('selected'));
                btn.classList.add('selected');
                state.color = name;
                document.getElementById('selected-color-name').textContent = `${name}`;
                updateUI();
            });
            container.appendChild(btn);
        });
    } else {
        document.getElementById('color-group').style.display = 'none';
    }
// Description images
    const contentContainer = document.getElementById('content-images');
    contentContainer.innerHTML = '';
    if (data.contentImages && data.contentImages.length > 0) {
        data.contentImages.forEach(src => {
            const img = document.createElement('img');
            img.src = src;
            img.classList.add('placeholder');
            img.onload = () => img.classList.remove('placeholder');
            contentContainer.appendChild(img);
        });
    }
    updateUI();
}
// Quantity controls
document.getElementById('qty-minus').addEventListener('click', () => {
    if (state.quantity > 1) {
        state.quantity--;
        document.getElementById('quantity').value = state.quantity;
        // In standard mode, pricePerItem stays the same (unitPrice)
        updateUI();
    }
});

document.getElementById('qty-plus').addEventListener('click', () => {
    state.quantity++;
    document.getElementById('quantity').value = state.quantity;
    // In standard mode, pricePerItem stays the same (unitPrice)
    updateUI();
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
const tabs = document.querySelectorAll(".tab-btn");
    const contents = document.querySelectorAll(".tab-content");
    const indicator = document.querySelector(".indicator");

    tabs.forEach((tab, index) => {
      tab.addEventListener("click", () => {
        tabs.forEach(t => t.classList.remove("active"));
        contents.forEach(c => c.classList.remove("active"));

        tab.classList.add("active");
        document.getElementById(tab.dataset.tab).classList.add("active");

        indicator.classList.toggle("right", index === 1);
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

if (loadMoreBtn) {
  loadMoreBtn.addEventListener('click', () => {
    loadMoreBtn.classList.add('loading');

    const svg = loadMoreBtn.querySelector('svg');
    if (svg) {
      svg.style.display = 'none';
    }
  });
}