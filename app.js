/* =========================================================
   KOSHI.WEAR — CUSTOMER STORE APP
   Supabase + Products + Cart + Favorites + Checkout
   ========================================================= */

const SUPABASE_URL =
  "https://eflcolwdhddfncbuvjua.supabase.co";

/*
  IMPORTANT:
  Keep your existing Supabase Publishable Key here.
  NEVER use the Supabase Secret Key in this file.
*/
const SUPABASE_PUBLISHABLE_KEY =
  "sb_publishable_J8K4FI12ExE5stcHVHviRQ_Uk__w4ko";

const supabaseClient =
  window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_PUBLISHABLE_KEY
  );


/* =========================================================
   STATE
   ========================================================= */

let products = [];
let filteredProducts = [];

let cart = [];
let favorites = [];

let selectedProduct = null;
let selectedColor = null;
let selectedSize = null;
let selectedQuantity = 1;

let currentCategory = "all";
let currentSearch = "";
let currentSort = "newest";


/* =========================================================
   DOM
   ========================================================= */

const productsGrid =
  document.getElementById("productsGrid");

const productsLoading =
  document.getElementById("productsLoading");

const productsEmpty =
  document.getElementById("productsEmpty");

const newProductsGrid =
  document.getElementById("newProductsGrid");

const bestProductsGrid =
  document.getElementById("bestProductsGrid");

const offersProductsGrid =
  document.getElementById("offersProductsGrid");

const favoritesGrid =
  document.getElementById("favoritesGrid");

const cartButton =
  document.getElementById("cartButton");

const cartDrawer =
  document.getElementById("cartDrawer");

const closeCart =
  document.getElementById("closeCart");

const overlay =
  document.getElementById("overlay");

const cartBody =
  document.getElementById("cartBody");

const cartCount =
  document.getElementById("cartCount");

const cartTotal =
  document.getElementById("cartTotal");

const checkoutButton =
  document.getElementById("checkoutButton");

const searchBtn =
  document.getElementById("searchBtn");

const searchPanel =
  document.getElementById("searchPanel");

const closeSearch =
  document.getElementById("closeSearch");

const searchInput =
  document.getElementById("searchInput");

const sortProducts =
  document.getElementById("sortProducts");

const mobileMenuBtn =
  document.getElementById("mobileMenuBtn");

const mobileNav =
  document.getElementById("mobileNav");

const productModal =
  document.getElementById("productModal");

const productModalBody =
  document.getElementById("productModalBody");


/* =========================================================
   HELPERS
   ========================================================= */

function escapeHTML(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}


function formatPrice(value) {
  const number = Number(value || 0);
  return `${number.toFixed(2)} ₪`;
}


function getProductPrice(product) {
  const price = Number(product?.price || 0);

  const salePrice =
    product?.sale_price !== null &&
    product?.sale_price !== undefined &&
    product?.sale_price !== ""
      ? Number(product.sale_price)
      : null;

  if (
    salePrice !== null &&
    Number.isFinite(salePrice) &&
    salePrice > 0 &&
    salePrice < price
  ) {
    return salePrice;
  }

  return price;
}


function getDiscount(product) {
  const price = Number(product?.price || 0);

  const salePrice =
    product?.sale_price !== null &&
    product?.sale_price !== undefined &&
    product?.sale_price !== ""
      ? Number(product.sale_price)
      : null;

  if (
    !price ||
    salePrice === null ||
    !Number.isFinite(salePrice) ||
    salePrice >= price
  ) {
    return 0;
  }

  return Math.round(
    ((price - salePrice) / price) * 100
  );
}


function normalizeArray(value) {
  if (Array.isArray(value)) {
    return value;
  }

  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);

      if (Array.isArray(parsed)) {
        return parsed;
      }
    } catch (_) {}

    return value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
}


function colorToCSS(color) {
  const map = {
    black: "#111",
    white: "#fff",
    gray: "#888",
    grey: "#888",
    red: "#b3261e",
    blue: "#315ea8",
    green: "#39844a",
    yellow: "#d9a800",
    orange: "#d46b22",
    pink: "#e18ca4",
    purple: "#8055a5",
    brown: "#76513c",
    beige: "#d9c7a7",
    gold: "#c9a227",
    silver: "#c0c0c0",

    أسود: "#111",
    أبيض: "#fff",
    رمادي: "#888",
    أحمر: "#b3261e",
    أزرق: "#315ea8",
    أخضر: "#39844a",
    أصفر: "#d9a800",
    وردي: "#e18ca4",
    بنفسجي: "#8055a5",
    بني: "#76513c",
    بيج: "#d9c7a7",
    ذهبي: "#c9a227",
    فضي: "#c0c0c0"
  };

  return (
    map[String(color || "").toLowerCase()] ||
    "#ddd"
  );
}


function getImage(product) {
  return (
    product?.image_url ||
    "https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=900&q=85"
  );
}


function showToast(message) {
  let toast =
    document.getElementById("koshiToast");

  if (!toast) {
    toast = document.createElement("div");
    toast.id = "koshiToast";

    toast.style.cssText = `
      position:fixed;
      left:50%;
      bottom:85px;
      transform:translateX(-50%) translateY(20px);
      background:#111;
      color:#fff;
      padding:13px 20px;
      border-radius:999px;
      z-index:99999;
      font-size:14px;
      opacity:0;
      transition:.25s ease;
      pointer-events:none;
      white-space:nowrap;
      box-shadow:0 10px 30px rgba(0,0,0,.18);
    `;

    document.body.appendChild(toast);
  }

  toast.textContent = message;

  requestAnimationFrame(() => {
    toast.style.opacity = "1";
    toast.style.transform =
      "translateX(-50%) translateY(0)";
  });

  clearTimeout(toast._timer);

  toast._timer = setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform =
      "translateX(-50%) translateY(20px)";
  }, 2200);
}


