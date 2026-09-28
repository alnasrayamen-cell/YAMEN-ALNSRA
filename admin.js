/* =========================================================
   KOSHI.WEAR ADMIN
   Real Supabase Admin Dashboard
   ========================================================= */
/* =========================
   1. SUPABASE CONFIG
   ========================= */
const SUPABASE_URL = "https://eflcolwdhddfncbuvjua.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_J8K4FI12ExE5stcHVHviRQ_Uk__w4ko";
const supabaseClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_PUBLISHABLE_KEY
);
/* =========================
   2. GLOBAL STATE
   ========================= */
let currentProducts = [];
let currentOrders = [];
let currentCustomers = [];
let currentOffers = [];
let currentVisitors = [];
/* =========================
   3. HELPERS
   ========================= */
function escapeHTML(value) {
    if (value === null || value === undefined) {
        return "";
    }
    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}
function formatMoney(value) {
    const number = Number(value || 0);
    return `${number.toFixed(2)} ₪`;
}
function formatDate(value) {
    if (!value) {
        return "—";
    }
    try {
        return new Date(value).toLocaleDateString("ar-PS", {
            year: "numeric",
            month: "short",
            day: "numeric"
        });
    } catch {
        return value;
    }
}
function formatDateTime(value) {
    if (!value) {
        return "—";
    }
    try {
        return new Date(value).toLocaleString("ar-PS", {
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        });
    } catch {
        return value;
    }
}
function showMessage(message) {
    alert(message);
}
function getStatusLabel(status) {
    const statuses = {
        new: "جديد",
        confirmed: "مؤكد",
        preparing: "قيد التجهيز",
        out_for_delivery: "خرج للتوصيل",
        delivered: "تم التسليم",
        cancelled: "ملغي"
    };
    return statuses[status] || status || "غير معروف";
}
function getStatusClass(status) {
    if (status === "delivered") {
        return "badge-green";
    }
    if (status === "cancelled") {
        return "badge-red";
    }
    if (status === "new") {
        return "badge-gray";
    }
    return "badge-gray";
}
/* =========================
   4. AUTHENTICATION
   ========================= */
async function checkAdminSession() {
    const {
        data: { session },
        error
    } = await supabaseClient.auth.getSession();
    if (error) {
        console.error("Session error:", error);
        window.location.href = "admin-login.html";
        return null;
    }
    if (!session) {
        window.location.href = "admin-login.html";
        return null;
    }
    const emailElement =
        document.getElementById("adminEmail");
    if (emailElement) {
        emailElement.textContent =
            session.user.email || "Admin";
    }
    return session;
}
/* =========================
   5. LOGOUT
   ========================= */
async function logoutAdmin() {
    const {
        error
    } = await supabaseClient.auth.signOut();
    if (error) {
        console.error(error);
        showMessage("حدث خطأ أثناء تسجيل الخروج.");
        return;
    }
    window.location.href = "admin-login.html";
}
document
    .getElementById("logoutBtn")
    ?.addEventListener("click", logoutAdmin);
/* =========================
   6. LOAD DASHBOARD
   ========================= */
async function loadDashboard() {
    await Promise.all([
        loadDashboardStats(),
        loadRecentOrders(),
        loadInventorySummary()
    ]);
}
/* =========================
   7. DASHBOARD STATS
   ========================= */
