// ═══════════════════════════════════════════════════════════════════════
// REALISTIC STONE TEXTURE GENERATOR
// Draws a 320×220 canvas tile that matches the existing block layout,
// exports it as a JPEG data-URL, and applies it to --stone-tile.
// ═══════════════════════════════════════════════════════════════════════

(function stoneModule() {
    // ── Seeded LCG random (reproducible grain) ──────────────────────────
    function makeLCG(seed) {
        let s = seed >>> 0;
        return () => {
            s = (Math.imul(s, 1664525) + 1013904223) | 0;
            return (s >>> 0) / 4294967296;
        };
    }

    function clamp(v) { return Math.max(0, Math.min(255, v | 0)); }

    // ── Per-block drawing ───────────────────────────────────────────────
    function drawBlock(ctx, x, y, w, h, base, cfg, rng) {
        ctx.save();
        ctx.beginPath();
        ctx.rect(x, y, w, h);
        ctx.clip();

        // 1. Base fill
        ctx.fillStyle = `rgb(${base[0]},${base[1]},${base[2]})`;
        ctx.fillRect(x, y, w, h);

        // 2. Per-pixel grain (warm noise — slightly less in blue channel)
        const img = ctx.getImageData(x, y, w, h);
        const d = img.data;
        for (let i = 0; i < d.length; i += 4) {
            const n = (rng() - 0.5) * 2 * cfg.grain;
            d[i]   = clamp(d[i]   + n);
            d[i+1] = clamp(d[i+1] + n * 0.85);
            d[i+2] = clamp(d[i+2] + n * 0.60);
        }
        ctx.putImageData(img, x, y);

        // 3. Directional light gradient (top-left = bright, bottom-right = dark)
        const grd = ctx.createLinearGradient(x, y, x + w, y + h);
        grd.addColorStop(0,   `rgba(255,255,255,${cfg.hlAlpha})`);
        grd.addColorStop(0.5, 'rgba(128,128,128,0)');
        grd.addColorStop(1,   `rgba(0,0,0,${cfg.shAlpha})`);
        ctx.fillStyle = grd;
        ctx.fillRect(x, y, w, h);

        // 4. Top & left edge highlight (light catching)
        ctx.strokeStyle = cfg.edgeHL;
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        ctx.moveTo(x, y + h); ctx.lineTo(x, y + 0.5); ctx.lineTo(x + w, y + 0.5);
        ctx.stroke();

        // 5. Bottom & right edge shadow
        ctx.strokeStyle = cfg.edgeSH;
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(x + w - 0.5, y); ctx.lineTo(x + w - 0.5, y + h); ctx.lineTo(x, y + h);
        ctx.stroke();

        ctx.restore();

        // 6. Crack (55% chance)
        if (rng() > 0.45) {
            ctx.save();
            ctx.beginPath(); ctx.rect(x + 2, y + 3, w - 4, h - 6); ctx.clip();
            ctx.strokeStyle = cfg.crack;
            ctx.lineWidth = 0.5 + rng() * 0.35;
            ctx.beginPath();
            let cx = x + w * 0.12 + rng() * w * 0.76;
            let cy = y + 6;
            ctx.moveTo(cx, cy);
            const steps = 4 + Math.floor(rng() * 4);
            for (let s = 0; s < steps; s++) {
                cx += (rng() - 0.5) * 11;
                cy += (h - 12) / steps;
                ctx.lineTo(
                    Math.max(x + 3, Math.min(x + w - 3, cx)),
                    Math.min(y + h - 6, cy)
                );
            }
            ctx.stroke();
            ctx.restore();
        }
    }

    // ── Generate full tile ───────────────────────────────────────────────
    function generateTile(isDark) {
        const W = 320, H = 220;
        const canvas = document.createElement('canvas');
        canvas.width = W; canvas.height = H;
        const ctx = canvas.getContext('2d');
        const rng = makeLCG(isDark ? 0xDEADBEEF : 0xC0FFEE42);

        // Config per theme
        const cfg = isDark ? {
            mortar:  '#0b0a08',
            stones:  [[35,31,24],[30,28,21],[39,31,22],[31,29,22],[36,32,25]],
            grain:   20,
            hlAlpha: 0.075,
            shAlpha: 0.38,
            edgeHL:  'rgba(255,255,255,0.09)',
            edgeSH:  'rgba(0,0,0,0.45)',
            crack:   'rgba(0,0,0,0.60)',
        } : {
            mortar:  '#9a8a72',
            stones:  [[205,185,148],[192,170,130],[212,192,154],[198,176,138],[208,188,150]],
            grain:   26,
            hlAlpha: 0.20,
            shAlpha: 0.13,
            edgeHL:  'rgba(255,255,255,0.32)',
            edgeSH:  'rgba(0,0,0,0.18)',
            crack:   'rgba(90,65,30,0.48)',
        };

        // Mortar background
        ctx.fillStyle = cfg.mortar;
        ctx.fillRect(0, 0, W, H);

        // Block layout (matches CSS background-size: 320x220)
        const layout = [
            { y:1,   h:100, blocks: [{x:1,w:148},{x:153,w:166}] },
            { y:105, h:114, blocks: [{x:1,w:95},{x:100,w:135},{x:239,w:80}] }
        ];

        let ci = 0;
        layout.forEach(row => {
            row.blocks.forEach(b => {
                drawBlock(ctx, b.x, row.y, b.w, row.h, cfg.stones[ci % cfg.stones.length], cfg, rng);
                ci++;
            });
        });

        return canvas.toDataURL('image/jpeg', 0.90);
    }

    // ── Apply texture to CSS custom property ────────────────────────────
    function applyStone(isDark) {
        const url = generateTile(isDark);
        document.documentElement.style.setProperty('--stone-tile', `url(${url})`);
    }

    // ── Theme toggle logic ───────────────────────────────────────────────
    const root   = document.documentElement;
    const btn    = document.getElementById('theme-toggle');
    const icon   = document.getElementById('theme-icon');

    function setTheme(dark) {
        root.setAttribute('data-theme', dark ? 'dark' : 'light');
        icon.textContent = dark ? '☀' : '☽';
        btn.title = dark ? 'Mode Terang' : 'Mode Gelap';
        applyStone(dark);
    }

    // Initial render
    applyStone(true);

    if (btn) {
        btn.addEventListener('click', () => {
            const isDark = root.getAttribute('data-theme') === 'dark';
            setTheme(!isDark);
        });
    }
})();

