# StyleSync Web App: Implementation Plan

The Next.js frontend for the StyleSync backend (`../StyleSync-BD`, FastAPI).
Everything below is based on the backend code as it is now: routers in `app/routers/`, schemas in `app/schemas/`, models in `app/models/`.

**Frontend stack:** Next.js 16 (App Router) · React 19.3 · Tailwind CSS 4.3 · TypeScript 5.9 · Bun 1.4

---

## 1. What the web app has to do

1. **Auth:** register (full name, username, email, age range, sex, password, confirm password). Log in with email *or* username. Forgot/reset password, email verification.
2. **Profile:** username, email, avatar, change password, location, settings, remaining AI quota.
3. **Avatar (doll):** take or upload a selfie, wait for the doll, change hair, skin and eye color and hair style.
4. **Wardrobe:** create collections (Tops, Trousers, Shoes, Accessories…), add items (photo, AI fills in name and color, user corrects them), edit, move and delete.
5. **AI outfit generator:** pick theme + weather + day/night (weather is auto-detected and editable). Show the outfit on the doll, the reasons, tips, sources and any missing pieces.
6. **Creation Room:** the doll and the wardrobe side by side. Drag or tap items into slots, see a live preview, change hair color, save.
7. **My outfits:** list, view, re-render, delete, publish/unpublish.
8. **Feed & social:** public feed (filter by theme), following feed, save, like, comment, follow, block, report, public profiles.
9. **AI stylist chat:** sessions, text + up to 3 photos, streamed replies, outfits shown on the doll inline.
10. **Admin:** users, system health, stats, published outfits and takedowns, report queue, comment moderation, themes, AI budget and quotas.

---

## 2. Key technical decisions

| Concern | Decision | Why |
|---|---|---|
| Talking to the API | **Next.js rewrite proxy**: `/api/v1/*` → `${BACKEND_URL}/api/v1/*` (and `/media/*` for local dev) in `next.config.ts` | The refresh cookie is `SameSite=Lax` with `path=/api/v1/auth`. Going through the proxy makes it a first-party cookie in every environment and removes CORS from the picture. |
| Access token | Kept **in memory only** (a module-level store + React context), never `localStorage` | Matches the backend design (README "Web client notes"). |
| Session restore | On app load, call `POST /api/v1/auth/refresh` with `credentials: "include"` and header `X-StyleSync-CSRF: 1` | The refresh cookie is httpOnly, so this is the only way to know whether the user is signed in. |
| Token expiry | Access token lasts 15 min (`expires_in`). On any `401`, run **one shared refresh** (single-flight promise) and retry the request once. If the refresh fails, sign out. | Refresh tokens rotate, and reusing an old one revokes the whole family, so two refreshes at the same time would log the user out. |
| Server state | **TanStack Query v5** | Caching, polling (renders, avatar), cursor pagination (feed), optimistic updates (like/save). |
| Forms | **react-hook-form + zod**, with rules that mirror the backend validators | Same errors on the client before the request goes out. |
| API types | **openapi-typescript** generated from `http://localhost:8000/openapi.json` into `src/lib/api/schema.d.ts`, with a small typed `fetch` wrapper (`openapi-fetch`) | Several admin and social endpoints return untyped `dict`s. Write those types by hand in `src/lib/api/types.ts` (shapes are in §5). |
| Route protection | **Client-side guard** in `(app)/layout.tsx` and `(admin)/layout.tsx` | The token is in memory and the cookie is scoped to `/api/v1/auth`, so `middleware.ts`/`proxy.ts` can't see whether the user is logged in. |
| Rendering doll SVGs | Sanitize with **DOMPurify** (SVG profile, scripts/foreignObject/style removed), make ids unique per doll, then render inline (`src/lib/svg.ts`, `components/doll/`) | An `<img>` would be safer, but browsers don't load the garment images that layered renders link inside the SVG, so the clothes would disappear. Inline + DOMPurify keeps them and still blocks scripts. |
| Streaming chat | `fetch` + `ReadableStream` + a small SSE parser (not `EventSource`) | The endpoint is a `POST` with `multipart/form-data`, and `EventSource` only supports `GET`. |
| UI kit | Tailwind 4 + **shadcn/ui** (Radix) + `lucide-react` icons + `sonner` toasts | Accessible primitives without a heavy theme. |
| Drag and drop (Creation Room) | **dnd-kit**, with tap-to-place as the default on touch screens | Works well with touch and keyboard. |
| Camera | `<input type="file" accept="image/*" capture="user">` first, `getUserMedia` as an option | Works on every phone without extra code. |

