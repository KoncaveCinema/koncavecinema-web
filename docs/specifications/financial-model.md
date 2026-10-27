# Financial & Profit Modeling Blueprint

**KONCAVE CINEMA NIGERIA LIMITED**  
_Unit Economics, Statutory Tax Compliance, Marketplace Turnover Analysis & Revenue Split Mechanics._

---

## 1. Financial Strategy & The Double-Margin Model

In traditional physical cinema exhibition in Nigeria, filmmakers lose 50%–60% to exhibitors (cinema chains) and 10%–15% to distributors—leaving the filmmaker with roughly 30%–35% of the gross box office.

Koncave Cinema replaces the physical exhibitor monopoly with a high-efficiency virtual exhibition cloud platform. By empowering filmmakers to dictate their own **Base Ticket Price ($P$)** between ₦2,500 and ₦10,000 (standard benchmark: **₦5,000.00**), the platform operates a **Double-Margin Profit Architecture**:

1. **The Base Commission**: Koncave acts as a technology distribution platform, retaining a platform commission (default **15%**) on the base box office. The producer receives **85%** (configurable by Koncave administrators between 50% and 95% on a per-movie basis).
2. **The VIP Infrastructure Premium**: For Tier 3 and Tier 4 Private Suites, Koncave adds a 20% infrastructure markup: `(P * Capacity) * 1.20`. This 20% premium is retained 100% by Koncave Cinema to cover LiveKit WebRTC SFU audio/video infrastructure and generate high-margin platform profit.

---

## 2. Infrastructure Cost Baselines (2026 Rates)

| Cost Component                        | Vendor Benchmark Rate                                                                                           | Koncave Unit Cost (120-min Movie)               |
| :------------------------------------ | :-------------------------------------------------------------------------------------------------------------- | :---------------------------------------------- |
| **Mux Video** (HLS delivery + DRM)    | ~$0.001 per minute at 1080p + ~$0.003 per DRM license; DRM access ~$100 / month (list prices, confirm by quote) | ≈ ₦185.00 per individual viewer                 |
| **Cloud Hosting (AWS App Runner/DB)** | Amortized server & DB overhead                                                                                  | ≈ ₦18.00 per ticket ($0.012 amortized at scale) |
| **LiveKit Cloud** (WebRTC Voice Mesh) | $0.0004 per participant-minute                                                                                  | ≈ ₦72.00 per participant (Private Suites only)  |
| **Paystack Transaction Gateway**      | 1.5% + ₦100 (Capped at ₦2,000)                                                                                  | Pass-through fee paid by user at checkout.      |
| **Busha Commerce (Future Crypto)**    | 1.0% flat (USDT / USDC)                                                                                         | Pass-through fee paid by user at checkout.      |
| **Dev & Staging Environments**        | Supabase + Upstash + Docker                                                                                     | **$0.00 / month (Zero Cost Tier)**              |

---

## 3. Statutory Nigerian Tax Compliance & Small Business Turnover Threshold

> **Status of this section**: desk research carried out in October 2026 from published
> professional summaries of the 2025 tax reform. It is not legal advice. Every point marked
> _to confirm_ must be signed off by a Nigerian tax adviser before the platform takes real money.

### A. Value Added Tax (VAT - 7.5%) & the Small Business Exemption

- **Governing law**: The Nigeria Tax Act 2025 and the Nigeria Tax Administration Act 2025 took effect on **1 January 2026**, replacing the Value Added Tax Act and the Finance Act thresholds previously cited in this document (the ₦25,000,000 turnover test under "Section 15" no longer applies). The Federal Inland Revenue Service (FIRS) is now the **Nigeria Revenue Service (NRS)**.
- **Federal VAT Rate**: remains **7.5%** on taxable goods and services, including digital services.
- **Small Business Exemption**: a business with annual turnover of **₦100,000,000 or less** and total fixed assets of **₦250,000,000 or less** (providers of professional services excluded) is exempt from registering for VAT, charging it, filing VAT returns, and remitting it. A business may opt in voluntarily by written notice, and compliance becomes mandatory once the threshold is exceeded. _To confirm: one secondary source quotes a ₦50,000,000 threshold._
- **What counts as Koncave's turnover — open risk**:
  - Koncave's position is that it is a **marketplace agent** selling admissions on behalf of filmmakers, so its turnover is its commission, private suite markups and concession margins, not the producer's share of the box office.
  - This position is **not settled**. Earlier revenue-authority guidance on platform intermediaries treats one that _receives the customer's payment_ as accountable for VAT on the whole amount, and one that only _earns a commission_ as accountable on the commission. Koncave collects the whole ticket price through Paystack. In _Bolt Operations v. FIRS_ the Tax Appeal Tribunal, upheld by the Federal High Court in July 2025, ruled against a platform on a related VAT question.
  - **Mitigations**: (1) the Producer Distribution Agreement appoints Koncave as a disclosed agent; (2) obtain a written opinion from a tax adviser; (3) if the adviser requires it, settle the producer's share through **Paystack split payments (subaccounts)** so it never becomes Koncave's money. The current plan is payout on request from Koncave's balance, which is simpler to operate but the weaker model for this argument (see the [pre-launch backlog](../phases/pre-launch-hardening-backlog.md), item 5).
  - If the agent position holds, the ₦100M threshold corresponds to roughly ₦500M–₦650M of box office. If it does not, the threshold is reached at ₦100M of ticket sales.
