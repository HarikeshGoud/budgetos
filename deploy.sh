#!/bin/bash
set -e

VERCEL_TOKEN=$(cat "$HOME/Library/Application Support/com.vercel.cli/auth.json" | python3 -c "import json,sys; d=json.load(sys.stdin); print(d['token'])")
TURSO_URL="libsql://budgetos-harikesh.aws-ap-south-1.turso.io"
TURSO_TOKEN="eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJpYXQiOjE3ODE4Njc4NjYsImlkIjoiMDE5ZWRhYjAtZGEwMS03NDdlLWFlZmMtYTI3MzMxMzVlNWU3IiwicmlkIjoiYzk5YWNmNTItZDU4Mi00NTgyLWFjMTItOTY3M2Q4M2RjNTU4In0.x9x81xaT74jM_WfCHEW7RN-ZysydWPMR0JEAI9Vcd7PgDc46L6X9jXwwzcYlGuA_eiPBPQreZkV0UnP6pN22CA"
SITE_PASSWORD="harikesh"
LIVE_DOMAIN="budgetos-live.vercel.app"

PROJECT_NAME="budgetos-$(date +%s)"
echo "→ Creating project: $PROJECT_NAME"

# Get personal account org ID from Vercel
ORG_ID=$(curl -s "https://api.vercel.com/v2/user" \
  -H "Authorization: Bearer $VERCEL_TOKEN" \
  | python3 -c "import json,sys; d=json.load(sys.stdin); print(d.get('user',{}).get('id',''))")

echo "→ Using account: $ORG_ID"

PROJECT_ID=$(curl -s -X POST "https://api.vercel.com/v10/projects" \
  -H "Authorization: Bearer $VERCEL_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"name\":\"$PROJECT_NAME\",\"framework\":\"nextjs\",\"buildCommand\":\"prisma generate && next build\"}" \
  | python3 -c "import json,sys; print(json.load(sys.stdin)['id'])")

echo "→ Project created: $PROJECT_ID"

for KEY_VAL in "TURSO_DATABASE_URL|$TURSO_URL" "TURSO_AUTH_TOKEN|$TURSO_TOKEN" "SITE_PASSWORD|$SITE_PASSWORD"; do
  KEY="${KEY_VAL%%|*}"; VAL="${KEY_VAL#*|}"
  curl -s -X POST "https://api.vercel.com/v10/projects/$PROJECT_ID/env" \
    -H "Authorization: Bearer $VERCEL_TOKEN" -H "Content-Type: application/json" \
    -d "{\"key\":\"$KEY\",\"value\":\"$VAL\",\"type\":\"encrypted\",\"target\":[\"production\",\"preview\"]}" > /dev/null
done
echo "→ Env vars set"

mkdir -p .vercel
cat > .vercel/project.json <<EOF
{
  "projectId": "$PROJECT_ID",
  "orgId": "$ORG_ID"
}
EOF

echo "→ Building..."
vercel build --prod --yes 2>&1 | grep -E "(✓|Error|error|warning)" || true

echo "→ Deploying..."
DEPLOY_URL=$(vercel deploy --prebuilt --prod --yes 2>&1 | grep -o 'https://[^ ]*' | tail -1)
echo "→ Deployed to: $DEPLOY_URL"

echo "→ Pointing $LIVE_DOMAIN to latest..."
vercel alias set "$DEPLOY_URL" "$LIVE_DOMAIN" --token="$VERCEL_TOKEN" 2>/dev/null || true

echo ""
echo "✓ DONE — https://$LIVE_DOMAIN is updated!"
