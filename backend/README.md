Prerequisites:

- [Vercel CLI](https://vercel.com/docs/cli) installed globally

## Environment Variables

Create a `.env` file in the backend directory with the following variables:

```bash
# AI Gateway API Key (for quiz generation)
AI_GATEWAY_API_KEY=your_gateway_api_key

# Upstash Redis (for caching quizzes and Farcaster mappings)
UPSTASH_REDIS_REST_URL=your_redis_url
UPSTASH_REDIS_REST_TOKEN=your_redis_token

# Neynar API Key (for Farcaster profile lookups)
# Get your free API key at https://neynar.com
NEYNAR_API_KEY=your_neynar_api_key

# Self Protocol (for identity verification)
SELF_SCOPE=realmind-celo

# Optional: Cron job secret for automated daily quiz generation
CRON_SECRET=your_cron_secret
```

To develop locally:

```
npm install
vc dev
```

```
open http://localhost:3000
```

To build locally:

```
npm install
vc build
```

To deploy:

```
npm install
vc deploy
```
