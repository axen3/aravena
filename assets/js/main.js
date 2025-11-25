// assets/js/main.js

// ================ Simple Cart System ================
function addToCart(product, size, color, qty = 1) {
    const cart = JSON.parse(localStorage.getItem("cart") || "[]");
    
    // Create a unique cartId based on product ID, size, and color
    const cartId = `${product.id}-${size || 'none'}-${color || 'none'}`;

    // Update the existing find logic to use the unique cartId
    const existing = cart.find(i => i.cartId === cartId);

    if (existing) {
        existing.qty += qty;
    } else {
        cart.push({ 
            cartId: cartId, // ADDED: The unique identifier for this item configuration
            id: product.id, 
            name: product.name, 
            price: product.price, 
            image: product.image, 
            size, 
            color, 
            qty 
        });
    }

    localStorage.setItem("cart", JSON.stringify(cart));
    updateCartCounter();
}

function updateCartCounter() {
    const cart = JSON.parse(localStorage.getItem("cart") || "[]");
    const total = cart.reduce((sum, i) => sum + i.qty, 0);
    const counter = document.getElementById("cart-counter");
    if (counter) counter.textContent = total;
}
// loading header links and close button handler
function setupMobileMenuListeners() {
    // Select elements again as they might have been dynamically replaced
    const toggle = document.querySelector(".mobile-menu-toggle");
    const closeBtn = document.querySelector(".mobile-menu-close");
    const nav = document.querySelector(".main-nav");
    
    // Safety check: ensure required elements exist
    if (!nav || !toggle) return; 

    // Define the close function
    const closeMenu = () => {
        nav.classList.remove("active");
        // Remove 'menu-open' class from the header, often used for styling overlay/shadow
        document.querySelector(".site-header")?.classList.remove("menu-open"); 
    };

    // 1. Toggle Button (Open/Close) - Stays static in HTML, set up only once.
    if (!toggle.hasAttribute('data-listeners-set')) {
        toggle.addEventListener("click", () => {
            nav.classList.toggle("active");
            document.querySelector(".site-header")?.classList.toggle("menu-open");
        });
        toggle.setAttribute('data-listeners-set', 'true'); // Mark as set
    }
    
    // 2. Close Button (Dynamically replaced, so must be re-attached every time loadHeaderLinks runs)
    // Using .onclick overwrites any previous handler, preventing duplicate listeners.
    if (closeBtn) {
        closeBtn.onclick = closeMenu;
    }

    // 3. Navigation Links (Closes menu on navigation)
    document.querySelectorAll(".main-nav a[data-link]").forEach(link => {
        // Using .onclick overwrites any previous handler
        link.onclick = closeMenu;
    });
}
// ======== HEADER LINKS ================
window.loadHeaderLinks = async function() {
    const res = await fetch("/data/products.json"); 
    const data = await res.json();
    const categories = data.categories;

    const navContainer = document.querySelector('.main-nav');
    if (!navContainer) return;

    // Static Home Link
    const staticHomeLink = '<a href="/home" data-link><i class="fas fa-home"></i> Home</a>';
    
    // Dynamic Category Links
    const categoryLinksHTML = categories.map(cat => {
        const catSlug = cat.toLowerCase(); 
        return `<a href="/category/${catSlug}" data-link><i class="fas fa-tag"></i> ${cat}</a>`;
    }).join('');

    // Static Cart Icon Link
    const cartIconHTML = `
      <div class="cart-icon desktop-cart">
        <a href="/checkout" data-link><i class="fas fa-shopping-cart"></i> <span id="cart-counter">0</span></a>
      </div>
    `;

    // 5. Construct the final innerHTML, replacing the existing content
    navContainer.innerHTML = `
        <button class="mobile-menu-close" aria-label="Close menu"><i class="fas fa-times"></i></button>
        ${staticHomeLink}
        ${categoryLinksHTML}
        ${cartIconHTML}
    `;
    
    // Ensure the cart counter is updated (assuming updateCartCounter is defined elsewhere)
    if (typeof updateCartCounter === 'function') {
        updateCartCounter();
    }

    // 6. CRITICAL FIX: Re-attach the event listeners to the new elements
    setupMobileMenuListeners(); 
};
// ================ Home Page ================
window.loadHome = async function (selectedCategory = null) {
    const container = document.getElementById("products-grid");
    const res = await fetch("/data/products.json");
    const data = await res.json();
    const products = data.products;

    // Filter products if a category is selected
    const jsonCategories = data.categories.map(c => c.toLowerCase());
    
    // 2. Prepend 'all' to the list
    const categories = ["all", ...jsonCategories]; 
    const filteredProducts = selectedCategory 
        ? products.filter(p => p.category.toLowerCase() === selectedCategory.toLowerCase())
        : products;

    // Update page title
    if (selectedCategory) {
        document.querySelector("h2") ? document.querySelector("h2").textContent = selectedCategory.charAt(0).toUpperCase() + selectedCategory.slice(1) : null;
    } else {
        document.querySelector("h2") ? document.querySelector("h2").textContent = "All Products" : null;
    }

    container.innerHTML = filteredProducts.map(p => {
        const hasDiscount = p.originalPrice && p.originalPrice > p.price;
        const discount = hasDiscount ? Math.round((1 - p.price / p.originalPrice) * 100) : 0;

        return `
            <div class="product-card">
                ${hasDiscount ? `<div class="sale-badge">-${discount}%</div>` : ''}
                <a href="/product/${p.id}" data-link> 
                    <div class="product-image-wrapper">
                        <img src="${p.image}" alt="${p.name}" loading="lazy">
                    </div>
                    <div class="card-content">
                        <h3>${p.name}</h3>
                        <p class="category-badge">${p.category}</p>
                        <div class="price-row">
                            <span class="price">MAD ${(p.price / 100).toFixed(2)}</span>
                            ${hasDiscount ? `<span class="original-price">MAD ${(p.originalPrice / 100).toFixed(2)}</span>` : ''}
                        </div>
                    </div>
                </a>
            </div>
        `;
    }).join("");

    // Add category filter buttons above grid (only on home/category pages)
    const header = document.querySelector(".hero-section");
    if (header && !document.getElementById("category-filters")) {
        
        const filterHTML = `<div id="category-filters" class="category-filters">
            ${categories.map(cat => {
                // Determine the clean URL path for the button
                const path = cat === "all" ? "/home" : `/category/${cat}`; 
                
                return `
                    <a href="${path}" data-link class="category-btn ${(!selectedCategory && cat === "all") || selectedCategory === cat ? "active" : ""}">
                        ${cat.charAt(0).toUpperCase() + cat.slice(1)}
                    </a>
                `;
            }).join("")}
        </div>`;
        header.insertAdjacentHTML("afterend", filterHTML);
    }
        // Categories filters scroll
    const targetElement = document.getElementById("products-start");
    
    if (selectedCategory && targetElement) {
        
        // Ensure the header height is accounted for if it's sticky
        const siteHeader = document.getElementById("header"); // Assuming your sticky header is #header
        const headerHeight = siteHeader ? siteHeader.offsetHeight : 0;

        // Calculate the top position of the target element relative to the document
        const targetTop = targetElement.getBoundingClientRect().top + window.pageYOffset;

        // Calculate the final scroll position: Target Top - Header Height (for sticky header offset)
        const scrollToY = targetTop - headerHeight - 20; // -20 for a small padding/buffer
        window.scrollTo({
            top: scrollToY,
            behavior: "smooth"
        });
    }

};

