"use strict";

/* =========================================================
   SUPABASE
========================================================= */

const SUPABASE_URL =
    "https://eflcolwdhddfncbuvjua.supabase.co";

const SUPABASE_KEY =
    "sb_publishable_J8K4FI12ExE5stcHVHviRQ_Uk__w4ko";

const supabaseClient =
    window.supabase.createClient(
        SUPABASE_URL,
        SUPABASE_KEY
    );


/* =========================================================
   STATE
========================================================= */

let products = [];
let orders = [];
let editingProductId = null;


/* =========================================================
   START
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    async () => {

        const {
            data
        } =
            await supabaseClient.auth.getSession();

        if (!data.session) {

            window.location.href =
                "admin-login.html";

            return;
        }

        setupNavigation();

        setupButtons();

        setupForms();

        await loadDashboard();

        await loadProducts();

        await loadOrders();

        loadStoreSettings();

    }
);


/* =========================================================
   NAVIGATION
========================================================= */

function setupNavigation() {

    document
        .querySelectorAll(".nav-btn")
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    openSection(
                        button.dataset.section
                    );

                }
            );

        });


    document
        .querySelectorAll("[data-open]")
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    openSection(
                        button.dataset.open
                    );

                }
            );

        });

}


function openSection(sectionId) {

    document
        .querySelectorAll(".admin-section")
        .forEach(section => {

            section.classList.remove(
                "active"
            );

        });


    const section =
        document.getElementById(
            sectionId
        );

    if (section) {

        section.classList.add(
            "active"
        );

    }


    document
        .querySelectorAll(".nav-btn")
        .forEach(button => {

            button.classList.toggle(
                "active",
                button.dataset.section ===
                sectionId
            );

        });


    const titles = {

        dashboard:
            "الرئيسية",

        orders:
            "طلبات الزبائن",

        products:
            "المنتجات",

        "add-product":
            "إضافة منتج",

        store:
            "إعدادات المتجر"

    };


    document.getElementById(
        "pageTitle"
    ).textContent =
        titles[sectionId] ||
        "الإدارة";

}


/* =========================================================
   BUTTONS
========================================================= */

function setupButtons() {

    document
        .getElementById(
            "logoutButton"
        )
        .addEventListener(
            "click",
            logout
        );


    document
        .getElementById(
            "refreshOrders"
        )
        .addEventListener(
            "click",
            loadOrders
        );


    document
        .getElementById(
            "cancelEdit"
        )
        .addEventListener(
            "click",
            resetProductForm
        );

}


/* =========================================================
   AUTH
========================================================= */

async function logout() {

    await supabaseClient.auth.signOut();

    window.location.href =
        "admin-login.html";

}


/* =========================================================
   DASHBOARD
========================================================= */

async function loadDashboard() {

    try {

        const [
            productsResult,
            ordersResult
        ] =
            await Promise.all([

                supabaseClient
                    .from("products")
                    .select(
                        "id",
                        {
                            count: "exact",
                            head: true
                        }
                    ),

                supabaseClient
                    .from("orders")
                    .select(
                        "*"
                    )

            ]);


        const productCount =
            productsResult.count ||
            0;

        const allOrders =
            ordersResult.data ||
            [];


        document.getElementById(
            "statProducts"
        ).textContent =
            productCount;


        document.getElementById(
            "statOrders"
        ).textContent =
            allOrders.length;


        const pending =
            allOrders.filter(
                order =>
                    String(
                        order.status ||
                        ""
                    ).toLowerCase() ===
                    "pending"
                    ||
                    String(
                        order.status ||
                        ""
                    ) ===
                    "جديد"
            ).length;


        document.getElementById(
            "statPending"
        ).textContent =
            pending;


        const sales =
            allOrders.reduce(
                (
                    total,
                    order
                ) =>
                    total +
                    Number(
                        order.total ||
                        order.total_amount ||
                        0
                    ),
                0
            );


        document.getElementById(
            "statSales"
        ).textContent =
            "₪" +
            formatPrice(sales);


        renderRecentOrders(
            allOrders
        );

    } catch (error) {

        console.error(
            "Dashboard error:",
            error
        );

    }

}


