/* =========================================================
   LITTLE STARS — STORE APPLICATION
   Version 2.0 — Supabase Products
========================================================= */
"use strict";
/* =========================================================
   SUPABASE
========================================================= */
const SUPABASE_URL =
    "https://eflcolwdhddfncbuvjua.supabase.co";
const SUPABASE_KEY =
    "sb_publishable_J8K4FI12ExE5stcHVHviRQ_Uk__w4ko";
let supabaseClient = null;
if (window.supabase) {
    supabaseClient = window.supabase.createClient(
        SUPABASE_URL,
        SUPABASE_KEY
    );
} else {
    console.error(
        "Supabase library was not loaded."
    );
}
/* =========================================================
   STORE DATA
========================================================= */
/*
 * Products are now loaded from:
 *
 * Supabase → products
 *
 * We keep this array so the rest of the
 * application can continue using it.
 */
let products = [];
/* =========================================================
   APPLICATION STATE
========================================================= */
let cart = loadCart();
let favorites = loadFavorites();
let currentModalProduct = null;
let currentQuantity = 1;
let selectedSize = null;
/* =========================================================
   DOM ELEMENTS
========================================================= */
const cartButton =
    document.getElementById("cartButton");
const cartDrawer =
    document.getElementById("cartDrawer");
const cartOverlay =
    document.getElementById("cartOverlay");
const closeCartButton =
    document.getElementById("closeCart");
const cartItemsContainer =
    document.getElementById("cartItems");
const cartCount =
    document.getElementById("cartCount");
const cartTotal =
    document.getElementById("cartTotal");
const productsGrid =
    document.getElementById("productsGrid");
const searchInput =
    document.getElementById("searchInput");
const searchButton =
    document.getElementById("searchButton");
const mobileMenu =
    document.getElementById("mobileMenu");
const mobileMenuButton =
    document.getElementById("mobileMenuButton");
const closeMobileMenu =
    document.getElementById("closeMobileMenu");
const productModal =
    document.getElementById("productModal");
const closeProductModal =
    document.getElementById("closeProductModal");
const modalProductImage =
    document.getElementById("modalProductImage");
const modalProductCategory =
    document.getElementById("modalProductCategory");
const modalProductTitle =
    document.getElementById("modalProductTitle");
const modalProductRating =
    document.getElementById("modalProductRating");
const modalProductPrice =
    document.getElementById("modalProductPrice");
const productQuantity =
    document.getElementById("productQuantity");
const decreaseQuantity =
    document.getElementById("decreaseQuantity");
const increaseQuantity =
    document.getElementById("increaseQuantity");
const modalAddToCart =
    document.getElementById("modalAddToCart");
const toast =
    document.getElementById("toast");
const toastMessage =
    document.getElementById("toastMessage");
const newsletterForm =
    document.getElementById("newsletterForm");
const checkoutButton =
    document.getElementById("checkoutButton");
const accountButton =
    document.getElementById("accountButton");