/* =========================================================
   LOCAL STORAGE
   ========================================================= */

function loadCart() {
  try {
    const saved =
      localStorage.getItem("koshi_cart");

    if (saved) {
      const parsed = JSON.parse(saved);

      if (Array.isArray(parsed)) {
        cart = parsed;
      }
    }
  } catch (error) {
    console.error("Cart load error:", error);
    cart = [];
  }

  renderCart();
}


function saveCart() {
  localStorage.setItem(
    "koshi_cart",
    JSON.stringify(cart)
  );
}


function loadFavorites() {
  try {
    const saved =
      localStorage.getItem("koshi_favorites");

    if (saved) {
      const parsed = JSON.parse(saved);

      if (Array.isArray(parsed)) {
        favorites = parsed;
      }
    }
  } catch (error) {
    console.error(
      "Favorites load error:",
      error
    );

    favorites = [];
  }
}


function saveFavorites() {
  localStorage.setItem(
    "koshi_favorites",
    JSON.stringify(favorites)
  );
}


/* =========================================================
   FAVORITES
   ========================================================= */

function isFavorite(productId) {
  return favorites.includes(productId);
}


function toggleFavorite(product) {
  if (!product?.id) {
    return;
  }

  if (isFavorite(product.id)) {
    favorites = favorites.filter(
      (id) => id !== product.id
    );

    showToast("تمت إزالة المنتج من المفضلة");
  } else {
    favorites.push(product.id);

    showToast("تمت إضافة المنتج إلى المفضلة ❤️");
  }

  saveFavorites();

  renderProducts();
  renderSpecialSections();
  renderFavorites();
}


function renderFavorites() {
  if (!favoritesGrid) {
    return;
  }

  const favoriteProducts =
    products.filter((product) =>
      favorites.includes(product.id)
    );

  if (!favoriteProducts.length) {
    favoritesGrid.innerHTML = `
      <div style="
        grid-column:1/-1;
        text-align:center;
        padding:35px 15px;
        color:#777;
      ">
        لا توجد منتجات في المفضلة حاليًا ❤️
      </div>
    `;

    return;
  }

  favoritesGrid.innerHTML = "";

  favoriteProducts.forEach((product) => {
    favoritesGrid.appendChild(
      createProductCard(product)
    );
  });
}


/* =========================================================
   LOAD PRODUCTS
   ========================================================= */

async function loadProducts() {
  if (productsLoading) {
    productsLoading.hidden = false;
  }

  if (productsEmpty) {
    productsEmpty.hidden = true;
  }

  if (productsGrid) {
    productsGrid.innerHTML = "";
  }

  const {
    data,
    error
  } = await supabaseClient
    .from("products")
    .select("*")
    .eq("is_active", true)
    .order("created_at", {
      ascending: false
    });

  if (error) {
    console.error(
      "Products loading error:",
      error
    );

    if (productsLoading) {
      productsLoading.hidden = true;
    }

    if (productsGrid) {
      productsGrid.innerHTML = `
        <div style="
          grid-column:1/-1;
          padding:50px 20px;
          text-align:center;
        ">
          <strong>
            تعذر تحميل المنتجات.
          </strong>

          <p style="
            margin-top:8px;
            color:#777;
          ">
            يرجى تحديث الصفحة والمحاولة مرة أخرى.
          </p>
        </div>
      `;
    }

    return;
  }

  products = data || [];

  if (productsLoading) {
    productsLoading.hidden = true;
  }

  applyFilters();
  renderSpecialSections();
  renderFavorites();
}


/* =========================================================
   CATEGORY MATCHING
   ========================================================= */

function productText(product) {
  return `
    ${product?.name || ""}
    ${product?.description || ""}
    ${product?.sku || ""}
  `.toLowerCase();
}


function matchesCategory(product, category) {
  if (!category || category === "all") {
    return true;
  }

  const text = productText(product);

  const categories = {
    girls: [
      "girl",
      "girls",
      "girl's",
      "بنات",
      "بنت",
      "فستان",
      "تنورة"
    ],

    boys: [
      "boy",
      "boys",
      "boy's",
      "أولاد",
      "ولد",
      "شورت",
      "بدلة"
    ],

    newborn: [
      "newborn",
      "baby",
      "infant",
      "مواليد",
      "مولود",
      "رضيع",
      "بيبي"
    ],

    jackets: [
      "jacket",
      "coat",
      "hoodie",
      "جاكيت",
      "معطف",
      "هودي"
    ],

    sets: [
      "set",
      "sets",
      "طقم",
      "أطقم"
    ],

    shoes: [
      "shoe",
      "shoes",
      "trainer",
      "sneaker",
      "حذاء",
      "أحذية",
      "كوتشي"
    ],

    accessories: [
      "accessor",
      "watch",
      "bag",
      "wallet",
      "إكسس",
      "اكسس",
      "حقيبة",
      "ساعة",
      "محفظة"
    ],

    sale: []
  };

  if (category === "sale") {
    return getDiscount(product) > 0;
  }

  const words =
    categories[category] || [];

  return words.some((word) =>
    text.includes(word)
  );
}


/* =========================================================
   FILTER + SEARCH + SORT
   ========================================================= */

