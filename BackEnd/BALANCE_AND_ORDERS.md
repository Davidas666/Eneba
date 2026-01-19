# 💰 Vartotojo Balansas ir Apsipirkimų Sistema

## 📊 Naujos Lentelės

### 1. **user_balance** - Vartotojo balansas
```sql
user_id       UUID (Primary Key)
balance       DECIMAL(10, 2)     -- Dabartinis balansas
currency      VARCHAR(3)          -- EUR, USD, etc.
updated_at    TIMESTAMP
```

### 2. **balance_history** - Balanso pakeitimų istorija
```sql
id            UUID (Primary Key)
user_id       UUID
amount        DECIMAL(10, 2)      -- Suma
type          VARCHAR(20)         -- deposit, withdrawal, purchase, refund, cashback
description   TEXT                -- Aprašymas
balance_before DECIMAL(10, 2)    -- Balansas prieš
balance_after DECIMAL(10, 2)     -- Balansas po
created_at    TIMESTAMP
```

**Tipai:**
- ✅ `deposit` - Balanso papildymas
- ❌ `withdrawal` - Išgryninimas
- 🛒 `purchase` - Pirkimas
- ↩️ `refund` - Grąžinimas
- 💸 `cashback` - Cashback gavimas

### 3. **orders** - Užsakymai
```sql
id            UUID (Primary Key)
user_id       UUID
total_amount  DECIMAL(10, 2)
payment_method VARCHAR(50)        -- balance, card, paypal
status        VARCHAR(50)         -- pending, completed, cancelled, refunded
created_at    TIMESTAMP
updated_at    TIMESTAMP
```

### 4. **order_items** - Užsakymo produktai
```sql
id               UUID (Primary Key)
order_id         UUID
listing_id       UUID               -- Nuoroda į game_listings
game_title       VARCHAR(255)       -- Kopija (jei listing ištrintas)
platform_name    VARCHAR(100)
region_name      VARCHAR(100)
quantity         INTEGER
price_at_purchase DECIMAL(10, 2)   -- Kaina pirkimo metu
activation_key   TEXT               -- Žaidimo raktas
created_at       TIMESTAMP
```

### 5. **seller_ratings** - Pardavėjų įvertinimai
```sql
rating           DECIMAL(3, 2)      -- 1.00 - 10.00 (pvz 9.50)
```
**Pavyzdžiai:**
- 9.00, 10.00 → Vidurkis: 9.50 ✅
- 7.50, 8.75, 9.25 → Vidurkis: 8.50 ✅

---

## 💰 Pinigų Formatai

**Visi pinigai:** `DECIMAL(10, 2)`
- `10` - bendras skaitmenų skaičius
- `2` - skaitmenys po kablelio
- Maksimumas: **99,999,999.99**

**Pavyzdžiai:**
```
29.99 ✅
149.50 ✅
1234.00 ✅
0.01 ✅ (minimalus)
```

**Rating:** `DECIMAL(3, 2)`
- Minimalus: 1.00
- Maksimalus: 10.00
- Pavyzdys: 9.50 ✅

---

## 🔄 Pirkimo Procesas

### **⚠️ SVARBU: NAUDOTI TRANSAKCIJAS!**

**Kodėl transakcijos būtinos:**
- ✅ ARBA viskas pavyksta, ARBA niekas neįvyksta
- ✅ Jei nepavyksta nuskaičiuoti balanso → produktas nepridedamas
- ✅ Jei nepakanka atsargų → balansas nenuskaičiuojamas
- ✅ Užkerta kelią race conditions (du žmonės perka tą patį daiktą vienu metu)

### **Transakcija su `postgres` biblioteka:**