// ═══════════════════════════════════════════════════════════════════════

const OLLAMA_URL = "http://localhost:11434/api/chat";

// ─── Dua Model Berjalan Bersamaan ────────────────────────────────────────────
const MODELS = [
    { id: 'mistral', label: '⚡ Mistral' }
];

// ─── Opsi Kecepatan ──────────────────────────────────────────────────────────
const OLLAMA_OPTIONS = {
    num_predict  : 350,
    num_ctx      : 2048,
    temperature  : 0.7,
    top_p        : 0.9,
    repeat_penalty: 1.1
};

// ─── Prompt ──────────────────────────────────────────────────────────────────
const SYSTEM_PROMPT =
    "Kamu adalah Pemandu ahli Kompleks Percandian Muaro Jambi di Jambi, Indonesia. " +
    "WAJIB jawab dalam Bahasa Indonesia. " +
    "Jawab LANGSUNG ke inti, maksimal 3-4 kalimat atau 4 bullet point (•). " +
    "Kalau ada daftar gunakan bullet •. Kalau ada nama penting gunakan **bold**. " +
    "Fokus pada topik: Kompleks Muaro Jambi, 8 candi dipugar (Tinggi, Gumpung, Kembar Batu, Gedong I&II, Astano, Koto Mahligai, Telago Rajo), " +
    "Kerajaan Sriwijaya, Kerajaan Melayu Kuno, Buddha Mahayana, arsitektur bata merah Sumatra, dan sejarah Batanghari. " +
    "Jika pertanyaan di luar topik candi/sejarah Jambi, arahkan kembali dengan sopan.";