function applyFilters() {
  let result = [...products];

  if (currentCategory !== "all") {
    result = result.filter((product) =>
      matchesCategory(
        product,
        currentCategory
      )
    );
  }

  if (currentSearch.trim()) {
    const search =
      currentSearch
        .trim()
        .toLowerCase();

    result = result.filter(
      (product) => {
        const text =
          productText(product);

        return text.includes(search);
      }
    );
  }

  if (currentSort === "price-low") {
    result.sort(
      (a, b) =>
        getProductPrice(a) -
        getProductPrice(b)
    );
  }

  if (currentSort === "price-high") {
    result.sort(
      (a, b) =>
        getProductPrice(b) -
        getProductPrice(a)
    );
  }

  if (currentSort === "name") {
    result.sort((a, b) =>
      String(a.name || "").localeCompare(
        String(b.name || ""),
        "ar"
      )
    );
  }

  if (currentSort === "newest") {
    result.sort(
      (a, b) =>
        new Date(
          b.created_at || 0
        ) -
        new Date(
          a.created_at || 0
        )
    );
  }

  filteredProducts = result;

  renderProducts();
}


/* =========================================================
   PRODUCT CARD
   ========================================================= */

function createProductCard(product) {
  const card =
    document.createElement("article");

  card.className =
    "product-card";

  const price =
    Number(product.price || 0);

  const finalPrice =
    getProductPrice(product);

  const discount =
    getDiscount(product);

  const stock =
    Number(product.stock || 0);

  const image =
    getImage(product);

  const colors =
    normalizeArray(product.colors);

  const sizes =
    normalizeArray(product.sizes);

  const favorite =
    isFavorite(product.id);

  card.innerHTML = `
    <div
      class="product-image-wrap"
      style="cursor:pointer;"
    >

      ${
        discount > 0
          ? `
            <span class="product-badge sale">
              خصم ${discount}%
            </span>
          `
          : ""
      }

      ${
        stock <= 0
          ? `
            <span class="product-badge">
              نفدت الكمية
            </span>
          `
          : ""
      }

      ${
        discount === 0 &&
        stock > 0
          ? `
            <span class="product-badge">
              جديد
            </span>
          `
          : ""
      }

      <button
        type="button"
        class="product-favorite ${
          favorite ? "active" : ""
        }"
        data-favorite-product="${escapeHTML(
          product.id
        )}"
        aria-label="المفضلة"
      >
        ${favorite ? "♥️" : "♡"}
      </button>

      <img
        class="product-image"
        src="${escapeHTML(image)}"
        alt="${escapeHTML(
          product.name
        )}"
        loading="lazy"
      >

    </div>

    <div class="product-info">

      <h3
        class="product-name"
        style="cursor:pointer;"
      >
        ${escapeHTML(
          product.name
        )}
      </h3>

      ${
        product.description
          ? `
            <p class="product-description">
              ${escapeHTML(
                product.description
              )}
            </p>
          `
          : ""
      }

      <div class="product-rating">
        <span>★★★★★</span>
        <small>جديد</small>
      </div>

      <div class="product-price-row">

        <strong class="product-price">
          ${formatPrice(finalPrice)}
        </strong>

        ${
          discount > 0
            ? `
              <span class="product-old-price">
                ${formatPrice(price)}
              </span>
            `
            : ""
        }

      </div>

      ${
        colors.length
          ? `
            <div class="product-colors">
              ${colors
                .slice(0, 6)
                .map(
                  (color) => `
                    <span
                      class="color-dot"
                      title="${escapeHTML(
                        color
                      )}"
                      style="
                        background:${colorToCSS(
                          color
                        )}
                      "
                    ></span>
                  `
                )
                .join("")}
            </div>
          `
          : ""
      }

      ${
        sizes.length
          ? `
            <div class="product-card-sizes">
              ${sizes
                .slice(0, 5)
                .map(
                  (size) => `
                    <span>
                      ${escapeHTML(
                        size
                      )}
                    </span>
                  `
                )
                .join("")}
            </div>
          `
          : ""
      }

      <button
        class="add-to-cart-mini"
        type="button"
        data-add-product="${escapeHTML(
          product.id
        )}"
        ${stock <= 0 ? "disabled" : ""}
      >
        ${
          stock <= 0
            ? "غير متوفر"
            : "إضافة إلى السلة"
        }
      </button>

    </div>
  `;

  const imageWrap =
    card.querySelector(
      ".product-image-wrap"
    );

  imageWrap?.addEventListener(
    "click",
    (event) => {
      if (
        event.target.closest(
          "[data-favorite-product]"
        )
      ) {
        return;
      }

      openProductModal(product);
    }
  );

  card
    .querySelector(".product-name")
    ?.addEventListener(
      "click",
      () => {
        openProductModal(product);
      }
    );

  card
    .querySelector(
      "[data-favorite-product]"
    )
    ?.addEventListener(
      "click",
      (event) => {
        event.stopPropagation();
        toggleFavorite(product);
      }
    );

  card
    .querySelector(
      "[data-add-product]"
    )
    ?.addEventListener(
      "click",
      (event) => {
        event.stopPropagation();

        if (stock <= 0) {
          return;
        }

        addToCart(product);
      }
    );

  return card;
}


/* =========================================================
   RENDER PRODUCTS
   ========================================================= */

function renderProducts() {
  if (!productsGrid) {
    return;
  }

  productsGrid.innerHTML = "";

  if (!filteredProducts.length) {
    if (productsEmpty) {
      productsEmpty.hidden = false;
    }

    return;
  }

  if (productsEmpty) {
    productsEmpty.hidden = true;
  }

  filteredProducts.forEach(
    (product) => {
      productsGrid.appendChild(
        createProductCard(product)
      );
    }
  );
}


/* =========================================================
   SPECIAL PRODUCT SECTIONS
   ========================================================= */