// ================ Product Page ================
window.loadProduct = async function (id) {
  function generateStarRating(rating,reviewCount) {
        const normalizedRating = Math.round(rating * 2) / 2;
        
        let starsHtml = '';
        let ratingValue = normalizedRating;
        
        const FULL_STAR = '<i class="fas fa-star" style="color: #ffc107;"></i>';
        const HALF_STAR = '<i class="fas fa-star-half-alt" style="color: #ffc107;"></i>';
        const EMPTY_STAR = '<i class="far fa-star" style="color: #ffc107;"></i>';

        for (let i = 0; i < 5; i++) {
            if (ratingValue >= 1) {
                starsHtml += FULL_STAR;
                ratingValue--;
            } else if (ratingValue === 0.5) {
                starsHtml += HALF_STAR;
                ratingValue = 0;
            } else {
                starsHtml += EMPTY_STAR;
            }
        }
        
        return `<span class="fa-rating-icons">${starsHtml}</span><span class="count"> (${reviewCount})</span>`;
    }
    // loading product details
    const res = await fetch("/data/products.json");
    const data = await res.json();
    const products = data.products;
    const product = products.find(p => p.id == id);
    
    if (!product) {
        document.getElementById("app").innerHTML = "<h2 style='text-align:center;padding:4rem;'>Product not found 😢</h2>";
        return;
    }

    // ... (rest of the product display logic remains the same) ...

    document.getElementById("product-title").textContent = product.name;
    document.getElementById("product-category").textContent = product.category;
    document.getElementById("product-rating").innerHTML = generateStarRating(product.rating|| 0,product.reviewCount || 0);
    document.getElementById("product-description").textContent = product.shortDescription;
    // shipping
    let shippingBadgeHTML = '';
    
    if (product.shipping === 'free') {
        shippingBadgeHTML = `<span class="detail-badge shipping-free-badge"><i class="fas fa-shipping-fast"></i> FREE SHIPPING</span>`;
    } else if (product.shipping === 'paid' && product.shippingCost > 0) {
        const cost = product.shippingCost;
        shippingBadgeHTML = `<span class="detail-badge shipping-paid-badge"><i class="fas fa-shipping-fast"></i> Shipping: ${cost} MAD</span>`;
    }
    document.getElementById("product-shipping").innerHTML = shippingBadgeHTML;
    // Stock Status + Disable buttons if out of stock
    const stockEl = document.getElementById("product-stock");
    const stockTextEl = stockEl.querySelector(".stock-text");
    const stockIconEl = stockEl.querySelector(".stock-icon");
    const addToCartBtn = document.getElementById("add-to-cart");
    const buyNowBtn = document.getElementById("buy-now");

    if (product.inStock) {
        stockTextEl.textContent = "In Stock";
        stockIconEl.className = "fas fa-check-circle stock-icon";
        stockEl.classList.remove("out-of-stock");

        // Enable buttons
        addToCartBtn.disabled = false;
        buyNowBtn.disabled = false;
        addToCartBtn.style.opacity = "1";
        buyNowBtn.style.opacity = "1";
        addToCartBtn.style.cursor = "pointer";
        buyNowBtn.style.cursor = "pointer";
    } else {
        stockTextEl.textContent = "Out of Stock";
        stockIconEl.className = "fas fa-times-circle stock-icon";
        stockEl.classList.add("out-of-stock");

        // Disable buttons
        addToCartBtn.disabled = true;
        buyNowBtn.disabled = true;
        addToCartBtn.style.opacity = "0.5";
        buyNowBtn.style.opacity = "0.5";
        addToCartBtn.style.cursor = "not-allowed";
        buyNowBtn.style.cursor = "not-allowed";
    }
    const priceEl = document.getElementById("product-price");
    priceEl.textContent = `MAD ${(product.price / 100).toFixed(2)}`;

    const originalPriceEl = document.getElementById("original-price");
    const discountBadgeEl = document.getElementById("discount-badge");

    if (product.originalPrice && product.originalPrice > product.price) {
        originalPriceEl.textContent = `MAD ${(product.originalPrice / 100).toFixed(2)}`;
        originalPriceEl.style.display = "inline";
        const discount = Math.round((1 - product.price / product.originalPrice) * 100);
        discountBadgeEl.textContent = `-${discount}%`;
        discountBadgeEl.style.display = "inline-block";
    } else {
        originalPriceEl.style.display = "none";
        discountBadgeEl.style.display = "none";
    }

    const allImages = [product.image, ...(product.images || [])];
    const imagesDiv = document.getElementById("product-images");

    imagesDiv.innerHTML = `
        <div class="gallery-main">
            <img id="main-gallery-image" src="${allImages[0]}" alt="${product.name}">
        </div>
        ${allImages.length > 1 ? `
            <div class="gallery-thumbs">
                ${allImages.map((src, i) => `
                    <img src="${src}" alt="thumb" class="${i === 0 ? 'active' : ''}" onclick="
                        document.getElementById('main-gallery-image').src = this.src;
                        this.parentElement.querySelectorAll('img').forEach(t => t.classList.remove('active'));
                        this.classList.add('active');
                    ">
                `).join("")}
            </div>
        ` : ''}
    `;

    const sizeSelect = document.getElementById("selectedSize");
    if (product.sizes && product.sizes.length > 0) {
        sizeSelect.innerHTML = product.sizes.map(s => `<option value="${s}">${s}</option>`).join("");
        sizeSelect.closest(".option-group").style.display = "block";
    } else {
        sizeSelect.closest(".option-group").style.display = "none";
    }

    const colorDiv = document.getElementById("color-options");
    if (product.colors && product.colors.length > 0) {
        colorDiv.innerHTML = product.colors.map((c, i) => `
            <div class="color-swatch ${i === 0 ? 'active' : ''}" style="background:${c.hex}" data-color="${c.name}" title="${c.name}"></div>
        `).join("");

        colorDiv.querySelectorAll(".color-swatch").forEach(swatch => {
            swatch.onclick = () => {
                colorDiv.querySelectorAll(".color-swatch").forEach(s => s.classList.remove("active"));
                swatch.classList.add("active");
            };
        });
        colorDiv.closest(".option-group").style.display = "block";
    } else {
        colorDiv.closest(".option-group").style.display = "none";
    }

    const qtyInput = document.getElementById("selectedUnits");
    const minusBtn = document.getElementById("qty-minus");
    const plusBtn = document.getElementById("qty-plus");

    const updateQtyButtons = () => {
        const val = parseInt(qtyInput.value);
        minusBtn.disabled = val <= 1;
        plusBtn.disabled = val >= 10;
    };

    minusBtn.onclick = () => {
        if (parseInt(qtyInput.value) > 1) {
            qtyInput.value = parseInt(qtyInput.value) - 1;
            updateQtyButtons();
        }
    };

    plusBtn.onclick = () => {
        if (parseInt(qtyInput.value) < 10) {
            qtyInput.value = parseInt(qtyInput.value) + 1;
            updateQtyButtons();
        }
    };

    qtyInput.value = 1;
    updateQtyButtons();

    const descDiv = document.getElementById("description-blocks");
    descDiv.innerHTML = (product.descriptionBlocks || []).map(block => {
        if (block.type === "h1") return `<h2>${block.content}</h2>`;
        if (block.type === "paragraph") return `<p>${block.content}</p>`;
        if (block.type === "ul") return `<ul>${block.items.map(i => `<li>${i}</li>`).join("")}</ul>`;
        if (block.type === "image") return `<img src="${block.src}" alt="${block.alt}" loading="lazy">`;
        return "";
    }).join("");

    // Add to Cart
    document.getElementById("add-to-cart").onclick = () => {
        const size = product.sizes?.length ? document.getElementById("selectedSize").value : null;
        const color = product.colors?.length ? document.querySelector(".color-swatch.active")?.dataset.color : null;
        const qty = parseInt(qtyInput.value) || 1;

        addToCart(product, size, color, qty);
    };

    // Buy Now – silent + instant checkout
    document.getElementById("buy-now").onclick = () => {
        const size = product.sizes?.length ? document.getElementById("selectedSize").value : null;
        const color = product.colors?.length ? document.querySelector(".color-swatch.active")?.dataset.color : null;
        const qty = parseInt(qtyInput.value) || 1;

        addToCart(product, size, color, qty);
        
        // HASH REMOVED: Navigate using the new navigateTo function from app.js
        window.navigateTo('/checkout'); 
    };

    updateTitle(product.name);
};

