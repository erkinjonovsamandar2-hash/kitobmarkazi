# KITOBMARKAZI — Master Editing & Architecture Guide

> **READ THIS FIRST** before making any change to the codebase.  
> This file must stay accurate. Update it whenever you add, rename, or remove anything.

---

## 1. Project Identity

| Item | Value |
|---|---|
| **Product name** | Kitobmarkazi |
| **Tagline** | Uzbek Books. One Platform. |
| **Language** | Uzbek (uz), all UI strings are in Uzbek |
| **Stack** | Vanilla HTML + Vanilla CSS + Vanilla JS (no framework, no build step) |
| **State management** | `localStorage` only (`km_cart`, `km_wish`, `km_ai_result`) |
| **Backend** | ❌ None yet — all data is hardcoded in `data.js` |
| **Hosting target** | Static files (any web host / CDN) |

---

## 2. File Map

```
kitobmarkazi/
├── index.html          ← Homepage (hero, publishers grid, best-sellers, coming-soon, AI quiz, how-it-works)
├── search.html         ← Book catalogue (search, genre filter, sort)
├── book.html           ← Single book detail (gallery, add-to-cart, recommendations)
├── cart.html           ← Shopping cart (grouped by publisher, quantity, summary)
├── order.html          ← Checkout (3-step: cart → books → order form + payment)
├── publishers.html     ← All publishers grid
├── publisher.html      ← Single publisher page (book grid)
├── wishlist.html       ← Saved favourites
├── tavsiya.html        ← AI quiz results page (reads km_ai_result from localStorage)
├── about.html          ← About us
├── contact.html        ← Contact page
├── faq.html            ← FAQ
├── terms.html          ← Terms of use
├── offer.html          ← Public offer (Ommaviy oferta)
├── style.css           ← Global design system (SINGLE shared stylesheet)
├── data.js             ← ALL shared data + helper functions (loaded on every page)
├── cart.js             ← Cart, wishlist, toast, scroll-reveal, mobile nav (loaded on every page)
└── images/
    ├── logo-main.png
    ├── logo-booktopia.png, logo-yangiasr.png, ... (publisher logos)
    ├── pay/
    │   ├── payme.png
    │   ├── click.png
    │   └── uzum.png
    └── covers/
        └── <bookId>.jpg / <bookId>.png  ← optional real cover images
```

---

## 3. Shared Globals (data.js)

Every page loads `data.js` first. The following are available globally on all pages:

### 3.1 Data Objects

| Variable | Type | Description |
|---|---|---|
| `PUBLISHERS` | Object | 20 publishers, keyed by slug (e.g. `booktopia`). Fields: `name`, `logo`/`text`, `color`, `founded`, `city`, `desc`, `first` (boolean → "TOP" badge) |
| `BOOKS` | Object | Books per publisher, keyed by publisher slug. Each book: `id`, `title`, `author`, `price` (number, UZS), `color` (CSS gradient), `rating`, `top` (boolean), `pages`, `year` |
| `DEFAULT_BOOKS` | Array | Fallback books used if a publisher has no entry in `BOOKS` |
| `COMING_SOON` | Array | "Tez kunda" / "Premyera" upcoming books. Fields: `title`, `author`, `pubKey`, `bg`, `offsetDays`, `label`, `desc` |
| `COURIERS` | Object | 4 couriers (`fargo`, `bts`, `emu`, `starex`). Fields: `name`, `color`, `desc`, `price` |
| `COURIERS_BY_REGION` | Object | Region → available courier slugs array |
| `COURIER_TUMAN_OVERRIDE` | Object | Region+district → overridden courier list |
| `TUMANS` | Object | Region → list of districts (for order form dropdowns) |
| `GENRES` | Object | 10 genre keys → `{name, icon}` |
| `BOOK_GENRE` | Object | bookId → genre key |
| `PUB_DEFAULT_GENRE` | Object | publisherSlug → fallback genre key |
| `QUIZ` | Array | 4 AI quiz questions. Each: `q`, `icon`, `options[]` (each option: `label`, `emoji`, `genres[]`) |
| `QUIZ_PROFILES` | Object | genre key → `{title, desc}` for AI result profile |
| `BOOK_IMAGES` | Object | bookId → array of extra image paths (currently empty; real covers go here) |
| `WEEK_TOP` | Object | `{pubKey, bookId}` — the "Book of the Week" on the hero |

