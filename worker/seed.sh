#!/usr/bin/env bash
#
# Clears all reports and seeds a few varied samples (with app/OS versions +
# attachments) so the triage UI has something to show. Reads creds from .env,
# same as testreport.sh.
#
#   ./seed.sh                       # seed against BASE_URL from .env
#   ./seed.sh http://127.0.0.1:8787 # seed a local `wrangler dev`

set -o pipefail
cd "$(dirname "$0")" || exit 1

getvar() { grep -E "^$1=" .env | head -1 | sed -E "s/^$1=//; s/^\"(.*)\"$/\1/"; }
APP="$(getvar APP_KEY)"; ADMIN="$(getvar ADMIN_KEY)"
BASE="${1:-$(getvar BASE_URL)}"
BASE="${BASE%/}"
if [[ -z "$BASE" ]]; then
  echo "✗ No base URL. Set BASE_URL in .env or pass one: ./seed.sh https://<worker>" >&2
  exit 1
fi

printf 'INFO app launched v2.1.0\nINFO task started id=42\nERROR worker stalled at 0x1f after 30s\n' | gzip > /tmp/sluice-seed.log.gz

# Clear existing reports first.
echo "clearing existing reports..."
curl -sS -X POST "$BASE/admin/reports/prune" -H "Authorization: Bearer $ADMIN" \
  -H "Content-Type: application/json" -d '{"window":"all"}' >/dev/null

seed() {
  curl -sS -o /dev/null -w "%{http_code} " -X POST "$BASE/report" -H "X-Report-Key: $APP" "$@"
}

echo -n "seeding (codes): "
seed -F "reportId=$(uuidgen)" -F "installationId=demo-01" -F "category=bug" \
  -F "summary=Export stops after ~30s on large files" \
  -F "description=Start any large export, wait ~30s, it halts while the UI still shows progress." \
  -F "email=aria@example.com" -F "appVersion=2.1.0 (210)" -F "osVersion=macOS 14.5 (23F79)" \
  -F 'metadata={"app":{"name":"ExampleApp","version":"2.1.0 (210)"},"device":{"os":"macOS 14.5","memory":"16 GB"}}' \
  -F "attachment=@/tmp/sluice-seed.log.gz;type=application/gzip"

seed -F "reportId=$(uuidgen)" -F "installationId=demo-02" -F "category=feature" \
  -F "summary=Add a dark mode" \
  -F "description=Would love a configurable dark theme in settings." \
  -F "email=devin@example.com" -F "appVersion=2.1.0 (210)" -F "osVersion=Windows 11 (23H2)" \
  -F 'metadata={"app":{"name":"ExampleApp","version":"2.1.0 (210)"},"device":{"os":"Windows 11"}}'

seed -F "reportId=$(uuidgen)" -F "installationId=demo-03" -F "category=crash" \
  -F "summary=Crash when opening a very large project" \
  -F "description=App hangs then quits while loading a large project." \
  -F "email=sam@example.com" -F "appVersion=2.0.3 (203)" -F "osVersion=Ubuntu 24.04" \
  -F 'metadata={"app":{"name":"ExampleApp","version":"2.0.3 (203)"},"device":{"os":"Ubuntu 24.04"}}' \
  -F "attachment=@/tmp/sluice-seed.log.gz;type=application/gzip"
echo

echo "current count: $(curl -sS "$BASE/admin/reports" -H "Authorization: Bearer $ADMIN" | grep -o '"id"' | wc -l | tr -d ' ')"
