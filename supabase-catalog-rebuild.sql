-- Kitobmarkazi verified launch catalogue
-- Run once in Supabase SQL Editor. Safe to rerun: the catalogue is rebuilt
-- transactionally while historical order_items remain untouched.
-- Prices below are current public reference prices for the client preview;
-- replace them with the client's stock prices before accepting live orders.

BEGIN;

ALTER TABLE books ADD COLUMN IF NOT EXISTS cover TEXT;
ALTER TABLE books ADD COLUMN IF NOT EXISTS isbn TEXT;
ALTER TABLE books ADD COLUMN IF NOT EXISTS language TEXT;
ALTER TABLE books ADD COLUMN IF NOT EXISTS script TEXT;
ALTER TABLE books ADD COLUMN IF NOT EXISTS binding TEXT;
ALTER TABLE books ADD COLUMN IF NOT EXISTS edition TEXT;
ALTER TABLE books ADD COLUMN IF NOT EXISTS "sourceUrl" TEXT;
ALTER TABLE books ADD COLUMN IF NOT EXISTS "coverPositionX" REAL DEFAULT 50;
ALTER TABLE books ADD COLUMN IF NOT EXISTS "coverPositionY" REAL DEFAULT 50;
ALTER TABLE books ADD COLUMN IF NOT EXISTS "coverScale" REAL DEFAULT 1;
ALTER TABLE books ADD COLUMN IF NOT EXISTS stock INTEGER DEFAULT 10;

INSERT INTO publishers
  (slug, name, "logoText", "logoColor", founded, description, "isTop", "sortOrder")
VALUES
  ('asaxiy', 'Asaxiy Books', 'AB', '#E53935', '2018', 'Asaxiy kompaniyasining o‘zbek tilidagi kitoblar nashr loyihasi.', 1, 1),
  ('yangiasr', 'Yangi Asr Avlodi', 'YA', '#1565C0', NULL, 'O‘zbek va jahon adabiyoti nashrlari.', 0, 2),
  ('zabarjad', 'Zabarjad Media', 'ZM', '#E9A91B', NULL, 'Badiiy, mumtoz va ma’rifiy kitoblar nashriyoti.', 0, 3),
  ('akadem', 'Akademnashr', 'AK', '#3F51B5', '2004', '2004-yilda tashkil etilgan nashriyot.', 0, 4),
  ('hilol', 'Hilol Nashr', 'HN', '#188A63', NULL, 'Diniy-ma’rifiy kitoblar nashriyoti.', 0, 5),
  ('bukhara', 'Bukhara Books', 'BB', '#1D4E89', NULL, 'Badiiy va tarixiy kitoblar nashriyoti.', 0, 6),
  ('turonzamin', 'Turon Zamin Ziyo', 'TZ', '#0F766E', NULL, 'O‘zbek va jahon adabiyoti nashrlari.', 0, 7),
  ('bayoz', 'Bayoz', 'BY', '#7C3AED', NULL, 'Badiiy va ommabop kitoblar nashriyoti.', 0, 8)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  "logoText" = COALESCE(publishers."logoText", EXCLUDED."logoText"),
  "logoColor" = COALESCE(publishers."logoColor", EXCLUDED."logoColor"),
  founded = EXCLUDED.founded,
  description = EXCLUDED.description,
  "isTop" = EXCLUDED."isTop",
  "sortOrder" = EXCLUDED."sortOrder";

-- Placeholder reviews describe the removed placeholder catalogue. Order lines
-- are denormalized snapshots and intentionally remain intact for audit/history.
DELETE FROM reviews WHERE "bookId" IN (SELECT id FROM books);
DELETE FROM books;

-- Existing coming-soon entries were unverified demo announcements. Keep the
-- feature empty until a publisher supplies a real release date and cover.
DELETE FROM coming_soon;
-- 'booktopia' (booktopia.uz) and 'gutenberg' (gutenbergnu.uz) are real publishers, confirmed
-- with the client — not demo data. This DELETE previously targeted both; now a no-op kept
-- for history. If another slug turns out to be genuine placeholder data, add it here.
DELETE FROM publishers WHERE slug IN ('__none__');

