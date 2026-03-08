/**
 * NOVA X1 — Full-Stack Backend Server
 * Node.js + Express + JSON file DB (no PostgreSQL needed)
 * Drop-in ready, zero config
 */

const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 3000;

// ─── MIDDLEWARE ───────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ─── JSON DATABASE (file-based, zero setup) ──────────────────────────
const DB_PATH = path.join(__dirname, 'db.json');

function readDB() {
  if (!fs.existsSync(DB_PATH)) return initDB();
  try { return JSON.parse(fs.readFileSync(DB_PATH, 'utf8')); }
  catch { return initDB(); }
}

function writeDB(data) {
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
}

function initDB() {
  const data = {
    products: [
      {
        id: 'nova-x1',
        name: 'NOVA X1',
        tagline: 'Sound Beyond Limits',
        price: 299,
        description: 'Premium true wireless earbuds with 11mm graphene driver, hybrid ANC, and 32-hour total battery life.',
        specs: {
          driver: '11mm Graphene Composite',
          bluetooth: '5.3',
          anc: '-42dB Hybrid ANC',
          battery_earbud: '8 hours',
          battery_total: '32 hours',
          quick_charge: '10 min → 2 hrs',
          weight: '4g per earbud',
          ip_rating: 'IPX5',
          latency: '40ms game mode',
          codec: 'aptX Lossless, LDAC, AAC',
          chip: 'Qualcomm QCC5181',
          driver_range: '5Hz – 40kHz'
        },
        colors: [
          { id: 'midnight-black', name: 'Midnight Black', accent: '#00e5ff', detail: 'MATTE FINISH · ELECTROPLATED RING · MIST-GREY MESH' },
          { id: 'arctic-silver', name: 'Arctic Silver', accent: '#a8c8ff', detail: 'BRUSHED FINISH · CHROME RING · PLATINUM MESH' },
          { id: 'ocean-blue', name: 'Ocean Blue', accent: '#0099ff', detail: 'DEEP SEA ANODISED · COBALT RING · NAVY MESH' },
          { id: 'sunset-orange', name: 'Sunset Orange', accent: '#ff6b35', detail: 'VOLCANIC FINISH · FLAME RING · EMBER MESH' },
          { id: 'pearl-white', name: 'Pearl White', accent: '#d4c8b0', detail: 'LUMINOUS FINISH · GOLD RING · IVORY MESH' }
        ],
        components: [
          { id: 'grille', name: 'Acoustic Grille', icon: '🔊', desc: 'Titanium-coated mesh with 0.3mm micro-perforations. Tuned for crystalline treble.', stat: 'IPX5 RATED' },
          { id: 'casing-f', name: 'Metal Casing (Front)', icon: '🛡️', desc: 'CNC-machined aerospace aluminium. Anodised finish. Zero plastic structural components.', stat: '0.6MM WALL THICKNESS' },
          { id: 'driver', name: 'Speaker Driver', icon: '⚡', desc: 'Custom 11mm graphene composite diaphragm. Deep bass to crystalline highs.', stat: '5Hz–40kHz RANGE' },
          { id: 'pcb', name: 'Main PCB', icon: '🧠', desc: 'Qualcomm QCC5181 processor. aptX Lossless. Bluetooth 5.3.', stat: '1.1GHz DSP' },
          { id: 'battery', name: 'Battery', icon: '🔋', desc: '105mAh LiPo cell. Graphene-enhanced. 10 min → 2 hrs playback.', stat: '8HR CONTINUOUS' },
          { id: 'tip', name: 'Silicone Ear Tip', icon: '💎', desc: 'Dual-layer medical-grade silicone + memory foam hybrid.', stat: 'ANATOMIC FIT' }
        ],
        features: [
          { name: 'Active Noise Cancellation', desc: '6-mic hybrid feedforward/feedback ANC. -42dB reduction.', chip: '-42dB REDUCTION' },
          { name: 'Spatial Audio', desc: 'Head-tracked 360° immersive audio. Dolby Atmos + DTS:X.', chip: 'DOLBY ATMOS · DTS:X' },
          { name: 'Transparency Mode', desc: 'Hear your environment naturally. 3ms adaptive blending.', chip: '3MS RESPONSE' },
          { name: 'Haptic Touch Controls', desc: 'Capacitive touch pad with vibration. 15 programmable gestures.', chip: '15 GESTURES' },
          { name: 'Fast Charging', desc: '10 minutes charges 2 hours of playback.', chip: 'USB-C + QI WIRELESS' }
        ],
        in_stock: true,
        launch_date: '2026-04-15',
        created_at: new Date().toISOString()
      }
    ],
    wishlist: [],
    analytics: [],
    admin_key: 'nova-admin-2026'
  };
  writeDB(data);
  return data;
}