function renderGrid(
  element,
  items
) {
  if (!element) {
    return;
  }

  element.innerHTML = "";

  if (!items.length) {
    element.innerHTML = `
      <div style="
        grid-column:1/-1;
        text-align:center;
        padding:30px;
        color:#777;
      ">
        لا توجد منتجات حاليًا.
      </div>
    `;

    return;
  }

  items.forEach((product) => {
    element.appendChild(
      createProductCard(product)
    );
  });
}


function renderSpecialSections() {
  const newest =
    [...products]
      .sort(
        (a, b) =>
          new Date(
            b.created_at || 0
          ) -
          new Date(
            a.created_at || 0
          )
      )
      .slice(0, 8);

  const offers =
    products
      .filter(
        (product) =>
          getDiscount(product) > 0
      )
      .slice(0, 8);

  /*
    Until the database has a dedicated
    sales-count field, "best sellers"
    uses the first active products.
    Later we can connect it to real order data.
  */
  const best =
    [...products].slice(0, 8);

  renderGrid(
    newProductsGrid,
    newest
  );

  renderGrid(
    bestProductsGrid,
    best
  );

  renderGrid(
    offersProductsGrid,
    offers
  );
}


/* =========================================================
   PRODUCT MODAL
   ========================================================= */

function openProductModal(product) {
  if (!productModalBody) {
    return;
  }

  selectedProduct = product;
  selectedQuantity = 1;

  const image =
    getImage(product);

  const price =
    Number(product.price || 0);

  const finalPrice =
    getProductPrice(product);

  const discount =
    getDiscount(product);

  const colors =
    normalizeArray(product.colors);

  const sizes =
    normalizeArray(product.sizes);

  selectedColor =
    colors.length
      ? colors[0]
      : null;

  selectedSize =
    sizes.length
      ? sizes[0]
      : null;

  productModalBody.innerHTML = `
    <div class="product-details">

      <div>

        <img
          src="${escapeHTML(image)}"
          alt="${escapeHTML(
            product.name
          )}"
          class="product-details-image"
        >

      </div>

      <div class="product-details-info">

        <span class="eyebrow">
          KOSHI.WEAR
        </span>

        <h2>
          ${escapeHTML(
            product.name
          )}
        </h2>

        ${
          product.description
            ? `
              <p class="product-details-description">
                ${escapeHTML(
                  product.description
                )}
              </p>
            `
            : ""
        }

        <div class="details-price">
          ${formatPrice(finalPrice)}

          ${
            discount > 0
              ? `
                <span class="details-old-price">
                  ${formatPrice(price)}
                </span>
              `
              : ""
          }
        </div>

        ${
          colors.length
            ? `
              <div class="option-group">

                <div class="option-title">
                  اللون
                </div>

                <div class="color-options">

                  ${colors
                    .map(
                      (
                        color,
                        index
                      ) => `
                        <button
                          type="button"
                          class="color-option ${
                            index === 0
                              ? "active"
                              : ""
                          }"
                          data-color="${escapeHTML(
                            color
                          )}"
                        >
                          <span
                            style="
                              display:inline-block;
                              width:14px;
                              height:14px;
                              border-radius:50%;
                              background:${colorToCSS(
                                color
                              )};
                              margin-left:6px;
                              vertical-align:middle;
                            "
                          ></span>

                          ${escapeHTML(
                            color
                          )}
                        </button>
                      `
                    )
                    .join("")}

                </div>

              </div>
            `
            : ""
        }

        ${
          sizes.length
            ? `
              <div class="option-group">

                <div class="option-title">
                  المقاس
                </div>

                <div class="size-options">

                  ${sizes
                    .map(
                      (
                        size,
                        index
                      ) => `
                        <button
                          type="button"
                          class="size-option ${
                            index === 0
                              ? "active"
                              : ""
                          }"
                          data-size="${escapeHTML(
                            size
                          )}"
                        >
                          ${escapeHTML(
                            size
                          )}
                        </button>
                      `
                    )
                    .join("")}

                </div>

              </div>
            `
            : ""
        }

        <div class="option-group">

          <div class="option-title">
            الكمية
          </div>

          <div class="detail-quantity">

            <button
              type="button"
              id="detailQtyMinus"
            >
              −
            </button>

            <span id="detailQty">
              1
            </span>

            <button
              type="button"
              id="detailQtyPlus"
            >
              +
            </button>

          </div>

        </div>

        <div style="
          margin:15px 0;
          padding:14px;
          border-radius:12px;
          background:#faf8f5;
          font-size:13px;
          color:#666;
        ">
          🚚 توصيل متاح
          <br>
          🔄 إمكانية الاستبدال حسب سياسة المتجر
        </div>

        <button
          type="button"
          class="detail-add-cart"
          id="detailAddCart"
          ${
            Number(
              product.stock || 0
            ) <= 0
              ? "disabled"
              : ""
          }
        >
          ${
            Number(
              product.stock || 0
            ) <= 0
              ? "غير متوفر"
              : "إضافة إلى السلة"
          }
        </button>

      </div>

    </div>
  `;

  productModal.hidden = false;

  document.body.classList.add(
    "no-scroll"
  );

  productModalBody
    .querySelectorAll("[data-color]")
    .forEach((button) => {
      button.addEventListener(
        "click",
        () => {
          productModalBody
            .querySelectorAll(
              "[data-color]"
            )
            .forEach((item) =>
              item.classList.remove(
                "active"
              )
            );

          button.classList.add(
            "active"
          );

          selectedColor =
            button.dataset.color;
        }
      );
    });

  productModalBody
    .querySelectorAll("[data-size]")
    .forEach((button) => {
      button.addEventListener(
        "click",
        () => {
          productModalBody
            .querySelectorAll(
              "[data-size]"
            )
            .forEach((item) =>
              item.classList.remove(
                "active"
              )
            );

          button.classList.add(
            "active"
          );

          selectedSize =
            button.dataset.size;
        }
      );
    });

  const qtyElement =
    document.getElementById(
      "detailQty"
    );

  document
    .getElementById(
      "detailQtyMinus"
    )
    ?.addEventListener(
      "click",
      () => {
        selectedQuantity =
          Math.max(
            1,
            selectedQuantity - 1
          );

        qtyElement.textContent =
          selectedQuantity;
      }
    );

  document
    .getElementById(
      "detailQtyPlus"
    )
    ?.addEventListener(
      "click",
      () => {
        const maxStock =
          Number(
            product.stock || 0
          );

        selectedQuantity =
          Math.min(
            maxStock,
            selectedQuantity + 1
          );

        qtyElement.textContent =
          selectedQuantity;
      }
    );

  document
    .getElementById(
      "detailAddCart"
    )
    ?.addEventListener(
      "click",
      () => {
        addToCart(
          product,
          selectedQuantity,
          selectedColor,
          selectedSize
        );

        closeProductModal();
      }
    );
}