/* =========================================================
   PRODUCTS
========================================================= */

async function loadProducts() {

    const {
        data,
        error
    } =
        await supabaseClient
            .from("products")
            .select("*")
            .order(
                "created_at",
                {
                    ascending: false
                }
            );


    if (error) {

        console.error(error);

        showToast(
            "تعذر تحميل المنتجات"
        );

        return;
    }


    products =
        data || [];


    renderProducts();

}


function renderProducts() {

    const container =
        document.getElementById(
            "productsList"
        );


    if (!products.length) {

        container.innerHTML = `
            <div class="empty">
                لا توجد منتجات حتى الآن.
            </div>
        `;

        return;
    }


    container.innerHTML =
        products
            .map(product => {

                const image =
                    product.image_url ||
                    "https://via.placeholder.com/500";


                const price =
                    Number(
                        product.sale_price ??
                        product.price ??
                        0
                    );


                return `

                <article class="admin-product">

                    <img
                        src="${escapeHTML(image)}"
                        alt="${escapeHTML(product.name || "")}"
                    >

                    <div class="admin-product-info">

                        <span>
                            ${escapeHTML(
                                product.sku || "بدون SKU"
                            )}
                        </span>

                        <h3>
                            ${escapeHTML(
                                product.name || "منتج"
                            )}
                        </h3>

                        <strong>
                            ₪${formatPrice(price)}
                        </strong>

                        <small>
                            المخزون:
                            ${Number(product.stock || 0)}
                        </small>

                    </div>

                    <div class="product-actions">

                        <button
                            class="edit-button"
                            onclick="editProduct('${product.id}')"
                        >
                            تعديل
                        </button>

                        <button
                            class="delete-button"
                            onclick="deleteProduct('${product.id}')"
                        >
                            حذف
                        </button>

                    </div>

                </article>

                `;

            })
            .join("");

}


/* =========================================================
   PRODUCT FORM
========================================================= */

function setupForms() {

    document
        .getElementById(
            "productForm"
        )
        .addEventListener(
            "submit",
            saveProduct
        );


    document
        .getElementById(
            "storeForm"
        )
        .addEventListener(
            "submit",
            saveStoreSettings
        );


    document
        .getElementById(
            "heroImage"
        )
        .addEventListener(
            "input",
            updateHeroPreview
        );

}


/* =========================================================
   SAVE PRODUCT
========================================================= */

async function saveProduct(event) {

    event.preventDefault();


    const product = {

        name:
            document.getElementById(
                "productName"
            ).value.trim(),

        sku:
            document.getElementById(
                "productSku"
            ).value.trim() || null,

        barcode:
            document.getElementById(
                "productBarcode"
            ).value.trim() || null,

        price:
            Number(
                document.getElementById(
                    "productPrice"
                ).value || 0
            ),

        sale_price:
            getNullableNumber(
                document.getElementById(
                    "productSalePrice"
                ).value
            ),

        stock:
            Number(
                document.getElementById(
                    "productStock"
                ).value || 0
            ),

        rating:
            Number(
                document.getElementById(
                    "productRating"
                ).value || 5
            ),

        reviews:
            Number(
                document.getElementById(
                    "productReviews"
                ).value || 0
            ),

        description:
            document.getElementById(
                "productDescription"
            ).value.trim(),

        image_url:
            document.getElementById(
                "productImage"
            ).value.trim(),

        colors:
            textToArray(
                document.getElementById(
                    "productColors"
                ).value
            ),

        sizes:
            textToArray(
                document.getElementById(
                    "productSizes"
                ).value
            ),

        is_active:
            document.getElementById(
                "productActive"
            ).value === "true"

    };


    let result;


    if (editingProductId) {

        result =
            await supabaseClient
                .from("products")
                .update(product)
                .eq(
                    "id",
                    editingProductId
                );

    } else {

        result =
            await supabaseClient
                .from("products")
                .insert(
                    product
                );

    }


    if (result.error) {

        console.error(
            result.error
        );

        showToast(
            "حدث خطأ أثناء حفظ المنتج"
        );

        return;
    }


    showToast(
        editingProductId
            ? "تم تعديل المنتج بنجاح"
            : "تمت إضافة المنتج بنجاح"
    );


    resetProductForm();

    await loadProducts();

    await loadDashboard();

    openSection(
        "products"
    );

}


