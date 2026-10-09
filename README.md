# StationeryPro — starter project

Mobile-friendly online stationery POS for multiple computers, MacBook and phones. The app is a PWA; it is not an APK yet. It uses Vite + JavaScript + Supabase.

## Important status
This is a functional starter foundation, not yet a fully audited production accounting/POS system. The first version includes login, roles, dashboard, products, stock-in, atomic sales, sales history, expenses, date-filtered sales report and settings. Remaining work includes purchases/suppliers/customers/debt settlement, returns/void flow, payment reconciliation, receipt printer testing, stronger audit screens, automated tests, offline write queue and production hardening.

## Free-tier setup

1. Install Node.js LTS on your development computer.
2. Create a new Supabase project on the Free plan.
3. In Supabase → SQL Editor, run `supabase/schema.sql`.
4. In Supabase → Project Settings → API, copy Project URL and anon/publishable key.
5. Open `src/main.js`, replace:
   - `PASTE_SUPABASE_PROJECT_URL_HERE`
   - `PASTE_SUPABASE_ANON_KEY_HERE`
   Never use `service_role` or secret key in browser code.
6. In the project folder, run:
   ```bash
   npm install
   npm run dev
   ```
   Open the local URL printed by Vite.
7. Create the owner's account using Supabase → Authentication → Users → Add user. The trigger creates an employee profile.
8. Find the new user's UUID in Authentication → Users. Run this SQL, replacing UUID:
   ```sql
   update public.profiles
   set full_name = 'Stationery Owner', role = 'owner', active = true
   where id = 'REPLACE-WITH-USER-UUID';
   ```
9. Create employee accounts in Supabase Authentication. Assign roles/permissions:
   ```sql
   update public.profiles
   set full_name='Cashier One',
       role='employee',
       active=true,
       permissions=array['dashboard.view','sales.create','sales.view','products.view']
   where id='EMPLOYEE-UUID';
   ```
10. For developer support, create a separate auth user and set `role='developer'`. Only give this role to a trusted technical account. This starter's developer role has broad manager access; do not use it for a third-party developer without changing permissions first.
11. Build for production:
   ```bash
   npm run build
   ```
   The output is `dist/`.

## Free hosting deployment

Use a GitHub repository and Cloudflare Pages:
- Push the source to GitHub.
- Create a Pages project connected to the repository.
- Build command: `npm run build`
- Output directory: `dist`
- No environment variables are needed in this starter because the Supabase URL and anon key are set in `src/main.js`; for a production repository, prefer build environment variables and keep the anon key restricted with RLS.
- Use the `*.pages.dev` subdomain initially to avoid buying a domain.
- After deployment, open the HTTPS URL on each computer and phone. On supported mobile browsers choose “Add to Home Screen” / “Install app”.

## Multi-device use

All online devices use the same Supabase project, so owner can see synced sales from other devices after a sale commits successfully. Internet is required for new reads/writes and live cross-device sync. The current service worker caches the app shell only; it does NOT queue sales offline. Do not record real sales when offline until a tested offline queue is implemented.

## Important security / operations
- Supabase Free may pause inactive projects and has usage limits. Export/backup data regularly; do not promise zero downtime.
- RLS is enabled. Test each role with separate accounts before real use.
- Never place a Supabase service-role/secret key in `src/main.js`, GitHub or the browser.
- Do not allow silent deletion of completed sales. Add a formal void/return flow before production.
- Current sales report is gross sales only; it does not calculate true net profit. Do not use the dashboard totals as audited accounts.
- Supabase SQL Editor access is admin-level; only trusted owner/developer should have project access.
- Test with fake data first, verify stock and totals, and make a backup before importing real inventory.

## Folder structure

- `src/main.js` — app UI and actions
- `src/style.css` — responsive desktop/mobile styles
- `supabase/schema.sql` — schema, RLS policies and transactional RPCs
- `public/sw.js` — app shell cache for PWA
- `manifest.webmanifest` — install metadata