async function loadDashboardStats() {
    try {
        const [
            ordersResult,
            productsResult,
            customersResult,
            visitorsResult
        ] = await Promise.all([
            supabaseClient
                .from("orders")
                .select("id", {
                    count: "exact",
                    head: true
                }),
            supabaseClient
                .from("products")
                .select("id", {
                    count: "exact",
                    head: true
                })
                .eq("is_active", true),
            supabaseClient
                .from("customers")
                .select("id", {
                    count: "exact",
                    head: true
                }),
            supabaseClient
                .from("visitor_sessions")
                .select("id", {
                    count: "exact",
                    head: true
                })
        ]);
        if (ordersResult.error) {
            console.error("Orders count:", ordersResult.error);
        }
        if (productsResult.error) {
            console.error("Products count:", productsResult.error);
        }
        if (customersResult.error) {
            console.error("Customers count:", customersResult.error);
        }
        if (visitorsResult.error) {
            console.error("Visitors count:", visitorsResult.error);
        }
        document.getElementById("statOrders").textContent =
            ordersResult.count ?? 0;
        document.getElementById("statProducts").textContent =
            productsResult.count ?? 0;
        document.getElementById("statCustomers").textContent =
            customersResult.count ?? 0;
        /*
          نحسب الزوار النشطين تقريبًا خلال آخر 10 دقائق.
        */
        const tenMinutesAgo =
            new Date(Date.now() - 10 * 60 * 1000).toISOString();
        const {
            count: activeVisitors,
            error: activeVisitorsError
        } = await supabaseClient
            .from("visitor_sessions")
            .select("id", {
                count: "exact",
                head: true
            })
            .gte("last_seen_at", tenMinutesAgo);
        if (activeVisitorsError) {
            console.error(activeVisitorsError);
        }
        document.getElementById("statVisitors").textContent =
            activeVisitors ?? 0;
    } catch (error) {
        console.error("Dashboard stats error:", error);
    }
}
/* =========================
   8. RECENT ORDERS
   ========================= */
async function loadRecentOrders() {
    const container =
        document.getElementById("recentOrders");
    if (!container) {
        return;
    }
    const {
        data,
        error
    } = await supabaseClient
        .from("orders")
        .select(`
            id,
            order_number,
            total,
            status,
            created_at
        `)
        .order("created_at", {
            ascending: false
        })
        .limit(8);
    if (error) {
        console.error("Recent orders:", error);
        container.innerHTML = `
            <tr>
                <td colspan="4">
                    <div class="empty">
                        <div class="empty-icon">!</div>
                        <h3>تعذر تحميل الطلبات</h3>
                        <p>${escapeHTML(error.message)}</p>
                    </div>
                </td>
            </tr>
        `;
        return;
    }
    currentOrders = data || [];
    if (!currentOrders.length) {
        container.innerHTML = `
            <tr>
                <td colspan="4">
                    <div class="empty">
                        <div class="empty-icon">▣</div>
                        <h3>لا توجد طلبات بعد</h3>
                        <p>عندما يبدأ العملاء بالطلب ستظهر الطلبات هنا.</p>
                    </div>
                </td>
            </tr>
        `;
        return;
    }
    container.innerHTML = currentOrders.map(order => {
        return `
            <tr>
                <td>
                    <strong>
                        ${escapeHTML(order.order_number || order.id)}
                    </strong>
                </td>
                <td>
                    ${formatMoney(order.total)}
                </td>
                <td>
                    <span class="badge ${getStatusClass(order.status)}">
                        ${escapeHTML(getStatusLabel(order.status))}
                    </span>
                </td>
                <td>
                    ${formatDateTime(order.created_at)}
                </td>
            </tr>
        `;
    }).join("");
}
/* =========================
   9. PRODUCTS
   ========================= */