const MAX_HISTORY  = 8;
const TYPE_SPEED   = 3;   // ms per karakter (normal)
const TYPE_FAST    = 1;   // ms per karakter (catch-up)
const QUEUE_THRESH = 12;  // antrian > 12 karakter → burst mode
const BURST_SIZE   = 4;   // karakter per tick saat burst
const COLLECT_TIMEOUT = 60_000;  // max tunggu model non-streaming (ms)

// ─── State — histori terpisah per model ──────────────────────────────────────
const histories = {};
MODELS.forEach(m => { histories[m.id] = []; });
let currentAbort = null;

const chatBox    = document.getElementById('chat-box');
const chatInput  = document.getElementById('chat-input');
const inputField = document.getElementById('user-input');
const sendBtn    = document.querySelector('#chat-input button');

// ─── Markdown Ringan ─────────────────────────────────────────────────────────
function renderMarkdown(text) {
    let s = text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
    return s
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g,     '<em>$1</em>')
        .replace(/`(.*?)`/g,
            '<code style="background:#1e2430;padding:1px 5px;border-radius:3px;font-size:0.88em;color:#e0c97a">$1</code>')
        .replace(/^[•\-\*] (.+)$/gm, '<li>$1</li>')
        .replace(/(<li>[\s\S]*?<\/li>)/g,
            m => '<ul style="margin:5px 0;padding-left:16px">' + m + '</ul>')
        .replace(/\n\n/g, '<br><br>')
        .replace(/\n/g,   '<br>');
}