### 3.2 Helper Functions

| Function | Usage |
|---|---|
| `getBooks(pubKey)` | Returns books array for a publisher (or DEFAULT_BOOKS) |
| `money(n)` | Formats number as `"55 000 so'm"` |
| `pubLogoHTML(pub, size)` | Returns `<img>` or SVG text logo HTML |
| `findBook(pubKey, bookId)` | Finds a book object; falls back to first book |
| `searchAll(q)` | Returns up to 8 search hits (books + publishers) |
| `couriersFor(region, tuman)` | Returns available courier slugs for a location |
| `tumansFor(region)` | Returns district array for a region |
| `coverHTML(book, pub)` | Returns designed cover HTML (pattern + title + optional real img) |
| `recommendFor(pubKey, book, limit)` | Returns recommended books (same author, then same publisher) |
| `bookGenre(pubKey, book)` | Returns genre key for a book |
| `allBooksFlat()` | Returns `[{pk, b, genre}]` for all books across all publishers |
| `bookCardHTML(pk, b)` | Returns full book card HTML (used in search, wishlist, tavsiya pages) |
| `cartIcon(size)` | Returns cart SVG icon HTML |
| `quizRecommend(genreScores, limit)` | AI quiz → returns `{books, topGenres}` |
| `bookImages(bookId)` | Returns extra images array for a book |
| `buildSearchIndex()` | Internal — builds search index |

---

## 4. Shared Cart & UI (cart.js)

Loaded on every page after `data.js`. Provides:

### 4.1 Cart Functions (localStorage: `km_cart`)

| Function | Description |
|---|---|
| `getCart()` | Returns cart array `[{pubKey, bookId, qty}]` |
| `saveCart(c)` | Saves cart + calls `updateCartBadge()` |
| `addToCart(pubKey, bookId, qty)` | Adds or increments item |
| `removeFromCart(pubKey, bookId)` | Removes item |
| `setQty(pubKey, bookId, qty)` | Sets specific quantity |
| `clearCart()` | Empties cart |
| `cartCount()` | Total item count |
| `cartItemsDetailed()` | Returns enriched cart with book + pub objects and `sum` |
| `cartTotal()` | Total price (books only, delivery excluded) |
| `updateCartBadge()` | Updates `.cart-count` badge across all nav icons |
| `addAndToast(pubKey, bookId)` | Adds to cart + shows toast notification |

### 4.2 Wishlist Functions (localStorage: `km_wish`)

| Function | Description |
|---|---|
| `getWishlist()` / `saveWishlist(w)` | CRUD for wishlist |
| `inWishlist(pk, id)` | Boolean check |
| `toggleWishlist(pk, id)` | Toggle + returns new state |
| `wishlistDetailed()` | Returns enriched wishlist |
| `updateWishlistBadge()` | Updates `.wish-count` badges |
| `toggleWish(pk, id, btn)` | Toggle + update button UI + show toast |

### 4.3 UI Utilities

| Feature | How |
|---|---|
| **Toast notification** | `toast(msg)` — creates/reuses `#km-toast` div, auto-hides after 1.8s |
| **Scroll reveal** | Elements with `.reveal` class fade up when scrolled into view (IntersectionObserver) |
| **Mobile hamburger** | Auto-built on all pages. Reads links from `.nav-links`, adds wishlist + cart links. Inserts `.nav-burger`, `.nav-mobile`, `.nav-backdrop` |

---

## 5. Design System (style.css)

### 5.1 CSS Variables