function closeProductModal() {
  if (productModal) {
    productModal.hidden = true;
  }

  document.body.classList.remove(
    "no-scroll"
  );
}


/* =========================================================
   CART
   ========================================================= */

function addToCart(
  product,
  quantity = 1,
  color = null,
  size = null
) {
  const stock =
    Number(product.stock || 0);

  if (stock <= 0) {
    showToast("هذا المنتج غير متوفر");
    return;
  }

  const existing =
    cart.find(
      (item) =>
        item.product_id ===
          product.id &&
        item.selected_color ===
          color &&
        item.selected_size ===
          size
    );

  if (existing) {
    existing.quantity =
      Math.min(
        stock,
        existing.quantity +
          quantity
      );
  } else {
    cart.push({
      product_id:
        product.id,

      name:
        product.name,

      image_url:
        product.image_url,

      unit_price:
        getProductPrice(product),

      quantity:
        Math.min(
          stock,
          quantity
        ),

      selected_color:
        color,

      selected_size:
        size
    });
  }

  saveCart();
  renderCart();

  showToast(
    "تمت إضافة المنتج إلى السلة 🛒"
  );

  openCart();
}


function removeFromCart(index) {
  cart.splice(index, 1);

  saveCart();
  renderCart();

  showToast(
    "تم حذف المنتج من السلة"
  );
}


function changeCartQuantity(
  index,
  change
) {
  const item = cart[index];

  if (!item) {
    return;
  }

  const product =
    products.find(
      (p) =>
        p.id ===
        item.product_id
    );

  const maxStock = product
    ? Number(
        product.stock || 0
      )
    : 999;

  item.quantity += change;

  if (item.quantity < 1) {
    item.quantity = 1;
  }

  if (
    maxStock > 0 &&
    item.quantity > maxStock
  ) {
    item.quantity = maxStock;

    showToast(
      "لا توجد كمية أكبر من المتوفر"
    );
  }

  if (maxStock <= 0) {
    cart.splice(index, 1);
  }

  saveCart();
  renderCart();
}


function getCartTotal() {
  return cart.reduce(
    (total, item) =>
      total +
      Number(
        item.unit_price || 0
      ) *
        Number(
          item.quantity || 0
        ),
    0
  );
}


function renderCart() {
  if (!cartBody) {
    return;
  }

  const totalQuantity =
    cart.reduce(
      (total, item) =>
        total +
        Number(
          item.quantity || 0
        ),
      0
    );

  if (cartCount) {
    cartCount.textContent =
      totalQuantity;
  }

  if (cartTotal) {
    cartTotal.textContent =
      formatPrice(
        getCartTotal()
      );
  }

  if (!cart.length) {
    cartBody.innerHTML = `
      <div class="cart-empty">
        السلة فارغة حاليًا 🛒
      </div>
    `;

    return;
  }

  cartBody.innerHTML =
    cart
      .map(
        (item, index) => `
          <div class="cart-item">

            <img
              src="${escapeHTML(
                item.image_url ||
                  "https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=500&q=80"
              )}"
              class="cart-item-image"
              alt="${escapeHTML(
                item.name
              )}"
            >

            <div class="cart-item-info">

              <h4>
                ${escapeHTML(
                  item.name
                )}
              </h4>

              <div class="cart-item-price">
                ${formatPrice(
                  item.unit_price
                )}
              </div>

              ${
                item.selected_color ||
                item.selected_size
                  ? `
                    <div class="cart-item-options">

                      ${
                        item.selected_color
                          ? `
                            اللون:
                            ${escapeHTML(
                              item.selected_color
                            )}
                          `
                          : ""
                      }

                      ${
                        item.selected_size
                          ? `
                            ${
                              item.selected_color
                                ? " | "
                                : ""
                            }

                            المقاس:
                            ${escapeHTML(
                              item.selected_size
                            )}
                          `
                          : ""
                      }

                    </div>
                  `
                  : ""
              }

              <div class="cart-item-actions">

                <button
                  type="button"
                  class="qty-btn"
                  data-cart-minus="${index}"
                >
                  −
                </button>

                <strong>
                  ${item.quantity}
                </strong>

                <button
                  type="button"
                  class="qty-btn"
                  data-cart-plus="${index}"
                >
                  +
                </button>

                <button
                  type="button"
                  class="remove-cart-item"
                  data-cart-remove="${index}"
                >
                  حذف
                </button>

              </div>

            </div>

          </div>
        `
      )
      .join("");

  cartBody
    .querySelectorAll(
      "[data-cart-minus]"
    )
    .forEach((button) => {
      button.addEventListener(
        "click",
        () => {
          changeCartQuantity(
            Number(
              button.dataset
                .cartMinus
            ),
            -1
          );
        }
      );
    });

  cartBody
    .querySelectorAll(
      "[data-cart-plus]"
    )
    .forEach((button) => {
      button.addEventListener(
        "click",
        () => {
          changeCartQuantity(
            Number(
              button.dataset
                .cartPlus
            ),
            1
          );
        }
      );
    });

  cartBody
    .querySelectorAll(
      "[data-cart-remove]"
    )
    .forEach((button) => {
      button.addEventListener(
        "click",
        () => {
          removeFromCart(
            Number(
              button.dataset
                .cartRemove
            )
          );
        }
      );
    });
}


