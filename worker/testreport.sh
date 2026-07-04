#!/usr/bin/env bash
#
# End-to-end smoke test for the Sluice triage Worker.
# Reads APP_KEY / ADMIN_KEY (and optional BASE_URL) from .env.
#
# Usage:
#   ./testreport.sh                      # test BASE_URL from .env
#   ./testreport.sh http://127.0.0.1:8787   # test a local `wrangler dev`
#   ./testreport.sh --promote            # also create a REAL issue on your repo
#
# For a REMOTE test, .env must hold the SAME keys you set via
# `wrangler secret put` (not the dev placeholders). .env is gitignored.

set -o pipefail

cd "$(dirname "$0")" || exit 1

if [[ ! -f .env ]]; then
  echo "✗ .env not found. Copy .env.example to .env and fill it in." >&2
  exit 1
fi

# Pull a KEY="value" (or KEY=value) entry out of .env.
getvar() {
  grep -E "^$1=" .env | head -1 | sed -E "s/^$1=//; s/^\"(.*)\"$/\1/"
}

# Parse args: --promote flag, first non-flag arg = BASE URL.
PROMOTE=0
BASE=""
for a in "$@"; do
  case "$a" in
    --promote) PROMOTE=1 ;;
    *) [[ -z "$BASE" ]] && BASE="$a" ;;
  esac
done

APP_KEY="$(getvar APP_KEY)"
ADMIN_KEY="$(getvar ADMIN_KEY)"
[[ -z "$BASE" ]] && BASE="$(getvar BASE_URL)"
BASE="${BASE%/}"  # strip trailing slash

if [[ -z "$BASE" ]]; then
  echo "✗ No base URL. Set BASE_URL in .env or pass one: ./testreport.sh https://<worker>" >&2
  exit 1
fi
if [[ -z "$APP_KEY" || -z "$ADMIN_KEY" ]]; then
  echo "✗ APP_KEY / ADMIN_KEY missing from .env" >&2
  exit 1
fi

# Warn if using dev placeholders against a remote URL (they won't match secrets).
if [[ "$BASE" == *"workers.dev"* && "$APP_KEY" == *"change-me"* ]]; then
  echo "⚠  .env still has placeholder keys but BASE is remote — expect 401s."
  echo "   Put your real wrangler secrets in .env, or pass a local URL."
  echo
fi

echo "Testing: $BASE"
echo

FAILED=0
ok()  { echo "  ✓ $1"; }
bad() { echo "  ✗ $1  ($2)"; FAILED=$((FAILED + 1)); }

code() { curl -sS -o /dev/null -w '%{http_code}' "$@"; }

RID="$(uuidgen)"
printf 'test log line\n' | gzip > /tmp/sluice-testlog.gz

# 1. liveness
if curl -sS "$BASE/" | grep -qi "sluice"; then ok "liveness"; else bad "liveness" "no banner"; fi

# 2. wrong app key -> 401
c=$(code -X POST "$BASE/report" -H "X-Report-Key: wrong" -F "reportId=$RID")
[[ "$c" == "401" ]] && ok "wrong app key rejected" || bad "wrong app key rejected" "got $c"

# 3. unauthed admin -> 401
c=$(code "$BASE/admin/reports")
[[ "$c" == "401" ]] && ok "unauthed admin rejected" || bad "unauthed admin rejected" "got $c"

# 4. ingest (with metadata + one attachment)
body=$(curl -sS -X POST "$BASE/report" -H "X-Report-Key: $APP_KEY" \
  -F "reportId=$RID" -F "installationId=smoke-test" -F "category=bug" \
  -F "summary=Smoke test $RID" -F "description=End-to-end check." -F "email=you@example.com" \
  -F "appVersion=2.1.0 (210)" -F "osVersion=macOS 14.5" \
  -F 'metadata={"app":{"name":"ExampleApp","version":"2.1.0 (210)"},"device":{"os":"macOS 14.5"}}' \
  -F "attachment=@/tmp/sluice-testlog.gz;type=application/gzip")
echo "$body" | grep -q '"ok":true' && ok "ingest" || bad "ingest" "$body"

# 5. duplicate ingest -> duplicate:true
body=$(curl -sS -X POST "$BASE/report" -H "X-Report-Key: $APP_KEY" \
  -F "reportId=$RID" -F "installationId=smoke-test" -F "category=bug" \
  -F "summary=dup" -F "description=dup" -F "email=you@example.com" \
  -F "appVersion=2.1.0 (210)" -F "osVersion=macOS 14.5")