// ─── PRODUCT ROUTES ────────────────────────────────────────────────────

// GET /api/product — Get main product
app.get('/api/product', (req, res) => {
  const db = readDB();
  const product = db.products[0];
  if (!product) return res.status(404).json({ error: 'Product not found' });
  res.json(product);
});

// GET /api/product/colors — Get all color variants
app.get('/api/product/colors', (req, res) => {
  const db = readDB();
  res.json(db.products[0]?.colors || []);
});

// GET /api/product/specs — Get specs
app.get('/api/product/specs', (req, res) => {
  const db = readDB();
  res.json(db.products[0]?.specs || {});
});

// GET /api/product/components — Get component list
app.get('/api/product/components', (req, res) => {
  const db = readDB();
  res.json(db.products[0]?.components || []);
});

// ─── WISHLIST ROUTES ───────────────────────────────────────────────────

// POST /api/wishlist — Add to wishlist
app.post('/api/wishlist', (req, res) => {
  const { name, email, color } = req.body;
  if (!name || !email) return res.status(400).json({ error: 'Name and email required' });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ error: 'Invalid email' });

  const db = readDB();

  // Check for duplicate email
  if (db.wishlist.find(w => w.email.toLowerCase() === email.toLowerCase())) {
    return res.status(409).json({ error: 'You\'re already on the list!', already: true });
  }

  const entry = {
    id: uuidv4(),
    name: name.trim(),
    email: email.toLowerCase().trim(),
    color: color || 'Midnight Black',
    ip: req.ip,
    created_at: new Date().toISOString()
  };

  db.wishlist.push(entry);
  writeDB(db);

  console.log(`📧 Wishlist: ${entry.name} (${entry.email}) — ${entry.color}`);

  res.status(201).json({
    success: true,
    message: `You're on the list, ${name.split(' ')[0]}! We'll email you on launch day.`,
    position: db.wishlist.length
  });
});

// GET /api/wishlist/count — Public count
app.get('/api/wishlist/count', (req, res) => {
  const db = readDB();
  res.json({ count: db.wishlist.length, spots_left: Math.max(0, 5000 - db.wishlist.length) });
});

// ─── ANALYTICS ROUTES ──────────────────────────────────────────────────

// POST /api/analytics — Track event
app.post('/api/analytics', (req, res) => {
  const { event, section, ts } = req.body;
  const db = readDB();
  db.analytics.push({
    id: uuidv4(),
    event: event || 'page_view',
    section: section || null,
    ip: req.ip,
    ua: req.headers['user-agent']?.substring(0, 100),
    ts: ts || Date.now(),
    created_at: new Date().toISOString()
  });
  // Keep only last 10,000 events
  if (db.analytics.length > 10000) db.analytics = db.analytics.slice(-10000);
  writeDB(db);
  res.json({ ok: true });
});

// ─── ADMIN ROUTES ──────────────────────────────────────────────────────
function adminAuth(req, res, next) {
  const key = req.headers['x-admin-key'] || req.query.key;
  const db = readDB();
  if (key !== db.admin_key) return res.status(403).json({ error: 'Invalid admin key' });
  next();
}

