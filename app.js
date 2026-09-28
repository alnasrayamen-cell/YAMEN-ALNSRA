// ============================================================
// KOSHI.WEAR
// REAL PRODUCTS FROM SUPABASE
// ============================================================
const SUPABASE_URL =
  "https://eflcolwdhddfncbuvjua.supabase.co";
// استخدم نفس Publishable Key الموجود عندك في Supabase
// لا تستخدم Secret Key هنا.
const SUPABASE_PUBLISHABLE_KEY =
  "ضع_هنا_PUBLISHABLE_KEY_الخاص_بمشروعك";
const { createClient } = window.supabase;
const supabaseClient = createClient(
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY
);
// ============================================================
// GLOBAL STATE
// ============================================================
let products = [];
let cart = [];
// ============================================================
// DOM
// ============================================================
const productsGrid =
  document.getElementById("productsGrid");
const productSearch =
  document.getElementById("productSearch");
const cartCount =
  document.getElementById("cartCount");
const cartBody =
  document.getElementById("cartBody");
const cartTotal =
  document.getElementById("cartTotal");
// ============================================================
// START
// ============================================================
document.addEventListener(
  "DOMContentLoaded",
  async () => {
    loadCart();
    updateCartUI();
    await loadProducts();
    setupSearch();
    setupFilters();
  }
);
// ============================================================
// LOAD PRODUCTS FROM SUPABASE
// ============================================================
async function loadProducts() {
  if (!productsGrid) {
    return;
  }
  productsGrid.innerHTML = `
    <div style="
      grid-column:1/-1;
      text-align:center;
      padding:60px 20px;
      color:#888;
    ">
      <div style="
        font-size:30px;
        margin-bottom:12px;
      ">
        KOSHI.WEAR
      </div>
      <div>
        جاري تحميل المنتجات...
      </div>
    </div>
  `;
  try {
    const {
      data,
      error
    } = await supabaseClient
      .from("products")
      .select(`
        id,
        name,
        description,
        price,
        sale_price,
        image_url,
        sku,
        barcode,
        stock,
        colors,
        sizes,
        is_active,
        created_at,
        updated_at
      `)
      .eq("is_active", true)
      .order("created_at", {
        ascending: false
      });
    if (error) {
      throw error;
    }
    products = data || [];
    renderProducts(products);
  } catch (error) {
    console.error(
      "KOSHI.WEAR products error:",
      error
    );
    productsGrid.innerHTML = `
      <div style="
        grid-column:1/-1;
        text-align:center;
        padding:60px 20px;
      ">
        <div style="
          font-size:22px;
          font-weight:700;
          margin-bottom:10px;
        ">
          تعذر تحميل المنتجات
        </div>
        <div style="
          color:#888;
          font-size:13px;
          margin-bottom:18px;
        ">
          تأكد من اتصال المتجر بقاعدة البيانات.
        </div>
        <button
          type="button"
          onclick="loadProducts()"
          style="
            background:#000;
            color:#fff;
            border:0;
            border-radius:10px;
            padding:12px 24px;
            cursor:pointer;
          "
        >
          إعادة المحاولة
        </button>
      </div>
    `;
  }
}
// ============================================================
// RENDER PRODUCTS
// ============================================================
function renderProducts(list) {
  if (!productsGrid) {
    return;
  }
  if (!list.length) {
    productsGrid.innerHTML = `
      <div style="
        grid-column:1/-1;
        text-align:center;
        padding:70px 20px;
        color:#888;
      ">
        <div style="
          font-size:20px;
          color:#111;
          font-weight:700;
          margin-bottom:8px;
        ">
          لا توجد منتجات حاليًا
        </div>
        <div style="
          font-size:13px;
        ">
          أضف المنتجات من لوحة الإدارة.
        </div>
      </div>
    `;
    return;
  }
  productsGrid.innerHTML =
    list.map(product => {
      const price =
        Number(product.price || 0);
      const salePrice =
        product.sale_price !== null &&
        product.sale_price !== undefined &&
        product.sale_price !== ""
          ? Number(product.sale_price)
          : null;
      const finalPrice =
        salePrice !== null &&
        salePrice > 0 &&
        salePrice < price
          ? salePrice
          : price;
      const isSale =
        salePrice !== null &&
        salePrice > 0 &&
        salePrice < price;
      const stock =
        Number(product.stock || 0);
      const isOutOfStock =
        stock <= 0;
      const image =
        product.image_url ||
        "https://images.unsplash.com/photo-1525507119028-ed4c629a60a3?auto=format&fit=crop&w=1000&q=85";
      return `
        <article
          class="product-card"
          data-product-id="${escapeHTML(product.id)}"
          data-name="${escapeHTML(product.name || "")}"
        >
          <div class="product-image">
            ${
              isOutOfStock
                ? `
                  <span
                    class="product-badge"
                    style="
                      background:#111;
                      color:#fff;
                    "
                  >
                    نفدت الكمية
                  </span>
                `
                : isSale
                  ? `
                    <span
                      class="product-badge sale"
                    >
                      SALE
                    </span>
                  `
                  : `
                    <span
                      class="product-badge"
                    >
                      NEW
                    </span>
                  `
            }
            <img
              src="${escapeAttribute(image)}"
              alt="${escapeAttribute(product.name || "KOSHI.WEAR")}"
              loading="lazy"
              onerror="this.src='https://images.unsplash.com/photo-1525507119028-ed4c629a60a3?auto=format&fit=crop&w=1000&q=85'"
            >
          </div>
          <div class="product-info">
            <h3 class="product-name">
              ${escapeHTML(product.name || "منتج")}
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
            <div class="price">
              <span class="current-price">
                ${formatPrice(finalPrice)}
              </span>
              ${
                isSale
                  ? `
                    <span class="old-price">
                      ${formatPrice(price)}
                    </span>
                  `
                  : ""
              }
            </div>
            ${
              isOutOfStock
                ? `
                  <button
                    class="add-product"
                    type="button"
                    disabled
                    style="
                      background:#eee;
                      color:#777;
                      border-color:#eee;
                      cursor:not-allowed;
                    "
                  >
                    نفدت الكمية
                  </button>
                `
                : `
                  <button
                    class="add-product"
                    type="button"
                    onclick="addProductToCart('${escapeJS(product.id)}')"
                  >
                    أضف إلى السلة
                  </button>
                `
            }
          </div>
        </article>
      `;
    }).join("");
}
// ============================================================
// ADD PRODUCT TO CART
// ============================================================
async function addProductToCart(productId) {
  const product =
    products.find(
      item => String(item.id) === String(productId)
    );
  if (!product) {
    alert("تعذر العثور على المنتج.");
    return;
  }
  const stock =
    Number(product.stock || 0);
  if (stock <= 0) {
    alert("هذا المنتج نفدت كميته.");
    return;
  }
  const existing =
    cart.find(
      item =>
        String(item.product_id) ===
        String(product.id)
    );
  if (existing) {
    if (existing.quantity >= stock) {
      alert(
        `الكمية المتوفرة حاليًا: ${stock}`
      );
      return;
    }
    existing.quantity += 1;
  } else {
    const price =
      Number(product.price || 0);
    const salePrice =
      product.sale_price !== null &&
      product.sale_price !== undefined &&
      product.sale_price !== ""
        ? Number(product.sale_price)
        : null;
    const finalPrice =
      salePrice !== null &&
      salePrice > 0 &&
      salePrice < price
        ? salePrice
        : price;
    cart.push({
      product_id:
        product.id,
      name:
        product.name,
      image_url:
        product.image_url,
      price:
        finalPrice,
      original_price:
        price,
      quantity:
        1,
      stock:
        stock,
      colors:
        normalizeArray(product.colors),
      sizes:
        normalizeArray(product.sizes)
    });
  }
  saveCart();
  updateCartUI();
  openCart();
}
// ============================================================
// REMOVE PRODUCT
// ============================================================
function removeCartItem(index) {
  if (
    index < 0 ||
    index >= cart.length
  ) {
    return;
  }
  cart.splice(index, 1);
  saveCart();
  updateCartUI();
}
// ============================================================
// CHANGE QUANTITY
// ============================================================
function changeCartQuantity(
  index,
  change
) {
  const item = cart[index];
  if (!item) {
    return;
  }
  const newQuantity =
    item.quantity + change;
  if (newQuantity <= 0) {
    removeCartItem(index);
    return;
  }
  if (
    item.stock &&
    newQuantity > item.stock
  ) {
    alert(
      `الكمية المتوفرة حاليًا: ${item.stock}`
    );
    return;
  }
  item.quantity =
    newQuantity;
  saveCart();
  updateCartUI();
}
// ============================================================
// CART UI
// ============================================================
function updateCartUI() {
  if (!cartCount) {
    return;
  }
  const count =
    cart.reduce(
      (total, item) =>
        total + Number(item.quantity || 0),
      0
    );
  cartCount.textContent =
    count;
  const total =
    cart.reduce(
      (sum, item) =>
        sum +
        Number(item.price || 0) *
        Number(item.quantity || 0),
      0
    );
  if (cartTotal) {
    cartTotal.textContent =
      formatPrice(total);
  }
  if (!cartBody) {
    return;
  }
  if (!cart.length) {
    cartBody.innerHTML = `
      <div class="empty-cart">
        <div class="empty-cart-icon">
          🛍
        </div>
        <strong>
          السلة فارغة
        </strong>
        <span>
          أضف بعض القطع التي تعجبك.
        </span>
      </div>
    `;
    return;
  }
  cartBody.innerHTML =
    cart.map(
      (item, index) => {
        const itemTotal =
          Number(item.price || 0) *
          Number(item.quantity || 0);
        return `
          <div
            style="
              display:flex;
              gap:12px;
              padding:15px 0;
              border-bottom:1px solid #eee;
              align-items:center;
            "
          >
            <img
              src="${escapeAttribute(
                item.image_url ||
                "https://images.unsplash.com/photo-1525507119028-ed4c629a60a3?auto=format&fit=crop&w=300&q=80"
              )}"
              alt=""
              style="
                width:72px;
                height:90px;
                object-fit:cover;
                border-radius:10px;
                background:#eee;
              "
            >
            <div style="
              flex:1;
              min-width:0;
            ">
              <strong
                style="
                  display:block;
                  font-size:13px;
                  margin-bottom:5px;
                "
              >
                ${escapeHTML(item.name)}
              </strong>
              <div style="
                font-size:11px;
                color:#888;
                margin-bottom:9px;
              ">
                ${formatPrice(item.price)}
              </div>
              <div style="
                display:flex;
                align-items:center;
                gap:8px;
              ">
                <button
                  type="button"
                  onclick="changeCartQuantity(${index}, -1)"
                  style="
                    width:28px;
                    height:28px;
                    border:1px solid #ddd;
                    background:white;
                    border-radius:50%;
                    cursor:pointer;
                  "
                >
                  −
                </button>
                <span
                  style="
                    min-width:20px;
                    text-align:center;
                    font-size:12px;
                    font-weight:700;
                  "
                >
                  ${item.quantity}
                </span>
                <button
                  type="button"
                  onclick="changeCartQuantity(${index}, 1)"
                  style="
                    width:28px;
                    height:28px;
                    border:1px solid #ddd;
                    background:white;
                    border-radius:50%;
                    cursor:pointer;
                  "
                >
                  +
                </button>
              </div>
            </div>
            <div style="
              text-align:left;
            ">
              <strong
                style="
                  display:block;
                  font-size:12px;
                  margin-bottom:10px;
                "
              >
                ${formatPrice(itemTotal)}
              </strong>
              <button
                type="button"
                onclick="removeCartItem(${index})"
                style="
                  border:0;
                  background:none;
                  color:#999;
                  cursor:pointer;
                  font-size:11px;
                "
              >
                حذف
              </button>
            </div>
          </div>
        `;
      }
    ).join("");
}
// ============================================================
// SEARCH
// ============================================================
function setupSearch() {
  if (!productSearch) {
    return;
  }
  productSearch.addEventListener(
    "input",
    function() {
      const value =
        this.value
          .trim()
          .toLowerCase();
      const filtered =
        products.filter(product => {
          const name =
            String(product.name || "")
              .toLowerCase();
          const description =
            String(product.description || "")
              .toLowerCase();
          const sku =
            String(product.sku || "")
              .toLowerCase();
          return (
            name.includes(value) ||
            description.includes(value) ||
            sku.includes(value)
          );
        });
      renderProducts(filtered);
    }
  );
}
// ============================================================
// FILTERS
// ============================================================
function setupFilters() {
  document
    .querySelectorAll(".filter")
    .forEach(button => {
      button.addEventListener(
        "click",
        function() {
          document
            .querySelectorAll(".filter")
            .forEach(
              btn =>
                btn.classList.remove(
                  "active"
                )
            );
          this.classList.add("active");
          const category =
            this.dataset.category;
          if (
            !category ||
            category === "all"
          ) {
            renderProducts(products);
            return;
          }
          if (category === "sale") {
            const saleProducts =
              products.filter(product => {
                const price =
                  Number(product.price || 0);
                const sale =
                  Number(
                    product.sale_price || 0
                  );
                return (
                  sale > 0 &&
                  sale < price
                );
              });
            renderProducts(
              saleProducts
            );
            return;
          }
          // المنتجات الجديدة
          if (category === "new") {
            renderProducts(
              products.slice(0, 8)
            );
            return;
          }
          // حاليًا المنتجات لا تحتوي
          // على category في قاعدة البيانات.
          // لذلك نعرض كل المنتجات إلى أن
          // نضيف category لاحقًا.
          renderProducts(products);
        }
      );
    });
}
// ============================================================
// CART STORAGE
// ============================================================
function saveCart() {
  localStorage.setItem(
    "koshi_cart",
    JSON.stringify(cart)
  );
}
function loadCart() {
  try {
    const saved =
      localStorage.getItem(
        "koshi_cart"
      );
    if (!saved) {
      cart = [];
      return;
    }
    const parsed =
      JSON.parse(saved);
    if (Array.isArray(parsed)) {
      cart = parsed;
    } else {
      cart = [];
    }
  } catch (error) {
    console.error(
      "Cart loading error:",
      error
    );
    cart = [];
  }
}
// ============================================================
// OPEN / CLOSE CART
// ============================================================
function openCart() {
  const drawer =
    document.getElementById(
      "cartDrawer"
    );
  const overlay =
    document.getElementById(
      "overlay"
    );
  if (drawer) {
    drawer.classList.add(
      "active"
    );
  }
  if (overlay) {
    overlay.classList.add(
      "active"
    );
  }
}
function closeCart() {
  const drawer =
    document.getElementById(
      "cartDrawer"
    );
  const overlay =
    document.getElementById(
      "overlay"
    );
  if (drawer) {
    drawer.classList.remove(
      "active"
    );
  }
  if (overlay) {
    overlay.classList.remove(
      "active"
    );
  }
}
// ============================================================
// NORMALIZE COLORS / SIZES
// ============================================================
function normalizeArray(value) {
  if (Array.isArray(value)) {
    return value;
  }
  if (typeof value === "string") {
    try {
      const parsed =
        JSON.parse(value);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    } catch (error) {
      return value
        .split(",")
        .map(item => item.trim())
        .filter(Boolean);
    }
  }
  return [];
}
// ============================================================
// PRICE
// ============================================================
function formatPrice(price) {
  const number =
    Number(price || 0);
  return (
    number.toLocaleString(
      "en-US",
      {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2
      }
    ) +
    " ₪"
  );
}
// ============================================================
// HTML SAFETY
// ============================================================
function escapeHTML(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
function escapeAttribute(value) {
  return escapeHTML(value);
}
function escapeJS(value) {
  return String(value ?? "")
    .replace(/\\/g, "\\\\")
    .replace(/'/g, "\\'")
    .replace(/"/g, '\\"')
    .replace(/\n/g, "\\n")
    .replace(/\r/g, "\\r");
}
// ============================================================
// EXPOSE FUNCTIONS
// ============================================================
window.loadProducts =
  loadProducts;
window.addProductToCart =
  addProductToCart;
window.removeCartItem =
  removeCartItem;
window.changeCartQuantity =
  changeCartQuantity;
window.openCart =
  openCart;
window.closeCart =
  closeCart;
window.updateCartUI =
  updateCartUI;