function escapeHtml(t) {
    return t.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

function createDotsHTML() {
    return `<span class="typing-dots"><span></span><span></span><span></span></span>`;
}

// ─── Typewriter Engine ───────────────────────────────────────────────────────
// Tokens dari stream masuk ke antrian → ditampilkan 1 karakter per tick.
// Teks ditampilkan sebagai plain selama animasi, lalu render markdown di akhir.
function createTypewriter(botDiv) {
    let queue       = '';   // karakter menunggu diketik
    let displayed   = '';   // karakter yang sudah tampil di layar
    let ticking     = false;
    let streamEnded = false;
    let cancelled   = false;

    function finalize() {
        botDiv.classList.remove('is-typing');
        botDiv.classList.add('md-done');
        botDiv.innerHTML = renderMarkdown(displayed);
        chatBox.scrollTop = chatBox.scrollHeight;
    }

    function tick() {
        if (cancelled) return;

        if (!queue.length) {
            ticking = false;
            if (streamEnded) finalize();
            // Kalau stream belum selesai, tunggu push() berikutnya yang akan restart
            return;
        }

        // Burst mode: ketik beberapa karakter sekaligus jika antrian besar
        const count = queue.length > QUEUE_THRESH ? BURST_SIZE : 1;
        displayed  += queue.slice(0, count);
        queue       = queue.slice(count);

        botDiv.textContent = displayed; // plain text selama animasi
        // rAF batches scroll updates — tidak memaksa layout per-tick
        requestAnimationFrame(() => { chatBox.scrollTop = chatBox.scrollHeight; });

        // Kecepatan adaptif: catch-up jika antrian masih menumpuk
        const delay = queue.length > QUEUE_THRESH ? TYPE_FAST : TYPE_SPEED;

        setTimeout(tick, delay);
    }

    return {
        // Dipanggil tiap token baru dari Ollama
        push(token) {
            if (cancelled) return;
            queue += token;
            if (!ticking) {
                ticking = true;
                botDiv.classList.add('is-typing');
                setTimeout(tick, TYPE_SPEED);
            }
        },

        // Dipanggil saat stream selesai
        finish() {
            streamEnded = true;
            if (!ticking && !queue.length) finalize(); // sudah selesai mengetik
            // Kalau masih mengetik, tick() akan panggil finalize() saat queue kosong
        },

        // Dipanggil saat user klik Stop
        cancel() {
            cancelled = true;
            ticking   = false;
            displayed += queue; // flush antrian langsung
            queue      = '';
            botDiv.classList.remove('is-typing');
        }
    };
}

// ─── UI Helpers ──────────────────────────────────────────────────────────────
function setGenerating(on) {
    inputField.disabled = on;
    sendBtn.disabled    = false;
    sendBtn.textContent = on ? '⏹ Stop' : 'Kirim';
    sendBtn.classList.toggle('stop-mode', on);
}

// ─── State — apakah widget terbuka ───────────────────────────────────────────
let chatIsOpen = false;  // dimulai sebagai bubble kecil

function toggleChat() {
    chatIsOpen = !chatIsOpen;
    const widget = document.getElementById('ai-widget');
    widget.classList.toggle('chat-closed', !chatIsOpen);
    // Bersihkan inline style agar CSS class bekerja
    chatBox.style.display   = '';
    chatInput.style.display = '';
    if (chatIsOpen) inputField.focus();
}

// ─── Hapus Riwayat ───────────────────────────────────────────────────────────
function clearChat() {
    // Pertahankan hanya pesan selamat datang pertama
    while (chatBox.children.length > 1) chatBox.removeChild(chatBox.lastChild);
    MODELS.forEach(m => { histories[m.id] = []; });
    inputField.focus();
}

// ─── Kirim Saran Cepat ───────────────────────────────────────────────────────
function sendSuggestion(text) {
    if (sendBtn.classList.contains('stop-mode')) return;
    inputField.value = text;
    sendMessage();
}

function appendMessage(text, sender) {
    const div = document.createElement('div');
    div.classList.add('message', sender);
    div.innerHTML = sender === 'bot' ? renderMarkdown(text) : escapeHtml(text);
    chatBox.appendChild(div);
    chatBox.scrollTop = chatBox.scrollHeight;
    return div;
}


// ─── Kirim / Stop ────────────────────────────────────────────────────────────
function handleButton() {
    if (sendBtn.classList.contains('stop-mode')) {
        currentAbort?.abort();
    } else {
        sendMessage();
    }
}

// ─── Kirim Pesan — Mistral streaming langsung ────────────────────────────────
async function sendMessage() {
    const text = inputField.value.trim();
    if (!text || text.length > 400) return;

    appendMessage(text, 'user');
    inputField.value = '';
    setGenerating(true);

    const modelId = 'mistral';

    // Trim histori + tambah pesan user
    if (histories[modelId].length > MAX_HISTORY * 2) {
        histories[modelId] = histories[modelId].slice(-MAX_HISTORY);
    }
    histories[modelId].push({ role: 'user', content: text });

    const ac = new AbortController();
    currentAbort = ac;

    // ── Status bubble ─────────────────────────────────────────────────────────
    const statusDiv = document.createElement('div');
    statusDiv.classList.add('message', 'bot');
    statusDiv.innerHTML = `<span class="ai-status-note">⚡ Menganalisis…` + createDotsHTML() + `</span>`;
    chatBox.appendChild(statusDiv);
    chatBox.scrollTop = chatBox.scrollHeight;

    try {
        const res = await fetch(OLLAMA_URL, {
            method : 'POST',
            headers: { 'Content-Type': 'application/json' },
            signal : ac.signal,
            body   : JSON.stringify({
                model   : modelId,
                messages: [
                    { role: 'system', content: SYSTEM_PROMPT },
                    ...histories[modelId].slice(-MAX_HISTORY)
                ],
                stream  : true,
                options : OLLAMA_OPTIONS
            })
        });

        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        // Hapus status bubble, tampilkan bubble jawaban
        statusDiv.remove();
        const botDiv = document.createElement('div');
        botDiv.classList.add('message', 'bot');
        botDiv.innerHTML = createDotsHTML();
        chatBox.appendChild(botDiv);
        chatBox.scrollTop = chatBox.scrollHeight;

        const tw = createTypewriter(botDiv);
        let fullReply   = '';
        let dotsCleared = false;

        const reader  = res.body.getReader();
        const decoder = new TextDecoder();

        outer: while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            for (const line of decoder.decode(value).split('\n')) {
                if (!line.trim()) continue;
                try {
                    const chunk = JSON.parse(line);
                    const token = chunk.message?.content || '';
                    if (token) {
                        if (!dotsCleared) { botDiv.innerHTML = ''; dotsCleared = true; }
                        fullReply += token;
                        tw.push(token);
                    }
                    if (chunk.done) break outer;
                } catch { /* skip */ }
            }
        }

        tw.finish();

        if (fullReply) {
            histories[modelId].push({ role: 'assistant', content: fullReply });
        } else {
            botDiv.innerHTML = renderMarkdown('Maaf, tidak ada respons. Coba lagi!');
        }

    } catch (err) {
        if (statusDiv.parentNode) statusDiv.remove();
        if (err.name !== 'AbortError') {
            const msg = err.message.includes('Failed to fetch')
                ? '⚠️ Ollama tidak merespons. Cek: `ollama serve`'
                : '⚠️ ' + err.message;
            appendMessage(msg, 'bot');
        }
    } finally {
        currentAbort = null;
        setGenerating(false);
        inputField.focus();
    }
}

