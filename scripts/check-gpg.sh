#!/usr/bin/env bash
set -euo pipefail

MIN_MAJOR=2
MIN_MINOR=5
MIN_PATCH=20

if ! command -v gpg &>/dev/null; then
  echo "ERROR: GnuPG (gpg) is not installed."
  echo "This project requires GnuPG >= ${MIN_MAJOR}.${MIN_MINOR}.${MIN_PATCH} for PQC support."
  exit 1
fi

GPG_VERSION=$(gpg --version | head -1 | grep -oP '\d+\.\d+\.\d+')

if [ -z "$GPG_VERSION" ]; then
  echo "ERROR: Could not determine GnuPG version."
  exit 1
fi

IFS='.' read -r MAJOR MINOR PATCH <<< "$GPG_VERSION"

FAILED=0
if [ "$MAJOR" -lt "$MIN_MAJOR" ]; then
  FAILED=1
elif [ "$MAJOR" -eq "$MIN_MAJOR" ]; then
  if [ "$MINOR" -lt "$MIN_MINOR" ]; then
    FAILED=1
  elif [ "$MINOR" -eq "$MIN_MINOR" ] && [ "$PATCH" -lt "$MIN_PATCH" ]; then
    FAILED=1
  fi
fi

if [ "$FAILED" -eq 1 ]; then
  echo "ERROR: GnuPG ${GPG_VERSION} is too old."
  echo "This project requires GnuPG >= ${MIN_MAJOR}.${MIN_MINOR}.${MIN_PATCH} for post-quantum cryptography (PQC) support."
  echo "See https://gnupg.org/download/ to upgrade."
  exit 1
fi

echo "GnuPG ${GPG_VERSION}: OK (>= ${MIN_MAJOR}.${MIN_MINOR}.${MIN_PATCH})"