async function loadProducts() {
    const grid =
        document.getElementById("productsGrid");
    if (!grid) {
        return;
    }
    grid.innerHTML = `
        <div class="card" style="grid-column:1/-1">
            <div class="empty">
                <div class="empty-icon">◌</div>
                <h3>جاري تحميل المنتجات...</h3>
                <p>يتم الاتصال بقاعدة البيانات.</p>
            </div>
        </div>
    `;
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
            created_at
        `)
        .order("created_at", {
            ascending: false
        });
    if (error) {
        console.error("Products error:", error);
        grid.innerHTML = `
            <div class="card" style="grid-column:1/-1">
                <div class="empty">
                    <div class="empty-icon">!</div>
                    <h3>تعذر تحميل المنتجات</h3>
                    <p>${escapeHTML(error.message)}</p>
                </div>
            </div>
        `;
        return;
    }
    currentProducts = data || [];
    renderProducts(currentProducts);
    renderInventory(currentProducts);
}
/* =========================
   10. RENDER PRODUCTS
   ========================= */
function renderProducts(products) {
    const grid =
        document.getElementById("productsGrid");
    if (!grid) {
        return;
    }
    if (!products.length) {
        grid.innerHTML = `
            <div class="card" style="grid-column:1/-1">
                <div class="empty">
                    <div class="empty-icon">◇</div>
                    <h3>لا توجد منتجات</h3>
                    <p>
                        لم تتم إضافة أي منتجات إلى قاعدة البيانات بعد.
                    </p>
                </div>
            </div>
        `;
        return;
    }
    grid.innerHTML = products.map(product => {
        const price =
            Number(product.price || 0);
        const salePrice =
            Number(product.sale_price || 0);
        const hasSale =
            salePrice > 0 &&
            salePrice < price;
        const image =
            product.image_url;
        let colors = "";
        if (Array.isArray(product.colors)) {
            colors = product.colors.join("، ");
        } else if (product.colors) {
            colors = String(product.colors);
        }
        return `
            <div class="product-card">
                <div class="product-image">
                    ${
                        image
                        ?
                        `<img
                            src="${escapeHTML(image)}"
                            alt="${escapeHTML(product.name)}"
                            loading="lazy"
                        >`
                        :
                        `<span>لا توجد صورة</span>`
                    }
                </div>
                <div class="product-info">
                    <div class="product-name">
                        ${escapeHTML(product.name)}
                    </div>
                    <div class="product-meta">
                        SKU:
                        ${escapeHTML(product.sku || "—")}
                    </div>
                    ${
                        colors
                        ?
                        `
                        <div class="product-meta">
                            الألوان:
                            ${escapeHTML(colors)}
                        </div>
                        `
                        :
                        ""
                    }
                    <div class="product-bottom">
                        <div class="price">
                            ${
                                hasSale
                                ?
                                `
                                <span style="color:#fff;">
                                    ${formatMoney(salePrice)}
                                </span>
                                <span style="
                                    color:#666;
                                    text-decoration:line-through;
                                    font-size:10px;
                                    margin-right:5px;
                                ">
                                    ${formatMoney(price)}
                                </span>
                                `
                                :
                                formatMoney(price)
                            }
                        </div>
                        <span class="badge ${
                            Number(product.stock || 0) > 0
                            ? "badge-green"
                            : "badge-red"
                        }">
                            ${
                                Number(product.stock || 0) > 0
                                ? `المخزون ${product.stock}`
                                : "نفد المخزون"
                            }
                        </span>
                    </div>
                </div>
            </div>
        `;
    }).join("");
}
/* =========================
   11. PRODUCT SEARCH
   ========================= */
document
    .getElementById("productSearch")
    ?.addEventListener("input", function () {
        const query =
            this.value.trim().toLowerCase();
        if (!query) {
            renderProducts(currentProducts);
            return;
        }
        const filtered =
            currentProducts.filter(product => {
                const name =
                    String(product.name || "").toLowerCase();
                const sku =
                    String(product.sku || "").toLowerCase();
                const barcode =
                    String(product.barcode || "").toLowerCase();
                return (
                    name.includes(query) ||
                    sku.includes(query) ||
                    barcode.includes(query)
                );
            });
        renderProducts(filtered);
    });
/* =========================
   12. INVENTORY
   ========================= */
function renderInventory(products) {
    const table =
        document.getElementById("inventoryTable");
    const summary =
        document.getElementById("inventorySummary");
    if (table) {
        if (!products.length) {
            table.innerHTML = `
                <tr>
                    <td colspan="4">
                        <div class="empty">
                            <h3>لا توجد منتجات</h3>
                        </div>
                    </td>
                </tr>
            `;
        } else {
            table.innerHTML =
                products.map(product => {
                    const stock =
                        Number(product.stock || 0);
                    let status =
                        "متوفر";
                    let badge =
                        "badge-green";
                    if (stock <= 0) {
                        status =
                            "نفد المخزون";
                        badge =
                            "badge-red";
                    } else if (stock <= 5) {
                        status =
                            "مخزون منخفض";
                        badge =
                            "badge-gray";
                    }
                    return `
                        <tr>
                            <td>
                                <strong>
                                    ${escapeHTML(product.name)}
                                </strong>
                            </td>
                            <td>
                                ${escapeHTML(product.sku || "—")}
                            </td>
                            <td>
                                ${stock}
                            </td>
                            <td>
                                <span class="badge ${badge}">
                                    ${status}
                                </span>
                            </td>
                        </tr>
                    `;
                }).join("");
        }
    }
    if (summary) {
        const total =
            products.reduce(
                (sum, product) =>
                    sum + Number(product.stock || 0),
                0
            );
        const outOfStock =
            products.filter(
                product =>
                    Number(product.stock || 0) <= 0
            ).length;
        const lowStock =
            products.filter(
                product => {
                    const stock =
                        Number(product.stock || 0);
                    return stock > 0 && stock <= 5;
                }
            ).length;
        summary.innerHTML = `
            <div style="
                display:grid;
                gap:10px;
            ">
                <div style="
                    display:flex;
                    justify-content:space-between;
                    padding:13px;
                    background:#181818;
                    border-radius:11px;
                ">
                    <span style="color:#999;">
                        إجمالي القطع
                    </span>
                    <strong>
                        ${total}
                    </strong>
                </div>
                <div style="
                    display:flex;
                    justify-content:space-between;
                    padding:13px;
                    background:#181818;
                    border-radius:11px;
                ">
                    <span style="color:#999;">
                        مخزون منخفض
                    </span>
                    <strong>
                        ${lowStock}
                    </strong>
                </div>
                <div style="
                    display:flex;
                    justify-content:space-between;
                    padding:13px;
                    background:#181818;
                    border-radius:11px;
                ">
                    <span style="color:#999;">
                        نفد المخزون
                    </span>
                    <strong style="color:#ff7070;">
                        ${outOfStock}
                    </strong>
                </div>
            </div>
        `;
    }
}
async function loadInventorySummary() {
    if (!currentProducts.length) {
        await loadProducts();
        return;
    }
    renderInventory(currentProducts);
}
/* =========================
   13. CUSTOMERS
   ========================= */
async function loadCustomers() {
    const table =
        document.getElementById("customersTable");
    if (!table) {
        return;
    }
    table.innerHTML = `
        <tr>
            <td colspan="5">
                <div class="empty">
                    <h3>جاري تحميل العملاء...</h3>
                </div>
            </td>
        </tr>
    `;
    const {
        data,
        error
    } = await supabaseClient
        .from("customers")
        .select(`
            id,
            full_name,
            phone,
            region,
            city,
            address,
            created_at
        `)
        .order("created_at", {
            ascending: false
        });
    if (error) {
        console.error("Customers:", error);
        table.innerHTML = `
            <tr>
                <td colspan="5">
                    <div class="empty">
                        <h3>تعذر تحميل العملاء</h3>
                        <p>${escapeHTML(error.message)}</p>
                    </div>
                </td>
            </tr>
        `;
        return;
    }
    currentCustomers = data || [];
    if (!currentCustomers.length) {
        table.innerHTML = `
            <tr>
                <td colspan="5">
                    <div class="empty">
                        <div class="empty-icon">♙</div>
                        <h3>لا يوجد عملاء بعد</h3>
                        <p>
                            العملاء سيظهرون هنا بعد تنفيذ أول طلب حقيقي.
                        </p>
                    </div>
                </td>
            </tr>
        `;
        return;
    }
    table.innerHTML =
        currentCustomers.map(customer => {
            return `
                <tr>
                    <td>
                        <strong>
                            ${escapeHTML(customer.full_name)}
                        </strong>
                    </td>
                    <td>
                        ${escapeHTML(customer.phone || "—")}
                    </td>
                    <td>
                        ${escapeHTML(customer.region || "—")}
                    </td>
                    <td>
                        ${escapeHTML(customer.city || "—")}
                    </td>
                    <td>
                        ${formatDate(customer.created_at)}
                    </td>
                </tr>
            `;
        }).join("");
}
/* =========================
   14. ORDERS PAGE
   ========================= */
async function loadOrders() {
    const table =
        document.getElementById("ordersTable");
    if (!table) {
        return;
    }
    table.innerHTML = `
        <tr>
            <td colspan="7">
                <div class="empty">
                    <h3>جاري تحميل الطلبات...</h3>
                </div>
            </td>
        </tr>
    `;
    const {
        data,
        error
    } = await supabaseClient
        .from("orders")
        .select(`
            id,
            order_number,
            customer_id,
            total,
            status,
            traffic_source,
            created_at
        `)
        .order("created_at", {
            ascending: false
        });
    if (error) {
        console.error("Orders:", error);
        table.innerHTML = `
            <tr>
                <td colspan="7">
                    <div class="empty">
                        <h3>تعذر تحميل الطلبات</h3>
                        <p>${escapeHTML(error.message)}</p>
                    </div>
                </td>
            </tr>
        `;
        return;
    }
    currentOrders = data || [];
    if (!currentOrders.length) {
        table.innerHTML = `
            <tr>
                <td colspan="7">
                    <div class="empty">
                        <div class="empty-icon">▣</div>
                        <h3>لا توجد طلبات بعد</h3>
                        <p>
                            ستظهر طلبات العملاء الحقيقية هنا.
                        </p>
                    </div>
                </td>
            </tr>
        `;
        return;
    }
    /*
      نجيب العملاء المرتبطين بالطلبات.
    */
    const customerIds =
        currentOrders
            .map(order => order.customer_id)
            .filter(Boolean);
    let customerMap = {};
    if (customerIds.length) {
        const {
            data: customers,
            error: customersError
        } = await supabaseClient
            .from("customers")
            .select(`
                id,
                full_name,
                phone
            `)
            .in("id", customerIds);
        if (!customersError) {
            (customers || []).forEach(customer => {
                customerMap[customer.id] =
                    customer;
            });
        }
    }
    table.innerHTML =
        currentOrders.map(order => {
            const customer =
                customerMap[order.customer_id];
            return `
                <tr>
                    <td>
                        <strong>
                            ${escapeHTML(
                                order.order_number ||
                                order.id
                            )}
                        </strong>
                    </td>
                    <td>
                        ${escapeHTML(
                            customer?.full_name || "—"
                        )}
                    </td>
                    <td>
                        ${escapeHTML(
                            customer?.phone || "—"
                        )}
                    </td>
                    <td>
                        ${formatMoney(order.total)}
                    </td>
                    <td>
                        <span class="badge ${
                            getStatusClass(order.status)
                        }">
                            ${escapeHTML(
                                getStatusLabel(order.status)
                            )}
                        </span>
                    </td>
                    <td>
                        ${formatDateTime(order.created_at)}
                    </td>
                    <td>
                        <button
                            class="btn btn-dark"
                            onclick="viewOrder('${order.id}')">
                            عرض
                        </button>
                    </td>
                </tr>
            `;
        }).join("");
}
/* =========================
   15. VIEW ORDER
   ========================= */
window.viewOrder = async function(orderId) {
    const {
        data: order,
        error
    } = await supabaseClient
        .from("orders")
        .select(`
            *,
            order_items (
                id,
                product_id,
                product_name,
                quantity,
                unit_price,
                selected_color,
                selected_size
            )
        `)
        .eq("id", orderId)
        .single();
    if (error) {
        console.error(error);
        showMessage(
            "تعذر تحميل تفاصيل الطلب."
        );
        return;
    }
    const {
        data: customer
    } = await supabaseClient
        .from("customers")
        .select("*")
        .eq("id", order.customer_id)
        .maybeSingle();
    let itemsText = "";
    if (order.order_items?.length) {
        itemsText =
            order.order_items
                .map(item => {
                    return `
                        ${item.product_name}
                        × ${item.quantity}
                    `;
                })
                .join("\n");
    }
    const customerText =
        customer
        ?
        `