// ================ Static Pages ================
/*
window.loadPage = async function (page) {
    const res = await ("/data/pages.json");
    const pages = await res.json();
    const content = pages[page] || { title: "Page Not Found", content: "<p>Sorry, this page does not exist.</p>" };

    document.getElementById("page-title").textContent = content.title;
    document.getElementById("page-content").innerHTML = content.content;
    updateTitle(content.title);
};
*/
// ================ CHECKOUT VALIDATION LOGIC ================

/**
 * Validates the checkout form fields according to specified rules.
 * Required fields: name (min 2), phone (10 digits starting with 0), address (min 10), city.
 * Notes field is optional.
 *  True if all required fields are valid.
 */
function validateCheckoutForm(event) {
    event.preventDefault(); // Stop default form submission first
    
    let isValid = true;
    
    // Define the required fields and their IDs
    const requiredFields = [
        { id: 'name', minLength: 2, msg: 'Full name is required (min 2 characters).' },
        { id: 'phone', type: 'phone', msg: 'Phone must be 10 digits, starting with 0.' },
        { id: 'address', minLength: 10, msg: 'Full address is required (min 10 characters).' },
        { id: 'city', type: 'select', msg: 'Please select your city.' }
    ];

    // Helper function to check and display errors for a single field
    const checkField = (inputEl, errorEl, message, isInvalid) => {
        if (isInvalid) {
            errorEl.textContent = message;
            inputEl.classList.add('invalid');
            isValid = false;
        } else {
            errorEl.textContent = '';
            inputEl.classList.remove('invalid');
        }
    };

    requiredFields.forEach(field => {
        const inputEl = document.getElementById(field.id);
        const errorEl = document.getElementById(`${field.id}-error`);
        if (!inputEl || !errorEl) return; 

        const value = inputEl.value.trim();

        // 1. Check for basic emptiness (applies to all required fields)
        if (value.length === 0 || (field.type === 'select' && value === '')) {
            const genericMsg = field.msg.split('(')[0].trim() + ' is required.';
            checkField(inputEl, errorEl, genericMsg, true);
            return;
        }
        
        // 2. Check Min Length
        if (field.minLength && value.length < field.minLength) {
             checkField(inputEl, errorEl, field.msg, true);
             return;
        }

        // 3. Specific Validation for Phone Number (10 digits starting with 0)
        if (field.type === 'phone') {
            const phoneRegex = /^0\d{9}$/;
            if (!phoneRegex.test(value)) {
                checkField(inputEl, errorEl, field.msg, true);
                return;
            }
        }
        
        // If all checks passed for this field
        checkField(inputEl, errorEl, '', false);
    });

    return isValid;
}

