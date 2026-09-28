/* =========================================================
   KOSHI.WEAR — CUSTOMER STORE APP
   Supabase + Products + Cart + Checkout
   ========================================================= */

const SUPABASE_URL = "https://eflcolwdhddfncbuvjua.supabase.co";

/*
  مهم:
  ضع هنا نفس Supabase Publishable Key الموجود عندك حاليًا.
  لا تضع Secret Key.
*/
const SUPABASE_PUBLISHABLE_KEY =
  "PUT_YOUR_EXISTING_PUBLISHABLE_KEY_HERE";

const supabaseClient = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY
);


/* =========================================================
   STATE
   ========================================================= */

let products = [];
let filteredProducts = [];
let cart = [];

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

const productsGrid = document.getElementById("productsGrid");
const productsLoading = document.getElementById("productsLoading");
const productsEmpty = document.getElementById("productsEmpty");

const cartButton = document.getElementById("cartButton");
const cartDrawer = document.getElementById("cartDrawer");
const closeCart = document.getElementById("closeCart");
const overlay = document.getElementById("overlay");

const cartBody = document.getElementById("cartBody");
const cartCount = document.getElementById("cartCount");
const cartTotal = document.getElementById("cartTotal");
const checkoutButton = document.getElementById("checkoutButton");

const searchBtn = document.getElementById("searchBtn");
const searchPanel = document.getElementById("searchPanel");
const closeSearch = document.getElementById("closeSearch");
const searchInput = document.getElementById("searchInput");

const sortProducts = document.getElementById("sortProducts");

const mobileMenuBtn = document.getElementById("mobileMenuBtn");
const mobileNav = document.getElementById("mobileNav");

const productModal = document.getElementById("productModal");
const productModalBody = document.getElementById("productModalBody");


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
  const price = Number(product.price || 0);
  const salePrice =
    product.sale_price !== null &&
    product.sale_price !== undefined &&
    product.sale_price !== ""
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
  const price = Number(product.price || 0);
  const salePrice =
    product.sale_price !== null &&
    product.sale_price !== undefined
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

  return Math.round(((price - salePrice) / price) * 100);
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

  return map[String(color).toLowerCase()] || "#ddd";
}


/* =========================================================
   LOCAL STORAGE
   ========================================================= */

