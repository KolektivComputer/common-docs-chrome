#!/usr/bin/env bash
# Publish @kolektiv/common-docs-chrome to the Kolektiv Nexus npm-public.
# The repo `.npmrc` maps `@kolektiv` to the `npm-public` group for fetching, so
# we temporarily append the npm-public mapping (with auth).
#
# DRY_RUN=true (or 1) packs the tarball and lists its contents without
# publishing or requiring credentials.
set -euo pipefail

HOST="repo.kolektiv.computer"
REGISTRY="https://${HOST}/repository/npm-public/"
PACKAGE="@kolektiv/common-docs-chrome"
VERSION="$(node -p "require('./package.json').version")"

root="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
NPMRC="${root}/.npmrc"

if [ "${DRY_RUN:-}" = "true" ] || [ "${DRY_RUN:-}" = "1" ]; then
  echo "DRY_RUN: packing ${PACKAGE}@${VERSION} (no publish)"
  pnpm pack
  tarball="$(ls -t kolektiv-common-docs-chrome-*.tgz 2>/dev/null | head -n 1 || true)"
  if [ -z "${tarball}" ]; then
    echo "::error::pnpm pack produced no tarball" >&2
    exit 1
  fi
  echo "contents of ${tarball}:"
  tar -tzf "${tarball}" | sort
  rm -f "${tarball}"
  exit 0
fi

: "${YURI_CAPITAL_REPO_USERNAME:?set YURI_CAPITAL_REPO_USERNAME}"
: "${YURI_CAPITAL_REPO_PASSWORD:?set YURI_CAPITAL_REPO_PASSWORD}"

backup="$(mktemp)"
cp "${NPMRC}" "${backup}"
trap 'cp "${backup}" "${NPMRC}"; rm -f "${backup}"' EXIT

AUTH="$(printf '%s:%s' "${YURI_CAPITAL_REPO_USERNAME}" "${YURI_CAPITAL_REPO_PASSWORD}" | openssl base64 -A)"
path="${REGISTRY#https://}"
path="${path#http://}"

{
  printf '\n@kolektiv:registry=%s\n' "${REGISTRY}"
  printf '//%s:_auth=%s\n' "${path}" "${AUTH}"
  printf '//%s:always-auth=true\n' "${path}"
} >>"${NPMRC}"

already_published() {
  npm view "${PACKAGE}@${VERSION}" --registry "${REGISTRY}" >/dev/null 2>&1
}

if already_published; then
  echo "already published ${PACKAGE}@${VERSION}, skipping"
  exit 0
fi

echo "publishing ${PACKAGE}@${VERSION} to ${REGISTRY}"
pnpm publish --no-git-checks --access public --registry "${REGISTRY}"
