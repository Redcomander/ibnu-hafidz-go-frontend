#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
PUBLISH_DIR="${CPANEL_FRONTEND_PUBLISH_DIR:-$HOME/public_html/beta}"

cd "$REPO_ROOT"

echo "[deploy] Menginstal dependensi frontend..."
npm ci

echo "[deploy] Sedang build frontend..."
npm run build

echo "[deploy] Mem-publish folder dist ke $PUBLISH_DIR"
mkdir -p "$PUBLISH_DIR"
rsync -a --delete "$REPO_ROOT/dist/" "$PUBLISH_DIR/"

if [[ -f "$REPO_ROOT/deploy/cpanel/.htaccess" ]]; then
  cp "$REPO_ROOT/deploy/cpanel/.htaccess" "$PUBLISH_DIR/.htaccess"
fi

echo "[deploy] Publish frontend selesai"