### Environment variables (`.env.local`)

```
BACKEND_URL=http://localhost:8000        # used only by next.config.ts rewrites
NEXT_PUBLIC_APP_NAME=StyleSync
```

Backend `.env` must have `FRONTEND_ORIGIN=http://localhost:3000` (used for links in emails, e.g. `/reset-password?token=…`).

---

## 3. Project structure

```
src/
├── app/
│   ├── layout.tsx                 # fonts, <Providers>, <Toaster>
│   ├── providers.tsx              # QueryClientProvider, AuthProvider, ThemeProvider
│   ├── (marketing)/page.tsx       # landing page (logged out) → redirects to /feed when logged in
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   ├── register/page.tsx
│   │   ├── forgot-password/page.tsx
│   │   ├── reset-password/page.tsx      # ?token=
│   │   └── verify-email/page.tsx        # ?token=
│   ├── (app)/                     # requires login
│   │   ├── layout.tsx             # auth guard, app shell (sidebar / bottom nav)
│   │   ├── wardrobe/page.tsx
│   │   ├── wardrobe/[collectionId]/page.tsx
│   │   ├── generate/page.tsx
│   │   ├── creation-room/page.tsx       # ?outfit= to load an existing outfit
│   │   ├── outfits/page.tsx
│   │   ├── outfits/[id]/page.tsx        # also used for public outfits (optional auth)
│   │   ├── feed/page.tsx                # tabs: For you / Following
│   │   ├── saved/page.tsx
│   │   ├── chat/page.tsx
│   │   ├── chat/[sessionId]/page.tsx
│   │   ├── avatar/page.tsx
│   │   ├── profile/page.tsx             # my profile + settings + change password + AI usage
│   │   └── u/[username]/page.tsx        # public profile
│   └── (admin)/admin/
│       ├── layout.tsx             # role === "admin" guard
│       ├── page.tsx               # health + stats dashboard
│       ├── users/page.tsx
│       ├── outfits/page.tsx
│       ├── reports/page.tsx
│       ├── themes/page.tsx
│       └── ai/page.tsx            # budget + quotas
├── components/
│   ├── ui/                        # shadcn components
│   ├── doll/                      # <DollImage>, <RenderStatus>, <DollStage>
│   ├── wardrobe/                  # <ItemCard>, <AddItemDialog>, <CollectionDialog>
│   ├── outfit/                    # <OutfitCard>, <OutfitDetail>, <MissingItems>, <Sources>
│   ├── feed/                      # <FeedList>, <LikeButton>, <SaveButton>, <Comments>
│   ├── chat/                      # <MessageList>, <Composer>, <ToolIndicator>
│   └── layout/                    # <AppShell>, <NavBar>, <QuotaBadge>
├── lib/
│   ├── api/
│   │   ├── client.ts              # fetch wrapper: base URL, bearer, 401 → refresh → retry
│   │   ├── schema.d.ts            # generated by openapi-typescript
│   │   ├── types.ts               # hand-written types for untyped dict responses
│   │   ├── errors.ts              # ApiError; maps FastAPI 422 detail[] to form field errors
│   │   └── sse.ts                 # SSE parser for chat
│   ├── auth/
│   │   ├── token-store.ts         # in-memory access token
│   │   └── auth-context.tsx       # user, login, register, logout, refresh bootstrap
│   ├── queries/                   # one file per area: wardrobe.ts, outfits.ts, feed.ts…
│   ├── validation/                # zod schemas that mirror the backend
│   └── utils/svg.ts               # svgToDataUrl
└── hooks/
    ├── use-geolocation.ts
    └── use-render-poll.ts
```

---

## 4. Core infrastructure

