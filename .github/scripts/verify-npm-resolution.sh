#!/usr/bin/env bash
# Verify anonymously that @kolektiv/common-docs-chrome resolves from the
# advertised npm registry — the `npm-public` group aggregating all public
# Kolektiv repos.
set -uo pipefail

REGISTRY="https://repo.yuri.capital/repository/npm-public/"
PACKAGE="@kolektiv/common-docs-chrome"

VERSION="${1:-}"
if [ -z "${VERSION}" ]; then
  VERSION="$(node -p "require('./package.json').version" 2>/dev/null)"
fi
if [ -z "${VERSION}" ]; then
  echo "::error::usage: $0 <version> (or run from the repository root with node available)"
  exit 2
fi

echo "verifying ${PACKAGE}:${VERSION} from ${REGISTRY}"

if npm view "${PACKAGE}@${VERSION}" version --registry "${REGISTRY}" \
  --fetch-retries=3 >/dev/null 2>&1; then
  echo "ok   ${PACKAGE}@${VERSION}"
else
  echo "::error::missing: ${PACKAGE}@${VERSION}"
  exit 1
fi

echo "package resolves from advertised registry ${REGISTRY}"
