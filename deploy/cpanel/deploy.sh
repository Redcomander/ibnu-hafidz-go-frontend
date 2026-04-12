#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
PUBLISH_DIR="${CPANEL_FRONTEND_PUBLISH_DIR:-$HOME/public_html/beta}"

find_npm_bin() {
  if command -v npm >/dev/null 2>&1; then
    command -v npm
    return 0
  fi

  local candidates=(
    /opt/cpanel/ea-nodejs*/bin/npm
    /opt/alt/alt-nodejs*/root/usr/bin/npm
    /usr/local/bin/npm
    /usr/bin/npm
  )

  local path
  for path in "${candidates[@]}"; do
    for resolved in $path; do
      if [[ -x "$resolved" ]]; then
        echo "$resolved"
        return 0
      fi
    done
  done

  return 1
}

cd "$REPO_ROOT"

NPM_BIN="$(find_npm_bin || true)"
if [[ -z "$NPM_BIN" ]]; then
  echo "[deploy] npm tidak ditemukan di server."
  echo "[deploy] Aktifkan Node.js di cPanel atau tambahkan npm ke PATH shell."
  echo "[deploy] Lokasi yang dicek: /opt/cpanel/ea-nodejs*/bin/npm dan /opt/alt/alt-nodejs*/root/usr/bin/npm"
  exit 1
fi

echo "[deploy] Menggunakan npm di: $NPM_BIN"

echo "[deploy] Menginstal dependensi frontend..."
"$NPM_BIN" ci

echo "[deploy] Sedang build frontend..."
"$NPM_BIN" run build

echo "[deploy] Mem-publish folder dist ke $PUBLISH_DIR"
mkdir -p "$PUBLISH_DIR"
if command -v rsync >/dev/null 2>&1; then
  rsync -a --delete "$REPO_ROOT/dist/" "$PUBLISH_DIR/"
else
  echo "[deploy] rsync tidak tersedia, memakai fallback cp -a"
  find "$PUBLISH_DIR" -mindepth 1 -maxdepth 1 -exec rm -rf {} +
  cp -a "$REPO_ROOT/dist/." "$PUBLISH_DIR/"
fi

if [[ -f "$REPO_ROOT/deploy/cpanel/.htaccess" ]]; then
  cp "$REPO_ROOT/deploy/cpanel/.htaccess" "$PUBLISH_DIR/.htaccess"
fi

echo "[deploy] Publish frontend selesai"
