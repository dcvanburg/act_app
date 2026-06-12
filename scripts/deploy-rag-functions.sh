#!/usr/bin/env bash
# Deploy the RAG chatbot search Edge Function.
# Requires SUPABASE_ACCESS_TOKEN in .env.local (never commit).
#
# Before running, confirm the following secrets are set in Supabase:
#   Dashboard → Project Settings → Edge Functions → Secrets
#     ANTHROPIC_API_KEY
#     VOYAGE_API_KEY
#
# Pre-pilot reminder (ADR-005, docs/SECURITY.md → AI processing):
#   • Anthropic DPA + zero-data-retention agreement signed
#   • Voyage AI DPA signed
#   • Privacy policy lists both processors
# Deploying the function is technically possible without these — but
# do not let pilot users invoke it until they are in place.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if [[ -f .env.local ]]; then
  set -a
  # shellcheck disable=SC1091
  source .env.local
  set +a
fi

if [[ -z "${SUPABASE_ACCESS_TOKEN:-}" ]]; then
  echo "Missing SUPABASE_ACCESS_TOKEN in .env.local" >&2
  echo "Create one at https://supabase.com/dashboard/account/tokens" >&2
  exit 1
fi

PROJECT_REF="${SUPABASE_PROJECT_REF:-atscybinltwlaaucthsl}"
SEARCH_URL="https://${PROJECT_REF}.supabase.co/functions/v1/search"

export SUPABASE_ACCESS_TOKEN

echo "→ Linking project ${PROJECT_REF}…"
npx supabase link --project-ref "$PROJECT_REF"

echo "→ Deploying search edge function…"
# JWT verification stays ON — anonymous chat is rejected (ADR-005).
npx supabase functions deploy search

echo "✓ Done. Search URL: ${SEARCH_URL}"
echo "  Test with:"
echo "  curl -X POST '${SEARCH_URL}' \\"
echo "    -H \"Authorization: Bearer <user-jwt>\" \\"
echo "    -H 'Content-Type: application/json' \\"
echo "    -d '{\"question\": \"Wat is acceptatie?\"}'"