// ─── Event Listeners ─────────────────────────────────────────────────────────
sendBtn.addEventListener('click', handleButton);
inputField.addEventListener('keypress', e => {
    if (e.key === 'Enter' && !sendBtn.classList.contains('stop-mode')) sendMessage();
});

// ─── 3D Card Tilt + Mouse-Follow Shimmer ─────────────────────────────────────
(function initCardTilt() {
    const TILT_X     = 13;   // max rotateX degrees
    const TILT_Y     = 16;   // max rotateY degrees
    const LIFT_Z     = 14;   // translateZ on hover (px)
    const EASE_MOVE  = 'transform .09s ease-out, box-shadow .3s ease, border-color .3s';
    const EASE_LEAVE = 'transform .55s cubic-bezier(.22,1,.36,1), box-shadow .3s ease, border-color .3s';

    document.querySelectorAll('.card').forEach(card => {

        card.addEventListener('mouseenter', () => {
            card.style.transition = EASE_MOVE;
        });

        card.addEventListener('mousemove', e => {
            const r  = card.getBoundingClientRect();
            const nx = (e.clientX - r.left)  / r.width  - 0.5;   // -0.5 … 0.5
            const ny = (e.clientY - r.top)   / r.height - 0.5;

            // 3-D tilt
            card.style.transform =
                `perspective(900px)` +
                ` rotateX(${(-ny * TILT_X).toFixed(2)}deg)` +
                ` rotateY(${( nx * TILT_Y).toFixed(2)}deg)` +
                ` translateZ(${LIFT_Z}px)`;

            // Mouse-follow shimmer via CSS custom properties
            card.style.setProperty('--mx', ((nx + 0.5) * 100).toFixed(1) + '%');
            card.style.setProperty('--my', ((ny + 0.5) * 100).toFixed(1) + '%');
        });

        card.addEventListener('mouseleave', () => {
            card.style.transition = EASE_LEAVE;
            card.style.transform  = '';
            // Reset shimmer to centre
            card.style.setProperty('--mx', '50%');
            card.style.setProperty('--my', '50%');
        });
    });
})();

// ═══════════════════════════════════════════════════════════════════════
// SCROLL ANIMATION — IntersectionObserver
// Adds .in-view to any .scroll-anim element when it enters the viewport.
// Expose window.reinitScrollAnim() so dynamic content (cards, related)
// can be registered after being injected into the DOM.
// ═══════════════════════════════════════════════════════════════════════
(function scrollAnimModule() {
    'use strict';

    // Respect reduced-motion preference — skip observer entirely
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        document.querySelectorAll('.scroll-anim').forEach(el => {
            el.classList.add('in-view');
        });
        window.reinitScrollAnim = function () {
            document.querySelectorAll('.scroll-anim:not(.in-view)').forEach(el => {
                el.classList.add('in-view');
            });
        };
        return;
    }

    const io = new IntersectionObserver(
        (entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('in-view');
                    io.unobserve(entry.target); // fire once
                }
            });
        },
        { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
    );

    function observe() {
        document.querySelectorAll('.scroll-anim:not(.in-view)').forEach(el => {
            io.observe(el);
        });
    }

    // Initial pass after DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', observe);
    } else {
        observe();
    }

    // Public re-init for dynamically added elements
    window.reinitScrollAnim = observe;
})();