function loadCart() {
  try {
    const saved = localStorage.getItem("koshi_cart");

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
  localStorage.setItem("koshi_cart", JSON.stringify(cart));
}


/* =========================================================
   LOAD PRODUCTS
   ========================================================= */

async function loadProducts() {
  productsLoading.hidden = false;
  productsEmpty.hidden = true;

  productsGrid.innerHTML = "";

  const { data, error } = await supabaseClient
    .from("products")
    .select("*")
    .eq("is_active", true)
    .order("created_at", {
      ascending: false
    });

  if (error) {
    console.error("Products loading error:", error);

    productsLoading.hidden = true;

    productsGrid.innerHTML = `
      <div style="
        grid-column:1/-1;
        padding:50px 20px;
        text-align:center;
      ">
        <strong>تعذر تحميل المنتجات.</strong>
        <p style="margin-top:8px;color:#777;">
          يرجى تحديث الصفحة والمحاولة مرة أخرى.
        </p>
      </div>
    `;

    return;
  }

  products = data || [];

  productsLoading.hidden = true;

  applyFilters();
}


/* =========================================================
   FILTER + SEARCH + SORT
   ========================================================= */

function applyFilters() {
  let result = [...products];

  /* Category */

  if (currentCategory === "sale") {
    result = result.filter(
      (product) => getDiscount(product) > 0
    );
  }

  if (currentCategory === "new") {
    result = result.slice(0, 12);
  }

  /* Search */

  if (currentSearch.trim()) {
    const search = currentSearch.trim().toLowerCase();

    result = result.filter((product) => {
      const name = String(product.name || "").toLowerCase();
      const description = String(
        product.description || ""
      ).toLowerCase();
      const sku = String(product.sku || "").toLowerCase();

      return (
        name.includes(search) ||
        description.includes(search) ||
        sku.includes(search)
      );
    });
  }

  /* Accessories */

  if (currentCategory === "accessories") {
    result = result.filter((product) => {
      const text = `
        ${product.name || ""}
        ${product.description || ""}
      `.toLowerCase();

      return (
        text.includes("accessor") ||
        text.includes("إكسس") ||
        text.includes("اكسس") ||
        text.includes("watch") ||
        text.includes("ساعة") ||
        text.includes("bag") ||
        text.includes("حقيبة") ||
        text.includes("محفظة") ||
        text.includes("wallet")
      );
    });
  }

  /* Sort */

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

  filteredProducts = result;

  renderProducts();
}


/* =========================================================
   RENDER PRODUCTS
   ========================================================= */

function renderProducts() {
  productsGrid.innerHTML = "";

  if (!filteredProducts.length) {
    productsEmpty.hidden = false;
    return;
  }

  productsEmpty.hidden = true;

  filteredProducts.forEach((product) => {
    productsGrid.appendChild(
      createProductCard(product)
    );
  });
}


function createProductCard(product) {
  const card = document.createElement("article");

  card.className = "product-card";

  const price = Number(product.price || 0);
  const finalPrice = getProductPrice(product);
  const discount = getDiscount(product);

  const stock = Number(product.stock || 0);

  const image =
    product.image_url ||
    "https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=900&q=85";

  const colors = normalizeArray(product.colors);

  card.innerHTML = `
    <div class="product-image-wrap">

      ${
        discount > 0
          ? `<span class="product-badge sale">
              -${discount}%
            </span>`
          : ""
      }

      ${
        stock <= 0
          ? `<span class="product-badge">
              نفدت الكمية
            </span>`
          : ""
      }

      <img
        class="product-image"
        src="${escapeHTML(image)}"
        alt="${escapeHTML(product.name)}"
        loading="lazy"
      >

    </div>

    <div class="product-info">

      <h3 class="product-name">
        ${escapeHTML(product.name)}
      </h3>

      ${
        product.description
          ? `
            <p class="product-description">
              ${escapeHTML(product.description)}
            </p>
          `
          : ""
      }

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

              <span class="product-discount">
                ${discount}%
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
                      title="${escapeHTML(color)}"
                      style="background:${colorToCSS(color)}"
                    ></span>
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
        data-add-product="${escapeHTML(product.id)}"
        ${stock <= 0 ? "disabled" : ""}
      >
        ${stock <= 0 ? "غير متوفر" : "إضافة إلى السلة"}
      </button>

    </div>
  `;

  card
    .querySelector(".product-image-wrap")
    .addEventListener("click", () => {
      openProductModal(product);
    });

  card
    .querySelector(".product-name")
    .addEventListener("click", () => {
      openProductModal(product);
    });

  const addButton = card.querySelector(
    "[data-add-product]"
  );

  if (addButton) {
    addButton.addEventListener("click", (event) => {
      event.stopPropagation();

      if (stock <= 0) {
        return;
      }

      addToCart(product);
    });
  }

  return card;
}


/* =========================================================
   PRODUCT MODAL
   ========================================================= */

function openProductModal(product) {
  selectedProduct = product;
  selectedColor = null;
  selectedSize = null;
  selectedQuantity = 1;

  const image =
    product.image_url ||
    "https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=900&q=85";

  const price = Number(product.price || 0);
  const finalPrice = getProductPrice(product);
  const discount = getDiscount(product);

  const colors = normalizeArray(product.colors);
  const sizes = normalizeArray(product.sizes);

  productModalBody.innerHTML = `
    <div class="product-details">

      <div>

        <img
          src="${escapeHTML(image)}"
          alt="${escapeHTML(product.name)}"
          class="product-details-image"
        >

      </div>

      <div class="product-details-info">

        <span class="eyebrow">
          KOSHI.WEAR
        </span>

        <h2>
          ${escapeHTML(product.name)}
        </h2>

        ${
          product.description
            ? `
              <p class="product-details-description">
                ${escapeHTML(product.description)}
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
                      (color, index) => `
                        <button
                          type="button"
                          class="color-option ${
                            index === 0
                              ? "active"
                              : ""
                          }"
                          data-color="${escapeHTML(color)}"
                        >
                          ${escapeHTML(color)}
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
                      (size, index) => `
                        <button
                          type="button"
                          class="size-option ${
                            index === 0
                              ? "active"
                              : ""
                          }"
                          data-size="${escapeHTML(size)}"
                        >
                          ${escapeHTML(size)}
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

        <button
          type="button"
          class="detail-add-cart"
          id="detailAddCart"
          ${Number(product.stock || 0) <= 0 ? "disabled" : ""}
        >
          ${
            Number(product.stock || 0) <= 0
              ? "غير متوفر"
              : "إضافة إلى السلة"
          }
        </button>

      </div>

    </div>
  `;

  productModal.hidden = false;
  document.body.classList.add("no-scroll");

  if (colors.length) {
    selectedColor = colors[0];

    productModalBody
      .querySelectorAll("[data-color]")
      .forEach((button) => {
        button.addEventListener("click", () => {
          productModalBody
            .querySelectorAll("[data-color]")
            .forEach((item) =>
              item.classList.remove("active")
            );

          button.classList.add("active");

          selectedColor =
            button.dataset.color;
        });
      });
  }

  if (sizes.length) {
    selectedSize = sizes[0];

    productModalBody
      .querySelectorAll("[data-size]")
      .forEach((button) => {
        button.addEventListener("click", () => {
          productModalBody
            .querySelectorAll("[data-size]")
            .forEach((item) =>
              item.classList.remove("active")
            );

          button.classList.add("active");

          selectedSize =
            button.dataset.size;
        });
      });
  }

  const qtyElement =
    document.getElementById("detailQty");

  document
    .getElementById("detailQtyMinus")
    .addEventListener("click", () => {

      selectedQuantity = Math.max(
        1,
        selectedQuantity - 1
      );

      qtyElement.textContent =
        selectedQuantity;
    });

  document
    .getElementById("detailQtyPlus")
    .addEventListener("click", () => {

      const maxStock =
        Number(product.stock || 0);

      selectedQuantity = Math.min(
        maxStock,
        selectedQuantity + 1
      );

      qtyElement.textContent =
        selectedQuantity;
    });

  document
    .getElementById("detailAddCart")
    .addEventListener("click", () => {

      addToCart(
        product,
        selectedQuantity,
        selectedColor,
        selectedSize
      );

      closeProductModal();
    });
}


function closeProductModal() {
  productModal.hidden = true;
  document.body.classList.remove("no-scroll");
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
  const price = getProductPrice(product);

  const existing = cart.find(
    (item) =>
      item.product_id === product.id &&
      item.selected_color === color &&
      item.selected_size === size
  );

  if (existing) {
    existing.quantity += quantity;
  } else {
    cart.push({
      product_id: product.id,
      name: product.name,
      image_url: product.image_url,
      unit_price: price,
      quantity,
      selected_color: color,
      selected_size: size
    });
  }

  saveCart();
  renderCart();
  openCart();
}


function removeFromCart(index) {
  cart.splice(index, 1);

  saveCart();
  renderCart();
}


function changeCartQuantity(index, change) {
  const item = cart[index];

  if (!item) {
    return;
  }

  const product = products.find(
    (p) => p.id === item.product_id
  );

  const maxStock = product
    ? Number(product.stock || 0)
    : 999;

  item.quantity += change;

  if (item.quantity < 1) {
    item.quantity = 1;
  }

  if (item.quantity > maxStock) {
    item.quantity = maxStock;
  }

  saveCart();
  renderCart();
}


function getCartTotal() {
  return cart.reduce(
    (total, item) =>
      total +
      Number(item.unit_price || 0) *
        Number(item.quantity || 0),
    0
  );
}


function renderCart() {
  const totalQuantity = cart.reduce(
    (total, item) =>
      total + Number(item.quantity || 0),
    0
  );

  cartCount.textContent = totalQuantity;

  cartTotal.textContent =
    formatPrice(getCartTotal());

  if (!cart.length) {
    cartBody.innerHTML = `
      <div class="cart-empty">
        السلة فارغة حاليًا.
      </div>
    `;

    return;
  }

  cartBody.innerHTML = cart
    .map(
      (item, index) => `
        <div class="cart-item">

          <img
            src="${escapeHTML(
              item.image_url ||
                "https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=500&q=80"
            )}"
            class="cart-item-image"
            alt="${escapeHTML(item.name)}"
          >

          <div class="cart-item-info">

            <h4>
              ${escapeHTML(item.name)}
            </h4>

            <div class="cart-item-price">
              ${formatPrice(item.unit_price)}
            </div>

            ${
              item.selected_color ||
              item.selected_size
                ? `
                  <div class="cart-item-options">

                    ${
                      item.selected_color
                        ? `اللون: ${escapeHTML(
                            item.selected_color
                          )}`
                        : ""
                    }

                    ${
                      item.selected_size
                        ? ` ${
                            item.selected_color
                              ? " | "
                              : ""
                          }المقاس: ${escapeHTML(
                            item.selected_size
                          )}`
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
    .querySelectorAll("[data-cart-minus]")
    .forEach((button) => {
      button.addEventListener("click", () => {
        changeCartQuantity(
          Number(button.dataset.cartMinus),
          -1
        );
      });
    });

  cartBody
    .querySelectorAll("[data-cart-plus]")
    .forEach((button) => {
      button.addEventListener("click", () => {
        changeCartQuantity(
          Number(button.dataset.cartPlus),
          1
        );
      });
    });

  cartBody
    .querySelectorAll("[data-cart-remove]")
    .forEach((button) => {
      button.addEventListener("click", () => {
        removeFromCart(
          Number(button.dataset.cartRemove)
        );
      });
    });
}


/* =========================================================
   CART OPEN / CLOSE
   ========================================================= */

function openCart() {
  cartDrawer.classList.add("active");
  overlay.classList.add("active");

  cartDrawer.setAttribute(
    "aria-hidden",
    "false"
  );

  document.body.classList.add("no-scroll");
}


function closeCartDrawer() {
  cartDrawer.classList.remove("active");
  overlay.classList.remove("active");

  cartDrawer.setAttribute(
    "aria-hidden",
    "true"
  );

  document.body.classList.remove("no-scroll");
}


/* =========================================================
   CHECKOUT MODAL
   ========================================================= */

function createCheckoutModal() {
  if (document.getElementById("checkoutModal")) {
    return;
  }

  const modal = document.createElement("div");

  modal.id = "checkoutModal";
  modal.className = "modal";

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

        <h2 style="font-size:30px;margin-bottom:8px;">
          إتمام الطلب
        </h2>

        <p style="color:#777;margin-bottom:25px;">
          أدخل معلومات التوصيل لإرسال طلبك.
        </p>

        <form id="checkoutForm">

          <div style="
            display:grid;
            grid-template-columns:1fr 1fr;
            gap:14px;
          ">

            <div>
              <label>الاسم الكامل</label>
              <input
                id="checkoutName"
                required
                type="text"
                placeholder="الاسم الكامل"
              >
            </div>

            <div>
              <label>رقم الهاتف</label>
              <input
                id="checkoutPhone"
                required
                type="tel"
                placeholder="05xxxxxxxx"
              >
            </div>

            <div>
              <label>المنطقة</label>
              <select id="checkoutRegion" required>

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
              <label>المدينة</label>
              <input
                id="checkoutCity"
                required
                type="text"
                placeholder="المدينة"
              >
            </div>

          </div>

          <div style="margin-top:14px;">

            <label>العنوان بالتفصيل</label>

            <textarea
              id="checkoutAddress"
              required
              rows="3"
              placeholder="الحي، الشارع، رقم المنزل..."
            ></textarea>

          </div>

          <div style="margin-top:14px;">

            <label>أقرب معلم</label>

            <input
              id="checkoutLandmark"
              type="text"
              placeholder="اختياري"
            >

          </div>

          <div style="margin-top:14px;">

            <label>ملاحظات الطلب</label>

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

  document.body.appendChild(modal);

  modal
    .querySelectorAll("[data-close-checkout]")
    .forEach((button) => {
      button.addEventListener(
        "click",
        closeCheckoutModal
      );
    });

  document
    .getElementById("checkoutForm")
    .addEventListener(
      "submit",
      submitCheckout
    );
}


function openCheckoutModal() {
  if (!cart.length) {
    alert("السلة فارغة.");
    return;
  }

  createCheckoutModal();

  const modal =
    document.getElementById(
      "checkoutModal"
    );

  modal.style.display = "grid";

  document.body.classList.add("no-scroll");
}


function closeCheckoutModal() {
  const modal =
    document.getElementById(
      "checkoutModal"
    );

  if (!modal) {
    return;
  }

  modal.style.display = "none";

  document.body.classList.remove(
    "no-scroll"
  );
}


/* =========================================================
   CHECKOUT
   ========================================================= */

async function submitCheckout(event) {
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

  errorBox.style.display = "none";
  successBox.style.display = "none";

  if (!cart.length) {
    errorBox.textContent =
      "السلة فارغة.";
    errorBox.style.display = "block";
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

  submitButton.disabled = true;
  submitButton.textContent =
    "جاري إرسال الطلب...";

  const trafficSource =
    detectTrafficSource();

  const items = cart.map((item) => ({
    product_id: item.product_id,
    quantity: Number(item.quantity || 1),
    selected_color:
      item.selected_color || null,
    selected_size:
      item.selected_size || null
  }));

  const { data, error } =
    await supabaseClient.rpc(
      "create_store_order",
      {
        p_full_name: fullName,
        p_phone: phone,
        p_region: region,
        p_city: city,
        p_address: address,
        p_landmark:
          landmark || null,
        p_notes:
          notes || null,
        p_traffic_source:
          trafficSource,
        p_items: items
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

    submitButton.disabled = false;
    submitButton.textContent =
      "تأكيد الطلب";

    return;
  }

  if (!data || !data.success) {
    errorBox.textContent =
      data?.message ||
      "تعذر إنشاء الطلب.";

    errorBox.style.display =
      "block";

    submitButton.disabled = false;
    submitButton.textContent =
      "تأكيد الطلب";

    return;
  }

  successBox.innerHTML = `
    <strong>
      تم إرسال طلبك بنجاح 🎉
    </strong>

    <div style="margin-top:7px;">
      رقم الطلب:
      <strong>
        ${escapeHTML(
          data.order_number || ""
        )}
      </strong>
    </div>

    <div style="margin-top:4px;">
      المجموع:
      <strong>
        ${formatPrice(data.total)}
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

  if (referrer.includes("instagram.com")) {
    return "instagram";
  }

  if (referrer.includes("facebook.com")) {
    return "facebook";
  }

  if (referrer.includes("tiktok.com")) {
    return "tiktok";
  }

  if (referrer.includes("google.")) {
    return "google";
  }

  if (referrer.includes("youtube.com")) {
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
      sessionId =
        crypto.randomUUID();

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
        .from("visitor_sessions")
        .upsert(
          {
            session_id: sessionId,
            traffic_source: source,
            current_page: page,
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
   SEARCH
   ========================================================= */

searchBtn?.addEventListener(
  "click",
  () => {

    searchPanel.classList.add(
      "active"
    );

    setTimeout(() => {
      searchInput.focus();
    }, 100);
  }
);


closeSearch?.addEventListener(
  "click",
  () => {
    searchPanel.classList.remove(
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

        document
          .getElementById(
            "products"
          )
          ?.scrollIntoView({
            behavior: "smooth"
          });

        applyFilters();
      }
    );
  });


/* =========================================================
   MOBILE MENU
   ========================================================= */

mobileMenuBtn?.addEventListener(
  "click",
  () => {

    mobileNav.classList.toggle(
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
  openCart
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

    const checkoutModal =
      document.getElementById(
        "checkoutModal"
      );

    if (checkoutModal) {
      closeCheckoutModal();
    }

    searchPanel?.classList.remove(
      "active"
    );

    mobileNav?.classList.remove(
      "active"
    );
  }
);


/* =========================================================
   INITIALIZE
   ========================================================= */

async function initializeStore() {
  loadCart();

  await loadProducts();

  await trackVisitor();
}

initializeStore();
