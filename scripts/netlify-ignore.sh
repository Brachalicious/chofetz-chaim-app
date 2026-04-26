#!/usr/bin/env bash
set -euo pipefail

# Netlify ignore command:
# - exit 0 => skip this build
# - exit 1 => continue with this build
#
# This keeps auto-deploy from spending build minutes on commits that do not
# change the deployed static app or its serverless functions.

BASE="${CACHED_COMMIT_REF:-}"
HEAD="${COMMIT_REF:-HEAD}"

if [[ -z "$BASE" ]]; then
  echo "No cached commit ref available; running build."
  exit 1
fi

changed_files="$(git diff --name-only "$BASE" "$HEAD" || true)"

if [[ -z "$changed_files" ]]; then
  echo "No file changes detected; skipping Netlify build."
  exit 0
fi

echo "Changed files:"
echo "$changed_files"

if echo "$changed_files" | grep -Eq '^(public/|netlify/|src/services/|package\.json|package-lock\.json|netlify\.toml)$'; then
  echo "Deploy-relevant changes detected; running Netlify build."
  exit 1
fi

echo "Only non-deploy files changed; skipping Netlify build."
exit 0