// ═══════════════════════════════════════════════════════════════════════
// NAV SMOOTH SCROLL
// • Link #tentang (dan #hash lainnya) → scrollIntoView smooth
// • Link "Beranda" (index.html) → scroll ke atas smoothly jika sudah
//   berada di halaman beranda, tanpa reload
// ═══════════════════════════════════════════════════════════════════════
(function navSmoothScroll() {
    'use strict';

    // Tinggi sticky navbar — sesuai .navbar { height: 56px }
    var NAV_H = 56;

    // Scroll ke elemen dengan offset navbar
    function scrollToEl(el) {
        var top = el.getBoundingClientRect().top + window.pageYOffset - NAV_H;
        window.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
    }

    // Deteksi apakah sedang di halaman beranda
    function onHomePage() {
        var p = location.pathname;
        return p === '/' ||
               p.endsWith('/index.html') ||
               p.endsWith('/') ||
               p === '';
    }

    document.addEventListener('click', function(e) {
        var link = e.target.closest('a');
        if (!link) return;

        var href = link.getAttribute('href');
        if (!href) return;

        // ── Kasus 1: anchor #hash (misal #tentang, #koleksi) ──
        if (href.startsWith('#') && href.length > 1) {
            var target = document.getElementById(href.slice(1));
            if (target) {
                e.preventDefault();
                scrollToEl(target);
                history.pushState(null, '', href);
            }
            return;
        }

        // ── Kasus 2: href="#" → scroll ke atas ──
        if (href === '#') {
            e.preventDefault();
            window.scrollTo({ top: 0, behavior: 'smooth' });
            history.replaceState(null, '', location.pathname);
            return;
        }

        // ── Kasus 3: link "Beranda" (index.html) saat sudah di beranda ──
        if ((href === 'index.html' || href === './index.html') && onHomePage()) {
            e.preventDefault();
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    });
})();

// ═══════════════════════════════════════════════════════════════════════
// MOBILE NAV — Hamburger toggle + dropdown accordion
// ═══════════════════════════════════════════════════════════════════════
(function mobileNavModule() {
    'use strict';

    var hamburger = document.getElementById('nav-hamburger');
    var navLinks  = document.getElementById('nav-links');
    var overlay   = document.getElementById('nav-overlay');
    if (!hamburger || !navLinks) return;

    function menuIsOpen() { return navLinks.classList.contains('nav-open'); }

    function openMenu() {
        navLinks.classList.add('nav-open');
        if (overlay) overlay.classList.add('nav-open');
        hamburger.classList.add('is-open');
        hamburger.setAttribute('aria-expanded', 'true');
        document.body.style.overflow = 'hidden';
    }

    function closeMenu() {
        navLinks.classList.remove('nav-open');
        if (overlay) overlay.classList.remove('nav-open');
        hamburger.classList.remove('is-open');
        hamburger.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
    }

    hamburger.addEventListener('click', function () {
        menuIsOpen() ? closeMenu() : openMenu();
    });

    if (overlay) overlay.addEventListener('click', closeMenu);

    // Tutup menu saat link navigasi diklik
    navLinks.addEventListener('click', function (e) {
        var link = e.target.closest('a.nav-link, a.dd-item, a.dd-overview');
        if (link && window.innerWidth <= 768) closeMenu();
    });

    // Tutup saat resize ke desktop
    window.addEventListener('resize', function () {
        if (window.innerWidth > 768 && menuIsOpen()) closeMenu();
    });

    // ── Dropdown inside mobile menu (toggle dengan klik) ──
    var ddBtn = document.getElementById('dd-toggle');
    if (ddBtn) {
        ddBtn.addEventListener('click', function () {
            var dropdown = this.closest('.nav-dropdown');
            if (!dropdown) return;
            var open = dropdown.classList.toggle('dd-active');
            this.setAttribute('aria-expanded', open);
        });
    }
})();