/* =========================================================
   LOCAL STORAGE
========================================================= */
function loadCart() {
    try {
        const saved =
            localStorage.getItem(
                "littleStarsCart"
            );
        return saved
            ? JSON.parse(saved)
            : [];
    } catch (error) {
        console.error(
            "Could not load cart:",
            error
        );
        return [];
    }
}
function saveCart() {
    localStorage.setItem(
        "littleStarsCart",
        JSON.stringify(cart)
    );
}
function loadFavorites() {
    try {
        const saved =
            localStorage.getItem(
                "littleStarsFavorites"
            );
        return saved
            ? JSON.parse(saved)
            : [];
    } catch (error) {
        console.error(
            "Could not load favorites:",
            error
        );
        return [];
    }
}
function saveFavorites() {
    localStorage.setItem(
        "littleStarsFavorites",
        JSON.stringify(favorites)
    );
}
/* =========================================================
   INITIALIZE
========================================================= */
document.addEventListener(
    "DOMContentLoaded",
    async () => {
        setupEventListeners();
        setupSizeButtons();
        updateCartUI();
        updateFavoriteButtons();
        await loadProducts();
    }
);
/* =========================================================
   LOAD PRODUCTS FROM SUPABASE
========================================================= */
async function loadProducts() {
    if (!supabaseClient) {
        showToast(
            "تعذر الاتصال بقاعدة البيانات",
            "!"
        );
        return;
    }
    try {
        const {
            data,
            error
        } = await supabaseClient
            .from("products")
            .select("*")
            .eq("is_active", true)
            .order(
                "created_at",
                {
                    ascending: false
                }
            );
        if (error) {
            console.error(
                "Supabase products error:",
                error
            );
            showToast(
                "حدث خطأ أثناء تحميل المنتجات",
                "!"
            );
            return;
        }
        products =
            (data || []).map(
                normalizeProduct
            );
        console.log(
            `Loaded ${products.length} products from Supabase`
        );
        renderProducts(products);
        updateCartUI();
    } catch (error) {
        console.error(
            "Unexpected products error:",
            error
        );
        showToast(
            "تعذر تحميل المنتجات",
            "!"
        );
    }
}
/* =========================================================
   NORMALIZE SUPABASE PRODUCT
========================================================= */
function normalizeProduct(
    product
) {
    const colors =
        normalizeJSONField(
            product.colors
        );
    const sizes =
        normalizeJSONField(
            product.sizes
        );
    return {
        id:
            product.id,
        name:
            product.name || "منتج",
        description:
            product.description || "",
        category:
            detectCategory(
                product
            ),
        categoryName:
            detectCategoryName(
                product
            ),
        price:
            Number(
                product.sale_price ??
                product.price ??
                0
            ),
        oldPrice:
            product.sale_price !== null &&
            product.sale_price !== undefined &&
            Number(product.sale_price) <
            Number(product.price)
                ? Number(product.price)
                : null,
        originalPrice:
            Number(
                product.price || 0
            ),
        salePrice:
            product.sale_price !== null &&
            product.sale_price !== undefined
                ? Number(product.sale_price)
                : null,
        rating:
            Number(
                product.rating || 5
            ),
        reviews:
            Number(
                product.reviews || 0
            ),
        image:
            product.image_url ||
            "https://via.placeholder.com/800x1000?text=Little+Stars",
        image_url:
            product.image_url || "",
        sku:
            product.sku || "",
        barcode:
            product.barcode || "",
        stock:
            Number(
                product.stock || 0
            ),
        colors,
        sizes,
        label:
            getProductLabel(product)
    };
}
/* =========================================================
   JSONB NORMALIZER
========================================================= */
function normalizeJSONField(
    value
) {
    if (Array.isArray(value)) {
        return value;
    }
    if (value === null ||
        value === undefined) {
        return [];
    }
    if (typeof value === "string") {
        try {
            const parsed =
                JSON.parse(value);
            return Array.isArray(parsed)
                ? parsed
                : [];
        } catch {
            return [];
        }
    }
    if (typeof value === "object") {
        return Object.values(value);
    }
    return [];
}
/* =========================================================
   CATEGORY DETECTION
========================================================= */
function detectCategory(
    product
) {
    const text =
        [
            product.name,
            product.description,
            product.sku
        ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase();
    if (
        text.includes("بنات") ||
        text.includes("girl") ||
        text.includes("dress") ||
        text.includes("فستان")
    ) {
        return "girls";
    }
    if (
        text.includes("مواليد") ||
        text.includes("baby") ||
        text.includes("newborn") ||
        text.includes("رضيع")
    ) {
        return "baby";
    }
    return "boys";
}
function detectCategoryName(
    product
) {
    const category =
        detectCategory(product);
    if (category === "girls") {
        return "بنات";
    }
    if (category === "baby") {
        return "مواليد";
    }
    return "أولاد";
}
/* =========================================================
   PRODUCT LABEL
========================================================= */
function getProductLabel(
    product
) {
    if (
        product.sale_price !== null &&
        product.sale_price !== undefined &&
        Number(product.sale_price) <
        Number(product.price)
    ) {
        return "خصم";
    }
    if (
        Number(product.stock || 0) <= 0
    ) {
        return "نفد";
    }
    return "جديد";
}
/* =========================================================
   EVENT LISTENERS
========================================================= */
function setupEventListeners() {
    /* CART */
    if (cartButton) {
        cartButton.addEventListener(
            "click",
            openCart
        );
    }
    if (closeCartButton) {
        closeCartButton.addEventListener(
            "click",
            closeCart
        );
    }
    if (cartOverlay) {
        cartOverlay.addEventListener(
            "click",
            closeCart
        );
    }
    /* MOBILE MENU */
    if (mobileMenuButton) {
        mobileMenuButton.addEventListener(
            "click",
            openMobileMenu
        );
    }
    if (closeMobileMenu) {
        closeMobileMenu.addEventListener(
            "click",
            closeMobileMenuPanel
        );
    }
    document
        .querySelectorAll(
            ".mobile-menu-links a"
        )
        .forEach(link => {
            link.addEventListener(
                "click",
                closeMobileMenuPanel
            );
        });
    /* SEARCH */
    if (searchInput) {
        searchInput.addEventListener(
            "input",
            () => {
                performSearch(
                    searchInput.value
                );
            }
        );
        searchInput.addEventListener(
            "keydown",
            event => {
                if (event.key === "Enter") {
                    event.preventDefault();
                    performSearch(
                        searchInput.value
                    );
                }
            }
        );
    }
    if (searchButton) {
        searchButton.addEventListener(
            "click",
            () => {
                performSearch(
                    searchInput
                        ? searchInput.value
                        : ""
                );
            }
        );
    }
    /* PRODUCT MODAL */
    if (closeProductModal) {
        closeProductModal.addEventListener(
            "click",
            closeProductModalWindow
        );
    }
    if (productModal) {
        productModal.addEventListener(
            "click",
            event => {
                if (
                    event.target ===
                    productModal
                ) {
                    closeProductModalWindow();
                }
            }
        );
    }
    /* QUANTITY */
    if (decreaseQuantity) {
        decreaseQuantity.addEventListener(
            "click",
            () => {
                if (
                    currentQuantity > 1
                ) {
                    currentQuantity--;
                    updateModalQuantity();
                }
            }
        );
    }
    if (increaseQuantity) {
        increaseQuantity.addEventListener(
            "click",
            () => {
                if (
                    currentModalProduct &&
                    currentQuantity <
                    currentModalProduct.stock
                ) {
                    currentQuantity++;
                    updateModalQuantity();
                }
            }
        );
    }
    /* MODAL ADD TO CART */
    if (modalAddToCart) {
        modalAddToCart.addEventListener(
            "click",
            () => {
                if (!currentModalProduct) {
                    return;
                }
                addToCart(
                    currentModalProduct.id,
                    currentQuantity,
                    selectedSize
                );
                closeProductModalWindow();
            }
        );
    }
    /* NEWSLETTER */
    if (newsletterForm) {
        newsletterForm.addEventListener(
            "submit",
            event => {
                event.preventDefault();
                const email =
                    document
                        .getElementById(
                            "newsletterEmail"
                        )
                        ?.value
                        .trim();
                if (!email) {
                    showToast(
                        "يرجى إدخال البريد الإلكتروني",
                        "!"
                    );
                    return;
                }
                localStorage.setItem(
                    "littleStarsNewsletter",
                    email
                );
                newsletterForm.reset();
                showToast(
                    "تم الاشتراك بنجاح ❤️"
                );
            }
        );
    }
    /* CHECKOUT */
    if (checkoutButton) {
        checkoutButton.addEventListener(
            "click",
            handleCheckout
        );
    }
    /* ACCOUNT */
    if (accountButton) {
        accountButton.addEventListener(
            "click",
            () => {
                showToast(
                    "قسم حساب العميل سيتم تفعيله مع نظام الطلبات."
                );
            }
        );
    }
    /* ESCAPE */
    document.addEventListener(
        "keydown",
        event => {
            if (
                event.key !== "Escape"
            ) {
                return;
            }
            closeCart();
            closeProductModalWindow();
            closeMobileMenuPanel();
        }
    );
    /* CATEGORY FILTER */
    document
        .querySelectorAll(
            ".navigation-container a"
        )
        .forEach(link => {
            link.addEventListener(
                "click",
                handleCategoryClick
            );
        });
}
/* =========================================================
   RENDER PRODUCTS
========================================================= */
function renderProducts(
    productList
) {
    if (!productsGrid) {
        return;
    }
    if (!productList.length) {
        productsGrid.innerHTML = `
            <div class="no-products">
                <div>
                    🔎
                </div>
                <h3>
                    لم نجد منتجات مطابقة
                </h3>
                <p>
                    جرّب البحث بكلمة أخرى.
                </p>
            </div>
        `;
        return;
    }
    productsGrid.innerHTML =
        productList
            .map(
                product =>
                    createProductHTML(
                        product
                    )
            )
            .join("");
    attachProductEvents();
    updateFavoriteButtons();
}
/* =========================================================
   PRODUCT HTML
========================================================= */
function createProductHTML(
    product
) {
    const oldPriceHTML =
        product.oldPrice
            ? `
                <del>
                    ₪${product.oldPrice}
                </del>
            `
            : "";
    const colorsHTML =
        product.colors
            .map(
                color => {
                    const safeColor =
                        String(color)
                            .toLowerCase()
                            .replace(
                                /[^a-z0-9_-]/g,
                                ""
                            );
                    return `
                        <span
                            class="color-dot ${safeColor}"
                            title="${escapeHTML(
                                String(color)
                            )}">
                        </span>
                    `;
                }
            )
            .join("");
    const outOfStock =
        Number(product.stock) <= 0;
    return `
        <article
            class="product-card"
            data-product-id="${escapeHTML(
                product.id
            )}">
            <div class="product-image-wrapper">
                <span class="product-label ${
                    product.label === "خصم"
                        ? "sale"
                        : product.label === "نفد"
                        ? "sale"
                        : "new"
                }">
                    ${escapeHTML(
                        product.label
                    )}
                </span>
                <button
                    class="favorite-button"
                    type="button"
                    data-favorite="${escapeHTML(
                        product.id
                    )}"
                    aria-label="إضافة للمفضلة">
                    ♡
                </button>
                <img
                    src="${escapeHTML(
                        product.image
                    )}"
                    alt="${escapeHTML(
                        product.name
                    )}"
                    loading="lazy">
                <button
                    class="quick-view-button"
                    type="button"
                    data-quick-view="${escapeHTML(
                        product.id
                    )}">
                    عرض سريع
                </button>
            </div>
            <div class="product-info">
                <span class="product-category">
                    ${escapeHTML(
                        product.categoryName
                    )}
                </span>
                <h3>
                    ${escapeHTML(
                        product.name
                    )}
                </h3>
                <div class="product-rating">
                    ${createStars(
                        product.rating
                    )}
                    <span>
                        (${product.reviews})
                    </span>
                </div>
                <div class="product-price">
                    <strong>
                        ₪${formatPrice(
                            product.price
                        )}
                    </strong>
                    ${oldPriceHTML}
                </div>
                <div class="product-options">
                    ${colorsHTML}
                </div>
                <button
                    class="add-to-cart-button"
                    type="button"
                    data-add-cart="${escapeHTML(
                        product.id
                    )}"
                    ${outOfStock ? "disabled" : ""}>
                    ${
                        outOfStock
                            ? "غير متوفر"
                            : "🛒 أضف للسلة"
                    }
                </button>
            </div>
        </article>
    `;
}
/* =========================================================
   HELPERS
========================================================= */
function escapeHTML(
    value
) {
    return String(value ?? "")
        .replace(
            /&/g,
            "&amp;"
        )
        .replace(
            /</g,
            "&lt;"
        )
        .replace(
            />/g,
            "&gt;"
        )
        .replace(
            /"/g,
            "&quot;"
        )
        .replace(
            /'/g,
            "&#039;"
        );
}
function formatPrice(
    value
) {
    const number =
        Number(value || 0);
    return Number.isInteger(number)
        ? String(number)
        : number.toFixed(2);
}
/* =========================================================
   STARS
========================================================= */
function createStars(
    rating
) {
    const safeRating =
        Math.max(
            0,
            Math.min(
                5,
                Number(rating || 0)
            )
        );
    return "★".repeat(
        Math.round(safeRating)
    );
}
/* =========================================================
   PRODUCT EVENTS
========================================================= */
function attachProductEvents() {
    document
        .querySelectorAll(
            "[data-add-cart]"
        )
        .forEach(button => {
            button.addEventListener(
                "click",
                () => {
                    addToCart(
                        button.dataset.addCart,
                        1,
                        null
                    );
                }
            );
        });
    document
        .querySelectorAll(
            "[data-quick-view]"
        )
        .forEach(button => {
            button.addEventListener(
                "click",
                () => {
                    const product =
                        findProduct(
                            button.dataset.quickView
                        );
                    if (product) {
                        openProductModal(
                            product
                        );
                    }
                }
            );
        });
    document
        .querySelectorAll(
            "[data-favorite]"
        )
        .forEach(button => {
            button.addEventListener(
                "click",
                () => {
                    toggleFavorite(
                        button.dataset.favorite
                    );
                }
            );
        });
}
/* =========================================================
   FIND PRODUCT
========================================================= */
function findProduct(
    productId
) {
    return products.find(
        product =>
            String(product.id) ===
            String(productId)
    );
}
/* =========================================================
   CART
========================================================= */
function addToCart(
    productId,
    quantity = 1,
    size = null
) {
    const product =
        findProduct(productId);
    if (!product) {
        showToast(
            "المنتج غير موجود",
            "!"
        );
        return;
    }
    if (
        Number(product.stock) <= 0
    ) {
        showToast(
            "هذا المنتج غير متوفر حاليًا",
            "!"
        );
        return;
    }
    const existingItem =
        cart.find(
            item =>
                String(item.productId) ===
                String(productId) &&
                String(item.size || "") ===
                String(size || "")
        );
    if (existingItem) {
        const newQuantity =
            existingItem.quantity +
            quantity;
        if (
            newQuantity >
            product.stock
        ) {
            showToast(
                `المتوفر فقط ${product.stock} قطع`,
                "!"
            );
            return;
        }
        existingItem.quantity =
            newQuantity;
    } else {
        cart.push({
            productId,
            quantity,
            size
        });
    }
    saveCart();
    updateCartUI();
    showToast(
        "تمت إضافة المنتج إلى السلة 🛒"
    );
}
/* =========================================================
   UPDATE CART UI
========================================================= */
function updateCartUI() {
    const totalItems =
        cart.reduce(
            (
                total,
                item
            ) =>
                total +
                Number(item.quantity || 0),
            0
        );
    if (cartCount) {
        cartCount.textContent =
            totalItems;
    }
    renderCartItems();
}
/* =========================================================
   RENDER CART
========================================================= */
function renderCartItems() {
    if (!cartItemsContainer) {
        return;
    }
    if (!cart.length) {
        cartItemsContainer.innerHTML = `
            <div class="empty-cart">
                <div>
                    🛒
                </div>
                <h3>
                    السلة فارغة
                </h3>
                <p>
                    أضف منتجاتك المفضلة إلى السلة.
                </p>
            </div>
        `;
        if (cartTotal) {
            cartTotal.textContent =
                "₪0";
        }
        return;
    }
    cartItemsContainer.innerHTML =
        cart
            .map(
                item =>
                    createCartItemHTML(
                        item
                    )
            )
            .join("");
    attachCartEvents();
    updateCartTotal();
}
/* =========================================================
   CART ITEM HTML
========================================================= */
function createCartItemHTML(
    item
) {
    const product =
        findProduct(
            item.productId
        );
    if (!product) {
        return "";
    }
    return `
        <div
            class="cart-item"
            data-cart-item="${escapeHTML(
                product.id
            )}">
            <img
                src="${escapeHTML(
                    product.image
                )}"
                alt="${escapeHTML(
                    product.name
                )}">
            <div class="cart-item-info">
                <h4>
                    ${escapeHTML(
                        product.name
                    )}
                </h4>
                <small>
                    ${escapeHTML(
                        product.categoryName
                    )}
                    ${
                        item.size
                            ? ` • ${escapeHTML(
                                item.size
                            )}`
                            : ""
                    }
                </small>
                <strong>
                    ₪${formatPrice(
                        product.price
                    )}
                </strong>
                <div class="cart-item-controls">
                    <button
                        type="button"
                        data-cart-minus="${escapeHTML(
                            product.id
                        )}"
                        data-cart-size="${
                            escapeHTML(
                                item.size || ""
                            )
                        }">
                        −
                    </button>
                    <span>
                        ${item.quantity}
                    </span>
                    <button
                        type="button"
                        data-cart-plus="${escapeHTML(
                            product.id
                        )}"
                        data-cart-size="${
                            escapeHTML(
                                item.size || ""
                            )
                        }">
                        +
                    </button>
                </div>
            </div>
            <button
                class="cart-remove"
                type="button"
                data-cart-remove="${escapeHTML(
                    product.id
                )}"
                data-cart-size="${
                    escapeHTML(
                        item.size || ""
                    )
                }">
                🗑️
            </button>
        </div>
    `;
}
/* =========================================================
   CART EVENTS
========================================================= */
function attachCartEvents() {
    document
        .querySelectorAll(
            "[data-cart-minus]"
        )
        .forEach(button => {
            button.addEventListener(
                "click",
                () => {
                    changeCartQuantity(
                        button.dataset.cartMinus,
                        button.dataset.cartSize,
                        -1
                    );
                }
            );
        });
    document
        .querySelectorAll(
            "[data-cart-plus]"
        )
        .forEach(button => {
            button.addEventListener(
                "click",
                () => {
                    changeCartQuantity(
                        button.dataset.cartPlus,
                        button.dataset.cartSize,
                        1
                    );
                }
            );
        });
    document
        .querySelectorAll(
            "[data-cart-remove]"
        )
        .forEach(button => {
            button.addEventListener(
                "click",
                () => {
                    removeFromCart(
                        button.dataset.cartRemove,
                        button.dataset.cartSize
                    );
                }
            );
        });
}
/* =========================================================
   CHANGE CART QUANTITY
========================================================= */
function changeCartQuantity(
    productId,
    size,
    change
) {
    const item =
        cart.find(
            cartItem =>
                String(
                    cartItem.productId
                ) ===
                String(productId) &&
                String(
                    cartItem.size || ""
                ) ===
                String(size || "")
        );
    const product =
        findProduct(productId);
    if (!item || !product) {
        return;
    }
    const newQuantity =
        item.quantity +
        change;
    if (newQuantity <= 0) {
        removeFromCart(
            productId,
            size
        );
        return;
    }
    if (
        newQuantity >
        product.stock
    ) {
        showToast(
            `المتوفر فقط ${product.stock} قطع`,
            "!"
        );
        return;
    }
    item.quantity =
        newQuantity;
    saveCart();
    updateCartUI();
}
/* =========================================================
   REMOVE CART ITEM
========================================================= */
function removeFromCart(
    productId,
    size
) {
    cart =
        cart.filter(
            item =>
                !(
                    String(
                        item.productId
                    ) ===
                    String(productId) &&
                    String(
                        item.size || ""
                    ) ===
                    String(size || "")
                )
        );
    saveCart();
    updateCartUI();
    showToast(
        "تم حذف المنتج من السلة"
    );
}
/* =========================================================
   CART TOTAL
========================================================= */
function calculateCartTotal() {
    return cart.reduce(
        (
            total,
            item
        ) => {
            const product =
                findProduct(
                    item.productId
                );
            if (!product) {
                return total;
            }
            return (
                total +
                Number(product.price || 0) *
                Number(item.quantity || 0)
            );
        },
        0
    );
}
function updateCartTotal() {
    if (!cartTotal) {
        return;
    }
    const total =
        calculateCartTotal();
    cartTotal.textContent =
        `₪${formatPrice(total)}`;
}
/* =========================================================
   OPEN / CLOSE CART
========================================================= */
function openCart() {
    if (cartDrawer) {
        cartDrawer.classList.add(
            "open"
        );
    }
    if (cartOverlay) {
        cartOverlay.classList.add(
            "open"
        );
    }
    document.body.style.overflow =
        "hidden";
}
function closeCart() {
    if (cartDrawer) {
        cartDrawer.classList.remove(
            "open"
        );
    }
    if (cartOverlay) {
        cartOverlay.classList.remove(
            "open"
        );
    }
    document.body.style.overflow =
        "";
}
/* =========================================================
   MOBILE MENU
========================================================= */
function openMobileMenu() {
    if (mobileMenu) {
        mobileMenu.classList.add(
            "open"
        );
    }
    document.body.style.overflow =
        "hidden";
}
function closeMobileMenuPanel() {
    if (mobileMenu) {
        mobileMenu.classList.remove(
            "open"
        );
    }
    document.body.style.overflow =
        "";
}
/* =========================================================
   SEARCH
========================================================= */
function performSearch(
    query
) {
    const cleanQuery =
        String(query || "")
            .trim()
            .toLowerCase();
    if (!cleanQuery) {
        renderProducts(products);
        return;
    }
    const filtered =
        products.filter(
            product => {
                const searchableText =
                    [
                        product.name,
                        product.description,
                        product.categoryName,
                        product.category,
                        product.sku,
                        product.barcode
                    ]
                        .filter(Boolean)
                        .join(" ")
                        .toLowerCase();
                return searchableText.includes(
                    cleanQuery
                );
            }
        );
    renderProducts(filtered);
    const productsSection =
        document.getElementById(
            "products"
        );
    if (productsSection) {
        productsSection.scrollIntoView({
            behavior: "smooth"
        });
    }
}
/* =========================================================
   FAVORITES
========================================================= */
function toggleFavorite(
    productId
) {
    const index =
        favorites.indexOf(
            productId
        );
    if (index === -1) {
        favorites.push(
            productId
        );
        showToast(
            "تمت إضافة المنتج للمفضلة ❤️"
        );
    } else {
        favorites.splice(
            index,
            1
        );
        showToast(
            "تم حذف المنتج من المفضلة"
        );
    }
    saveFavorites();
    updateFavoriteButtons();
}
function updateFavoriteButtons() {
    document
        .querySelectorAll(
            "[data-favorite]"
        )
        .forEach(button => {
            const productId =
                button.dataset.favorite;
            if (
                favorites.includes(
                    productId
                )
            ) {
                button.textContent =
                    "♥️";
                button.style.color =
                    "#ff5d73";
            } else {
                button.textContent =
                    "♡";
                button.style.color =
                    "";
            }
        });
}
/* =========================================================
   PRODUCT MODAL
========================================================= */
function openProductModal(
    product
) {
    currentModalProduct =
        product;
    currentQuantity = 1;
    selectedSize =
        product.sizes &&
        product.sizes.length
            ? product.sizes[0]
            : null;
    if (modalProductImage) {
        modalProductImage.src =
            product.image;
        modalProductImage.alt =
            product.name;
    }
    if (modalProductCategory) {
        modalProductCategory.textContent =
            product.categoryName;
    }
    if (modalProductTitle) {
        modalProductTitle.textContent =
            product.name;
    }
    if (modalProductRating) {
        modalProductRating.innerHTML =
            `
                ${createStars(
                    product.rating
                )}
                <span>
                    (${product.reviews})
                </span>
            `;
    }
    if (modalProductPrice) {
        modalProductPrice.innerHTML =
            `
                <strong>
                    ₪${formatPrice(
                        product.price
                    )}
                </strong>
                ${
                    product.oldPrice
                        ? `
                            <del>
                                ₪${formatPrice(
                                    product.oldPrice
                                )}
                            </del>
                        `
                        : ""
                }
            `;
    }
    updateModalQuantity();
    updateSizeButtons();
    if (productModal) {
        productModal.classList.add(
            "open"
        );
    }
    document.body.style.overflow =
        "hidden";
}
function closeProductModalWindow() {
    if (productModal) {
        productModal.classList.remove(
            "open"
        );
    }
    currentModalProduct =
        null;
    document.body.style.overflow =
        "";
}
/* =========================================================
   MODAL QUANTITY
========================================================= */
function updateModalQuantity() {
    if (productQuantity) {
        productQuantity.textContent =
            currentQuantity;
    }
}
/* =========================================================
   SIZE BUTTONS
========================================================= */
function setupSizeButtons() {
    document
        .querySelectorAll(
            ".size-options button"
        )
        .forEach(button => {
            button.addEventListener(
                "click",
                () => {
                    document
                        .querySelectorAll(
                            ".size-options button"
                        )
                        .forEach(
                            otherButton => {
                                otherButton.classList.remove(
                                    "selected"
                                );
                            }
                        );
                    button.classList.add(
                        "selected"
                    );
                    selectedSize =
                        button.textContent.trim();
                }
            );
        });
}
function updateSizeButtons() {
    const buttons =
        document.querySelectorAll(
            ".size-options button"
        );
    if (!currentModalProduct) {
        return;
    }
    buttons.forEach(
        (
            button,
            index
        ) => {
            const size =
                currentModalProduct
                    .sizes[index];
            if (size) {
                button.textContent =
                    size;
                button.style.display =
                    "";
            } else {
                button.style.display =
                    "none";
            }
            button.classList.toggle(
                "selected",
                size === selectedSize
            );
        }
    );
}
/* =========================================================
   TOAST
========================================================= */
let toastTimer = null;
function showToast(
    message,
    icon = "✓"
) {
    if (!toast) {
        return;
    }
    const toastIcon =
        document.getElementById(
            "toastIcon"
        );
    if (toastMessage) {
        toastMessage.textContent =
            message;
    }
    if (toastIcon) {
        toastIcon.textContent =
            icon;
    }
    toast.classList.add(
        "show"
    );
    clearTimeout(
        toastTimer
    );
    toastTimer =
        setTimeout(
            () => {
                toast.classList.remove(
                    "show"
                );
            },
            3000
        );
}
/* =========================================================
   CHECKOUT
========================================================= */
function handleCheckout() {
    if (!cart.length) {
        showToast(
            "السلة فارغة",
            "!"
        );
        return;
    }
    showToast(
        "سيتم ربط إتمام الطلب بقاعدة البيانات في الخطوة التالية 🛍️"
    );
}
/* =========================================================
   CATEGORY FILTERING
========================================================= */
function handleCategoryClick(
    event
) {
    const href =
        event.currentTarget.getAttribute(
            "href"
        );
    if (
        !href ||
        !href.startsWith("#")
    ) {
        return;
    }
    const category =
        href.substring(1);
    if (
        [
            "boys",
            "girls",
            "baby"
        ].includes(
            category
        )
    ) {
        event.preventDefault();
        const filtered =
            products.filter(
                product =>
                    product.category ===
                    category
            );
        renderProducts(
            filtered
        );
        const section =
            document.getElementById(
                "products"
            );
        if (section) {
            section.scrollIntoView({
                behavior: "smooth"
            });
        }
    }
}
/* =========================================================
   WINDOW STORAGE SYNC
========================================================= */
window.addEventListener(
    "storage",
    event => {
        if (
            event.key ===
            "littleStarsCart"
        ) {
            cart =
                loadCart();
            updateCartUI();
        }
        if (
            event.key ===
            "littleStarsFavorites"
        ) {
            favorites =
                loadFavorites();
            updateFavoriteButtons();
        }
    }
);
/* =========================================================
   SUPABASE REALTIME PRODUCT REFRESH
========================================================= */
if (supabaseClient) {
    supabaseClient
        .channel(
            "products-live"
        )
        .on(
            "postgres_changes",
            {
                event: "*",
                schema: "public",
                table: "products"
            },
            async () => {
                await loadProducts();
            }
        )
        .subscribe();
}
/* =========================================================
   EXPOSE STORE FUNCTIONS
========================================================= */
window.LittleStarsStore = {
    products: () => products,
    getCart() {
        return cart;
    },
    getFavorites() {
        return favorites;
    },
    getCartTotal() {
        return calculateCartTotal();
    },
    addToCart,
    removeFromCart,
    openProductModal,
    showToast,
    reloadProducts:
        loadProducts
};
/* =========================================================
   END
========================================================= */
