# Recipe Notebook

A personal recipe manager where you can create, organize, and share recipes. Sign in with Discord or Hack Club, build your cookbook, publish recipes for others to discover, and rate what you cook.

---

## Features

- **Create & edit recipes** — Add a title, description, prep/cook time, servings, tags, cover photo, ingredient groups, and step-by-step instructions
- **Drag to reorder** — Rearrange ingredients (within and between groups), ingredient groups, and steps by dragging
- **Auto-save** — Changes are debounced and saved to the server automatically as you type
- **Ingredient scaling** — Scale any recipe to 0.5×, 1×, 2×, 5×, or 10× — quantities and servings update instantly
- **Unit conversion** — Toggle between metric and imperial; values are converted with kitchen-friendly precision (fractions for imperial, decimals for metric)
- **Tags** — Tag recipes for better searchability; tags are weighted higher in search results
- **Browse & search** — Full-text fuzzy search across all published recipes, ranked by relevance and average rating
- **Publish or keep private** — Recipes stay private until you publish them; published recipes are immutable and visible to anyone
- **Star ratings** — Rate any published recipe 1–5 stars; average rating and count are shown on every recipe card
- **User profiles** — View all published recipes from any user at `/user-recipes/[id]`

---

## Getting Started

### 1. Clone & install

```bash
git clone <your-repo-url>
cd food-diary-better
pnpm install
```

### 2. Set up environment variables

Create a `.env` file in the root and fill in the following:

```env
# Database (PostgreSQL)
DATABASE_URL="postgresql://..."   # connection-pooling URL (e.g. Supabase)
DIRECT_URL="postgresql://..."     # direct connection URL (for migrations)

# Auth (NextAuth)
AUTH_SECRET=""                    # run: npx auth secret
AUTH_DISCORD_ID=""
AUTH_DISCORD_SECRET=""
AUTH_HACKCLUB_ID=""
AUTH_HACKCLUB_SECRET=""

# File uploads
UPLOADTHING_TOKEN=""
```

> **Where do I get these?**
>
> - **Discord OAuth** — [discord.com/developers/applications](https://discord.com/developers/applications) → New Application → OAuth2
> - **Hack Club OAuth** — [identity.hackclub.com](https://identity.hackclub.com)
> - **UploadThing** — [uploadthing.com](https://uploadthing.com) → create a project and copy the token
> - **Database** — [supabase.com](https://supabase.com) for a free hosted Postgres (enable the `pg_trgm` extension), or run locally with the included script

### 3. Enable the pg_trgm extension

The search feature requires PostgreSQL's `pg_trgm` extension. If using Supabase, run this once in the SQL editor:

```sql
CREATE EXTENSION IF NOT EXISTS pg_trgm;
```

### 4. Start the database (local only)

If running locally with Docker/Podman:

```bash
./start-database.sh
```

Or paste your Supabase connection strings in `.env` and skip this step.

### 5. Push the database schema

```bash
pnpm db:push
```

### 6. Run the app

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) — done!

---

## Useful Commands

| Command             | What it does                       |
| ------------------- | ---------------------------------- |
| `pnpm dev`          | Start dev server (with hot reload) |
| `pnpm build`        | Build for production               |
| `pnpm start`        | Run the production build           |
| `pnpm db:push`      | Sync database schema               |
| `pnpm db:studio`    | Open a visual database browser     |
| `pnpm lint:fix`     | Auto-fix linting errors            |
| `pnpm format:write` | Auto-format all files              |

---

## Tech Stack

|              |                                          |
| ------------ | ---------------------------------------- |
| Framework    | Next.js 15 (App Router)                  |
| Language     | TypeScript                               |
| Styling      | Tailwind CSS + Framer Motion             |
| API          | tRPC v11 + React Query                   |
| Database     | PostgreSQL + Prisma                      |
| Search       | PostgreSQL `pg_trgm` (fuzzy full-text)   |
| Auth         | NextAuth v5 (Discord & Hack Club OAuth)  |
| File uploads | UploadThing                              |
| Drag & drop  | @dnd-kit                                 |

---

## How to Use the App

### Creating a recipe

1. Sign in at `/sign-in`
2. Go to **My Recipes** and click **New Recipe**
3. Add a title, description, prep/cook time, servings, and tags
4. Add ingredient groups and ingredients — choose a unit and label for each
5. Write your steps
6. Upload a cover photo
7. Changes save automatically — no save button needed

### Reordering content

Drag the handle icon next to any ingredient, ingredient group, or step to reorder it. You can also drag ingredients between groups.

### Scaling a recipe

On any recipe view page, use the scale buttons (0.5×, 1×, 2×, 5×, 10×) to adjust quantities. Servings update to match. This is display-only and doesn't modify the stored recipe.

### Switching units

Use the metric/imperial toggle on a recipe view to convert all ingredient quantities. Imperial values display as fractions; metric values display as decimals.

### Publishing a recipe

1. Open the recipe and click **Preview** to see how it looks publicly
2. When ready, click **Publish**
3. The app validates your recipe before publishing (title, ingredient labels, step text)
4. Confirm the warning — **published recipes cannot be edited**
5. Published recipes are visible at `/recipe/[id]` and appear in search results

### Browsing & searching

Go to `/search` to browse all published recipes. Type in the search box for fuzzy full-text search — results are ranked by tag matches, then title, then description, then average rating. Scroll down to load more.

### Rating a recipe

Open any published recipe you don't own and click a star (1–5). Your rating is saved immediately and the average updates in real time. You can change your rating by clicking a different star.

### Viewing a user's recipes

Click a recipe author's name or avatar to go to their profile at `/user-recipes/[id]`, which shows all of their published recipes.