### 4.1 API client (`lib/api/client.ts`)
- Base URL `/api/v1` (goes through the rewrite proxy).
- Adds `Authorization: Bearer <token>` when there is a token.
- Always sends `credentials: "include"`.
- On `401` (except for `/auth/*` calls): `await refreshOnce()` and retry the request once.
- `refreshOnce()` keeps one promise in flight. It calls `POST /auth/refresh` with `X-StyleSync-CSRF: 1`, stores the new `access_token` and updates the user in the auth context. If that fails, it clears the token and sends the user to `/login?next=…`.
- Errors: FastAPI returns `{ detail: string }` for normal errors and `{ detail: [{ loc, msg, type }] }` for `422`. `ApiError` keeps the status, a readable message, and a field map built from `loc` so forms can show errors under the right field.
- Errors to handle everywhere:
  - `401`: session expired, sign out.
  - `403`: show the message as is (deactivated account, can't comment, not an admin).
  - `404`: not found page.
  - `409`: conflict (username taken, collection not empty).
  - `423`: account locked after repeated failed logins.
  - `429`: rate limit or daily quota reached. Show the `detail` text and refresh the quota badge.
  - `503`: AI is resting (offline mode). Show a banner and offer the manual path.

### 4.2 Auth context (`lib/auth/auth-context.tsx`)
- State: `status: "loading" | "authenticated" | "anonymous"`, `user: UserOut | null`.
- On mount: try `refreshOnce()`. Show a full-page loader until it finishes.
- `login(identifier, password)`, `register(data)`, `logout()`. Logout calls `POST /auth/logout` with the CSRF header, clears the token and the query cache.
- `register` and `login` both return a `TokenOut` (`access_token`, `expires_in`, `user`), so the user is signed in right away after registering.
- Optional: refresh in the background about 1 minute before `expires_in` runs out, so most requests never hit a `401`.

### 4.3 Doll rendering helpers (`components/doll/`)
- `svgToDataUrl(svg)` → `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`.
- `<DollImage svg? imageUrl? alt>`: uses the SVG if there is one, otherwise `image_url`, otherwise a skeleton.
- `<RenderStatus render>`: `pending` → shimmer and "Dressing your doll…"; `failed` → error and a **Re-render** button (`POST /outfits/{id}/render`); `done` → the doll. Show a small "Quick preview" label when `render.method === "layered"` (the free fallback render).
- `useRenderPoll(outfitId)`: polls `GET /outfits/{id}/render` every 2 s (backing off to 5 s) while `status === "pending"`, stops after about 2 min, then refetches the outfit.
- List responses (`GET /outfits`, feed, saved) **leave out `render.svg`**. Use `render.image_url` in cards and load the full outfit (`GET /outfits/{id}`, which includes the SVG) on the detail page.

---

## 5. API reference for the frontend

All paths start with `/api/v1`. 🔒 = needs login · 🔓 = login optional · 👑 = admin only.

### Auth
| Call | Body / params | Returns |
|---|---|---|
| `POST /auth/register` | `{ full_name, username, email, age_range, sex, password, confirm_password }` | `TokenOut` (201) + sets the refresh cookie |
| `POST /auth/login` | `{ identifier, password }` (identifier = email if it contains `@`, otherwise username) | `TokenOut` |
| `POST /auth/refresh` | header `X-StyleSync-CSRF: 1` | `TokenOut` |
| `POST /auth/logout` | header `X-StyleSync-CSRF: 1` | `{ detail }` |
| `POST /auth/forgot-password` | `{ email }` | always 200 |
| `POST /auth/reset-password` | `{ token, password, confirm_password }` | `{ detail }` |
| `POST /auth/verify-email` | `{ token }` | `{ detail }` |
| `POST /auth/resend-verification` 🔒 | — | `{ detail }` |

Validation rules to copy into zod:
- `username`: `^[a-z0-9_.]{3,30}$` (lowercase it before sending).
- `full_name`: 2–80 characters.
- `password`: at least 8 characters, with a letter and a number, at most 128.
- `age_range`: `13-17 | 18-24 | 25-34 | 35-44 | 45-54 | 55+`.
- `sex`: `male | female` (this decides the doll's body type, so explain that on the form).

### Users
| Call | Notes |
|---|---|
| `GET /users/me` 🔒 | `UserOut`: id, full_name, username, email, age_range, sex, role, email_verified, avatar_image_url, follower/following counts, weather_auto_detect, location_city, comment_policy |
| `PATCH /users/me` 🔒 | `{ full_name }` |
| `POST /users/me/change-password` 🔒 | `{ current_password, new_password, confirm_password }` |
| `PUT /users/me/location` 🔒 | `{ lat, lon, city?, source: "browser" \| "ip" \| "manual" }` |
| `DELETE /users/me/location` 🔒 | clear the saved location |
| `PATCH /users/me/settings` 🔒 | `{ weather_auto_detect?, comment_policy?: "everyone" \| "followers" \| "off" }` |
| `GET /users/me/ai-usage` 🔒 | `{ mode: "normal" \| "saver" \| "offline", quotas: { tag, generate, chat, render, avatar: { used, limit, remaining, period: "day" \| "week" } } }` |
| `GET /users/{username}` 🔓 | `PublicProfileOut`: username, full_name (null for teens), avatar_image_url, counts, is_following, follow_pending, is_self |

### Avatar
| Call | Notes |
|---|---|
| `GET /avatar` 🔒 | `AvatarOut`: `status: pending \| ready \| failed`, body_type, features `{ skin_tone, hair_style, hair_color, face_shape, eye_color, build }`, image_url, svg, render_version, error |
| `POST /avatar` 🔒 | multipart: `selfie` (file), `consent` (must be `true`), `keep_selfie` (bool). Returns 202, then poll `GET /avatar` until `status !== "pending"` |
| `PATCH /avatar` 🔒 | `{ hair_color?, skin_tone?, eye_color? }` (6-digit hex, instant, no AI) and `{ hair_style?, face_shape?, build? }` (uses AI when credit allows) |

Every user gets a template doll when they register, so `GET /avatar` always returns something.

### Wardrobe
| Call | Notes |
|---|---|
| `GET /collections` 🔒 | `[{ id, name, category, item_count, created_at }]` |
| `POST /collections` 🔒 | `{ name (1–40), category }`. Category is one of `top, bottom, dress, outerwear, shoes, accessory, bag, headwear, other` |
| `PATCH /collections/{id}` 🔒 | `{ name?, category? }` |
| `DELETE /collections/{id}?cascade=` 🔒 | `409` if it has items and `cascade` isn't true. Ask the user: "Delete the 6 items too?" |
| `POST /items/analyze` 🔒 | multipart `image`. Returns `{ upload_id, image_url, suggestion, notice }`. **Nothing is saved yet.** `suggestion` can be `null` (offline/quota). If `notice` is set, show it (e.g. "doesn't look like clothing") |
| `POST /collections/{id}/items` 🔒 | `{ upload_id, name, primary_color, color_hex?, category?, subcategory?, secondary_colors?, pattern?, material?, formality? (1–5), warmth? (1–5), seasons?, style_tags? }`. The `upload_id` expires after 24 h |
| `GET /items?collection_id=&category=&color=` 🔒 | `ItemOut[]` (includes `image_url`, `cutout_url`, `user_corrected`) |
| `GET /items/{id}` · `PATCH /items/{id}` · `DELETE /items/{id}` 🔒 | `PATCH` also takes `collection_id` to move an item to another collection |

`suggestion` keys (from the vision model): `is_clothing, name, category, subcategory, primary_color, color_hex, secondary_colors, pattern, material, formality, warmth, seasons, style_tags, confidence`.

### Outfits & weather
| Call | Notes |
|---|---|
| `GET /outfits/options` | `{ themes: [{ slug, name, description, icon }], weather: ["hot","warm","mild","cool","cold","rainy","snowy","windy"], time_of_day: ["day","night"] }` |
| `GET /themes` | active themes (same shape) |
| `GET /weather/current?lat=&lon=` 🔒 | `{ weather, temperature_c, time_of_day, city, source, auto_detected }`. Never fails: falls back to `mild`/default with `auto_detected: false` |
| `POST /outfits/generate` 🔒 | `{ theme, weather, temperature_c?, time_of_day }` → `OutfitOut`. `status: ok \| partial \| not_possible`. When the status is **`not_possible`, `id` is `null` and nothing was saved** |
| `POST /outfits` 🔒 | Creation Room save: `{ name?, items: [{ item_id, slot }] (1–10), theme? }` → `OutfitOut` (201), render starts |
| `POST /outfits/preview` 🔒 | `{ items: [{ item_id, slot }] }` → `{ svg, problems: string[] }`. Free, no AI credit, so it's fine to call on every change (debounced) |
| `GET /outfits?source=&limit=&skip=` 🔒 | my outfits (no SVG). `source`: `ai_generated \| creation_room \| chat` |
| `GET /outfits/{id}` 🔓 | full `OutfitOut` with the SVG |
| `GET /outfits/{id}/render` 🔓 | `RenderInfo { status, image_url, svg, method, avatar_render_version, error }` |
| `POST /outfits/{id}/render` 🔒 | re-render on the current doll (useful after avatar changes: compare `render.avatar_render_version` with `avatar.render_version`) |
| `DELETE /outfits/{id}` 🔒 | |

Slots: `top, bottom, dress, outerwear, shoes, headwear, bag, accessory_1, accessory_2, accessory_3`.

`OutfitOut`: `id, status, name, source, items[{ item_id, slot, reason, name, image_url }], context{ theme, weather, temperature_c, time_of_day }, ai_rationale, ai_sources[], tips[], missing_items[{ category, description }], render, is_published, published_at, author{ username, avatar_image_url }, comments_enabled, like_count, save_count, comment_count, liked_by_me, saved_by_me, created_at`.

### Feed & social
| Call | Notes |
|---|---|
| `POST /feed/outfits/{id}/publish` 🔒 | body (optional) `{ comments_enabled? }` |
| `POST /feed/outfits/{id}/unpublish` 🔒 | |
| `GET /feed?theme=&cursor=&limit=` 🔓 | `{ items: OutfitOut[], next_cursor }`. Pass `next_cursor` as-is for the next page |
| `GET /feed/following?cursor=` 🔒 | same shape |
| `POST` / `DELETE /feed/outfits/{id}/save` 🔒 | |
| `GET /feed/saved` 🔒 | `OutfitOut[]` |
| `POST` / `DELETE /social/outfits/{id}/like` 🔒 | |
| `GET /social/outfits/{id}/comments` 🔓 | `[{ id, username, avatar_image_url, text, status, created_at, is_mine }]` |
| `POST /social/outfits/{id}/comments` 🔒 | `{ text (1–500) }`. Can return `403` with a reason (comments off / followers only / blocked). Comments caught by the filter come back with `status: "hidden"`, so say "Your comment is awaiting review" |
| `DELETE /social/comments/{id}` 🔒 | the comment's author or the outfit's author |
| `POST` / `DELETE /social/users/{username}/follow` 🔒 | follow can become a **request** (teen accounts). Re-read the profile afterwards to get `follow_pending` |
| `GET /social/users/{username}/followers` · `/following` 🔓 | `[{ username, avatar_image_url }]` |
| `GET /social/follow-requests` 🔒 | `[{ username, avatar_image_url }]` |
| `POST /social/follow-requests/{username}/approve` · `/decline` 🔒 | |
| `POST` / `DELETE /social/users/{username}/block` 🔒 | |
| `POST /social/reports` 🔒 | `{ target_type: "outfit" \| "comment" \| "user", target_id, reason (3–300) }` |

### Chat
| Call | Notes |
|---|---|
| `POST /chat/sessions` 🔒 | `{ id, title, updated_at }` |
| `GET /chat/sessions` 🔒 | latest 50 |
| `GET /chat/sessions/{id}/messages` 🔒 | `[{ id, role, text, image_urls, outfit_ids, created_at }]` |
| `DELETE /chat/sessions/{id}` 🔒 | |
| `POST /chat/sessions/{id}/messages` 🔒 | multipart `text` (≤2000) and `images` (≤3 files, ≤10 MB each, JPEG/PNG/WebP/HEIC). **Streams SSE** |

SSE events (`event:` line + JSON `data:` line):
- `tool` `{ name }`: show "Searching your wardrobe…" (`search_wardrobe`, `get_item`) or "Putting an outfit together…" (`create_outfit`).
- `outfit` `{ outfit_id }`: insert an `<OutfitCard>` placeholder now and poll its render.
- `delta` `{ text }`: append to the assistant message.
- `done` `{ message_id, outfit_ids, … }`: finish the message, invalidate the sessions list (the title may change) and the quota.
- `error` `{ detail }`: show it in the thread.

Before the stream starts, the request itself can fail with `400`, `429` or `503`. Check `response.ok` before reading the stream.

### Admin 👑 (`/admin`)
| Call | Returns |
|---|---|
| `GET /admin/users?q=&skip=&limit=` | `{ total, items: [{ id, username, email, full_name, age_range, sex, role, is_active, email_verified, created_at, last_login_at, item_count, outfit_count, follower_count }] }` |
| `PATCH /admin/users/{id}` | `{ is_active?, role? }` (admins can't deactivate or demote themselves) |
| `GET /admin/health` | `{ database, storage, ai_gateway, background_tasks_pending, last_24h: { ai_calls, ai_error_rate, render_failures, avg_latency_ms_by_model, cost_usd }, ai_budget }` |
| `GET /admin/stats?days=` | `{ totals: {...}, per_day: { users, outfits, likes, comments, follows, ai_calls: { "YYYY-MM-DD": n } } }` |
| `GET /admin/ai-budget` | `{ cycle_days, budget_usd, spent_usd, remaining_usd, used_fraction, by_model, by_feature, calls, projected_run_out, mode }` |
| `GET` / `PATCH /admin/ai-quotas` | `{ tag, generate, chat, render, avatar_per_week }` |
| `GET /admin/outfits/published` | `OutfitOut[]` |
| `DELETE /admin/outfits/{id}/publish` | take down |
| `GET /admin/reports?status=open\|resolved` · `PATCH /admin/reports/{id}` `{ note? }` | moderation queue |
| `PATCH /admin/comments/{id}` | `{ status: "visible" \| "hidden" \| "removed" }` |
| `GET /admin/themes` · `POST /admin/themes` · `PATCH /admin/themes/{id}` | `{ slug, name, description, styling_rules, icon, sort_order, is_active }` |

---

## 6. Screens

### 6.1 Register / Login
- **Register:** full name, username (lowercase as they type, and show the allowed characters), email, age range (select), sex (two big cards, Male / Female, with a doll silhouette and the note "Your doll's body type"), password with a strength hint, confirm password. Map `409` to the username or email field.
- **Login:** a single "Email or username" field and a password field. `423` → "Account locked, try again in a few minutes". Link to forgot password.
- After registering, send the user to `/avatar?onboarding=1`, then `/wardrobe`.
- Show a dismissible banner when `email_verified` is false, with a **Resend** button.

### 6.2 Avatar (`/avatar`)
- Left: the large doll (`svg`). Right: the controls.
- **Create from selfie:** camera/file input, consent checkbox (required, explains the photo is used only to draw the doll and is deleted unless "keep" is ticked). Submit, then poll `GET /avatar` until it's ready. If it `failed`, show `error` and keep the current doll.
- **Edit:** hair, skin and eye color pickers (a preset palette plus a custom hex input). Hair style, face shape and build as selects. Debounce color changes by about 300 ms before `PATCH`. Hair style and face changes use AI, so they need an explicit **Apply** button and a loading state.
- Show the weekly avatar quota (`quotas.avatar`).
- After the avatar changes, outfits rendered with an older `render_version` show a "Re-render on your new doll" prompt.

### 6.3 Wardrobe (`/wardrobe`, `/wardrobe/[collectionId]`)
- A grid of collections (name, category icon, item count) and a **New collection** dialog (name + category). Suggest presets on an empty wardrobe: Tops, Trousers, Dresses, Outerwear, Shoes, Accessories, Bags, Headwear.
- Collection page: item grid, filters (category, color search), and an **Add item** button.
- **Add item dialog (two steps):**
  1. Drop or capture a photo, show it, call `/items/analyze` with the spinner text "Scanning your item…".
  2. A form prefilled from `suggestion`: name, primary color (text + swatch from `color_hex`), category (defaults to the collection's), and an "More details" section (pattern, material, formality 1–5, warmth 1–5, seasons, style tags). Fields the AI filled get a small "AI" tag that disappears once the user edits them. If `suggestion` is null, the form is blank and shows "Fill in the details". Save calls `POST /collections/{id}/items`.
- Item detail drawer: edit fields, move to another collection, delete.
- Delete collection: confirm, and if it gets a `409`, offer "Delete with all items" (`cascade=true`).

### 6.4 Generate (`/generate`)
- **Selectors:** theme cards (from `/outfits/options`), weather chips, a temperature field, and a Day/Night toggle.
- **Auto-detect:** on load, if `user.weather_auto_detect` is on, ask for browser geolocation, then call `/weather/current?lat&lon` (or without coordinates if the user says no; the backend falls back to the saved location and then IP). Prefill the selectors and show the label "Auto-detected · {city}, {temp}°C". Changing any value removes the label. Offer "Save this location" (`PUT /users/me/location`).
- Empty-wardrobe guard: if there are no items, show a call to add clothes instead of the form.
- **Result:**
  - `ok`: doll render (poll), the item list with each `reason`, `ai_rationale`, `tips`, and `ai_sources` as links. Actions: Publish, Open in Creation Room, Regenerate.
  - `partial`: same, plus a **"Not in your wardrobe"** panel listing `missing_items`.
  - `not_possible`: no doll, the missing items, and a link to the wardrobe. Nothing was saved, so there are no actions.
- Show the remaining generations (`quotas.generate.remaining`). Disable the button at 0, and show a banner when `mode` is `saver` or `offline`.

### 6.5 Creation Room (`/creation-room`)
- Layout: **doll in the middle** (`<DollStage>`), **wardrobe panel** on the side (on mobile, a bottom sheet with collection tabs), and the **slot list** on the other side: top, bottom, dress, outerwear, shoes, headwear, bag, accessory 1–3.
- Drag an item onto the doll or a slot, or tap an item to drop it into the slot that fits its category. Accessories fill accessory_1 → 2 → 3. Picking a dress clears the bottom, and picking a bottom clears the dress. A top over a dress is allowed. This is the same rule the backend uses (`services/outfit_service.py`).
- Every change calls `POST /outfits/preview` (debounced about 400 ms, keeping the previous render on screen) and shows the returned `svg`. Show `problems[]` as inline warnings.
- **Hair color** swatch row right on the stage (calls `PATCH /avatar`, instant, then refreshes the preview).
- **Save:** name and optional theme, then `POST /outfits`, then go to `/outfits/{id}` (the full render polls there). Then offer **Publish**.
- `?outfit={id}` loads an existing outfit's items to edit as a new one.

### 6.6 My outfits (`/outfits`, `/outfits/[id]`)
- Grid with tabs All / AI / Creation Room / Chat (`source`), paged with `skip`/`limit`. Cards show `render.image_url`, a status badge and a published badge.
- Detail page: the doll, the items (link to each item), context chips (theme, weather, time of day), rationale, tips, sources, missing items. Owner actions: publish/unpublish (with a "Allow comments" toggle), re-render, open in Creation Room, delete. For other people's published outfits: author header, like, save, comments, report.

### 6.7 Feed (`/feed`, `/saved`, `/u/[username]`)
- Tabs **For you** / **Following**, a theme filter (chips), infinite scroll with `useInfiniteQuery` on `next_cursor`.
- Card: the author's avatar and username (links to `/u/…`), the doll render, theme chip, like/save/comment counts. Like and save update the screen at once and roll back on error.
- Comments sheet: list, add (≤500 characters with a counter), delete own comments, report. Show the `403` reason when comments are closed.
- Public profile: avatar, username, full name (when not hidden), counts, a Follow / Requested / Following button, block and report in a menu, and followers/following lists. **The backend has no endpoint for a user's published outfits yet** (see §8).
- Profile → **Follow requests** section when there are pending requests (approve/decline).

### 6.8 AI chat (`/chat`, `/chat/[sessionId]`)
- Left: the session list (new chat, delete). Right: the thread.
- Composer: textarea, attach up to 3 photos with thumbnails, send. Starter prompts: "Recreate this look from my wardrobe" (with a photo), "What goes with my navy chinos?", "Tips for a beach wedding".
- Streaming: add the user's message to the thread straight away, then create an assistant bubble and fill it from `delta`. Show `tool` events as a status line. Every `outfit` event adds an `<OutfitCard>` that polls its render and links to `/outfits/{id}`.
- History: `GET /…/messages`. Each `outfit_ids` entry becomes an `<OutfitCard>` (fetched with `GET /outfits/{id}`).
- Make the "not available in your wardrobe" answers easy to spot (the AI writes them as plain text, so no special handling is needed beyond markdown rendering with `react-markdown`).
- Disable sending when `quotas.chat.remaining === 0` or `mode === "offline"`.

### 6.9 Profile (`/profile`)
- Avatar thumbnail (→ `/avatar`), username, email (+ verified badge or resend), full name (editable).
- Change password form.
- Settings: weather auto-detect toggle, saved location (city + clear), comment policy (everyone / followers / off).
- AI usage card: one meter per feature (used/limit, "resets daily" or "resets weekly") and the current mode.
- Log out.

### 6.10 Admin (`/admin`)
- **Dashboard:** health tiles (database, storage, AI gateway, pending tasks, AI error rate, render failures, 24 h cost), latency by model, and stats charts (`per_day` series, 7/30/90-day switch). Load the `dataviz` guidance before building the charts.
- **Users:** searchable table (q), pagination, activate/deactivate, make or remove admin.
- **Published outfits:** grid with **Take down**.
- **Reports:** open/resolved tabs. Each row links to its target and has resolve (+ note). A comment target gets hide/remove/restore buttons (`PATCH /admin/comments/{id}`).
- **Themes:** table (including inactive), add/edit dialog (slug, name, description, styling rules, icon, order, active). Drag to reorder, which writes `sort_order`.
- **AI:** budget meter (`used_fraction`), spend by model and by feature, projected run-out date, mode badge, and the quota editor form.

---

## 7. Phased delivery

| Phase | Scope | Done when |
|---|---|---|
| **0. Foundation** | Rewrites proxy, env, shadcn/ui setup, TanStack Query, `openapi-typescript` script (`bun run gen:api`), API client with refresh + retry, `ApiError`, app shell (desktop sidebar, mobile bottom nav), light/dark theme tokens, ESLint or Biome | `bun run gen:api` produces types. A test page can call `/outfits/options` through the proxy |
| **1. Auth & profile** | Register, login, logout, session restore, forgot/reset/verify pages, route guards, profile page, change password, settings, quota badge | A new user can register, refresh the page and stay signed in, log out, reset a password from the email link |
| **2. Avatar** | `<DollImage>`, avatar page, selfie upload + polling, color/feature edits, onboarding step | A user can turn a selfie into a doll and change the hair color instantly |
| **3. Wardrobe** | Collections CRUD, add-item flow with AI autofill and correction, item edit/move/delete, filters | Upload a shirt → "Navy oxford shirt" is prefilled → edit → saved in the right collection |
| **4. Generate** | Options, geolocation + weather prefill, generator form, render polling, result states (ok/partial/not_possible), missing items, sources | An outfit made only from owned items appears on the doll, and missing pieces are listed |
| **5. Creation Room** | Stage, wardrobe panel, slot logic, dnd-kit + tap-to-place, debounced preview, hair color on stage, save | Pick items → see them on the doll → save → it appears in My outfits |
| **6. Outfits, feed & social** | My outfits + detail, publish/unpublish, feed tabs + infinite scroll, like/save/comments, public profiles, follow/requests/block/report, saved page | A published outfit shows the username + avatar. Another user can like, save, comment and follow |
| **7. AI chat** | Sessions, composer with photos, SSE client, tool/outfit/delta/done/error handling, outfit cards in the thread, history | "Recreate this look" streams an answer and shows an owned-items outfit on the doll, or "not available in your wardrobe" |
| **8. Admin** | Admin guard, dashboard + charts, users, published outfits, reports + comment moderation, themes, AI budget + quotas | An admin can see users and health, take down an outfit, and add a theme that shows up in the generator right away |
| **9. Polish** | Empty, loading and error states everywhere, accessibility pass (keyboard drag and drop, focus, contrast), mobile layout check, `next/image` for remote images (`images.remotePatterns` for `res.cloudinary.com`), metadata/OG images for public outfit pages | Lighthouse a11y ≥ 95, usable at 360 px wide |

---

## 8. Backend gaps found while planning

These block or weaken frontend features. Fix them in `StyleSync-BD` or work around them as noted.

1. ~~**No way to list a user's published outfits.**~~ **Done:** `GET /feed?author=<username>` (cursor-paged, respects blocks, 404 for unknown users), covered by `test_feed_filtered_by_author_for_profiles`.
2. **No "popular" sort on the feed.** The design doc mentions newest/popular, but `/feed` is newest only. Add `sort=popular` (by `like_count + save_count` in a recent window) if the "For you" tab should rank.
3. **Untyped responses.** `/users/me/ai-usage`, the admin endpoints, the followers/following lists and `/outfits/preview` return plain `dict`s, so the OpenAPI schema has no shape for them. Adding `response_model`s would let `openapi-typescript` cover everything.
4. **Chat history only returns `outfit_ids`.** The frontend has to make one `GET /outfits/{id}` per outfit. Fine for now. Returning small outfit summaries with the messages would save requests.
5. **The generate rate limit is 5 per minute** on top of the daily quota. The UI should disable the button while a request is in flight and show the `429` message.
6. **Production cookies.** With the rewrite proxy, nothing extra is needed. If the frontend ever calls the API on a different site directly, the refresh cookie needs `SameSite=None; Secure` and `CORS` `extra_cors_origins` must include the frontend.

---

## 9. Testing

- **Unit (Vitest + Testing Library):** API client refresh/retry and single-flight, the SSE parser (split chunks, several events in one chunk), zod schemas, Creation Room slot rules, `svgToDataUrl`.
- **API mocking:** MSW handlers built from the generated types, so components can be tested without the backend.
- **E2E (Playwright)** against a local backend running in offline AI mode (no `AI_GATEWAY_API_KEY`, so it costs no credit): register → avatar → add item (manual entry) → Creation Room save → publish → second user likes and comments → admin takes it down.
- **Contract:** run `bun run gen:api` in CI and fail if `schema.d.ts` changes without being committed, so frontend and backend stay in sync.

---

## 10. Running locally

```bash
# backend (in ../StyleSync-BD)
uvicorn app.main:app --reload            # http://localhost:8000, docs at /docs

# frontend (this repo)
bun install
bun run gen:api                          # openapi-typescript http://localhost:8000/openapi.json -o src/lib/api/schema.d.ts
bun dev                                  # http://localhost:3000
```
