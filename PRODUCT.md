# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Existing: vanilla HTML/CSS/JS, one global `style.css` plus per-page `<style>` blocks, Express + SQLite/Postgres API, deployed on Vercel. No build step.

## Users

Uzbek readers (Latin script) browsing and ordering books from several publishers in one place. Device use is an equal mix of phones and desktop.

## Product Purpose

Kitobmarkazi is a publisher-focused online bookstore: one platform where Uzbekistan's publishers are listed with their books, and a reader can add books from different publishers to one cart and have them delivered. Success = visitors complete orders, and publishers look official and easy to browse.

## Positioning

Books from many Uzbek publishers in a single cart and a single checkout (courier and payment chosen at order time). A single-publisher shop cannot truthfully copy that.

## Operating Context

Catalogue of 52 books across 20 publishers (data in `server/data/kitobmarkazi.db`). Pages: home, search, publishers, publisher, book, cart, order, wishlist, track, about, contact, faq, terms, offer. Payments shown: Payme, Click, Uzum. Defective books returnable within 3 days (terms.html).

## Capabilities and Constraints

- Stays simple: client rejected a busier redesign as "bachkana" (childish) and a hero photo background (slow). Publisher cards must stay clean rows, not elaborate illustrated cards.
- No invented commercial facts: delivery days/prices are not defined in the repo; courier and region are chosen at order time.
- Keep the 3D book-open hover tilt on book cards (client likes it).
- Keep Lucide icons.

## Brand Commitments

Name "Kitobmarkazi" and the existing logo (`images/logo-main.png`). The approved "simple" reference is `kitobmarkazi_v13_3/`.

## Evidence on Hand

Real publisher logos in `images/`, 29 cover files in `images/covers/`, real books, prices and ratings in the database. No testimonials, customer counts or press; do not fabricate them. Order count "340+" on the home page is a placeholder.

## Product Principles

1. Publishers are the product: make them look official and easy to find.
2. Clear price, clear next step: the add-to-cart path is never ambiguous.
3. Simple over decorated: one idea per section, no illustration for its own sake.
4. Truthful: never claim delivery times, volumes or proof that the data does not back.

## Accessibility & Inclusion

Uzbek Latin script with oʻ/gʻ apostrophes; Cyrillic toggle is a possible later feature. Body contrast ≥4.5:1, visible keyboard focus, respect reduced motion.