// GET /api/admin/dashboard
app.get('/api/admin/dashboard', adminAuth, (req, res) => {
  const db = readDB();

  // Analytics summary
  const events = db.analytics;
  const sectionViews = {};
  events.filter(e => e.event === 'section_view').forEach(e => {
    sectionViews[e.section] = (sectionViews[e.section] || 0) + 1;
  });

  const colorPref = {};
  db.wishlist.forEach(w => { colorPref[w.color] = (colorPref[w.color] || 0) + 1; });

  res.json({
    summary: {
      total_wishlist: db.wishlist.length,
      total_events: events.length,
      spots_left: Math.max(0, 5000 - db.wishlist.length)
    },
    section_views: sectionViews,
    color_preferences: colorPref,
    recent_signups: db.wishlist.slice(-10).reverse(),
    product: db.products[0]
  });
});

// GET /api/admin/wishlist — Full wishlist
app.get('/api/admin/wishlist', adminAuth, (req, res) => {
  const db = readDB();
  res.json({ count: db.wishlist.length, entries: db.wishlist });
});

// DELETE /api/admin/wishlist/:id
app.delete('/api/admin/wishlist/:id', adminAuth, (req, res) => {
  const db = readDB();
  const before = db.wishlist.length;
  db.wishlist = db.wishlist.filter(w => w.id !== req.params.id);
  writeDB(db);
  res.json({ deleted: before > db.wishlist.length });
});

// PUT /api/admin/product — Update product details
app.put('/api/admin/product', adminAuth, (req, res) => {
  const { price, tagline, description, in_stock } = req.body;
  const db = readDB();
  if (!db.products[0]) return res.status(404).json({ error: 'Product not found' });

  if (price !== undefined) db.products[0].price = parseFloat(price);
  if (tagline) db.products[0].tagline = tagline;
  if (description) db.products[0].description = description;
  if (in_stock !== undefined) db.products[0].in_stock = Boolean(in_stock);
  db.products[0].updated_at = new Date().toISOString();

  writeDB(db);
  res.json({ success: true, product: db.products[0] });
});

// POST /api/admin/colors — Add color variant
app.post('/api/admin/colors', adminAuth, (req, res) => {
  const { name, accent, detail } = req.body;
  if (!name || !accent) return res.status(400).json({ error: 'Name and accent color required' });

  const db = readDB();
  const color = { id: name.toLowerCase().replace(/\s+/g, '-'), name, accent, detail: detail || '' };
  db.products[0].colors.push(color);
  writeDB(db);
  res.status(201).json(color);
});