// ================ Checkout Page – ALWAYS AVAILABLE & FIXED ================
window.loadCheckout = function () {
    const cart = JSON.parse(localStorage.getItem("cart") || "[]");

    if (cart.length === 0) {
        document.getElementById("app").innerHTML = `
            <div style="text-align:center; padding:8rem 2rem;">
                <i class="fas fa-shopping-cart" style="font-size:6rem; color:#cbd5e1; margin-bottom:1.5rem;"></i>
                <h2 style="font-size:2.2rem; margin-bottom:1rem; color:var(--primary);">Your cart is empty</h2>
                <p style="font-size:1.2rem; color:#666; margin-bottom:2rem;">
                    Looks like you haven't added anything yet.<br>
                    Let's find something you love!
                </p>
                <a href="/home" data-link class="cta-button" style="display:inline-block; padding:1rem 2.5rem; font-size:1.2rem;">
                    Start Shopping
                </a>
            </div>`;
        return;
    }

    const itemsHTML = cart.map((item, index) => `
        <div class="cart-item">
            <img src="${item.image}" alt="${item.name}">
            <div class="cart-item-details">
                <h4>${item.name}</h4>
                <p>${item.size ? 'Size: ' + item.size + ' • ' : ''}${item.color ? 'Color: ' + item.color + ' • ' : ''}Qty: ${item.qty}</p>
                <p>MAD ${(item.price / 100 * item.qty).toFixed(2)}</p>
            </div>
            <button class="remove-item-btn" data-index="${index}">
                <i class="fas fa-trash-alt"></i>
            </button>
        </div>
    `).join("");

    const cartItemsEl = document.getElementById("cart-items");
    if (cartItemsEl) cartItemsEl.innerHTML = itemsHTML;

    const total = cart.reduce((sum, i) => sum + i.price * i.qty, 0) / 100;
    const totalEl = document.getElementById("grand-total");
    if (totalEl) totalEl.textContent = total.toFixed(2);

    document.querySelectorAll(".remove-item-btn").forEach(btn => {
        btn.onclick = () => {
            const index = parseInt(btn.dataset.index);
            cart.splice(index, 1);
            localStorage.setItem("cart", JSON.stringify(cart));
            updateCartCounter();
            loadCheckout();
        };
    });

    // Populate Moroccan cities dropdown (remains unchanged)
    const moroccoCities = [
        "Agadir", "Ahfir", "Aïn Bni Mathar", "Aïn Defali", "Aïn El Aouda", "Aït Benhaddou", "Aït Iaaza",
        "Al Hoceïma", "Arbaoua", "Asilah", "Bab Berred", "Béni Mellal", "Ben Slimane", "Berkane", "Berrechid",
        "Bhalil", "Boujdour", "Boulemane", "Boumia", "Bouznika", "Casablanca", "Chefchaouen", "Chichaoua",
        "Dakhla", "Dar Gueddari", "Dar Kebdani", "Demnate", "Driouch", "El Aioun Sidi Mellouk", "El Guerdane",
        "El Hajeb", "El Jadida", "Erfoud", "Errachidia", "Essaouira", "Fès", "Figuig", "Fnideq", "Fquih Ben Salah",
        "Guelmim", "Goulmima", "Guercif", "Had Kourt", "Ifrane", "Imilchil", "Imouzzer Kandar", "Inezgane",
        "Issaouen (Ketama)", "Jerada", "Kénitra", "Khémisset", "Khouribga", "Khénifra", "Ksar El Kébir",
        "Laâyoune", "Larache", "Marrakech", "Martil", "M'diq", "Mohammédia", "Midelt", "Moulay Idriss Zerhoun",
        "Nador", "Ouarzazate", "Oualidia", "Oujda", "Oulad Teïma", "Rabat", "Safi", "Saïdia", "Salé",
        "Témara", "Tanger", "Tarfaya", "Taza", "Tétouan", "Tiznit", "Taroudant"
    ];

    const citySelect = document.getElementById("city");
    if (citySelect && citySelect.options.length === 1) {  // only run once
        moroccoCities.sort().forEach(city => {
            const option = document.createElement("option");
            option.value = city;
            option.textContent = city;
            citySelect.appendChild(option);
        });
    }

    const form = document.getElementById("cod-form");
    if (form) {
        // Attach validation to the form submit
        form.addEventListener('submit', async e => {
            
            // 1. Run the validation function
            const isFormValid = validateCheckoutForm(e); 
            
            if (!isFormValid) {
                // Stop here if validation failed
                return;
            }
            
            // 2. If valid, proceed with order submission
            
            const btn = form.querySelector(".place-order-btn");
            btn.disabled = true;
            btn.textContent = "Placing Order...";

         /*   const orderData = {
                // orderDate: new Date().
                orderId: "WY-" + Date.now().toString().slice(-6), // nice short ID
                name: document.getElementById("name").value.trim(),
                phone: document.getElementById("phone").value.trim(),
                address: document.getElementById("address").value.trim(),
                city: document.getElementById("city").value.trim(),
                notes: document.getElementById("notes").value.trim() || "No notes",
                items: cart.map(i => `${i.name} (${i.qty}x)${i.size ? " - Size: " + i.size : ""}${i.color ? " - Color: " + i.color : ""}`).join(" • "),
                total: total.toFixed(2),
                status: "Pending"                       
            };*/

        const orderData = {
    secret: "Aravena900",
    orderId: "WY-" + Date.now().toString().slice(-6),
    name: document.getElementById("name").value.trim(),
    phone: document.getElementById("phone").value.trim(),
    address: document.getElementById("address").value.trim(),
    city: document.getElementById("city").value.trim(),
    notes: document.getElementById("notes").value.trim() || "No notes",
    items: cart.map(i => `${i.name} (${i.qty}x)${i.size ? " - Size: " + i.size : ""}${i.color ? " - Color: " + i.color : ""}`).join(" • "),
    total: total.toFixed(2),
    status: "Pending"
};

            const webhookURL = "https://hook.eu1.make.com/daglayfja85x5ovvk2zr66qlb0br7pqy"; // ← Replace with your real URL

            try {
                /* await fetch(webhookURL, {
                    method: "POST",
                    body: JSON.stringify(orderData),
                    headers: { "Content-Type": "application/json" }
                });*/
               await fetch("https://script.google.com/macros/s/AKfycby3YlL49Wi3H_eKLSaPtHIES3ZXJvYBDO23qLk01Cf_vTtF7ew0PSNApTSKzaYtLH0F/exec", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(orderData)
});
                localStorage.removeItem("cart");
                updateCartCounter();
                
                // HASH REMOVED: Navigate using the new navigateTo function from app.js
                window.navigateTo('/thankyou'); 
            } catch (err) {
                alert("Order failed. Please try again or contact us.");
                btn.disabled = false;
                btn.textContent = "Place Order";
            }
        });
    }
};

