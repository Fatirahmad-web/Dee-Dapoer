/* ============================================
   DEE DAPOER - supabase.js  v2
   ⚠️  Harus dimuat SETELAH script.js
   ============================================ */

'use strict';

/* ──────────────────────────────────────────────
   ⚙️  GANTI KEDUA NILAI INI DENGAN MILIK KAMU
   Supabase Dashboard → Settings → API
   ────────────────────────────────────────────── */
const SUPABASE_URL  = 'https://ihntiszvxwnwnqamrvbp.supabase.co';
const SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlobnRpc3p2eHdud25xYW1ydmJwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYxNTA3NDUsImV4cCI6MjA5MTcyNjc0NX0.wmvuQvdN2pBQLGGOny25ik8qshcBl_cukzmZwiSdxZo';

/* ──────────────────────────────────────────────
   INIT CLIENT
   ────────────────────────────────────────────── */
const { createClient } = supabase;
const db = createClient(SUPABASE_URL, SUPABASE_ANON);


/* ══════════════════════════════════════════════
   1. FETCH MENU DARI SUPABASE
══════════════════════════════════════════════ */
async function fetchMenus() {
    const { data, error } = await db
        .from('menus')
        .select('*')
        .eq('is_available', true)
        .order('category', { ascending: true });

    if (error) {
        console.error('[Supabase] fetchMenus:', error.message);
        return [];
    }
    return data;
}


/* ══════════════════════════════════════════════
   2. SIMPAN PESANAN KE SUPABASE
══════════════════════════════════════════════ */
async function submitOrder({ customerName, customerPhone, customerAddress, items }) {
    const totalPrice = items.reduce((sum, i) => sum + i.price * i.qty, 0);

    const { data, error } = await db
        .from('orders')
        .insert([{
            customer_name:    customerName,
            customer_phone:   customerPhone,
            customer_address: customerAddress,
            items:            items,
            total_price:      totalPrice,
            status:           'pending',
        }])
        .select()
        .single();

    if (error) {
        console.error('[Supabase] submitOrder:', error.message);
        return null;
    }
    return data;
}


/* ══════════════════════════════════════════════
   3. RENDER MENU GRID DARI SUPABASE
══════════════════════════════════════════════ */
async function renderMenuFromSupabase() {
    const menuGrid = document.querySelector('.menu-grid');
    if (!menuGrid) return;

    menuGrid.innerHTML = `
        <div style="grid-column:1/-1;text-align:center;padding:4rem 2rem;color:var(--gray-light);">
            <div style="font-size:2rem;margin-bottom:1rem">⏳</div>
            <p style="font-size:0.95rem">Memuat menu...</p>
        </div>`;

    const menus = await fetchMenus();

    if (menus.length === 0) {
        menuGrid.innerHTML = `
            <div style="grid-column:1/-1;text-align:center;padding:4rem 2rem;color:var(--gray-light);">
                <div style="font-size:2rem;margin-bottom:1rem">🍽️</div>
                <p style="font-size:0.95rem">Menu sedang diperbarui. Silakan cek kembali nanti.</p>
            </div>`;
        return;
    }

    menuGrid.innerHTML = menus.map(item => `
        <article class="menu-card reveal-up" data-category="${item.category}">
            <div class="menu-card-img-wrap">
                <img
                    src="${item.image_url || 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&q=70'}"
                    alt="${item.name}"
                    class="menu-card-img"
                    loading="lazy"
                    onerror="this.src='https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&q=70'">
                ${item.badge ? `<span class="menu-badge">${item.badge}</span>` : ''}
                <button
                    class="btn-add-cart"
                    data-name="${item.name}"
                    data-price="${item.price}"
                    aria-label="Tambah ke keranjang">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                        <path d="M12 5v14M5 12h14"/>
                    </svg>
                </button>
            </div>
            <div class="menu-card-body">
                <span class="menu-cat-tag">${item.category}</span>
                <h3 class="menu-card-name">${item.name}</h3>
                <p class="menu-card-desc">${item.description || ''}</p>
                <div class="menu-card-footer">
                    <span class="menu-price">Rp ${Number(item.price).toLocaleString('id-ID')}</span>
                    <button
                        class="btn-add-cart btn-primary btn-sm"
                        data-name="${item.name}"
                        data-price="${item.price}">
                        + Keranjang
                    </button>
                </div>
            </div>
        </article>
    `).join('');

    initFilterBar();
    initCartListeners();
    if (typeof triggerReveal === 'function') triggerReveal();
}


/* ══════════════════════════════════════════════
   4. FILTER BAR (re-init setelah render dinamis)
══════════════════════════════════════════════ */
function initFilterBar() {
    document.querySelectorAll('.filter-btn').forEach(btn => {
        const clone = btn.cloneNode(true);
        btn.parentNode.replaceChild(clone, btn);
    });

    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const filter = btn.dataset.filter;
            document.querySelectorAll('.menu-card').forEach(card => {
                const show = filter === 'all' || card.dataset.category === filter;
                card.classList.toggle('hidden', !show);
                if (show) card.style.animation = 'fadeInCard 0.4s ease forwards';
            });
        });
    });
}