العميل: ${customer.full_name || "—"}
الهاتف: ${customer.phone || "—"}
المنطقة: ${customer.region || "—"}
المدينة: ${customer.city || "—"}
العنوان: ${customer.address || "—"}
        `
        :
        "لا توجد بيانات عميل.";
    showMessage(`
رقم الطلب: ${order.order_number || order.id}
${customerText}
الحالة: ${getStatusLabel(order.status)}
الإجمالي: ${formatMoney(order.total)}
المنتجات:
${itemsText || "لا توجد منتجات"}
    `);
};
/* =========================
   16. OFFERS
   ========================= */
async function loadOffers() {
    const table =
        document.getElementById("offersTable");
    if (!table) {
        return;
    }
    const {
        data,
        error
    } = await supabaseClient
        .from("offers")
        .select("*")
        .order("created_at", {
            ascending: false
        });
    if (error) {
        console.error("Offers:", error);
        table.innerHTML = `
            <tr>
                <td colspan="5">
                    <div class="empty">
                        <h3>تعذر تحميل العروض</h3>
                        <p>${escapeHTML(error.message)}</p>
                    </div>
                </td>
            </tr>
        `;
        return;
    }
    currentOffers = data || [];
    if (!currentOffers.length) {
        table.innerHTML = `
            <tr>
                <td colspan="5">
                    <div class="empty">
                        <div class="empty-icon">%</div>
                        <h3>لا توجد عروض</h3>
                        <p>
                            أضف أول عرض عندما نبني نظام العروض.
                        </p>
                    </div>
                </td>
            </tr>
        `;
        return;
    }
    table.innerHTML =
        currentOffers.map(offer => {
            const discount =
                offer.discount_type === "percentage"
                ? `${offer.discount_value}%`
                : formatMoney(offer.discount_value);
            return `
                <tr>
                    <td>
                        <strong>
                            ${escapeHTML(offer.name)}
                        </strong>
                    </td>
                    <td>
                        ${escapeHTML(offer.code || "—")}
                    </td>
                    <td>
                        ${discount}
                    </td>
                    <td>
                        <span class="badge ${
                            offer.is_active
                            ? "badge-green"
                            : "badge-red"
                        }">
                            ${
                                offer.is_active
                                ? "فعال"
                                : "غير فعال"
                            }
                        </span>
                    </td>
                    <td>
                        ${formatDate(offer.ends_at)}
                    </td>
                </tr>
            `;
        }).join("");
}
/* =========================
   17. VISITORS
   ========================= */
async function loadVisitors() {
    const table =
        document.getElementById("visitorsTable");
    if (!table) {
        return;
    }
    const {
        data,
        error
    } = await supabaseClient
        .from("visitor_sessions")
        .select(`
            id,
            session_id,
            traffic_source,
            current_page,
            last_seen_at,
            created_at
        `)
        .order("last_seen_at", {
            ascending: false
        })
        .limit(100);
    if (error) {
        console.error("Visitors:", error);
        table.innerHTML = `
            <tr>
                <td colspan="4">
                    <div class="empty">
                        <h3>تعذر تحميل الزوار</h3>
                        <p>${escapeHTML(error.message)}</p>
                    </div>
                </td>
            </tr>
        `;
        return;
    }
    currentVisitors = data || [];
    if (!currentVisitors.length) {
        table.innerHTML = `
            <tr>
                <td colspan="4">
                    <div class="empty">
                        <div class="empty-icon">◉</div>
                        <h3>لا توجد جلسات بعد</h3>
                        <p>
                            ستظهر جلسات زوار المتجر هنا.
                        </p>
                    </div>
                </td>
            </tr>
        `;
        return;
    }
    table.innerHTML =
        currentVisitors.map(visitor => {
            return `
                <tr>
                    <td>
                        ${escapeHTML(
                            visitor.session_id?.slice(0, 12) ||
                            "—"
                        )}
                    </td>
                    <td>
                        ${escapeHTML(
                            visitor.traffic_source ||
                            "direct"
                        )}
                    </td>
                    <td>
                        ${escapeHTML(
                            visitor.current_page ||
                            "—"
                        )}
                    </td>
                    <td>
                        ${formatDateTime(
                            visitor.last_seen_at
                        )}
                    </td>
                </tr>
            `;
        }).join("");
}
/* =========================
   18. SETTINGS
   ========================= */
async function loadSettings() {
    const {
        data,
        error
    } = await supabaseClient
        .from("store_settings")
        .select(`
            id,
            store_name,
            logo_url,
            admin_profile_image_url
        `)
        .eq("id", 1)
        .maybeSingle();
    if (error) {
        console.error("Settings:", error);
        return;
    }
    if (!data) {
        return;
    }
    document.getElementById("storeName").value =
        data.store_name || "KOSHI.WEAR";
    document.getElementById("logoUrl").value =
        data.logo_url || "";
    document.getElementById("adminProfileImageUrl").value =
        data.admin_profile_image_url || "";
}
async function saveSettings() {
    const storeName =
        document.getElementById("storeName").value.trim();
    const logoUrl =
        document.getElementById("logoUrl").value.trim();
    const profileUrl =
        document
            .getElementById("adminProfileImageUrl")
            .value
            .trim();
    const {
        error
    } = await supabaseClient
        .from("store_settings")
        .update({
            store_name:
                storeName || "KOSHI.WEAR",
            logo_url:
                logoUrl || null,
            admin_profile_image_url:
                profileUrl || null,
            updated_at:
                new Date().toISOString()
        })
        .eq("id", 1);
    if (error) {
        console.error(error);
        showMessage(
            "تعذر حفظ الإعدادات: " +
            error.message
        );
        return;
    }
    showMessage(
        "تم حفظ إعدادات المتجر بنجاح."
    );
}
document
    .getElementById("saveSettings")
    ?.addEventListener(
        "click",
        saveSettings
    );
/* =========================
   19. PRODUCT MODAL
   ========================= */
document
    .getElementById("productForm")
    ?.addEventListener(
        "submit",
        async function(event) {
            event.preventDefault();
            const name =
                document
                    .getElementById("productName")
                    .value
                    .trim();
            const description =
                document
                    .getElementById("productDescription")
                    .value
                    .trim();
            const price =
                Number(
                    document
                        .getElementById("productPrice")
                        .value
                );
            const salePriceRaw =
                document
                    .getElementById("productSalePrice")
                    .value
                    .trim();
            const salePrice =
                salePriceRaw
                ? Number(salePriceRaw)
                : null;
            const sku =
                document
                    .getElementById("productSku")
                    .value
                    .trim();
            const barcode =
                document
                    .getElementById("productBarcode")
                    .value
                    .trim();
            const stock =
                Number(
                    document
                        .getElementById("productStock")
                        .value
                );
            const imageUrl =
                document
                    .getElementById("productImage")
                    .value
                    .trim();
            const colorsText =
                document
                    .getElementById("productColors")
                    .value
                    .trim();
            const sizesText =
                document
                    .getElementById("productSizes")
                    .value
                    .trim();
            if (!name) {
                showMessage(
                    "اكتب اسم المنتج."
                );
                return;
            }
            if (!Number.isFinite(price) || price < 0) {
                showMessage(
                    "أدخل سعرًا صحيحًا."
                );
                return;
            }
            if (!Number.isFinite(stock) || stock < 0) {
                showMessage(
                    "أدخل كمية مخزون صحيحة."
                );
                return;
            }
            const colors =
                colorsText
                ?
                colorsText
                    .split(",")
                    .map(item => item.trim())
                    .filter(Boolean)
                :
                [];
            const sizes =
                sizesText
                ?
                sizesText
                    .split(",")
                    .map(item => item.trim())
                    .filter(Boolean)
                :
                [];
            const {
                error
            } = await supabaseClient
                .from("products")
                .insert({
                    name,
                    description:
                        description || null,
                    price,
                    sale_price:
                        salePrice,
                    image_url:
                        imageUrl || null,
                    sku:
                        sku || null,
                    barcode:
                        barcode || null,
                    stock,
                    colors,
                    sizes,
                    is_active:
                        true
                });
            if (error) {
                console.error(
                    "Create product:",
                    error
                );
                showMessage(
                    "تعذر إضافة المنتج:\n" +
                    error.message
                );
                return;
            }
            showMessage(
                "تمت إضافة المنتج بنجاح 🎉"
            );
            document
                .getElementById("productForm")
                .reset();
            document
                .getElementById("productStock")
                .value = "0";
            document
                .getElementById("productModal")
                .classList.remove("open");
            await loadProducts();
            await loadDashboardStats();
        }
    );
/* =========================
   20. REFRESH
   ========================= */
async function refreshEverything() {
    await Promise.all([
        loadDashboard(),
        loadProducts(),
        loadCustomers(),
        loadOrders(),
        loadOffers(),
        loadVisitors(),
        loadSettings()
    ]);
}
window.addEventListener(
    "admin-refresh",
    refreshEverything
);
/* =========================
   21. SECTION CHANGES
   ========================= */
window.addEventListener(
    "admin-section-change",
    async function(event) {
        const section =
            event.detail.section;
        if (section === "dashboard") {
            await loadDashboard();
        }
        if (section === "products") {
            await loadProducts();
        }
        if (section === "inventory") {
            await loadProducts();
        }
        if (section === "customers") {
            await loadCustomers();
        }
        if (section === "orders") {
            await loadOrders();
        }
        if (section === "offers") {
            await loadOffers();
        }
        if (section === "visitors") {
            await loadVisitors();
        }
        if (section === "settings") {
            await loadSettings();
        }
    }
);
/* =========================
   22. ORDER SEARCH
   ========================= */
document
    .getElementById("orderSearch")
    ?.addEventListener(
        "input",
        function() {
            const query =
                this.value
                    .trim()
                    .toLowerCase();
            if (!query) {
                loadOrders();
                return;
            }
            const filtered =
                currentOrders.filter(order => {
                    return String(
                        order.order_number ||
                        order.id ||
                        ""
                    )
                    .toLowerCase()
                    .includes(query);
                });
            const table =
                document.getElementById(
                    "ordersTable"
                );
            if (!filtered.length) {
                table.innerHTML = `
                    <tr>
                        <td colspan="7">
                            <div class="empty">
                                <h3>لا توجد نتائج</h3>
                                <p>
                                    لم نجد طلبًا مطابقًا للبحث.
                                </p>
                            </div>
                        </td>
                    </tr>
                `;
                return;
            }
            table.innerHTML =
                filtered.map(order => {
                    return `
                        <tr>
                            <td>
                                <strong>
                                    ${escapeHTML(
                                        order.order_number ||
                                        order.id
                                    )}
                                </strong>
                            </td>
                            <td>—</td>
                            <td>—</td>
                            <td>
                                ${formatMoney(order.total)}
                            </td>
                            <td>
                                <span class="badge ${
                                    getStatusClass(
                                        order.status
                                    )
                                }">
                                    ${escapeHTML(
                                        getStatusLabel(
                                            order.status
                                        )
                                    )}
                                </span>
                            </td>
                            <td>
                                ${formatDateTime(
                                    order.created_at
                                )}
                            </td>
                            <td>
                                <button
                                    class="btn btn-dark"
                                    onclick="viewOrder('${order.id}')">
                                    عرض
                                </button>
                            </td>
                        </tr>
                    `;
                }).join("");
        }
    );
/* =========================
   23. REFRESH ORDERS BUTTON
   ========================= */
document
    .getElementById("refreshOrders")
    ?.addEventListener(
        "click",
        loadOrders
    );
/* =========================
   24. START ADMIN
   ========================= */
async function startAdmin() {
    const session =
        await checkAdminSession();
    if (!session) {
        return;
    }
    console.log(
        "KOSHI.WEAR Admin connected."
    );
    await refreshEverything();
}
document.addEventListener(
    "DOMContentLoaded",
    startAdmin
);