/* =========================================================
   CART OPEN / CLOSE
   ========================================================= */

function openCart() {
  if (!cartDrawer) {
    return;
  }

  cartDrawer.classList.add(
    "active"
  );

  overlay?.classList.add(
    "active"
  );

  cartDrawer.setAttribute(
    "aria-hidden",
    "false"
  );

  document.body.classList.add(
    "no-scroll"
  );
}


function closeCartDrawer() {
  cartDrawer?.classList.remove(
    "active"
  );

  overlay?.classList.remove(
    "active"
  );

  cartDrawer?.setAttribute(
    "aria-hidden",
    "true"
  );

  document.body.classList.remove(
    "no-scroll"
  );
}


/* =========================================================
   CHECKOUT MODAL
   ========================================================= */

function createCheckoutModal() {
  if (
    document.getElementById(
      "checkoutModal"
    )
  ) {
    return;
  }

  const modal =
    document.createElement(
      "div"
    );

  modal.id =
    "checkoutModal";

  modal.className =
    "modal";

  modal.innerHTML = `
    <div
      class="modal-backdrop"
      data-close-checkout
    ></div>

    <div class="modal-content">

      <button
        type="button"
        class="modal-close"
        data-close-checkout
      >
        ×
      </button>

      <div style="padding:35px;">

        <span class="eyebrow">
          KOSHI.WEAR
        </span>

        <h2 style="
          font-size:30px;
          margin-bottom:8px;
        ">
          إتمام الطلب
        </h2>

        <p style="
          color:#777;
          margin-bottom:25px;
        ">
          أدخل معلومات التوصيل لإرسال طلبك.
        </p>

        <form id="checkoutForm">

          <div style="
            display:grid;
            grid-template-columns:1fr 1fr;
            gap:14px;
          ">

            <div>
              <label>
                الاسم الكامل
              </label>

              <input
                id="checkoutName"
                required
                type="text"
                placeholder="الاسم الكامل"
              >
            </div>

            <div>
              <label>
                رقم الهاتف
              </label>

              <input
                id="checkoutPhone"
                required
                type="tel"
                placeholder="05xxxxxxxx"
              >
            </div>

            <div>
              <label>
                المنطقة
              </label>

              <select
                id="checkoutRegion"
                required
              >
                <option value="">
                  اختر المنطقة
                </option>

                <option value="palestine">
                  فلسطين
                </option>

                <option value="inside_israel">
                  داخل إسرائيل
                </option>
              </select>
            </div>

            <div>
              <label>
                المدينة
              </label>

              <input
                id="checkoutCity"
                required
                type="text"
                placeholder="المدينة"
              >
            </div>

          </div>

          <div style="
            margin-top:14px;
          ">

            <label>
              العنوان بالتفصيل
            </label>

            <textarea
              id="checkoutAddress"
              required
              rows="3"
              placeholder="الحي، الشارع، رقم المنزل..."
            ></textarea>

          </div>

          <div style="
            margin-top:14px;
          ">

            <label>
              أقرب معلم
            </label>

            <input
              id="checkoutLandmark"
              type="text"
              placeholder="اختياري"
            >

          </div>

          <div style="
            margin-top:14px;
          ">

            <label>
              ملاحظات الطلب
            </label>

            <textarea
              id="checkoutNotes"
              rows="2"
              placeholder="اختياري"
            ></textarea>

          </div>

          <div
            id="checkoutError"
            style="
              display:none;
              margin-top:15px;
              padding:12px;
              background:#fff0f0;
              color:#a00;
              border-radius:8px;
              font-size:13px;
            "
          ></div>

          <div
            id="checkoutSuccess"
            style="
              display:none;
              margin-top:15px;
              padding:16px;
              background:#f0f8f0;
              color:#245c2a;
              border-radius:8px;
            "
          ></div>

          <button
            id="submitCheckout"
            type="submit"
            class="checkout-btn"
            style="margin-top:20px;"
          >
            تأكيد الطلب
          </button>

        </form>

      </div>

    </div>
  `;

  document.body.appendChild(
    modal
  );

  modal
    .querySelectorAll(
      "[data-close-checkout]"
    )
    .forEach((button) => {
      button.addEventListener(
        "click",
        closeCheckoutModal
      );
    });

  document
    .getElementById(
      "checkoutForm"
    )
    ?.addEventListener(
      "submit",
      submitCheckout
    );
}


function openCheckoutModal() {
  if (!cart.length) {
    showToast(
      "السلة فارغة"
    );
    return;
  }

  createCheckoutModal();

  const modal =
    document.getElementById(
      "checkoutModal"
    );

  if (!modal) {
    return;
  }

  modal.style.display =
    "grid";

  document.body.classList.add(
    "no-scroll"
  );
}