```javascript
await sql.begin(async (sql) => {
    // 1. LOCK balansą (kiti turi laukti)
    const [balance] = await sql`
        SELECT balance FROM user_balance 
        WHERE user_id = ${userId}
        FOR UPDATE  -- LOCK!
    `;

    // 2. Patikrinti ar užtenka
    if (balance.balance < totalAmount) {
        throw new Error('Nepakanka balanso'); // ROLLBACK
    }

    // 3. Lock atsargas
    const [listing] = await sql`
        SELECT stock FROM game_listings 
        WHERE id = ${listingId}
        FOR UPDATE  -- LOCK!
    `;

    if (listing.stock < quantity) {
        throw new Error('Nepakanka atsargų'); // ROLLBACK
    }

    // 4. Nuskaičiuoti balansą
    await sql`
        UPDATE user_balance 
        SET balance = balance - ${totalAmount}
        WHERE user_id = ${userId}
    `;

    // 5. Sumažinti atsargas
    await sql`
        UPDATE game_listings 
        SET stock = stock - ${quantity}
        WHERE id = ${listingId}
    `;

    // 6. Sukurti užsakymą
    await sql`INSERT INTO orders ...`;

    // Jei VISKAS OK → COMMIT automatiškai
    // Jei bet kas metė Error → ROLLBACK automatiškai
});
```

### **1. Vartotojas prideda į krepšelį**
```
cart_items -> listing_id, quantity
```

### **2. Eina į checkout**
Patikrina ar užtenka balanso:
```sql
SELECT balance FROM user_balance WHERE user_id = 'xxx'
SELECT SUM(price * quantity) FROM cart_items ...
```

### **3. Pirkimas vykdomas**

**A. Sukuriamas užsakymas:**
```sql
INSERT INTO orders (user_id, total_amount, status)
VALUES ('user-id', 149.99, 'completed')
```

**B. Produktai perkeliami į order_items:**
```sql
INSERT INTO order_items (order_id, listing_id, game_title, price_at_purchase, activation_key)
SELECT ...
FROM cart_items
```

**C. Nuskaičiuojamas balansas:**
```sql
UPDATE user_balance 
SET balance = balance - 149.99
WHERE user_id = 'xxx'
```

**D. Įrašoma į balance_history:**
```sql
INSERT INTO balance_history (user_id, amount, type, description)
VALUES ('xxx', 149.99, 'purchase', 'Užsakymas #12345')
```

**E. Sumažinamos atsargos:**
```sql
UPDATE game_listings 
SET stock = stock - 1
WHERE id IN (...)
```

**F. Išvalomas krepšelis:**
```sql
DELETE FROM cart_items WHERE cart_id = 'xxx'
```

---

## 💳 Balanso Papildymas

```sql
-- 1. Atnaujinti balansą
UPDATE user_balance 
SET balance = balance + 50.00
WHERE user_id = 'xxx'

-- 2. Įrašyti istoriją
INSERT INTO balance_history (user_id, amount, type, description)
VALUES ('xxx', 50.00, 'deposit', 'PayPal papildymas')
```

---

## 📜 Apsipirkimų Istorija

### **Vartotojo užsakymų sąrašas:**
```sql
SELECT 
    o.id,
    o.total_amount,
    o.status,
    o.created_at,
    COUNT(oi.id) as items_count
FROM orders o
LEFT JOIN order_items oi ON o.id = oi.order_id
WHERE o.user_id = 'xxx'
GROUP BY o.id
ORDER BY o.created_at DESC
```

**Rezultatas:**
```
Order #1234 | €149.99 | Completed | 2026-01-14 | 3 items
Order #1233 | €29.99  | Completed | 2026-01-12 | 1 item
Order #1232 | €89.99  | Refunded  | 2026-01-10 | 2 items
```

### **Vieno užsakymo detalės:**
```sql
SELECT 
    oi.game_title,
    oi.platform_name,
    oi.region_name,
    oi.price_at_purchase,
    oi.activation_key
FROM order_items oi
WHERE oi.order_id = 'order-uuid'
```

**Rezultatas:**
```
Red Dead Redemption 2 | Steam | EU | €29.99 | XXXXX-XXXXX-XXXXX
GTA V | Rockstar | Global | €19.99 | YYYYY-YYYYY-YYYYY
```

