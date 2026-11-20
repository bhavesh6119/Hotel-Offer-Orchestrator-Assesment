# Hotel Offer Orchestrator

A backend service that orchestrates hotel offer aggregation from multiple suppliers using **Temporal.io** workflows, **Redis** caching, and **Express 5** (TypeScript).

## Architecture

```
Client
  │
  ▼
Express API (/api/hotels?city=delhi)
  │
  ├── Cache hit? ──► Return from Redis
  │
  └── Cache miss
        │
        ▼
   Temporal Workflow (hotelOfferWorkflow)
        │
        ├── Activity: fetchSupplierAOffers  ─────┐
        └── Activity: fetchSupplierBOffers  ─────┤ (parallel)
                                                 ▼
                                      mergeOffers() [pure fn]
                                      dedupe by name, keep cheaper
                                                 │
                                        Activity: saveOffersToCache
                                                 │
                                                 ▼
                                            Redis (city key)
```

## Prerequisites

- Node.js ≥ 22
- Docker & Docker Compose

## Quick Start

### 1. Clone & configure

```bash
cd Backend
cp .env.example .env
# Edit .env if needed (defaults work for Docker Compose)
```

### 2. Start infrastructure

```bash
docker compose up redis temporal temporal-ui -d
```

### 3. Install dependencies & start

```bash
cd Backend
npm install
npm run dev        # Express server on :3000
# In a second terminal:
npm run worker:dev # Temporal worker
```

### 4. Using Docker Compose (full stack)

```bash
docker compose up --build
```

## API Reference

### `GET /api/hotels?city=<city>`

Fetches deduplicated hotel offers for a city. Triggers a Temporal workflow on first request; subsequent requests within the TTL are served from Redis.

**Response (200)**
```json
[
  {
    "name": "The Grand Palace",
    "price": 4200,
    "supplier": "Supplier B",
    "commissionPct": 11
  }
]
```

### `GET /api/hotels?city=<city>&minPrice=X&maxPrice=Y`

Same as above, but filters by price range **inside Redis** (not in JS after the fact).

### `GET /supplierA/hotels`

Mock Supplier A endpoint. Returns 7 raw hotel offers.

### `GET /supplierB/hotels`

Mock Supplier B endpoint. Returns 7 raw hotel offers (3 overlap with Supplier A, with different prices).

### `GET /health`

Returns health of all subsystems.

**Response (200 — all healthy)**
```json
{
  "status": "ok",
  "redis": { "status": "ok" },
  "temporal": { "status": "ok" },
  "supplierA": { "status": "ok", "latencyMs": 2 },
  "supplierB": { "status": "ok", "latencyMs": 1 },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## Deduplication Logic

Hotels from both suppliers are merged using the `mergeOffers()` pure function (`src/utils/mergeOffers.ts`):
- Names are normalised (lowercase, trimmed, collapsed whitespace).
- When the same hotel name appears in both suppliers, the **cheaper offer** is kept.

**Example:**
| Name | Supplier A | Supplier B | Winner |
|------|-----------|-----------|--------|
| The Grand Palace | ₹4500 | ₹4200 | Supplier B |
| Blue Horizon Inn | ₹2200 | ₹2500 | Supplier A |
| Metro Luxe Hotel | ₹5200 | ₹4900 | Supplier B |

## Project Structure

```
hotel-offer-orchestrator/
├── Backend/
│   ├── server.ts                  # Entry point
│   ├── src/
│   │   ├── app.ts                 # Express setup
│   │   ├── config/                # env, redis, temporal, logger
│   │   ├── routes/                # hotel, supplier, health
│   │   ├── controllers/           # thin controllers
│   │   ├── services/              # business logic
│   │   ├── middleware/            # validate, error, requestLogger
│   │   ├── mocks/                 # supplier mock data
│   │   ├── temporal/
│   │   │   ├── activities/        # supplier + cache activities
│   │   │   ├── workflows/         # hotelOffer workflow
│   │   │   ├── client.ts
│   │   │   └── worker.ts
│   │   ├── utils/                 # normalizeName, mergeOffers
│   │   └── types/                 # hotel.types.ts
│   ├── Dockerfile
│   ├── package.json
│   ├── tsconfig.json
│   └── .env.example
├── postman/
├── docker-compose.yml
└── README.md
```

## Temporal UI

Accessible at http://localhost:8080 when running Docker Compose.

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3000` | HTTP server port |
| `REDIS_URL` | — | Redis connection URL |
| `TEMPORAL_ADDRESS` | — | Temporal server address |
| `TEMPORAL_NAMESPACE` | `default` | Temporal namespace |
| `TEMPORAL_TASK_QUEUE` | `hotel-offers` | Worker task queue name |
| `SUPPLIER_A_URL` | — | Supplier A mock endpoint URL |
| `SUPPLIER_B_URL` | — | Supplier B mock endpoint URL |
| `LOG_LEVEL` | `info` | Pino log level |
| `CACHE_TTL_SECONDS` | `300` | Redis cache TTL |