```css
--navy: #0A1628       /* Primary dark background */
--navy2: #13294A
--navy3: #0E2036
--teal: #1D9E75       /* Primary brand green */
--teal-d: #0F6E56
--teal-l: #5DCAA5
--gold: #D9A93E       /* Accent gold */
--gold-l: #F0CC72
--gold-d: #A9802A
--cream: #FAF7F0      /* Page background */
--cream2: #F1EBDD
--white: #fff
--ink: #15202E        /* Primary text */
--mid: #56606E
--light: #98A2AE      /* Muted text */
--border: #E9E3D6
--serif: 'Playfair Display', Georgia, serif
--sans: 'Manrope', system-ui, sans-serif
--grad-navy: linear-gradient(135deg, #0C1B30, #0A1628, #0B2A24)
--grad-gold: linear-gradient(135deg, #F0CC72, #D9A93E)
--grad-teal: linear-gradient(135deg, #1D9E75, #0F6E56)
--sh-sm / --sh-md / --sh-lg   /* elevation shadows */
--sh-gold / --sh-teal         /* colored glows */
```

### 5.2 Key Reusable Classes

| Class | Purpose |
|---|---|
| `.nav` | Sticky top navbar (dark navy, gold underline on active) |
| `.brand` | Logo + name link |
| `.nav-links` | Desktop nav links (hidden on mobile) |
| `.cart-link` / `.wish-link` | Nav icon badges |
| `.cart-count` / `.wish-count` | Badge counters (auto-managed by cart.js) |
| `.btn`, `.btn-teal`, `.btn-gold`, `.btn-ghost`, `.btn-navy` | Button variants |
| `.sec` | Content section wrapper (max 1100px, centered, padded) |
| `.sh` | Section header row (title + "see all" link) |
| `.st` | Section title (serif, gold underline) |
| `.ss` | Section subtitle |
| `.sa` | Section "see all" link |
| `.book` | Book card (white card with hover lift) |
| `.book-cover` | Cover area with height |
| `.book-body` | Text area below cover |
| `.book-foot` | Price + action buttons row |
| `.book-title`, `.book-author`, `.book-price` | Book text |
| `.book-cart-btn` | Teal cart button on card |
| `.wish-btn-inline` | Heart button on card |
| `.bc-badge` | "🔥 Top" badge on cover |
| `.genre-pill` | Genre filter pill |
| `.genre-row` | Wrapping row of genre pills |
| `.reveal` | Scroll reveal wrapper (add `.in` class when visible) |
| `.site-foot` | Deep teal footer |
| `.ac-wrap`, `.ac-list`, `.ac-item` | Autocomplete dropdown |
| `.modal-overlay`, `.modal` | "Tez kunda" popup modal |
| `.cover-sm` / `.cover-lg` | Cover size variants |
| `.cv-pat`, `.cv-grad`, `.cv-pub`, `.cv-mid`, `.cv-title`, `.cv-author`, `.cv-img` | Designed cover layers |
| `.card`, `.card-title`, `.card-body` | Inner content cards |
| `.frow` | 2-column form grid |
| `.field` + `label` | Form field row |
| `.steps-wrap`, `.steps-bar` | Step progress bar (inner pages) |
| `.nav-burger`, `.nav-mobile`, `.nav-backdrop` | Mobile nav (injected by cart.js) |

---

## 6. Page-by-Page Behaviour

### `index.html` (Homepage)
- **Hero**: search bar with autocomplete → `search.html?q=...`; featured book card ("Haftaning kitobi")
- **Publishers grid** (`#pubGrid`): renders first 20 publishers from `PUBLISHERS`, sorted by `order[]` array defined inline
- **Best sellers** (`#bsScroll`): horizontal scroll, books with `top:true`, sorted by rating (top 10)
- **Genres** (`#genreRow`): genre pills linking to `search.html?genre=...`
- **Coming soon** (`#ads`): poster cards from `COMING_SOON`; each opens a modal with countdown timer
- **AI Maslahatchi** (`#ai`): 4-question quiz → stores result in `localStorage.km_ai_result` → redirects to `tavsiya.html`
- **How it works**: static 3-step section
- **Inline stats** (`#s1`, `#s2`, `#s3`): animated count-up (20 publishers, 150 books, 340 something)