- **Execution Model**:
  - **While exempt**: `VAT_RATE_PERCENT=0`. No VAT is charged, shown, or collected. Customers pay the ticket price plus the payment processing fee.
  - **Once registration is required**: set `VAT_RATE_PERCENT=7.5`. VAT is itemised at checkout, recorded on every settlement, held apart from platform revenue, and remitted to the NRS. The producer's payout is unaffected.
  - Finance must track cumulative turnover monthly so the switch is made before the threshold is crossed, not after.

### B. State Entertainment Tax Clarification

- No state entertainment or consumption tax is charged on virtual streaming.
- In 2020 the Lagos State Film and Video Censors Board announced a 5% levy on audio-visual content including streaming. The Lagos State Government publicly disowned the levy and suspended the official responsible.
- The Lagos State 5% consumption tax applies to purchases in hotels, restaurants and event centres, not to online streaming.
- Koncave Cinema does not collect or remit any such levy.

### C. Payment Processing Fee

- The payment gateway's charge is passed to the customer and shown as a **processing fee**. It is never described as a tax.
- It is grossed up so that the amount left after Paystack's deduction equals the ticket subtotal exactly (see section 4).

### D. Questions Still Open for the Tax Adviser

1. The exact small-business threshold and whether Koncave's activity is caught by the professional-services exclusion.
2. Whether turnover is measured on commission or on gross ticket sales (see A).
3. Withholding tax obligations on payouts to producers.
4. Company income tax and development levy position for the company's size.
5. Electronic invoicing (fiscalisation) obligations and their timeline for small businesses.

---

## 4. Pass-Through Checkout Unit Economics

Under the **Pass-Through Checkout Architecture**, payment gateway processing fees (Paystack: 1.5% + ₦100, capped at ₦2,000) are paid by the customer at checkout on top of the ticket price. This guarantees that the box office pool remains 100% intact, and the producer's agreed net payout is never eroded by payment processing costs.

Paystack takes its percentage on the amount actually charged, so the fee is **grossed up** rather than calculated on the subtotal:

```txt
total charged  = (subtotal + VAT + ₦100) ÷ (1 − 0.015)      rounded up to the next kobo
processing fee = total charged − subtotal − VAT              capped at ₦2,000
```

The single formula used by checkout pricing, payment settlement and the admin payout calculator (`src/common/money/pricing.ts`, `src/payments/settlement.calculator.ts`):

```txt
base amount      = P × seats
markup           = 20% of base amount (private suites only)
subtotal         = base amount + markup
producer revenue = base amount × producer % (per film, 50–95%, default 85%)
platform revenue = amount collected − actual gateway fee − VAT − producer revenue
```

If the gateway keeps more than the fee charged (for example an international card), the difference comes out of platform revenue, never the producer's.

### Case Study A: Single Individual Ticket (₦5,000 Base Ticket)

| Revenue / Cost Item         | Calculation                  | Amount (NGN)          |
| :-------------------------- | :--------------------------- | :-------------------- |
| **Base Ticket Price ($P$)** | Producer Defined             | ₦5,000.00             |
| VAT (small business exempt) | 0% (`VAT_RATE_PERCENT=0`)    | ₦0.00                 |
| Subtotal                    | Base Ticket                  | ₦5,000.00             |
| Processing Fee (grossed up) | (P + 100) ÷ 0.985 − P        | ₦177.67               |
| **FINAL CUSTOMER CHARGE**   | **Total Paid at Checkout**   | **₦5,177.67**         |
| Paystack Gateway Deduction  | Automatically retained       | - ₦177.67             |
| **Net Box Office Settled**  | **Gross Ticket Box Office**  | **₦5,000.00**         |
| **Producer Net Payout**     | **85% of Base Ticket ($P$)** | **₦4,250.00 (85.0%)** |
| Koncave Base Commission     | 15% of Base Ticket ($P$)     | ₦750.00 (15.0%)       |
| Mux Streaming + DRM Cost    | 120 mins HLS + 1 license     | - ₦185.00             |
| Cloud Compute & DB Overhead | Amortized AWS & DB footprint | - ₦18.00              |
| **KONCAVE NET MARGIN**      | **Net Platform Margin**      | **₦547.00 (72.9%)**   |

