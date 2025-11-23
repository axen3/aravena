const appDiv = document.getElementById("app");

// --- UTILITY FUNCTIONS (Modified to remove hash logic) ---

async function loadUI(file) {
    appDiv.style.opacity = "0";
    const html = await fetch(`/ui/${file}.html`).then(r => r.text());
    appDiv.innerHTML = html;
    
    // Get the current clean route path (e.g., /product/123 -> product)
    const currentPath = location.pathname.split("/")[1] || "home"; 
    
    // ONLY scroll to top for product, checkout, pages – NOT for home/category
    if (!["home", "category", ""].includes(currentPath)) {
        window.scrollTo(0, 0);
    }
    
    requestAnimationFrame(() => {
        appDiv.style.transition = "opacity 0.25s ease";
        appDiv.style.opacity = "1";
    });
}

async function loadHeaderFooter() {
    const header = await fetch("/components/header.html").then(r => r.text());
    document.getElementById("header").innerHTML = header;
    const footer = await fetch("/components/footer.html").then(r => r.text());
    document.getElementById("footer").innerHTML = footer;

    const toggle = document.querySelector(".mobile-menu-toggle");
    const closeBtn = document.querySelector(".mobile-menu-close");
    const nav = document.querySelector(".main-nav");
    const closeMenu = () => nav.classList.remove("active");

    toggle?.addEventListener("click", () => nav.classList.toggle("active"));
    closeBtn?.addEventListener("click", closeMenu);
    document.querySelectorAll(".main-nav a[data-link]").forEach(link => {
        link.addEventListener("click", closeMenu);
    });
}

function updateTitle(title) {
    document.title = title ? `${title} - Wally Store` : "Wally Store";
}

function updateCartCounter() {
    const cart = JSON.parse(localStorage.getItem("cart") || "[]");
    const total = cart.reduce((sum, i) => sum + i.qty, 0);
    const counter = document.getElementById("cart-counter");
    if (counter) counter.textContent = total;
}

// --- NAVIGATION FUNCTION (NEW) ---

const navigateTo = url => {
    // 1. Use History API to change the URL without a page reload
    history.pushState(null, null, url);
    // 2. Run the router logic to render the new content
    router();
};


// --- ROUTER FUNCTION (Modified to use pathname) ---

async function router() {
    // Read the clean URL path, default to "/" if it's just the root domain
    const path = window.location.pathname; 
    
    // Split the path: e.g., /product/123 -> ["", "product", "123"]
    const [_, route, param] = path.split("/"); 
    const currentRoute = route || "home"; // Handle root path "/" as "home"

    if (currentRoute === "home" || currentRoute === "category") {
        await loadUI("home");
        const category = (currentRoute === "category") ? param : null;
        if (window.loadHome) await window.loadHome(category);
        updateTitle(category ? param.charAt(0).toUpperCase() + param.slice(1) : "Home");

    } else if (currentRoute === "product") {
        await loadUI("product");
        if (window.loadProduct) await window.loadProduct(param);

    } else if (currentRoute === "pages" && param) {
        let htmlContent = "";
        let pageTitle = "Page Not Found";
        
        try {
            const response = await fetch(`/pages/${param}.html`);
            if (response.ok) {
                htmlContent = await response.text();
                pageTitle = param.charAt(0).toUpperCase() + param.slice(1).replace(/-/g, " ");
            } else {
                // If page not found, fetch 404
                htmlContent = await fetch("/pages/404.html").then(r => r.text());
            }
        } catch (err) {
            // Handle network errors by showing 404
            htmlContent = await fetch("/pages/404.html").then(r => r.text());
        }

        appDiv.innerHTML = htmlContent;

        requestAnimationFrame(() => {
            appDiv.style.transition = "opacity 0.25s ease";
            appDiv.style.opacity = "1";
        });

        updateTitle(pageTitle); // Removed "- Wally Store" as it's added in updateTitle
        window.scrollTo(0, 0);
    
    } else if (currentRoute === "checkout") {
        await loadUI("checkout");
        const waitForCart = () => {
            if (document.getElementById("cart-items")) {
                window.loadCheckout();
            } else {
                requestAnimationFrame(waitForCart);
            }
        };
        waitForCart();

    } else if (currentRoute === "thankyou") {
        appDiv.innerHTML = `
            <div style="text-align:center;padding:6rem 1rem;">
                <h1>Thank You! 🎉</h1>
                <p>Your order has been placed successfully.</p>
                <p>We will call you soon to confirm.</p>
                <a href="/home" data-link class="cta-button">Continue Shopping</a>
            </div>`;
        updateTitle("Thank You");
        window.scrollTo(0, 0);
        requestAnimationFrame(() => appDiv.style.opacity = "1");

    } else {
        // Fallback for an unknown path, redirect to home using pushState
        navigateTo("/home"); 
    }

    updateCartCounter();
}


// --- EVENT LISTENERS (Modified for History API) ---

document.addEventListener("click", e => {
    const link = e.target.closest("[data-link]");
    if (link) {
        e.preventDefault();
        // Use navigateTo (which uses history.pushState) instead of setting location.hash
        navigateTo(link.getAttribute("href")); 
    }
});

// Use popstate for back/forward buttons instead of hashchange
window.addEventListener("popstate", router); 

document.addEventListener("DOMContentLoaded", async () => {
    await loadHeaderFooter();
    // Use the router to load the initial clean path (e.g., /home, /product/123)
    await router(); 
    // 3. CRITICAL: Once the page is fully assembled (Header, Footer, and Content in #app)
    // and styles are applied, fade in the entire site wrapper.
    const wrapper = document.getElementById("site-wrapper");
    if (wrapper) {
        // Ensure transition is set for a smooth visual reveal
        wrapper.style.transition = "opacity 0.25s ease";
        // Make the entire site visible
        wrapper.style.opacity = "1"; 
    }
    
});