INSERT INTO books (
  id, "publisherSlug", title, author, price, color, rating, "isTop", pages,
  year, genre, description, cover, isbn, language, script, binding, edition,
  "sourceUrl", stock
)
VALUES
  ('atom', 'asaxiy', 'Atom odatlar', 'Jeyms Klir', 55000, '#F4A300', 0, 1, 300, 2023, 'psixologiya',
   'Kichik, muntazam odatlar orqali barqaror o‘zgarish yaratish haqida amaliy qo‘llanma.',
   '/images/covers/atom-catalog.webp', '978-9943-23-194-8', 'O‘zbek', 'Kirill', 'Yumshoq', 'Asaxiy Books, 2023',
   'https://asaxiy.uz/product/zheims-klir-atom-odatlar', 10),
  ('jannat-2024', 'asaxiy', 'Jannat', 'Abdurazzoq Gurna', 69000, '#E7B625', 0, 0, 252, 2024, 'roman',
   'Nobel mukofoti sovrindori Abdurazzoq Gurnaning inson taqdiri, xotira va mansublik haqidagi romani.',
   '/images/covers/jannat-catalog.webp', '978-9910-9325-7-1', 'O‘zbek', 'Lotin', 'Egiluvchan', 'Asaxiy Books, 2024',
   'https://asaxiy.uz/product/abdurazzoq-gurna-jannat', 10),
  ('graf-monte-kristo-2025', 'asaxiy', 'Graf Monte-Kristo (2 jild)', 'Aleksandr Dyuma', 159000, '#1A4B92', 0, 0, 1288, 2025, 'klassik',
   'Sabr, xiyonat, sadoqat va qasos mavzularini yorituvchi ikki jildlik to‘liq nashr.',
   '/images/covers/graf-monte-kristo-catalog.webp', '9789910865824', 'O‘zbek', 'Kirill', 'Egiluvchan', 'Asaxiy Books, 2025, 2 jild',
   'https://asaxiy.uz/product/aleksandr-dyuma-graf-monte-kristo-asaxiy-books-2ta-kitob', 10),

  ('mehrobdan', 'yangiasr', 'Mehrobdan chayon', 'Abdulla Qodiriy', 35000, '#771D32', 0, 1, 336, 2018, 'klassik',
   'Abdulla Qodiriyning o‘zbek romanchiligi tarixidagi muhim asarlaridan biri.',
   '/images/covers/mehrobdan-catalog.webp', '9789943277359', 'O‘zbek', 'Lotin', 'Yumshoq', 'Yangi Asr Avlodi, 2018',
   'https://asaxiy.uz/product/abdulla-kodirij-mehrobdan-chayon', 10),
  ('kecha', 'yangiasr', 'Kecha va kunduz', 'Abdulhamid Cho‘lpon', 45000, '#172E5B', 0, 1, 320, 2023, 'klassik',
   'Cho‘lponning jamiyat, inson erki va murakkab taqdirlar haqidagi mashhur romani.',
   '/images/covers/kecha-catalog.webp', '978-9943-6501-9-0', 'O‘zbek', 'Lotin', 'Qattiq', 'Yangi Asr Avlodi, 2023',
   'https://asaxiy.uz/product/chulpon-kecha-va-kunduz-2', 10),
  ('jinoyat-va-jazo-2022', 'yangiasr', 'Jinoyat va jazo', 'Fyodor Dostoyevskiy', 59000, '#373E95', 0, 0, 768, 2022, 'tarjima',
   'Jinoyat, vijdon va inson ruhiyatining murakkab qatlamlarini ochuvchi jahon adabiyoti klassikasi.',
   '/images/covers/jinoyat-yangiasr-catalog.webp', '978-9943-27-379-5', 'O‘zbek', 'Kirill', 'Qattiq', 'Yangi Asr Avlodi, 2022; tarjimon Ibrohim G‘afurov',
   'https://asaxiy.uz/product/fedor-dostoevskii-zhinoyat-va-zhazo-kattik-mukova', 10),

  ('ichindagi-ichindadur-2025', 'zabarjad', 'Ichindagi ichindadur', 'Jaloliddin Rumiy', 49000, '#17131D', 0, 0, 336, 2025, 'diniy',
   'Jaloliddin Rumiyning suhbat va hikmatlari jamlangan ma’rifiy asar.',
   '/images/covers/ichindagi-ichindadur-catalog.webp', '9789943952898', 'O‘zbek', 'Lotin', 'Qattiq', 'Zabarjad Media, 2025',
   'https://asaxiy.uz/product/jaloliddin-rumiy-ichindagi-ichindadur-zabarjad-media', 10),
  ('adabiyot-muallimi-2025', 'zabarjad', 'Adabiyot muallimi', 'Abdulla Qahhor', 39000, '#355B47', 0, 0, 224, 2025, 'klassik',
   'Abdulla Qahhor ijodidan tanlangan badiiy asar.',
   '/images/covers/adabiyot-muallimi-catalog.webp', '9789910810213', 'O‘zbek', 'Lotin', 'Yumshoq', 'Zabarjad Media, 2025',
   'https://asaxiy.uz/product/abdulla-qahhor-adabiyot-muallimi-zabarjad-media', 10),
  ('shahzoda-va-gado-2019', 'zabarjad', 'Shahzoda va gado', 'Mark Tven', 35000, '#9A4252', 0, 0, 240, 2019, 'bolalar',
   'Bir-biriga o‘xshash ikki bolaning o‘rin almashishi orqali jamiyat va adolat haqida hikoya qiluvchi roman.',
   '/images/covers/shahzoda-va-gado-catalog.webp', '978-9943-5841-2-9', 'O‘zbek', 'Lotin', 'Yumshoq', 'Zabarjad Media, 2019',
   'https://asaxiy.uz/product/mark-tven-shahzoda-va-gado-zabarjad-media', 10),

  ('oy-va-chaqa-2025', 'akadem', 'Oy va chaqa', 'Somerset Moem', 55000, '#D2AD2F', 0, 0, 272, 2025, 'tarjima',
   'Ijod, tanlov va inson tabiatining murakkabliklari haqidagi mashhur roman.',
   '/images/covers/oy-va-chaqa-catalog.webp', '9789910685026', 'O‘zbek', 'Kirill', 'Qattiq', 'Akademnashr, 2025',
   'https://asaxiy.uz/product/somerset-moem-oy-va-sariq-chaqa-akademnashr', 10),
  ('gulqaychi-2024', 'akadem', 'Gulqaychi', 'Gulrang', 35000, '#F4F0E7', 0, 0, 112, 2024, 'ilmiy',
   'Gulrang qalamiga mansub zamonaviy o‘zbek nashri.',
   '/images/covers/gulqaychi-catalog.webp', '978-9910-759-73-4', 'O‘zbek', 'Lotin', 'Yumshoq', 'Akademnashr, 2024',
   'https://asaxiy.uz/product/gulrang-gulqaychi', 10),
  ('biz-kutgan-fasl-2024', 'akadem', 'Biz kutgan fasl', 'Mansur Jumayev', 30000, '#F2EFE8', 0, 0, 128, 2024, 'sheriyat',
   'Mansur Jumayevning she’riy to‘plami.',
   '/images/covers/biz-kutgan-fasl-catalog.webp', '978-9910-759-727', 'O‘zbek', 'Lotin', 'Yumshoq', 'Akademnashr, 2024; ISBNni jismoniy nusxadan tekshirish kerak',
   'https://asaxiy.uz/product/mansur-jumaev-biz-kutgan-fasl', 10),

  ('isrof-lotin-2024', 'hilol', 'Isrof (lotin alifbosida)', 'Shayx Muhammad Sodiq Muhammad Yusuf', 15000, '#25104A', 0, 0, 80, 2024, 'diniy',
   'Isrof tushunchasi va uning inson hayotidagi ko‘rinishlari haqida diniy-ma’rifiy risola.',
   '/images/covers/isrof-catalog.webp', '978-9910-731-92-1', 'O‘zbek', 'Lotin', 'Yumshoq', 'Hilol Nashr, 2024',
   'https://hilolnashr.uz/isrof-lotin-alifbosidagi-nashri', 10),
  ('quron-ilmlari-2024', 'hilol', 'Qur’on ilmlari', 'Shayx Muhammad Sodiq Muhammad Yusuf', 81000, '#19170F', 0, 0, 504, 2024, 'diniy',
   'Qur’oni Karim bilan bog‘liq asosiy ilmlar haqida batafsil diniy-ma’rifiy kitob.',
   '/images/covers/quron-ilmlari-catalog.webp', '978-9910-987-04-4', 'O‘zbek', 'Kirill', 'Qattiq', 'Hilol Nashr, 2024',
   'https://hilolnashr.uz/diniy-marifiy/quron-ilmlari', 10),
  ('ijtimoiy-odoblar-2025', 'hilol', 'Ijtimoiy odoblar', 'Shayx Muhammad Sodiq Muhammad Yusuf', 67000, '#B29666', 0, 0, 456, 2025, 'diniy',
   'Kundalik va ijtimoiy hayotdagi odoblar haqida diniy-ma’rifiy qo‘llanma.',
   '/images/covers/ijtimoiy-odoblar-catalog.webp', '978-9910-687-88-4', 'O‘zbek', 'Kirill', 'Qattiq', 'Hilol Nashr, 2025',
   'https://hilolnashr.uz/kitoblar/mualliflar/shayx-kitoblari-uz/ijtimoiy-odoblar-krill', 10),

  ('yulduzli-tunlar-2024', 'bukhara', 'Yulduzli tunlar', 'Pirimqul Qodirov', 55000, '#2450A4', 0, 0, 640, 2024, 'tarix',
   'Zahiriddin Muhammad Bobur hayoti va davri tasvirlangan tarixiy roman.',
   '/images/covers/yulduzli-tunlar-catalog.webp', '9789910882357', 'O‘zbek', 'Lotin', 'Qattiq', 'Bukhara Books, 2024',
   'https://asaxiy.uz/product/pirimqul-qodirov-yulduzli-tunlar-bukhara-books', 10),
  ('jinoyat-va-jazo-2025', 'bukhara', 'Jinoyat va jazo', 'Fyodor Dostoyevskiy', 65000, '#F3F1ED', 0, 0, 704, 2025, 'tarjima',
   'Dostoyevskiyning jinoyat, vijdon va tavba haqidagi mashhur romani.',
   '/images/covers/jinoyat-bukhara-catalog.webp', '9789910897351', 'O‘zbek', 'Lotin', 'Yumshoq', 'Bukhara Books, 2025; tarjimon Ibrohim G‘afurov',
   'https://asaxiy.uz/product/fyodor-dostoevskiy-jinoyat-va-jazo-bukhara-books', 10),
  ('buxoro-tarixi-2024', 'bukhara', 'Buxoro tarixi', 'Abu Bakr Muhammad ibn Ja’far Narshaxiy', 54000, '#E8DFC2', 0, 0, 144, 2024, 'tarix',
   'Buxoro vohasining qadimgi va ilk islom davri tarixiga bag‘ishlangan manba.',
   '/images/covers/buxoro-tarixi-catalog.webp', '9789910919183', 'O‘zbek', 'Kirill', 'Qattiq', 'Bukhara Books, 2024',
   'https://asaxiy.uz/product/abu-bakr-muhammad-ibn-jafar-narshahiy-buhoro-tarihi-bukhara-books', 10),

  ('chol', 'turonzamin', 'Chol va dengiz', 'Ernest Heminguey', 32000, '#159CC8', 0, 1, 125, 2023, 'klassik',
   'Inson matonati va umidini ulug‘lovchi jahon adabiyoti klassikasi.',
   '/images/covers/chol-catalog.webp', '978-9943-8999-0-2', 'O‘zbek', 'Lotin', 'Yumshoq', 'Turon Zamin Ziyo, 2023',
   'https://asaxiy.uz/product/ernest-heminguey-chol-va-dengiz', 10),
  ('power', 'bayoz', 'Hokimiyatning 48 qonuni', 'Robert Grin', 60000, '#262137', 0, 1, 238, NULL, 'biznes',
   'Hokimiyat munosabatlari va strategik tafakkur haqida ommabop asar.',
   '/images/covers/power-catalog.webp', NULL, 'O‘zbek', 'Kirill', NULL, 'Bayoz nashri; yil va ISBNni jismoniy nusxadan tekshirish kerak',
   'https://asaxiy.uz/product/robert-grin-hokimiyatning-48-konuni-bestseller', 10);

COMMIT;

-- Post-run sanity check (run separately if desired):
-- SELECT p.name, COUNT(b.id) AS books
-- FROM publishers p LEFT JOIN books b ON b."publisherSlug" = p.slug
-- GROUP BY p.slug, p.name ORDER BY books DESC, p.name;