### `search.html`
- URL params: `?q=...` (text), `?genre=...` (genre key)
- Genre filter bar + sort pills (all / cheap / rating / new / top)
- Publisher matches section appears when query matches a publisher name
- Uses `bookCardHTML()` to render grid

### `book.html`
- URL params: `?pub=<pubKey>&book=<bookId>`
- Gallery with optional thumbnails (uses `BOOK_IMAGES`)
- Lightbox for images
- Quantity selector (1–10)
- Wishlist + Add to Cart
- Recommendations grid (`recommendFor()`)

### `cart.html`
- Reads cart from localStorage, renders grouped by publisher
- Inc/dec quantity inline
- Links to `order.html`

### `order.html`
- 3-step visual header (cart ✓ → books ✓ → order active)
- Form: name, phone, region → district (dynamic from `TUMANS`) → courier (dynamic from `couriersFor()`) → delivery payment timing → payment method (Payme / Click / Uzum)
- Validation: alerts on missing fields (currently `alert()` — backend will replace this)
- Success state: shows order number (random `#UZ-XXXXX`), clears cart
- **⚠️ Currently no real order submission — success is purely frontend simulation**

### `publishers.html`
- Grid of all 20 publishers, links to `publisher.html?pub=<key>`

### `publisher.html`
- URL param: `?pub=<pubKey>`
- Shows publisher info + full book grid

### `wishlist.html`
- Reads `km_wish` from localStorage
- Uses `bookCardHTML()` to render

### `tavsiya.html`
- Reads `km_ai_result` from localStorage (set by AI quiz on index.html)
- Renders recommended books with profile info

---

## 7. Current Limitations (Frontend-only)

| Limitation | Impact | Backend solution needed |
|---|---|---|
| All books/publishers hardcoded in `data.js` | Can't add/update content without code changes | API endpoints for books, publishers |
| Order submit is fake (random order number) | No real orders captured | POST `/api/orders` |
| No user accounts / authentication | Cart/wishlist lost on browser clear | Auth + server-side cart |
| Payment methods are cosmetic | No actual payment processing | Payme/Click/Uzum SDK integration |
| Search is client-side in-memory | Won't scale with many books | Backend full-text search |
| AI quiz is static scoring | Not truly AI | Optional: real ML or improved scoring |
| `rating` values are hardcoded | Can't reflect real user reviews | Review/rating system |
| `top` flag is hardcoded | Bestsellers are manual | Sales data aggregation |
| `COMING_SOON.offsetDays` is relative to today | Dates drift randomly | Real scheduled release dates from DB |

---

## 8. Backend Integration Plan (What Needs to Be Built)

### 8.1 API Endpoints Required

```
GET  /api/publishers           → replaces PUBLISHERS constant
GET  /api/publishers/:slug     → single publisher + their books
GET  /api/books                → paginated, filterable (genre, publisher, sort)
GET  /api/books/:pubSlug/:id   → single book detail
GET  /api/search?q=...         → search across books + publishers
GET  /api/coming-soon          → replaces COMING_SOON constant
POST /api/orders               → submit order (name, phone, address, items, courier, payment)
GET  /api/orders/:id           → order status
POST /api/wishlist             → server-side wishlist (authenticated)
GET  /api/couriers?region=&tuman=  → dynamic courier availability
```

### 8.2 Frontend Changes Needed for Backend Integration

| File | Change |
|---|---|
| `data.js` | Replace hardcoded constants with `fetch()` calls OR keep as seed/fallback and add API layer |
| `index.html` | Fetch publishers + coming soon from API on page load |
| `search.html` | Replace in-memory search with API call on input |
| `book.html` | Fetch book detail from API |
| `order.html` | Replace fake submit with real `fetch('/api/orders', {method:'POST', ...})` |
| `cart.js` | Consider syncing cart to server (optional, needs auth) |
| ALL pages | Add loading states (skeleton screens) while API responds |

### 8.3 Recommended Tech Stack for Backend

- **Language**: Node.js (Express) or Python (FastAPI) — TBD with client
- **Database**: PostgreSQL (relational: publishers, books, orders, users)
- **Auth**: JWT tokens (for admin panel + optional customer accounts)
- **Payment**: Payme Merchant API, Click API, Uzum API
- **Hosting**: Railway / Vercel (backend) + existing static host for frontend

