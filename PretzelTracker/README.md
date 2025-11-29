# Auntie Anne's Pretzel Price Tracker

Crowd sourced tracker for Auntie Anne's pretzel prices. This page lets visitors submit prices at specific locations, review recent submissions, and view the average Original Pretzel price over time.

## Setup

<!-- Supabase configuration steps for the site maintainer -->
1. Go to https://supabase.com and create a new project (Free plan).
2. In the SQL editor, create a table named `pretzel_prices` with:

```
CREATE TABLE public.pretzel_prices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  username text NOT NULL,
  location_text text NOT NULL,
  price_original numeric(10,2) NOT NULL,
  price_cinnamon numeric(10,2),
  price_pepperoni numeric(10,2),
  notes text
);
```

3. Enable Row Level Security (RLS) on `pretzel_prices`.
4. Add policies for anonymous access (not hardened for production):
   - Insert: allow for `anon` role with `USING true` and `WITH CHECK true`.
   - Select: allow for `anon` role with `USING true`.

> These example policies are not production-ready. Tighten them before deploying broadly.

5. From **Project Settings → API**, copy your project URL (`supabaseUrl`) and anon public API key (`supabaseKey`).
6. Copy `supabase-config.sample.js` to `supabase-config.js` and paste your values:

```js
const SUPABASE_URL = "https://YOUR-PROJECT-ID.supabase.co";
const SUPABASE_ANON_KEY = "YOUR_ANON_PUBLIC_KEY_HERE";
```

Place `supabase-config.js` alongside the other PretzelTracker files so the page can initialize Supabase.