/* =========================================================
   EDIT PRODUCT
========================================================= */

window.editProduct =
    function (id) {

        const product =
            products.find(
                item =>
                    String(item.id) ===
                    String(id)
            );


        if (!product) {
            return;
        }


        editingProductId =
            product.id;


        document.getElementById(
            "productFormTitle"
        ).textContent =
            "تعديل المنتج";


        document.getElementById(
            "productId"
        ).value =
            product.id;


        document.getElementById(
            "productName"
        ).value =
            product.name || "";


        document.getElementById(
            "productSku"
        ).value =
            product.sku || "";


        document.getElementById(
            "productBarcode"
        ).value =
            product.barcode || "";


        document.getElementById(
            "productPrice"
        ).value =
            product.price ?? "";


        document.getElementById(
            "productSalePrice"
        ).value =
            product.sale_price ?? "";


        document.getElementById(
            "productStock"
        ).value =
            product.stock ?? 0;


        document.getElementById(
            "productRating"
        ).value =
            product.rating ?? 5;


        document.getElementById(
            "productReviews"
        ).value =
            product.reviews ?? 0;


        document.getElementById(
            "productDescription"
        ).value =
            product.description || "";


        document.getElementById(
            "productImage"
        ).value =
            product.image_url || "";


        document.getElementById(
            "productColors"
        ).value =
            arrayToText(
                product.colors
            );


        document.getElementById(
            "productSizes"
        ).value =
            arrayToText(
                product.sizes
            );


        document.getElementById(
            "productActive"
        ).value =
            product.is_active === false
                ? "false"
                : "true";


        openSection(
            "add-product"
        );

    };


/* =========================================================
   DELETE PRODUCT
========================================================= */

window.deleteProduct =
    async function (id) {

        const confirmed =
            confirm(
                "هل أنت متأكد من حذف هذا المنتج؟"
            );


        if (!confirmed) {
            return;
        }


        const {
            error
        } =
            await supabaseClient
                .from("products")
                .delete()
                .eq(
                    "id",
                    id
                );


        if (error) {

            console.error(error);

            showToast(
                "تعذر حذف المنتج"
            );

            return;
        }


        showToast(
            "تم حذف المنتج"
        );


        await loadProducts();

        await loadDashboard();

    };


/* =========================================================
   RESET PRODUCT FORM
========================================================= */

function resetProductForm() {

    editingProductId =
        null;


    document.getElementById(
        "productForm"
    ).reset();


    document.getElementById(
        "productFormTitle"
    ).textContent =
        "إضافة منتج جديد";


    document.getElementById(
        "productRating"
    ).value =
        5;


    document.getElementById(
        "productReviews"
    ).value =
        0;


    document.getElementById(
        "productActive"
    ).value =
        "true";

}


/* =========================================================
   ORDERS
========================================================= */

async function loadOrders() {

    const {
        data,
        error
    } =
        await supabaseClient
            .from("orders")
            .select("*")
            .order(
                "created_at",
                {
                    ascending: false
                }
            );


    if (error) {

        console.error(
            "Orders error:",
            error
        );

        showToast(
            "تعذر تحميل الطلبات"
        );

        return;
    }


    orders =
        data || [];


    renderOrders();

    renderRecentOrders(
        orders
    );

    updateOrderStats();

}


/* =========================================================
   RENDER ORDERS
========================================================= */

