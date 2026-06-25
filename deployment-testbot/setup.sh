#!/usr/bin/env bash
# Build the SUT from source and wait until healthy. Tuned for Mealie.
# Mealie facts (verified 2026-06-13):
#   Port:       9000 (APP_PORT env default, EXPOSE 9000 in Dockerfile)
#   Health:     GET /api/app/about  (confirmed in docker/healthcheck.sh)
#   Dockerfile: docker/Dockerfile   (ENTRYPOINT /app/run.sh, target=production)
set -euo pipefail
cd "$(dirname "$0")"
echo "Building SUT from source + starting..."
docker compose -f docker-compose.yml up -d --build
echo "Waiting for health endpoint..."
for i in $(seq 1 60); do
  if curl -sf -m 3 http://localhost:9000/api/app/about >/dev/null; then echo "SUT healthy"; break; fi
  sleep 3
  [[ $i -eq 60 ]] && { echo "SUT failed to become healthy"; docker compose logs --tail 50; exit 1; }
done

# Complete first-run so the app does not redirect to /admin/setup on login.
# Mealie marks is_first_login=true while a user with the hardcoded default email
# (settings._DEFAULT_EMAIL = "changeme@example.com") exists; the frontend then
# pushes admin users to /admin/setup. Renaming the seeded admin's email off that
# constant flips is_first_login=false (login lands on the app). Password unchanged.
echo "Completing first-run (renaming default admin off the default email)..."
TOKEN=$(curl -sf -m 10 -X POST http://localhost:9000/api/auth/token \
  -H 'Content-Type: application/x-www-form-urlencoded' \
  --data-urlencode 'username=changeme@example.com' --data-urlencode 'password=MyPassword' \
  | python3 -c 'import json,sys; print(json.load(sys.stdin)["access_token"])')
SELF=$(curl -sf -m 10 http://localhost:9000/api/users/self -H "Authorization: Bearer $TOKEN")
USER_ID=$(printf '%s' "$SELF" | python3 -c 'import json,sys; print(json.load(sys.stdin)["id"])')
printf '%s' "$SELF" \
  | python3 -c 'import json,sys; u=json.load(sys.stdin); u["email"]="admin@mealie.test"; print(json.dumps(u))' \
  | curl -sf -m 10 -X PUT "http://localhost:9000/api/users/$USER_ID" \
      -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' --data-binary @- >/dev/null
if curl -sf -m 10 http://localhost:9000/api/app/about/startup-info \
     | python3 -c 'import json,sys; sys.exit(0 if json.load(sys.stdin)["isFirstLogin"] is False else 1)'; then
  echo "First-run complete (admin -> admin@mealie.test; isFirstLogin=false)."
else
  echo "ERROR: isFirstLogin still true after admin rename"; exit 1
fi

echo "Setup complete"