---

## 📊 Balanso Istorija

```sql
SELECT 
    amount,
    type,
    description,
    balance_before,
    balance_after,
    created_at
FROM balance_history
WHERE user_id = 'xxx'
ORDER BY created_at DESC
```

**Rezultatas:**
```
+€50.00  | deposit   | PayPal papildymas      | €0.00   | €50.00  | 2026-01-14
-€29.99  | purchase  | Užsakymas #1234        | €50.00  | €20.01  | 2026-01-14
+€2.99   | cashback  | Cashback 2%            | €20.01  | €23.00  | 2026-01-15
-€19.99  | purchase  | Užsakymas #1235        | €23.00  | €3.01   | 2026-01-15
```

---

## ↩️ Grąžinimas (Refund)

```sql
-- 1. Pakeisti statusą
UPDATE orders SET status = 'refunded' WHERE id = 'xxx'

-- 2. Grąžinti pinigus
UPDATE user_balance SET balance = balance + 149.99 WHERE user_id = 'xxx'

-- 3. Įrašyti istoriją
INSERT INTO balance_history (user_id, amount, type, description)
VALUES ('xxx', 149.99, 'refund', 'Grąžinimas už užsakymą #1234')
```

---

## 💸 Cashback Sistema

**Po pirkimo:**
```sql
-- Sukurti cashback įrašą (pvz 2%)
INSERT INTO cashback (user_id, listing_id, amount, percentage, status)
VALUES ('xxx', 'listing-id', 2.99, 2.00, 'pending')
```

**Išmokėti:**
```sql
-- 1. Pridėti į balansą
UPDATE user_balance SET balance = balance + 2.99 WHERE user_id = 'xxx'

-- 2. Pažymėti kaip išmokėtą
UPDATE cashback SET status = 'paid' WHERE user_id = 'xxx'

-- 3. Įrašyti istoriją
INSERT INTO balance_history (user_id, amount, type, description)
VALUES ('xxx', 2.99, 'cashback', 'Cashback 2%')
```

---

## 📈 Statistika

### **Vartotojo išlaidos per 30 dienų:**
```sql
SELECT 
    COUNT(*) as total_orders,
    SUM(total_amount) as total_spent,
    AVG(total_amount) as avg_order
FROM orders
WHERE user_id = 'xxx'
    AND status = 'completed'
    AND created_at >= CURRENT_TIMESTAMP - INTERVAL '30 days'
```

### **Viso cashback:**
```sql
SELECT 
    SUM(amount) as total_cashback,
    COUNT(*) as cashback_count
FROM cashback
WHERE user_id = 'xxx' AND status = 'paid'
```

---

## 🎯 Frontend Reikalavimai

### **Profile puslapyje:**
- ✅ Dabartinis balansas
- ✅ "Papildyti balansą" mygtukas
- ✅ Balanso istorija (10 paskutinių įrašų)

### **Orders puslapyje:**
- ✅ Apsipirkimų istorija su filtrais (status)
- ✅ Kiekvieno užsakymo detalės
- ✅ Activation keys (žaidimų raktai)
- ✅ "Refund" mygtukas (jei leidžiama)

### **Checkout puslapyje:**
- ✅ Balansas viršuje
- ✅ Cart total
- ✅ "Pirkti" mygtukas (disabled jei nepakanka)
- ✅ "Papildyti balansą" linkas

---

## 🔒 Saugumo Pastabos

1. **Transakcijos** - Naudoti PostgreSQL transactions pirkimams
2. **Stock tikrinimas** - Patikrinti atsargas prieš pirkimą
3. **Balance validacija** - Patikrinti balansą prieš nuskaičiuojant
4. **Activation keys** - Užšifruoti duomenų bazėje
5. **Order history** - Saugoti visą info (kaina, pavadinimas) net jei listing ištrintas