echo "$body" | grep -q '"duplicate":true' && ok "idempotency" || bad "idempotency" "$body"

# 6. admin list contains our report
body=$(curl -sS "$BASE/admin/reports?status=new" -H "Authorization: Bearer $ADMIN_KEY")
echo "$body" | grep -q "$RID" && ok "admin list" || bad "admin list" "$body"

# 7. detail has description + an attachment
body=$(curl -sS "$BASE/admin/reports/$RID" -H "Authorization: Bearer $ADMIN_KEY")
echo "$body" | grep -q "End-to-end check" && ok "detail" || bad "detail" "$body"
AID=$(echo "$body" | sed -E 's/.*"attachments":\[\{"id":"([^"]+)".*/\1/')
[[ -n "$AID" && "$AID" != "$body" ]] && ok "attachment listed" || bad "attachment listed" "no attachment id"

# 8. attachment download (gzipped bytes -> original text)
if [[ -n "$AID" && "$AID" != "$body" ]]; then
  out=$(curl -sS "$BASE/admin/reports/$RID/attachments/$AID" -H "Authorization: Bearer $ADMIN_KEY" | gunzip -c 2>/dev/null)
  [[ "$out" == "test log line" ]] && ok "attachment download" || bad "attachment download" "got '$out'"
fi

# 8b. per-report delete (uses a distinct installation id / report)
RID2="$(uuidgen)"
curl -sS -o /dev/null -X POST "$BASE/report" -H "X-Report-Key: $APP_KEY" \
  -F "reportId=$RID2" -F "installationId=smoke-delete" -F "category=bug" \
  -F "summary=delete me" -F "description=delete me" -F "email=you@example.com" \
  -F "appVersion=2.1.0 (210)" -F "osVersion=macOS 14.5"
dc=$(code -X DELETE "$BASE/admin/reports/$RID2" -H "Authorization: Bearer $ADMIN_KEY")
[[ "$dc" == "200" ]] && ok "delete report" || bad "delete report" "got $dc"
gone=$(curl -sS "$BASE/admin/reports/$RID2" -H "Authorization: Bearer $ADMIN_KEY")
echo "$gone" | grep -q '"not_found"' && ok "deleted report gone" || bad "deleted report gone" "$gone"

# 9. optional promote (creates a REAL issue on your GITHUB_OWNER/GITHUB_REPO)
if [[ "$PROMOTE" == "1" ]]; then
  echo
  echo "⚠  Promoting — this creates an issue on your configured repo."
  body=$(curl -sS -X POST "$BASE/admin/reports/$RID/promote" -H "Authorization: Bearer $ADMIN_KEY" \
    -H "Content-Type: application/json" -d '{"title":"[sluice smoke test] please close","labels":["bug"]}')
  url=$(echo "$body" | sed -E 's/.*"issue":"([^"]*)".*/\1/')
  echo "$body" | grep -q '"ok":true' && ok "promote -> $url" || bad "promote" "$body"
  echo "   Remember to close that issue. Leaving the report un-pruned so you can inspect it."
  echo
  echo "Failures: $FAILED"
  exit $((FAILED > 0 ? 1 : 0))
fi

# 10. prune preview
body=$(curl -sS "$BASE/admin/reports/prune?window=all" -H "Authorization: Bearer $ADMIN_KEY")
echo "$body" | grep -qE '"count":[1-9]' && ok "prune preview" || bad "prune preview" "$body"

# 11. prune execute (cleanup)
body=$(curl -sS -X POST "$BASE/admin/reports/prune" -H "Authorization: Bearer $ADMIN_KEY" \
  -H "Content-Type: application/json" -d '{"window":"all"}')
echo "$body" | grep -qE '"deleted":[1-9]' && ok "prune execute (cleanup)" || bad "prune execute (cleanup)" "$body"

# 12. our report is gone
body=$(curl -sS "$BASE/admin/reports/$RID" -H "Authorization: Bearer $ADMIN_KEY")
echo "$body" | grep -q '"not_found"' && ok "report deleted" || bad "report deleted" "$body"

echo
if [[ "$FAILED" -eq 0 ]]; then echo "All checks passed."; else echo "$FAILED check(s) failed."; fi
exit $((FAILED > 0 ? 1 : 0))