// fixed id scroll utility
window.scrollToElement = function(targetId) {
    const targetElement = document.getElementById(targetId);

    if (targetElement) {
        // Assuming your sticky header is #header
        const siteHeader = document.getElementById("header");
        const headerHeight = siteHeader ? siteHeader.offsetHeight : 0;

        // Calculate the top position of the target element relative to the document
        const targetTop = targetElement.getBoundingClientRect().top + window.pageYOffset;

        // Calculate the final scroll position: Target Top - Header Height - Padding
        const scrollToY = targetTop - headerHeight - 20; // 20px buffer for padding

        window.scrollTo({
            top: scrollToY,
            behavior: "smooth"
        });
    }
};

// ================ CONTACT FORM UTILITIES AND VALIDATION ================

// Global variable to store the CAPTCHA answer
let correctCaptchaAnswer; 

/**
 * Generates a simple math CAPTCHA.
 */
function generateCaptcha() {
    const num1 = Math.floor(Math.random() * 10) + 1;
    const num2 = Math.floor(Math.random() * 5) + 1;
    const operator = (Math.random() > 0.5) ? '+' : '-';
    
    let question;
    let answer;

    if (operator === '+') {
        question = `${num1} + ${num2}`;
        answer = num1 + num2;
    } else {
        const largeNum = Math.max(num1, num2);
        const smallNum = Math.min(num1, num2);
        question = `${largeNum} - ${smallNum}`;
        answer = largeNum - smallNum;
    }
    
    // Update the question text and store the answer
    const questionEl = document.getElementById('captcha-question');
    if (questionEl) {
        questionEl.textContent = `What is ${question}?`;
    }
    correctCaptchaAnswer = answer.toString();
}