function renderOrders() {

    const container =
        document.getElementById(
            "ordersList"
        );


    if (!orders.length) {

        container.innerHTML = `
            <div class="empty">
                لا توجد طلبات حتى الآن.
            </div>
        `;

        return;
    }


    container.innerHTML =
        orders
            .map(order => {

                const total =
                    Number(
                        order.total ??
                        order.total_amount ??
                        0
                    );


                const status =
                    order.status ||
                    "pending";


                return `

                <article class="order-card">

                    <div class="order-top">

                        <div>

                            <strong>
                                ${escapeHTML(
                                    order.order_number ||
                                    "طلب #" +
                                    String(order.id).slice(0,8)
                                )}
                            </strong>

                            <span>
                                ${formatDate(
                                    order.created_at
                                )}
                            </span>

                        </div>

                        <span class="status">
                            ${escapeHTML(
                                translateStatus(status)
                            )}
                        </span>

                    </div>


                    <div class="order-customer">

                        <strong>
                            ${escapeHTML(
                                order.customer_name ||
                                "بدون اسم"
                            )}
                        </strong>

                        <span>
                            📞
                            ${escapeHTML(
                                order.phone ||
                                order.customer_phone ||
                                "-"
                            )}
                        </span>

                        <span>
                            📍
                            ${escapeHTML(
                                order.address ||
                                order.city ||
                                "-"
                            )}
                        </span>

                    </div>


                    <div class="order-bottom">

                        <strong>
                            ₪${formatPrice(total)}
                        </strong>

                        <button
                            class="small-button"
                            onclick="viewOrder('${order.id}')"
                        >
                            👁️ تفاصيل الطلب
                        </button>

                    </div>

                </article>

                `;

            })
            .join("");

}


/* =========================================================
   RECENT ORDERS
========================================================= */

function renderRecentOrders(
    list
) {

    const container =
        document.getElementById(
            "recentOrders"
        );


    if (!container) {
        return;
    }


    const recent =
        list.slice(
            0,
            6
        );


    if (!recent.length) {

        container.innerHTML =
            `<div class="empty">
                لا توجد طلبات.
            </div>`;

        return;
    }


    container.innerHTML = `

        <table>

            <thead>

                <tr>
                    <th>الطلب</th>
                    <th>الزبون</th>
                    <th>المجموع</th>
                    <th>الحالة</th>
                </tr>

            </thead>

            <tbody>

                ${recent
                    .map(order => `

                    <tr>

                        <td>
                            ${escapeHTML(
                                order.order_number ||
                                "#" +
                                String(order.id).slice(0,8)
                            )}
                        </td>

                        <td>
                            ${escapeHTML(
                                order.customer_name ||
                                "-"
                            )}
                        </td>

                        <td>
                            ₪${formatPrice(
                                order.total ??
                                order.total_amount ??
                                0
                            )}
                        </td>

                        <td>
                            ${escapeHTML(
                                translateStatus(
                                    order.status ||
                                    "pending"
                                )
                            )}
                        </td>

                    </tr>

                `)
                .join("")}

            </tbody>

        </table>

    `;

}


/* =========================================================
   VIEW ORDER
========================================================= */