---

## 9. ⚠️ Removal / Change Protocol

> **NEVER remove or replace existing frontend features without following this process.**

### Step-by-step rules:

1. **Identify** what exists: describe the exact feature (function name, HTML element, CSS class, or data structure) you want to remove or change.
2. **Explain WHY** you want to remove it and WHAT you are replacing it with. Be specific.
3. **Show the client** the explanation before touching any code.
4. **Wait for explicit confirmation** ("yes, remove it" or "yes, replace it").
5. Only then make the edit.

### Examples of what requires confirmation:

| What | Why Confirmation is Needed |
|---|---|
| Removing `QUIZ` or AI Maslahatchi section | Visible feature, was likely intentional by client |
| Removing any publisher from `PUBLISHERS` | Represents a real business relationship |
| Removing any page (e.g. `tavsiya.html`) | May be linked from external sources |
| Removing `couriersFor()` logic | Complex logic; replacement must be equivalent |
| Changing the `money()` format | Affects display on every page |
| Removing any payment option (Payme / Click / Uzum) | May have commercial implications |
| Changing `localStorage` key names | Will break existing saved carts for real users |
| Removing `cart.js` scroll-reveal or mobile nav | Shared UX behaviour across all pages |

### What you CAN do without confirmation:
- Fix bugs (broken logic, crashes, typos)
- Add new features that don't remove existing ones
- Improve performance or code quality
- Add new books or publishers to `data.js`
- Add backend API endpoints that are purely additive

---

## 10. Code Conventions

### JavaScript
- All files use **ES5** style (`var`, `function(){}`, no arrow functions, no template literals) for maximum browser compatibility
- No build step, no transpilation — what you write is what ships
- Inline event handlers are used extensively (`onclick="..."`) — keep this pattern for consistency
- Data manipulation uses Array method chaining (`.filter`, `.map`, `.forEach`, `.sort`)

### CSS
- **Single source of truth**: `style.css` is the global file. Most page-specific styles go in `<style>` blocks inside the `<head>` of each HTML file
- CSS variables defined in `:root` must be used — never hardcode raw color hex in new rules
- Mobile-first responsive: breakpoints at `600px`, `760px`, `860px`, `900px`

### HTML
- Language: `lang="uz"` on `<html>`
- Each page loads in this exact order: `style.css` → (page-specific `<style>`) → content → `data.js` → `cart.js` → page-specific `<script>`
- IDs must be unique per page; classes are shared across pages

---

## 11. Data: Adding New Books

To add a book to an existing publisher in `data.js`:

```js
// Inside BOOKS.booktopia array:
{ 
  id: "unique_id",       // lowercase, no spaces, URL-safe
  title: "Book Title", 
  author: "Author Name", 
  price: 65000,          // in UZS (so'm), integer
  color: "linear-gradient(150deg, #1A3A5C, #2A5C8A)",  // book cover bg
  rating: 4.7,           // 0.0 – 5.0
  top: false,            // true = appears in Best Sellers
  pages: 320, 
  year: 2025 
}
```

Then optionally add to `BOOK_GENRE`:
```js
unique_id: "roman",  // use a key from GENRES
```

To add a real cover image: place `images/covers/unique_id.jpg` (or `.png`). The `coverHTML()` function will auto-display it.

---

## 12. Data: Adding New Publishers

```js
// In PUBLISHERS object:
newpub: { 
  name: "Publisher Name", 
  logo: "images/logo-newpub.png",   // OR use text+color if no logo:
  // text: "NEWPUB", color: "#123456",
  founded: "2020", 
  city: "Toshkent", 
  desc: "Publisher description in Uzbek",
  first: false  // true = shows ★ TOP badge on homepage
}
```

Then add to `BOOKS.newpub = [...]` and update `order[]` and `counts{}` in `index.html` inline script.

---

*Last updated: 2026-06-29 | Maintained by: Antigravity (AI assistant)*  
*Update this file whenever the architecture changes.*