function closeCheckoutModal() {
  const modal =
    document.getElementById(
      "checkoutModal"
    );

  if (!modal) {
    return;
  }

  modal.style.display =
    "none";

  document.body.classList.remove(
    "no-scroll"
  );
}


/* =========================================================
   CHECKOUT
   ========================================================= */

async function submitCheckout(
  event
) {
  event.preventDefault();

  const submitButton =
    document.getElementById(
      "submitCheckout"
    );

  const errorBox =
    document.getElementById(
      "checkoutError"
    );

  const successBox =
    document.getElementById(
      "checkoutSuccess"
    );

  if (!submitButton) {
    return;
  }

  errorBox.style.display =
    "none";

  successBox.style.display =
    "none";

  if (!cart.length) {
    errorBox.textContent =
      "السلة فارغة.";

    errorBox.style.display =
      "block";

    return;
  }

  const fullName =
    document.getElementById(
      "checkoutName"
    ).value.trim();

  const phone =
    document.getElementById(
      "checkoutPhone"
    ).value.trim();

  const region =
    document.getElementById(
      "checkoutRegion"
    ).value;

  const city =
    document.getElementById(
      "checkoutCity"
    ).value.trim();

  const address =
    document.getElementById(
      "checkoutAddress"
    ).value.trim();

  const landmark =
    document.getElementById(
      "checkoutLandmark"
    ).value.trim();

  const notes =
    document.getElementById(
      "checkoutNotes"
    ).value.trim();

  if (
    !fullName ||
    !phone ||
    !region ||
    !city ||
    !address
  ) {
    errorBox.textContent =
      "يرجى تعبئة جميع الحقول المطلوبة.";

    errorBox.style.display =
      "block";

    return;
  }

  submitButton.disabled =
    true;

  submitButton.textContent =
    "جاري إرسال الطلب...";

  const trafficSource =
    detectTrafficSource();

  const items =
    cart.map((item) => ({
      product_id:
        item.product_id,

      quantity:
        Number(
          item.quantity || 1
        ),

      selected_color:
        item.selected_color ||
        null,

      selected_size:
        item.selected_size ||
        null
    }));

  const {
    data,
    error
  } =
    await supabaseClient.rpc(
      "create_store_order",
      {
        p_full_name:
          fullName,

        p_phone:
          phone,

        p_region:
          region,

        p_city:
          city,

        p_address:
          address,

        p_landmark:
          landmark || null,

        p_notes:
          notes || null,

        p_traffic_source:
          trafficSource,

        p_items:
          items
      }
    );

  if (error) {
    console.error(
      "Checkout RPC error:",
      error
    );

    errorBox.textContent =
      "تعذر إنشاء الطلب حاليًا. يرجى المحاولة مرة أخرى.";

    errorBox.style.display =
      "block";

    submitButton.disabled =
      false;

    submitButton.textContent =
      "تأكيد الطلب";

    return;
  }

  if (
    !data ||
    !data.success
  ) {
    errorBox.textContent =
      data?.message ||
      "تعذر إنشاء الطلب.";

    errorBox.style.display =
      "block";

    submitButton.disabled =
      false;

    submitButton.textContent =
      "تأكيد الطلب";

    return;
  }

  successBox.innerHTML = `
    <strong>
      تم إرسال طلبك بنجاح 🎉
    </strong>

    <div style="
      margin-top:7px;
    ">
      رقم الطلب:
      <strong>
        ${escapeHTML(
          data.order_number ||
            ""
        )}
      </strong>
    </div>

    <div style="
      margin-top:4px;
    ">
      المجموع:
      <strong>
        ${formatPrice(
          data.total
        )}
      </strong>
    </div>
  `;

  successBox.style.display =
    "block";

  submitButton.style.display =
    "none";

  cart = [];

  saveCart();
  renderCart();

  closeCartDrawer();

  await loadProducts();

  setTimeout(() => {
    closeCheckoutModal();
  }, 5000);
}


/* =========================================================
   SEARCH
   ========================================================= */

function openSearchPanel() {
  if (!searchPanel) {
    return;
  }

  searchPanel.classList.add(
    "active"
  );

  setTimeout(() => {
    searchInput?.focus();
  }, 100);
}


searchBtn?.addEventListener(
  "click",
  openSearchPanel
);


closeSearch?.addEventListener(
  "click",
  () => {
    searchPanel?.classList.remove(
      "active"
    );
  }
);


searchInput?.addEventListener(
  "input",
  (event) => {
    currentSearch =
      event.target.value;

    applyFilters();

    if (
      currentSearch.trim()
    ) {
      document
        .getElementById(
          "products"
        )
        ?.scrollIntoView({
          behavior: "smooth",
          block: "start"
        });
    }
  }
);


/* =========================================================
   SORT
   ========================================================= */

sortProducts?.addEventListener(
  "change",
  (event) => {
    currentSort =
      event.target.value;

    applyFilters();
  }
);


/* =========================================================
   CATEGORY BUTTONS
   ========================================================= */

document
  .querySelectorAll(
    ".category-card"
  )
  .forEach((button) => {
    button.addEventListener(
      "click",
      () => {
        currentCategory =
          button.dataset.category ||
          "all";

        applyFilters();

        document
          .getElementById(
            "products"
          )
          ?.scrollIntoView({
            behavior: "smooth"
          });
      }
    );
  });


/* =========================================================
   NAV CATEGORY LINKS
   ========================================================= */

