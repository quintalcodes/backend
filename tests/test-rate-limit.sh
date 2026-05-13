#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${BASE_URL:-https://localhost}"
ROUTE_PATH="${PATH_SUFFIX:-/api/login}"
EXPECTED_LIMIT="${LIMIT:-30}"
EXTRA_REQUESTS="${EXTRA:-5}"
CLIENT_IP="${CLIENT_IP:-203.0.113.50}"
REQUEST_BODY="${REQUEST_BODY:-{\"email\":\"rate-limit-test@example.com\",\"password\":\"x\"}}"
TOTAL_REQUESTS=$((EXPECTED_LIMIT + EXTRA_REQUESTS))
TARGET_URL="${BASE_URL}${ROUTE_PATH}"

print_config() {
  echo "Rate Limit Smoke Test"
  echo "---------------------"
  echo "Target URL      : ${TARGET_URL}"
  echo "Client IP       : ${CLIENT_IP} (X-Forwarded-For)"
  echo "Expected limit  : ${EXPECTED_LIMIT}"
  echo "Extra requests  : ${EXTRA_REQUESTS}"
  echo "Total requests  : ${TOTAL_REQUESTS}"
  echo
}

send_request() {
  curl --insecure -sS -o /dev/null -w "%{http_code}" \
    -X POST "${TARGET_URL}" \
    -H "Content-Type: application/json" \
    -H "X-Forwarded-For: ${CLIENT_IP}" \
    -d "${REQUEST_BODY}"
}

print_summary() {
  local rate_limited_count="$1"
  local other_count="$2"

  echo
  echo "Results"
  echo "-------"
  echo "429 responses   : ${rate_limited_count}"
  echo "Other responses : ${other_count}"
  echo
}

run_test() {
  local rate_limited=0
  local other=0

  for request_number in $(seq 1 "${TOTAL_REQUESTS}"); do
    local status_code
    status_code="$(send_request)"

    if [[ "${status_code}" == "429" ]]; then
      rate_limited=$((rate_limited + 1))
    else
      other=$((other + 1))
    fi

    printf "Request %02d/%02d -> HTTP %s\n" "${request_number}" "${TOTAL_REQUESTS}" "${status_code}"
  done

  print_summary "${rate_limited}" "${other}"

  if [[ "${rate_limited}" -lt 1 ]]; then
    echo "No 429 responses seen. Check server URL, route, and limiter settings." >&2
    return 1
  fi

  echo "Rate limiter appears to be active."
}

print_config
run_test
