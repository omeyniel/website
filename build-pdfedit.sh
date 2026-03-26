#!/usr/bin/env bash
set -euo pipefail

root_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
app_dir="${PDFEDIT_SRC:-$root_dir/pdfedit-src}"
publish_dir="${PDFEDIT_PUBLISH:-$root_dir/pdfedit}"

if [ ! -d "$app_dir" ]; then
  echo "Source app not found at: $app_dir" >&2
  echo "Set PDFEDIT_SRC or move the app to $root_dir/pdfedit-src" >&2
  exit 1
fi

if [ "$app_dir" = "$publish_dir" ]; then
  echo "Source and publish directories are the same ($app_dir)." >&2
  echo "Move the source to $root_dir/pdfedit-src, or set PDFEDIT_PUBLISH to a different path." >&2
  exit 1
fi

cd "$app_dir"

npm run build

rm -rf "$publish_dir"
mkdir -p "$publish_dir"
cp -R "$app_dir/out"/* "$publish_dir/"

printf "\nDeployed static build to %s\n" "$publish_dir"
