# Recipe Notebook

A personal recipe manager where you can create, organize, and share your recipes. Sign in with Discord or Hack Club, build your cookbook, and publish recipes for others to see.

---

## Features

- **Create & edit recipes** — Add ingredients (with units), group them, write step-by-step instructions, and upload a cover photo
- **Drag to reorder** — Rearrange ingredients and steps by dragging them
- **Publish or keep private** — Recipes stay private until you choose to publish them
- **Rate recipes** — Leave star ratings on published recipes
- **Preview before publishing** — See exactly how your recipe looks to others before going public

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
> - **Database** — [supabase.com](https://supabase.com) for a free hosted Postgres, or run locally with the included script

### 3. Start the database

If running locally with Docker/Podman:

```bash
./start-database.sh
```

Or just paste your Supabase connection strings in `.env` and skip this step.

### 4. Push the database schema

```bash
pnpm db:push
```

### 5. Run the app

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

|              |                                   |
| ------------ | --------------------------------- |
| Framework    | Next.js 15 (App Router)           |
| Language     | TypeScript                        |
| Styling      | Tailwind CSS + Framer Motion      |
| API          | tRPC                              |
| Database     | PostgreSQL + Prisma               |
| Auth         | NextAuth v5 (Discord & Hack Club) |
| File uploads | UploadThing                       |

---

## How to Use the App

### Creating a recipe

1. Sign in at `/sign-in`
2. Go to **My Recipes** and click **New Recipe**
3. Add a title, description, cook time, and servings
4. Add ingredients — pick a unit (cup, grams, etc.) and a label
5. Write your steps — drag to reorder them anytime
6. Upload a cover photo
7. Hit **Save**

### Publishing a recipe

1. Open the recipe and click **Preview** to see how it looks publicly
2. If you're happy with it, click **Publish**
3. Published recipes are visible to anyone with the link

### Rating a recipe

Open any published recipe and click a star (1–5) at the bottom of the page.
