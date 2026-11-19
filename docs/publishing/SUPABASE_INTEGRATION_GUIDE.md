# Supabase Architecture & Implementation Guide for COSYmagazine

This guide details all components, database structures, security policies, storage buckets, and serverless functions needed in Supabase to power COSYmagazine.

---

## 1. Supabase Project Architecture Overview

COSYmagazine operates as a static client application on GitHub Pages, tightly integrated with Supabase for:
1. **Authentication & Identity**: User logins synchronized with the COSY ecosystem (`COSYlanguages/login.html`).
2. **Founder & Staff Privileges**: Studio editing rights in `editor.html` (`founder`, `admin`, `owner` roles).
3. **Paywall Entitlement Verification**: Gating flipbook spreads (Page 4+) and subscriber-only features via `js/cms-auth.js` and `js/flipbook.js`.
4. **Secure Asset Storage**: Private bucket `magazine-editions` for high-resolution printable PDFs, preventing public harvesting.
5. **Signed Download URLs**: Edge Function generating short-lived authenticated download URLs for paid readers.

---

## 2. Step-by-Step Supabase Dashboard Setup

### Step 2.1: Execute Schema Migration
1. Open the [Supabase Dashboard](https://supabase.com/dashboard).
2. Navigate to your project (e.g. `iajkejcmoykubthlwfra`).
3. In the left navigation, open the **SQL Editor**.
4. Click **New Query**, paste the contents of `docs/SUPABASE_SCHEMA.sql` (or `supabase/schema.sql`), and click **Run**.

### Step 2.2: Verify Database Tables
Ensure the following tables are created under the `public` schema:
* `profiles`:
  - `id` (uuid, primary key, references `auth.users`)
  - `email` (text)
  - `full_name` (text)
  - `role` (text, check constraint: `'student'`, `'subscriber'`, `'teacher'`, `'admin'`, `'founder'`, `'owner'`)
* `subscriptions`:
  - `id` (uuid, primary key)
  - `user_id` (uuid, references `auth.users`)
  - `tier` (text: `'free'`, `'monthly'`, `'annual'`, `'founder'`, `'patron'`)
  - `status` (text: `'active'`, `'past_due'`, `'canceled'`, etc.)
  - `valid_until` (timestamptz)
* `issue_purchases`:
  - `id` (uuid, primary key)
  - `user_id` (uuid, references `auth.users`)
  - `issue_id` (text, e.g. `'vol-2026-08'`)
  - `amount_paid` (integer, in cents)
  - `currency` (text)
  - `purchase_date` (timestamptz)
* `magazine_issues`:
  - `id` (text, primary key, e.g. `'vol-2026-08'`)
  - `volume_number` (text, e.g. `'Vol. 2026.08'`)
  - `title` (text, e.g. `'Get Ready for School'`)
  - `theme` (text)
  - `month_year` (text, e.g. `'August 2026'`)
  - `is_published` (boolean)
  - `preview_page_limit` (integer, default 3)
  - `pdf_storage_path` (text, e.g. `'issues/cosymagazine-vol-2026-08.pdf'`)

### Step 2.3: Storage Bucket Setup
1. In the left navigation, open **Storage**.
2. Verify that the bucket `magazine-editions` exists and **Public Bucket** is set to **OFF** (Private).
3. Inside `magazine-editions`, upload issue PDFs under the `issues/` prefix:
   - `issues/cosymagazine-vol-2026-08.pdf`
   - `issues/cosymagazine-vol-2026-09.pdf`
   - `issues/cosymagazine-vol-2026-10.pdf`
   - `issues/cosymagazine-vol-2026-11.pdf`
   - `issues/cosymagazine-vol-2026-12.pdf`

---

## 3. Promoting Users to Founder / Admin Role

To grant founder access to `editor.html` (COSYmagazine Studio) or bypass paywalls:

```sql
update public.profiles
set role = 'founder'
where email = 'founder@cosylanguages.com';
```

---

## 4. Deploying the Supabase Edge Function

The edge function `get-issue-download-url` generates temporary signed download links for entitled users.

To deploy via the Supabase CLI:

```bash
# Login to Supabase CLI
npx supabase login

# Link to project
npx supabase link --project-ref iajkejcmoykubthlwfra

# Deploy edge function
npx supabase functions deploy get-issue-download-url --no-verify-jwt
```

### Edge Function Invocation Example (Frontend):

```javascript
const { data, error } = await supabase.functions.invoke('get-issue-download-url', {
  body: { issue_id: 'vol-2026-08' }
});

if (data && data.download_url) {
  // Open signed download link
  window.open(data.download_url, '_blank');
} else {
  console.error('Download authorization failed:', error);
}
```

---

## 5. Paywall Integration in Flipbook & Articles

* **Free Preview Threshold**: Configured in `js/flipbook.js` (default: 3 pages).
* **Entitlement Check**: Handled by `CosyCMSAuth.hasPaidAccess(issueId)`.
  1. Checks if current user has `isFounder` (`founder`, `admin`, `owner`).
  2. Checks if current user has an active row in `subscriptions`.
  3. Checks if user has a record in `issue_purchases` matching `issueId`.
* **Fallback & Cache**: `sessionStorage.getItem('cosy_has_paid_access')` is respected for offline or local preview environments.

---

## 6. Stripe / Payment Webhook Integration (Optional)

When integrating Stripe:
* On `customer.subscription.created` or `updated` -> Upsert into `subscriptions` table.
* On `checkout.session.completed` (single issue purchase) -> Insert into `issue_purchases` table with metadata `issue_id: session.metadata.issue_id`.