window.viewOrder =
    async function (orderId) {

        const order =
            orders.find(
                item =>
                    String(item.id) ===
                    String(orderId)
            );


        if (!order) {
            return;
        }


        const {
            data: items,
            error
        } =
            await supabaseClient
                .from("order_items")
                .select("*")
                .eq(
                    "order_id",
                    orderId
                );


        if (error) {

            console.error(error);

        }


        const orderItems =
            items || [];


        const total =
            Number(
                order.total ??
                order.total_amount ??
                0
            );


        document.getElementById(
            "orderDetails"
        ).innerHTML = `

            <h2>
                تفاصيل الطلب
            </h2>

            <div class="detail-grid">

                <div>
                    <small>رقم الطلب</small>
                    <strong>
                        ${escapeHTML(
                            order.order_number ||
                            String(order.id)
                        )}
                    </strong>
                </div>

                <div>
                    <small>التاريخ</small>
                    <strong>
                        ${formatDate(
                            order.created_at
                        )}
                    </strong>
                </div>

                <div>
                    <small>اسم الزبون</small>
                    <strong>
                        ${escapeHTML(
                            order.customer_name ||
                            "-"
                        )}
                    </strong>
                </div>

                <div>
                    <small>رقم الهاتف</small>
                    <strong>
                        ${escapeHTML(
                            order.phone ||
                            order.customer_phone ||
                            "-"
                        )}
                    </strong>
                </div>

                <div>
                    <small>العنوان</small>
                    <strong>
                        ${escapeHTML(
                            order.address ||
                            "-"
                        )}
                    </strong>
                </div>

                <div>
                    <small>المدينة</small>
                    <strong>
                        ${escapeHTML(
                            order.city ||
                            "-"
                        )}
                    </strong>
                </div>

            </div>


            <h3 class="items-title">
                المنتجات المطلوبة
            </h3>


            <div class="order-items">

                ${
                    orderItems.length
                        ? orderItems
                            .map(item => `

                                <div class="order-item">

                                    <div>

                                        <strong>
                                            ${escapeHTML(
                                                item.product_name ||
                                                item.name ||
                                                "منتج"
                                            )}
                                        </strong>

                                        <span>
                                            الكمية:
                                            ${Number(
                                                item.quantity ||
                                                0
                                            )}
                                        </span>

                                        ${
                                            item.size
                                                ? `
                                                <span>
                                                    المقاس:
                                                    ${escapeHTML(
                                                        item.size
                                                    )}
                                                </span>
                                                `
                                                : ""
                                        }

                                        ${
                                            item.color
                                                ? `
                                                <span>
                                                    اللون:
                                                    ${escapeHTML(
                                                        item.color
                                                    )}
                                                </span>
                                                `
                                                : ""
                                        }

                                    </div>

                                    <strong>
                                        ₪${formatPrice(
                                            Number(
                                                item.price ||
                                                0
                                            ) *
                                            Number(
                                                item.quantity ||
                                                0
                                            )
                                        )}
                                    </strong>

                                </div>

                            `)
                            .join("")
                        : `
                            <div class="empty">
                                لا توجد تفاصيل للمنتجات في order_items.
                            </div>
                        `
                }

            </div>


            ${
                order.notes
                    ? `
                    <div class="notes">
                        <strong>ملاحظات الزبون:</strong>
                        <p>
                            ${escapeHTML(
                                order.notes
                            )}
                        </p>
                    </div>
                    `
                    : ""
            }


            <div class="order-total">

                <span>
                    الإجمالي
                </span>

                <strong>
                    ₪${formatPrice(total)}
                </strong>

            </div>

        `;


        document.getElementById(
            "orderModal"
        ).classList.add(
            "show"
        );

    };


/* =========================================================
   ORDER MODAL
========================================================= */

document
    .getElementById(
        "closeOrderModal"
    )
    .addEventListener(
        "click",
        () => {

            document.getElementById(
                "orderModal"
            ).classList.remove(
                "show"
            );

        }
    );


document
    .getElementById(
        "orderModal"
    )
    .addEventListener(
        "click",
        event => {

            if (
                event.target.id ===
                "orderModal"
            ) {

                event.currentTarget.classList.remove(
                    "show"
                );

            }

        }
    );


/* =========================================================
   STORE SETTINGS
========================================================= */

function loadStoreSettings() {

    const saved =
        localStorage.getItem(
            "littleStarsStoreSettings"
        );


    if (!saved) {
        return;
    }


    try {

        const settings =
            JSON.parse(
                saved
            );


        document.getElementById(
            "storeName"
        ).value =
            settings.name ||
            "Little Stars";


        document.getElementById(
            "storeSubtitle"
        ).value =
            settings.subtitle ||
            "Kids Fashion";


        document.getElementById(
            "heroImage"
        ).value =
            settings.heroImage ||
            "";


        document.getElementById(
            "heroTitle"
        ).value =
            settings.heroTitle ||
            "أناقة صغيرة وفرحة كبيرة";


        document.getElementById(
            "heroDescription"
        ).value =
            settings.heroDescription ||
            "";


        updateHeroPreview();

    } catch {

        console.log(
            "Could not load store settings"
        );

    }

}


