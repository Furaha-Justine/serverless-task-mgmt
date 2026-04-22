#!/usr/bin/env bash
# scripts/bundle.sh
# Installs dependencies and copies shared code into each Lambda function directory
# so Terraform archive_file can zip self-contained packages.

set -euo pipefail

LAMBDAS_DIR="$(cd "$(dirname "$0")/../lambdas" && pwd)"
FUNCTIONS=(preSignup postConfirm createTask updateTask assignTask closeTask getTasks getTaskById)

echo "→ Installing root Lambda dependencies..."
cd "$LAMBDAS_DIR"
npm install

echo "→ Bundling functions..."
for fn in "${FUNCTIONS[@]}"; do
  DIR="$LAMBDAS_DIR/$fn"
  echo "  Bundling $fn..."

  # Copy shared utilities
  cp -r "$LAMBDAS_DIR/shared" "$DIR/shared"

  # Copy node_modules
  cp -r "$LAMBDAS_DIR/node_modules" "$DIR/node_modules"
done

echo "✓ All functions bundled. Ready for terraform apply."
