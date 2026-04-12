# Ravenswood Archive

A search engine and archive for [Blood on the Clocktower](https://bloodontheclocktower.com/) scripts. Browse, search, filter, and download community-created scripts with customisable PDF generation.

**Live at [ravenswoodarchive.com](https://ravenswoodarchive.com)**

## Features

- **Script search** with fuzzy matching on name and author, plus filters for script type, character inclusions/exclusions, base 3 only, homebrew content, and collections
- **PDF generation** with extensive customisation: colours, fonts, backgrounds, paper sizes, compact modes, and multi-language support
- **Script versioning** so authors can publish updates without losing history
- **Collections** for curating and browsing grouped scripts
- **Competitions** with bracket generation, seeding, and community voting
- **User accounts** for submitting scripts, tracking favourites, and saving PDF preferences
- **Public API** for third-party integrations (see [API docs](#api))

## Tech Stack

- [Next.js](https://nextjs.org/) (App Router) + React + TypeScript
- [Supabase](https://supabase.com/) (PostgreSQL with Row-Level Security)
- [Tailwind CSS](https://tailwindcss.com/) + [shadcn/ui](https://ui.shadcn.com/)
- [Puppeteer](https://pptr.dev/) for server-side PDF rendering
- Deployed on [Vercel](https://vercel.com/)

## Getting Started

### Prerequisites

- Node.js 20+
- A [Supabase](https://supabase.com/) project (or local instance via `supabase start`)

### Setup

```bash
# Install dependencies
npm install

# Copy the example env file and fill in your Supabase credentials
cp .env.example .env.local

# Run database migrations
npx supabase db push

# Start the dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to browse the archive.

### Environment Variables

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous/public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (server-side only) |
| `NEXT_PUBLIC_SITE_URL` | Public URL of the site |
| `NEXT_PUBLIC_PDF_ASSETS_URL` | Base URL for PDF asset files (optional) |

## API

The archive exposes a public search API for third-party tools and integrations.

**Base URL:** `https://ravenswoodarchive.com/api`

### Authentication

All API requests require an `X-API-Key` header. Contact the team to request a key.

### `GET /api/search`

Search and filter scripts. Supports the following query parameters:

| Parameter | Description |
|---|---|
| `q` | Fuzzy search on name or author |
| `type` | `full`, `teensy`, or `all` |
| `base3` | Set to `true` to exclude carousel characters |
| `homebrew` | `true` for homebrew-only, `false` to exclude homebrew |
| `include` | Comma-separated character IDs (scripts must contain all) |
| `exclude` | Comma-separated character IDs (scripts must contain none) |
| `collections` | Comma-separated collection UUIDs |
| `sort` | `newest`, `downloads`, or `favourites` |
| `page` / `pageSize` | Pagination (max 100 per page) |

Full OpenAPI spec available at [`/api/docs`](https://ravenswoodarchive.com/api/docs).

## Archive Stacks

Script data is also preserved in [ravenswood-archive-stacks](https://github.com/Dan-314/ravenswood-archive-stacks), a community-owned, content-addressed Git archive. This ensures no scripts are lost if any single service goes down.

## Acknowledgements

PDF rendering is ported from [botc-script-pdf-generator](https://github.com/JohnForster/botc-script-pdf-generator) by John Forster (MIT License). See [THIRD_PARTY_LICENSES.md](THIRD_PARTY_LICENSES.md) for details.

Blood on the Clocktower is created and owned by [The Pandemonium Institute](https://www.thepandemoniumInstitute.com/).

## License

Licensed under the [GNU Affero General Public License v3.0](LICENSE).