async function saveStoreSettings(
    event
) {

    event.preventDefault();


    const settings = {

        name:
            document.getElementById(
                "storeName"
            ).value.trim(),

        subtitle:
            document.getElementById(
                "storeSubtitle"
            ).value.trim(),

        heroImage:
            document.getElementById(
                "heroImage"
            ).value.trim(),

        heroTitle:
            document.getElementById(
                "heroTitle"
            ).value.trim(),

        heroDescription:
            document.getElementById(
                "heroDescription"
            ).value.trim()

    };


    localStorage.setItem(
        "littleStarsStoreSettings",
        JSON.stringify(settings)
    );


    /*
     * إذا لم يكن جدول إعدادات المتجر
     * موجودًا في Supabase فلن يتوقف
     * النظام؛ يتم حفظ الإعدادات محليًا.
     *
     * عند إنشاء جدول settings لاحقًا
     * يمكن ربطه هنا.
     */


    updateHeroPreview();


    showToast(
        "تم حفظ إعدادات المتجر"
    );

}


function updateHeroPreview() {

    const url =
        document.getElementById(
            "heroImage"
        ).value.trim();


    const preview =
        document.getElementById(
            "heroPreview"
        );


    if (!url) {

        preview.style.display =
            "none";

        return;
    }


    preview.src =
        url;

    preview.style.display =
        "block";

}


/* =========================================================
   HELPERS
========================================================= */

function textToArray(
    value
) {

    return String(
        value || ""
    )
        .split(",")
        .map(
            item =>
                item.trim()
        )
        .filter(Boolean);

}


function arrayToText(
    value
) {

    if (
        Array.isArray(value)
    ) {

        return value.join(
            ", "
        );

    }


    if (
        typeof value ===
        "string"
    ) {

        return value;

    }


    return "";

}


function getNullableNumber(
    value
) {

    if (
        value === "" ||
        value === null ||
        value === undefined
    ) {

        return null;

    }


    const number =
        Number(value);


    return Number.isFinite(
        number
    )
        ? number
        : null;

}


function formatPrice(
    value
) {

    const number =
        Number(
            value || 0
        );


    return Number.isInteger(
        number
    )
        ? String(number)
        : number.toFixed(2);

}


function formatDate(
    value
) {

    if (!value) {
        return "-";
    }


    try {

        return new Date(
            value
        ).toLocaleString(
            "ar-PS",
            {
                year: "numeric",
                month: "2-digit",
                day: "2-digit",
                hour: "2-digit",
                minute: "2-digit"
            }
        );

    } catch {

        return String(value);

    }

}


function translateStatus(
    status
) {

    const values = {

        pending:
            "جديد",

        confirmed:
            "تم التأكيد",

        processing:
            "قيد التجهيز",

        shipped:
            "تم الشحن",

        delivered:
            "تم التسليم",

        cancelled:
            "ملغي",

        canceled:
            "ملغي",

        new:
            "جديد"

    };


    return values[
        String(status)
            .toLowerCase()
    ] ||
        status ||
        "جديد";

}


function escapeHTML(
    value
) {

    return String(
        value ?? ""
    )
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


function updateOrderStats() {

    const pending =
        orders.filter(
            order =>
                String(
                    order.status ||
                    ""
                ).toLowerCase() ===
                "pending"
        ).length;


    document.getElementById(
        "statOrders"
    ).textContent =
        orders.length;


    document.getElementById(
        "statPending"
    ).textContent =
        pending;


    const sales =
        orders.reduce(
            (
                total,
                order
            ) =>
                total +
                Number(
                    order.total ??
                    order.total_amount ??
                    0
                ),
            0
        );


    document.getElementById(
        "statSales"
    ).textContent =
        "₪" +
        formatPrice(sales);

}


function showToast(
    message
) {

    const toast =
        document.getElementById(
            "toast"
        );


    toast.textContent =
        message;


    toast.classList.add(
        "show"
    );


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
   REALTIME
========================================================= */

supabaseClient
    .channel(
        "admin-products"
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

            await loadDashboard();

        }
    )
    .subscribe();


supabaseClient
    .channel(
        "admin-orders"
    )
    .on(
        "postgres_changes",
        {
            event: "*",
            schema: "public",
            table: "orders"
        },
        async () => {

            await loadOrders();

            await loadDashboard();

        }
    )
    .subscribe();