/**
 * Validates form fields and CAPTCHA.
 * @returns {boolean} True if all validation passes.
 */
function validateFields() {
    let isValid = true;

    // Helper to validate and display errors
    const checkField = (id, check, message) => {
        const inputEl = document.getElementById(id);
        const errorEl = document.getElementById(id.replace('-input', '-error'));
        
        if (check()) {
            errorEl.textContent = message;
            inputEl.classList.add('invalid');
            isValid = false;
        } else {
            errorEl.textContent = '';
            inputEl.classList.remove('invalid');
        }
    };

    // --- 1. Basic Field Validation ---
    const nameVal = document.getElementById('name-input').value.trim();
    const emailVal = document.getElementById('email-input').value.trim();
    const messageVal = document.getElementById('message-input').value.trim();
    
    checkField('name-input', () => nameVal.length < 2, 'Name must be at least 2 characters.');
    checkField('email-input', () => emailVal === '' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailVal), 'Please enter a valid email address.');
    checkField('message-input', () => messageVal.length < 10, 'Message must be at least 10 characters.');

    // --- 2. CAPTCHA Validation ---
    const captchaInput = document.getElementById('captcha-input');
    const captchaError = document.getElementById('captcha-error');
    const captchaVal = captchaInput.value.trim();
    
    if (captchaVal !== correctCaptchaAnswer) {
        captchaError.textContent = 'Incorrect answer. Please try again.';
        captchaInput.classList.add('invalid');
        generateCaptcha(); // Generate new CAPTCHA on failure
        isValid = false;
    } else {
        captchaError.textContent = '';
        captchaInput.classList.remove('invalid');
    }

    return isValid;
}

