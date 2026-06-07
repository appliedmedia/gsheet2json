#!/usr/bin/env bash
# Verify the four g2j.* vanity redirects are live and resolve to the right
# targets. Run after configuring DNS for PreLaunch Lane 4 and again any time
# the redirect targets change.
#
# Exits 0 if every check passes, 1 otherwise. Prints one line per check.

set -u

PASS=0
FAIL=0

check() {
  local label="$1"
  local cmd="$2"
  local expect="$3"
  local actual
  actual=$(eval "$cmd" 2>&1)
  if echo "$actual" | grep -qE "$expect"; then
    printf '  PASS  %s\n' "$label"
    PASS=$((PASS + 1))
  else
    printf '  FAIL  %s\n         expected: %s\n         got:      %s\n' "$label" "$expect" "$actual"
    FAIL=$((FAIL + 1))
  fi
}

printf 'Verifying g2j.* vanity redirects...\n\n'

# g2j.in -> gsheet2json.com (pre-approval, the product card) or the
# Marketplace listing (post-approval). Accept either; nothing else.
check 'g2j.in  301 issued' \
  'curl -sI https://g2j.in' \
  'HTTP/[12](\.[01])? 30[127]'

check 'g2j.in  final target reachable' \
  'curl -sILo /dev/null -w "%{http_code} %{url_effective}" https://g2j.in' \
  '200 (https://gsheet2json\.com/?|https://workspace\.google\.com/marketplace/app/gsheet2json/)'

check 'g2j.dev   301 to github repo' \
  'curl -sILo /dev/null -w "%{url_effective}" https://g2j.dev' \
  'github.com/appliedmedia/gsheet2json'

check 'g2j.support  301 to github issues' \
  'curl -sILo /dev/null -w "%{url_effective}" https://g2j.support' \
  'github.com/appliedmedia/gsheet2json/issues'

check 'g2j.pub/legal  resolves with 200 at gsheet2json.com/legal' \
  'curl -sILo /dev/null -w "%{http_code} %{url_effective}" https://g2j.pub/legal' \
  '200 https://gsheet2json\.com/legal'

# The legal page itself must contain both privacy and terms text.
check 'gsheet2json.com/legal  privacy text present' \
  'curl -sL https://gsheet2json.com/legal' \
  'Privacy'

check 'gsheet2json.com/legal  terms text present' \
  'curl -sL https://gsheet2json.com/legal' \
  '(Terms|terms of service)'

printf '\nResult: %d passed, %d failed\n' "$PASS" "$FAIL"
test "$FAIL" -eq 0
