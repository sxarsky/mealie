#!/usr/bin/env bash
# Print a bearer token for the SUT. Tuned for Mealie's admin.
# setup.sh renames the seeded admin's email to admin@mealie.test (off the
# hardcoded default) to disable the first-run /admin/setup redirect; password
# stays MyPassword (settings._DEFAULT_PASSWORD). Auth endpoint:
#   POST /api/auth/token  (application/x-www-form-urlencoded)
set -euo pipefail
USER="${MEALIE_ADMIN_EMAIL:-admin@mealie.test}"
PASS="${MEALIE_ADMIN_PASSWORD:-MyPassword}"
curl -sf -m 10 -X POST http://localhost:9000/api/auth/token \
  -H 'Content-Type: application/x-www-form-urlencoded' \
  --data-urlencode "username=$USER" --data-urlencode "password=$PASS" \
  | python3 -c "import json,sys; print(json.load(sys.stdin)['access_token'])"