// ─── ADMIN HTML PANEL ──────────────────────────────────────────────────
app.get('/admin', (req, res) => {
  res.send(`<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>NOVA X1 — Admin Panel</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{background:#020408;color:#dde8f5;font-family:'Segoe UI',system-ui,sans-serif;min-height:100vh}
nav{background:#030810;border-bottom:1px solid rgba(0,229,255,.12);padding:16px 32px;display:flex;align-items:center;gap:16px}
.logo{font-size:1.3rem;font-weight:800;letter-spacing:.1em;color:#fff}.logo em{color:#00e5ff;font-style:normal}
.auth-row{display:flex;gap:8px;margin-left:auto}
input.key-input{background:rgba(255,255,255,.06);border:1px solid rgba(0,229,255,.2);border-radius:6px;padding:8px 14px;color:#fff;font-size:.84rem;outline:none;width:200px}
input.key-input:focus{border-color:#00e5ff}
button.go{background:#00e5ff;color:#000;border:none;border-radius:6px;padding:8px 20px;font-weight:700;font-size:.84rem;cursor:pointer}
button.go:hover{opacity:.9}
main{max-width:1100px;margin:0 auto;padding:32px}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:16px;margin-bottom:32px}
.card{background:rgba(255,255,255,.035);border:1px solid rgba(0,229,255,.1);border-radius:12px;padding:22px}
.card h3{font-size:.72rem;text-transform:uppercase;letter-spacing:.12em;color:rgba(0,229,255,.7);margin-bottom:12px}
.big-num{font-size:3rem;font-weight:800;color:#fff;line-height:1}
.big-label{font-size:.72rem;color:rgba(255,255,255,.35);margin-top:4px}
.bar-row{display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid rgba(255,255,255,.05);font-size:.82rem}
.bar-row:last-child{border-bottom:none}
.bar-pct{color:#00e5ff;font-size:.72rem}
table{width:100%;border-collapse:collapse;margin-top:8px}
th{text-align:left;font-size:.65rem;text-transform:uppercase;letter-spacing:.1em;color:rgba(255,255,255,.3);padding:8px 12px;border-bottom:1px solid rgba(255,255,255,.08)}
td{padding:10px 12px;font-size:.82rem;border-bottom:1px solid rgba(255,255,255,.04)}
tr:hover td{background:rgba(0,229,255,.03)}
.badge{background:rgba(0,229,255,.12);border:1px solid rgba(0,229,255,.25);border-radius:20px;padding:3px 10px;font-size:.65rem;color:#00e5ff}
.del-btn{background:transparent;border:1px solid rgba(255,80,80,.3);color:rgba(255,100,100,.7);border-radius:4px;padding:4px 10px;font-size:.72rem;cursor:pointer}
.del-btn:hover{background:rgba(255,80,80,.1);color:#ff6b6b}
h2{font-size:1.3rem;font-weight:700;color:#fff;margin:32px 0 16px}
.section-title{font-size:1.1rem;font-weight:700;color:#fff;margin:0 0 12px}
#msg{position:fixed;top:20px;right:20px;background:#00e5ff;color:#000;padding:12px 20px;border-radius:8px;font-weight:700;font-size:.84rem;display:none;z-index:999}
.edit-form{display:flex;flex-direction:column;gap:10px}
.ef-row{display:flex;flex-direction:column;gap:4px}
.ef-label{font-size:.65rem;text-transform:uppercase;letter-spacing:.1em;color:rgba(255,255,255,.35)}
.ef-input{background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.1);border-radius:6px;padding:10px 14px;color:#fff;font-size:.84rem;outline:none}
.ef-input:focus{border-color:#00e5ff}
.ef-btn{background:linear-gradient(135deg,#00e5ff,#7c3aed);border:none;border-radius:6px;padding:11px;color:#fff;font-weight:700;font-size:.84rem;cursor:pointer;margin-top:4px}
</style>
</head>
<body>
<div id="msg"></div>
<nav>
  <div class="logo">NOV<em>A</em> X1 <span style="font-size:.7rem;color:rgba(255,255,255,.3);font-weight:400">ADMIN</span></div>
  <div class="auth-row">
    <input class="key-input" id="ak" type="password" placeholder="Admin key">
    <button class="go" onclick="loadDashboard()">Load Dashboard</button>
  </div>
</nav>
<main>
  <div id="dash" style="display:none">
    <div class="grid" id="cards"></div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px">
      <div>
        <h2>Section Views</h2>
        <div class="card"><div id="secViews"></div></div>
      </div>
      <div>
        <h2>Color Preferences</h2>
        <div class="card"><div id="colorPref"></div></div>
      </div>
    </div>
    <h2>Recent Waitlist Signups</h2>
    <div class="card" style="overflow-x:auto">
      <table id="wlTable">
        <thead><tr><th>Name</th><th>Email</th><th>Color</th><th>Signed Up</th><th>Action</th></tr></thead>
        <tbody id="wlBody"></tbody>
      </table>
    </div>
    <h2>Update Product</h2>
    <div class="card">
      <div class="edit-form">
        <div class="ef-row"><div class="ef-label">Price ($)</div><input class="ef-input" id="ep-price" placeholder="299"></div>
        <div class="ef-row"><div class="ef-label">Tagline</div><input class="ef-input" id="ep-tag" placeholder="Sound Beyond Limits"></div>
        <div class="ef-row"><div class="ef-label">Description</div><input class="ef-input" id="ep-desc" placeholder="Product description"></div>
        <button class="ef-btn" onclick="updateProduct()">Save Changes</button>
      </div>
    </div>
  </div>
  <div id="locked" style="text-align:center;padding:80px;color:rgba(255,255,255,.3)">Enter admin key to access dashboard</div>
</main>
<script>
let ak='';
function msg(t,ok=true){const m=document.getElementById('msg');m.textContent=t;m.style.background=ok?'#00e5ff':'#ff6b6b';m.style.display='block';setTimeout(()=>m.style.display='none',3000);}
async function api(path,opts={}){
  const r=await fetch('/api/admin'+path+'?key='+ak,{headers:{'Content-Type':'application/json','x-admin-key':ak},...opts});
  return r.json();
}
async function loadDashboard(){
  ak=document.getElementById('ak').value;
  const d=await api('/dashboard');
  if(d.error){msg('Invalid admin key',false);return;}
  document.getElementById('locked').style.display='none';
  document.getElementById('dash').style.display='block';
  // Cards
  document.getElementById('cards').innerHTML=[
    {label:'Waitlist Signups',val:d.summary.total_wishlist,sub:'Launch reservations'},
    {label:'Spots Remaining',val:d.summary.spots_left,sub:'Out of 5,000'},
    {label:'Analytics Events',val:d.summary.total_events,sub:'Total tracked events'},
    {label:'Price',val:'$'+d.product.price,sub:d.product.in_stock?'In Stock':'Out of Stock'},
  ].map(c=>`<div class="card"><h3>${c.label}</h3><div class="big-num">${c.val}</div><div class="big-label">${c.sub}</div></div>`).join('');
  // Section views
  const sv=d.section_views||{};
  document.getElementById('secViews').innerHTML=Object.entries(sv).sort((a,b)=>b[1]-a[1]).map(([k,v])=>
    \`<div class="bar-row"><span>\${k}</span><span class="bar-pct">\${v} views</span></div>\`).join('')||'<div style="color:rgba(255,255,255,.3);font-size:.82rem">No data yet</div>';
  // Color pref
  const cp=d.color_preferences||{};
  document.getElementById('colorPref').innerHTML=Object.entries(cp).sort((a,b)=>b[1]-a[1]).map(([k,v])=>
    \`<div class="bar-row"><span>\${k}</span><span class="bar-pct">\${v}</span></div>\`).join('')||'<div style="color:rgba(255,255,255,.3);font-size:.82rem">No data yet</div>';
  // Wishlist table
  document.getElementById('wlBody').innerHTML=d.recent_signups.map(w=>
    \`<tr><td>\${w.name}</td><td>\${w.email}</td><td><span class="badge">\${w.color}</span></td><td>\${new Date(w.created_at).toLocaleDateString()}</td><td><button class="del-btn" onclick="del('\${w.id}')">Remove</button></td></tr>\`
  ).join('')||'<tr><td colspan="5" style="color:rgba(255,255,255,.3);text-align:center">No signups yet</td></tr>';
  // Pre-fill product
  document.getElementById('ep-price').value=d.product.price;
  document.getElementById('ep-tag').value=d.product.tagline;
  document.getElementById('ep-desc').value=d.product.description;
}
async function del(id){
  const r=await api('/wishlist/'+id,{method:'DELETE'});
  if(r.deleted){msg('Entry removed');loadDashboard();}
}
async function updateProduct(){
  const r=await api('/product',{method:'PUT',body:JSON.stringify({price:document.getElementById('ep-price').value,tagline:document.getElementById('ep-tag').value,description:document.getElementById('ep-desc').value})});
  if(r.success)msg('Product updated!');
}
</script>
</body>
</html>`);
});

// ─── HEALTH CHECK ─────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  const db = readDB();
  res.json({ status: 'OK', wishlist: db.wishlist.length, version: '1.0.0', ts: new Date() });
});

// ─── CATCH ALL ────────────────────────────────────────────────────────
app.get('*', (req, res) => {
  const indexPath = path.join(__dirname, 'public', 'index.html');
  if (fs.existsSync(indexPath)) res.sendFile(indexPath);
  else res.status(404).json({ error: 'Frontend not found — place index.html in public/' });
});

// ─── START ────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n🎧 NOVA X1 Server running → http://localhost:${PORT}`);
  console.log(`⚙️  Admin Panel         → http://localhost:${PORT}/admin`);
  console.log(`📡 API Health          → http://localhost:${PORT}/api/health`);
  console.log(`\nAdmin key: nova-admin-2026\n`);
});

module.exports = app;