/* ══════════════════════════════════════════════
   5. CART LISTENERS (untuk kartu menu dinamis)
══════════════════════════════════════════════ */
function initCartListeners() {
    document.querySelectorAll('.btn-add-cart').forEach(btn => {
        btn.addEventListener('click', () => {
            const name  = btn.dataset.name;
            const price = parseInt(btn.dataset.price, 10);
            if (!name || !price) return;

            const existing = cart.find(i => i.name === name);
            if (existing) existing.qty++;
            else cart.push({ name, price, qty: 1 });

            if (typeof updateCart === 'function') updateCart();
            if (typeof openCart  === 'function') openCart();

            btn.style.transform = 'rotate(135deg) scale(1.3)';
            btn.style.background = '#FFD700';
            btn.style.color = '#0A0A0A';
            setTimeout(() => {
                btn.style.transform = '';
                btn.style.background = '';
                btn.style.color = '';
            }, 500);
        });
    });
}


/* ══════════════════════════════════════════════
   6. CHECKOUT MODAL
══════════════════════════════════════════════ */
function buildCheckoutModal() {
    if (document.getElementById('checkout-modal')) {
        const openCheckoutModal = () => {
            const m = document.getElementById('checkout-modal');
            m.style.opacity = '1'; m.style.visibility = 'visible';
            m.querySelector('#checkout-box').style.transform = 'scale(1)';
        };
        return { openCheckoutModal };
    }

    const modal = document.createElement('div');
    modal.id = 'checkout-modal';
    modal.style.cssText = `
        position:fixed;inset:0;z-index:2000;
        background:rgba(0,0,0,0.65);
        display:flex;align-items:center;justify-content:center;
        padding:1.5rem;
        opacity:0;visibility:hidden;
        transition:opacity 0.25s,visibility 0.25s;
        backdrop-filter:blur(6px);
    `;
    modal.innerHTML = `
        <div id="checkout-box" style="
            background:#fff;border-radius:20px;
            width:100%;max-width:440px;overflow:hidden;
            transform:scale(0.95);transition:transform 0.25s;
            box-shadow:0 32px 80px rgba(0,0,0,0.3);
        ">
            <div style="background:#0A0A0A;padding:1.25rem 1.5rem;display:flex;align-items:center;justify-content:space-between;">
                <h3 style="font-family:'Plus Jakarta Sans',sans-serif;font-weight:700;color:#fff;font-size:1rem">
                    📦 Data Pengiriman
                </h3>
                <button id="checkout-modal-close" style="
                    width:28px;height:28px;border-radius:50%;
                    background:rgba(255,255,255,0.1);border:none;
                    color:rgba(255,255,255,0.6);font-size:1rem;
                    cursor:pointer;display:flex;align-items:center;justify-content:center;
                ">✕</button>
            </div>
            <div style="padding:1.5rem">
                <div style="margin-bottom:1rem">
                    <label style="display:block;font-size:0.72rem;font-weight:700;color:#999;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:0.45rem">Nama Pemesan *</label>
                    <input id="co-name" type="text" placeholder="cth: Budi Santoso" style="width:100%;padding:0.72rem 1rem;border:1.5px solid #e5e5e5;border-radius:10px;font-size:0.9rem;outline:none;font-family:'Lato',sans-serif;color:#111;transition:border-color 0.2s" onfocus="this.style.borderColor='#FFD700'" onblur="this.style.borderColor='#e5e5e5'">
                </div>
                <div style="margin-bottom:1rem">
                    <label style="display:block;font-size:0.72rem;font-weight:700;color:#999;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:0.45rem">No. WhatsApp *</label>
                    <input id="co-phone" type="tel" placeholder="cth: 08123456789" style="width:100%;padding:0.72rem 1rem;border:1.5px solid #e5e5e5;border-radius:10px;font-size:0.9rem;outline:none;font-family:'Lato',sans-serif;color:#111;transition:border-color 0.2s" onfocus="this.style.borderColor='#FFD700'" onblur="this.style.borderColor='#e5e5e5'">
                </div>
                <div style="margin-bottom:1.5rem">
                    <label style="display:block;font-size:0.72rem;font-weight:700;color:#999;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:0.45rem">Alamat Lengkap *</label>
                    <textarea id="co-address" rows="3" placeholder="Nama jalan, RT/RW, kelurahan, kota..." style="width:100%;padding:0.72rem 1rem;border:1.5px solid #e5e5e5;border-radius:10px;font-size:0.9rem;outline:none;resize:none;font-family:'Lato',sans-serif;color:#111;transition:border-color 0.2s" onfocus="this.style.borderColor='#FFD700'" onblur="this.style.borderColor='#e5e5e5'"></textarea>
                </div>
                <div id="co-error" style="color:#ef4444;font-size:0.8rem;margin-bottom:0.75rem;display:none;padding:0.5rem 0.75rem;background:#fef2f2;border-radius:8px;"></div>
                <button id="co-submit" style="
                    width:100%;padding:0.9rem;
                    background:#FFD700;color:#0A0A0A;
                    font-family:'Plus Jakarta Sans',sans-serif;font-weight:700;font-size:0.92rem;
                    border-radius:100px;border:none;cursor:pointer;
                    display:flex;align-items:center;justify-content:center;gap:0.6rem;
                    transition:opacity 0.2s,transform 0.15s;
                " onmouseover="this.style.opacity='0.88'" onmouseout="this.style.opacity='1'">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="#0A0A0A"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>
                    Konfirmasi & Kirim WhatsApp
                </button>
                <p style="text-align:center;font-size:0.72rem;color:#bbb;margin-top:0.75rem">Pesanan tersimpan otomatis & dikirim ke WhatsApp kami</p>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    const box = document.getElementById('checkout-box');

    function openCheckoutModal() {
        modal.style.opacity  = '1';
        modal.style.visibility = 'visible';
        box.style.transform  = 'scale(1)';
        setTimeout(() => document.getElementById('co-name')?.focus(), 100);
    }
    function closeCheckoutModal() {
        modal.style.opacity  = '0';
        modal.style.visibility = 'hidden';
        box.style.transform  = 'scale(0.95)';
    }

    modal.addEventListener('click', (e) => { if (e.target === modal) closeCheckoutModal(); });
    document.getElementById('checkout-modal-close').addEventListener('click', closeCheckoutModal);

    document.getElementById('co-submit').addEventListener('click', async () => {
        const customerName    = document.getElementById('co-name').value.trim();
        const customerPhone   = document.getElementById('co-phone').value.trim();
        const customerAddress = document.getElementById('co-address').value.trim();
        const errEl           = document.getElementById('co-error');
        const submitBtn       = document.getElementById('co-submit');

        if (!customerName || !customerPhone || !customerAddress) {
            errEl.textContent = '⚠️ Semua field wajib diisi.';
            errEl.style.display = 'block'; return;
        }
        if (!/^[0-9+\s-]{8,15}$/.test(customerPhone)) {
            errEl.textContent = '⚠️ Format nomor WhatsApp tidak valid.';
            errEl.style.display = 'block'; return;
        }
        errEl.style.display = 'none';

        submitBtn.disabled = true;
        submitBtn.textContent = 'Memproses...';
        submitBtn.style.opacity = '0.6';

        const order = await submitOrder({
            customerName, customerPhone, customerAddress,
            items: cart.map(i => ({ name: i.name, price: i.price, qty: i.qty })),
        });

        submitBtn.disabled = false;
        submitBtn.style.opacity = '1';
        submitBtn.innerHTML = `Konfirmasi & Kirim WhatsApp`;

        if (!order) {
            errEl.textContent = '❌ Gagal menyimpan pesanan. Coba lagi.';
            errEl.style.display = 'block'; return;
        }

        closeCheckoutModal();
        document.getElementById('co-name').value = '';
        document.getElementById('co-phone').value = '';
        document.getElementById('co-address').value = '';

        const total = cart.reduce((sum, i) => sum + i.price * i.qty, 0);

// Gunakan \n untuk baris baru agar lebih rapi saat di-encode
let messageText = `Halo DEE DAPOER!\n`;
messageText += `Pesanan No. *#${String(order.id).padStart(5,'0')}*\n\n`;

cart.forEach(i => {
    messageText += `• ${i.name} ×${i.qty} — Rp ${(i.price*i.qty).toLocaleString('id-ID')}\n`;
});

messageText += `\n*Total: Rp ${total.toLocaleString('id-ID')}*\n\n`;
messageText += `Nama: ${customerName}\n`;
messageText += `HP: ${customerPhone}\n`;
messageText += `Alamat: ${customerAddress}\n\n`;
messageText += `Mohon dikonfirmasi. Terima kasih!`;

// Encode seluruh pesan agar karakter # dan spasi tidak memutus URL
const encodedMsg = encodeURIComponent(messageText);

// Ganti 62812... dengan nomor WhatsApp asli DEE DAPOER secara lengkap
window.open(`https://wa.me/6281295539569?text=${encodedMsg}`, '_blank');

        cart.length = 0;
        if (typeof updateCart === 'function') updateCart();
        if (typeof closeCart  === 'function') closeCart();
    });

    return { openCheckoutModal };
}


/* ══════════════════════════════════════════════
   7. OVERRIDE TOMBOL CHECKOUT DI CART
══════════════════════════════════════════════ */
function initSupabaseCheckout() {
    const btnCheckout = document.getElementById('btn-checkout');
    if (!btnCheckout) return;

    const { openCheckoutModal } = buildCheckoutModal();

    // Clone untuk hapus listener lama dari script.js
    const newBtn = btnCheckout.cloneNode(true);
    btnCheckout.parentNode.replaceChild(newBtn, btnCheckout);

    newBtn.addEventListener('click', (e) => {
        e.preventDefault();
        if (!cart || cart.length === 0) return;
        openCheckoutModal();
    });
}


/* ══════════════════════════════════════════════
   INIT
══════════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', () => {
    renderMenuFromSupabase();
    initSupabaseCheckout();
});