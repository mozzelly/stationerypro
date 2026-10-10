# StationeryPro
Powered by Mozz Elly

## Requirements
- Node.js LTS
- npm
- Supabase project
- Git

## Installation
1. Clone or open the StationeryPro repository.
2. Install dependencies:

   npm install

3. Configure `.env.local`:

   VITE_SUPABASE_URL=YOUR_SUPABASE_PROJECT_URL
   VITE_SUPABASE_ANON_KEY=YOUR_SUPABASE_PUBLISHABLE_KEY

4. Run the development server:

   npm run dev

5. Open the local URL printed in the terminal.

## Build
npm run build

## Preview
npm run preview

## Database
Run the approved SQL schema in the StationeryPro Supabase project.
Create the first Auth account and promote it to owner using its Auth UUID.

## Security
- Never commit `.env.local`.
- Never put service-role or secret keys in frontend code.
- Verify RLS policies before using real business data.
- Keep database backups.
- Test sales, stock, access permissions and reports before production.

## Current limitations
- Offline sales queue and conflict-safe synchronization require additional implementation.
- Staff account creation requires a trusted administrative workflow.
- Returns, voids and refunds require a controlled database workflow.
- Stock receipt history requires a dedicated stock-in operation.