/**
 * Handles the click event for the submit button, running validation and fetch.
 */
async function handleContactFormSubmit() {
    // 1. Run client-side validation
    if (!validateFields()) {
        return;
    }

    const form = document.getElementById('contact-form');
    const submitBtn = document.getElementById('submit-button');
    const formData = new FormData(form);
    
    // Disable button and show loading state
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';

    // 2. Submit data via FETCH (required when overriding default form action)
    try {
        const response = await fetch(form.action, {
            method: form.method,
            body: formData,
            headers: {
                'Accept': 'application/json'
            }
        });

        // 3. Handle successful submission
        if (response.ok) {
            const formWrapper = document.querySelector('.contact-form-wrapper');
    // 2. Get the success message element (which is currently hidden in the HTML)
    const successMessage = document.getElementById('contact-success');
    
    if (formWrapper && successMessage) {
        // *** CRITICAL FIX: Replace the form content with the success message ***
        formWrapper.innerHTML = successMessage.outerHTML;

        // Ensure the replaced element is visible (since the original success div had display:none)
        const newSuccessMessage = document.getElementById('contact-success');
        if (newSuccessMessage) {
            newSuccessMessage.style.display = 'block';
            newSuccessMessage.style.opacity = '0'; // Optional: for fade-in effect
            setTimeout(() => { 
                newSuccessMessage.style.transition = 'opacity 0.5s ease';
                newSuccessMessage.style.opacity = '1';
                if (window.scrollToElement) {
                    window.scrollToElement('contact-success'); 
                }
            }, 10);
        }
            } else {
                alert('Success! Your message was sent.');
            }
        } else {
            alert('Form submission failed! Please try again or use WhatsApp.');
            // Re-enable button on failure
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Send Message';
        }

    } catch (error) {
        console.error('Submission error:', error);
        alert('An unexpected error occurred. Please try again.');
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Send Message';
    }
}


// ================ PAGE INITIALIZER FUNCTIONS ================

/**
 * Initializes the contact form page with CAPTCHA and event listeners.
 */
window.loadContact = function() {
    const contactForm = document.getElementById('contact-form');
    const submitButton = document.getElementById('submit-button');
    
    if (contactForm && submitButton) {
        // 1. Generate the initial CAPTCHA question
        generateCaptcha();

        // 2. Attach the new submission handler to the button click
        submitButton.addEventListener('click', handleContactFormSubmit);
    }
    
    // Ensures the success message is initially hidden when the page loads
    const successMessage = document.getElementById('contact-success');
    if (successMessage) {
        successMessage.style.display = 'none';
    }
};