#!/usr/bin/env bash
# Deploy the magic-link HTTPS bridge and update Supabase redirect URLs.
# Requires SUPABASE_ACCESS_TOKEN in .env.local (never commit).
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
BRIDGE_URL="https://${PROJECT_REF}.supabase.co/functions/v1/auth-callback"

export SUPABASE_ACCESS_TOKEN

echo "→ Linking project ${PROJECT_REF}…"
npx supabase link --project-ref "$PROJECT_REF"

echo "→ Deploying auth-callback edge function…"
npx supabase functions deploy auth-callback --no-verify-jwt

echo "→ Updating redirect URL allowlist…"
CURRENT="$(curl -sS -H "Authorization: Bearer ${SUPABASE_ACCESS_TOKEN}" \
  "https://api.supabase.com/v1/projects/${PROJECT_REF}/config/auth")"

UPDATED="$(python3 - "$CURRENT" "$BRIDGE_URL" <<'PY'
import json, sys

config = json.loads(sys.argv[1])
bridge = sys.argv[2]
existing = [u.strip() for u in config.get("uri_allow_list", "").split(",") if u.strip()]
required = [bridge, "actapp://**", "exp://**"]
merged = existing[:]
for url in required:
    if url not in merged:
        merged.append(url)
print(json.dumps({"uri_allow_list": ",".join(merged)}))
PY
)"

curl -sS -X PATCH \
  -H "Authorization: Bearer ${SUPABASE_ACCESS_TOKEN}" \
  -H "Content-Type: application/json" \
  -d "$UPDATED" \
  "https://api.supabase.com/v1/projects/${PROJECT_REF}/config/auth" \
  | python3 -c "import sys,json; d=json.load(sys.stdin); print('Redirect URLs:', d.get('uri_allow_list','(updated)'))"

echo "✓ Done. Bridge URL: ${BRIDGE_URL}"
echo "  Request a new magic link — old emails still use the previous redirect."