document
  .querySelectorAll(
    "[data-category]"
  )
  .forEach((element) => {
    if (
      element.classList.contains(
        "category-card"
      )
    ) {
      return;
    }

    element.addEventListener(
      "click",
      (event) => {
        const category =
          element.dataset.category;

        if (!category) {
          return;
        }

        event.preventDefault();

        currentCategory =
          category;

        applyFilters();

        document
          .getElementById(
            "products"
          )
          ?.scrollIntoView({
            behavior: "smooth"
          });

        mobileNav?.classList.remove(
          "active"
        );
      }
    );
  });


/* =========================================================
   MOBILE MENU
   ========================================================= */

mobileMenuBtn?.addEventListener(
  "click",
  () => {
    mobileNav?.classList.toggle(
      "active"
    );
  }
);


mobileNav
  ?.querySelectorAll("a")
  .forEach((link) => {
    link.addEventListener(
      "click",
      () => {
        mobileNav.classList.remove(
          "active"
        );
      }
    );
  });


/* =========================================================
   CART EVENTS
   ========================================================= */

cartButton?.addEventListener(
  "click",
  (event) => {
    event.preventDefault();
    openCart();
  }
);


closeCart?.addEventListener(
  "click",
  closeCartDrawer
);


overlay?.addEventListener(
  "click",
  closeCartDrawer
);


checkoutButton?.addEventListener(
  "click",
  openCheckoutModal
);


/* =========================================================
   PRODUCT MODAL EVENTS
   ========================================================= */

productModal
  ?.querySelectorAll(
    "[data-close-product]"
  )
  .forEach((button) => {
    button.addEventListener(
      "click",
      closeProductModal
    );
  });


/* =========================================================
   ACCOUNT BUTTON
   ========================================================= */

document
  .querySelectorAll(
    "#accountButton, [data-account]"
  )
  .forEach((button) => {
    button.addEventListener(
      "click",
      (event) => {
        event.preventDefault();

        showToast(
          "قسم الحساب سيتم تفعيله قريبًا 👤"
        );
      }
    );
  });


/* =========================================================
   FAVORITES BUTTON
   ========================================================= */

document
  .querySelectorAll(
    "#favoritesButton, [data-favorites]"
  )
  .forEach((button) => {
    button.addEventListener(
      "click",
      (event) => {
        event.preventDefault();

        if (favoritesGrid) {
          favoritesGrid.scrollIntoView({
            behavior: "smooth"
          });
        } else {
          showToast(
            `لديك ${favorites.length} منتج في المفضلة ❤️`
          );
        }
      }
    );
  });


/* =========================================================
   HERO / SHOP NOW BUTTON
   ========================================================= */

document
  .querySelectorAll(
    "[data-shop-now], #shopNowButton"
  )
  .forEach((button) => {
    button.addEventListener(
      "click",
      (event) => {
        event.preventDefault();

        currentCategory =
          "all";

        applyFilters();

        document
          .getElementById(
            "products"
          )
          ?.scrollIntoView({
            behavior: "smooth"
          });
      }
    );
  });


/* =========================================================
   ESC KEY
   ========================================================= */

document.addEventListener(
  "keydown",
  (event) => {
    if (event.key !== "Escape") {
      return;
    }

    closeCartDrawer();
    closeProductModal();
    closeCheckoutModal();

    searchPanel?.classList.remove(
      "active"
    );

    mobileNav?.classList.remove(
      "active"
    );
  }
);


/* =========================================================
   TRAFFIC SOURCE
   ========================================================= */

function detectTrafficSource() {
  const params =
    new URLSearchParams(
      window.location.search
    );

  const utmSource =
    params.get("utm_source");

  if (utmSource) {
    return utmSource;
  }

  const referrer =
    document.referrer || "";

  if (
    referrer.includes(
      "instagram.com"
    )
  ) {
    return "instagram";
  }

  if (
    referrer.includes(
      "facebook.com"
    )
  ) {
    return "facebook";
  }

  if (
    referrer.includes(
      "tiktok.com"
    )
  ) {
    return "tiktok";
  }

  if (
    referrer.includes(
      "google."
    )
  ) {
    return "google";
  }

  if (
    referrer.includes(
      "youtube.com"
    )
  ) {
    return "youtube";
  }

  if (!referrer) {
    return "direct";
  }

  return "other";
}


/* =========================================================
   VISITOR TRACKING
   ========================================================= */

async function trackVisitor() {
  try {
    let sessionId =
      localStorage.getItem(
        "koshi_visitor_session"
      );

    if (!sessionId) {
      if (
        window.crypto &&
        typeof crypto.randomUUID ===
          "function"
      ) {
        sessionId =
          crypto.randomUUID();
      } else {
        sessionId =
          "koshi-" +
          Date.now() +
          "-" +
          Math.random()
            .toString(36)
            .slice(2);
      }

      localStorage.setItem(
        "koshi_visitor_session",
        sessionId
      );
    }

    const page =
      window.location.pathname +
      window.location.search;

    const source =
      detectTrafficSource();

    const { error } =
      await supabaseClient
        .from(
          "visitor_sessions"
        )
        .upsert(
          {
            session_id:
              sessionId,

            traffic_source:
              source,

            current_page:
              page,

            last_seen_at:
              new Date().toISOString()
          },
          {
            onConflict:
              "session_id"
          }
        );

    if (error) {
      console.error(
        "Visitor tracking error:",
        error
      );
    }
  } catch (error) {
    console.error(
      "Visitor tracking failed:",
      error
    );
  }
}


/* =========================================================
   INITIALIZE
   ========================================================= */

async function initializeStore() {
  loadCart();

  loadFavorites();

  await loadProducts();

  await trackVisitor();
}


initializeStore();