_(Note: Once VAT registration is required and `VAT_RATE_PERCENT` is set to 7.5, ₦375.00 VAT is added at checkout, the processing fee becomes ₦183.38 and the customer pays ₦5,558.38. The VAT is held for remittance to the NRS without affecting the producer's ₦4,250.00 payout)._

---

### Case Study B: The 5-Person Private Suite (The Profit Engine)

Assumes a VIP Host booking a 5-capacity private room for a premiere with a ₦5,000 base ticket:

| Revenue / Cost Item                | Calculation                      | Amount (NGN)           |
| :--------------------------------- | :------------------------------- | :--------------------- |
| Base Box Office                    | 5 seats × ₦5,000                 | ₦25,000.00             |
| Koncave Room Infrastructure Markup | 20% of ₦25,000                   | ₦5,000.00              |
| Subtotal                           | Base + Infrastructure Markup     | ₦30,000.00             |
| Processing Fee (grossed up)        | (30,000 + 100) ÷ 0.985 − 30,000  | ₦558.38                |
| **FINAL CUSTOMER CHARGE**          | **Total Paid at Checkout**       | **₦30,558.38**         |
| Paystack Gateway Deduction         | Automatically retained           | - ₦558.38              |
| **Net Box Office Settled**         | **Total Settled Funds**          | **₦30,000.00**         |
| **Producer Net Payout**            | **85% of Base Box Office**       | **₦21,250.00 (85.0%)** |
| Koncave Base Commission            | 15% of ₦25,000 Base              | ₦3,750.00              |
| Koncave Room Premium (20%)         | 100% Retained by Platform        | ₦5,000.00              |
| **Koncave Gross Revenue**          | Commission + Room Premium        | **₦8,750.00**          |
| Mux Streaming + DRM Cost           | 5 viewers × ₦185                 | - ₦925.00              |
| LiveKit WebRTC Voice Cost          | 5 viewers × ₦72                  | - ₦360.00              |
| **KONCAVE NET PROFIT**             | **Net Platform Profit per Room** | **₦7,465.00 (85.3%)**  |

---

### Case Study C: The 10-Person Private Suite

Assumes a VIP Host booking a 10-capacity private room for a premiere with a ₦5,000 base ticket:

| Revenue / Cost Item                | Calculation                      | Amount (NGN)           |
| :--------------------------------- | :------------------------------- | :--------------------- |
| Base Box Office                    | 10 seats × ₦5,000                | ₦50,000.00             |
| Koncave Room Infrastructure Markup | 20% of ₦50,000                   | ₦10,000.00             |
| Subtotal                           | Base + Infrastructure Markup     | ₦60,000.00             |
| Processing Fee (grossed up)        | (60,000 + 100) ÷ 0.985 − 60,000  | ₦1,015.23              |
| **FINAL CUSTOMER CHARGE**          | **Total Paid at Checkout**       | **₦61,015.23**         |
| Paystack Gateway Deduction         | Automatically retained           | - ₦1,015.23            |
| **Net Box Office Settled**         | **Total Settled Funds**          | **₦60,000.00**         |
| **Producer Net Payout**            | **85% of Base Box Office**       | **₦42,500.00 (85.0%)** |
| Koncave Base Commission            | 15% of ₦50,000 Base              | ₦7,500.00              |
| Koncave Room Premium (20%)         | 100% Retained by Platform        | ₦10,000.00             |
| **Koncave Gross Revenue**          | Commission + Room Premium        | **₦17,500.00**         |
| Mux Streaming + DRM Cost           | 10 viewers × ₦185                | - ₦1,850.00            |
| LiveKit WebRTC Voice Cost          | 10 viewers × ₦72                 | - ₦720.00              |
| **KONCAVE NET PROFIT**             | **Net Platform Profit per Room** | **₦14,930.00 (85.3%)** |

---

## 5. Food & Beverage (F&B) Concession Margins

Replicating physical cinema concession profits, Koncave integrates automated last-mile dispatch via Chowdeck Relay:

- **Vendor Wholesale Cost**: Koncave partners with bulk cinema concession hubs in key urban centers (e.g., Lekki, Ikeja), purchasing a Large Popcorn + Chilled Drink combo for ₦1,500 wholesale.
- **Platform Retail Price**: Sold to the user during ticket checkout for ₦3,500.
- **Logistics Delivery Tariff**: Chowdeck Relay charges a geofenced delivery fee (e.g., ₦1,000 per drop-off), passed onto the customer during checkout.
- **Net Margin**: Koncave clears **₦2,000 net profit per order** with zero inventory risk. If 20% of a 10,000-viewer premiere orders concessions, it generates an additional **₦4,000,000** in pure platform profit.

---

## 6. Premiere Night Scaling Projections (₦5,000 Benchmark)

| Premiere Scale           | Total Viewers | Gross Box Office | Producer Net Payout (85%) | Koncave Platform Revenue (15%) |
| :----------------------- | :------------ | :--------------- | :------------------------ | :----------------------------- |
| **Indie Release**        | 1,000         | ₦5,000,000       | ₦4,250,000                | ₦750,000                       |
| **Standard Blockbuster** | 10,000        | ₦50,000,000      | ₦42,500,000               | ₦7,500,000                     |
| **Mega Premiere**        | 50,000        | ₦250,000,000     | ₦212,500,000              | ₦37,500,000                    |
