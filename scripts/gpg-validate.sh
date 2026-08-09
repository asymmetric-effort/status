#!/usr/bin/env bash
set -euo pipefail

# Validate that a .gpg file was encrypted with PQC algorithms.
# Used by CI to reject non-PQC encrypted subscriber files.
#
# Usage:
#   ./scripts/gpg-validate.sh <file.gpg>

if [ $# -lt 1 ]; then
  echo "Usage: gpg-validate.sh <file.gpg>"
  exit 1
fi

GPG_FILE="$1"

if [ ! -f "$GPG_FILE" ]; then
  echo "ERROR: File not found: $GPG_FILE"
  exit 1
fi

# Inspect the encrypted packet to check algorithm usage
PACKET_INFO=$(gpg --list-packets --verbose "$GPG_FILE" 2>&1 || true)

# Check for PQC key encapsulation (ML-KEM / Kyber)
# In GnuPG 2.5+, PQC-encrypted packets use composite algorithms
# that show up as ky768, ml-kem, or KEM in packet listings
if echo "$PACKET_INFO" | grep -qi "ml-kem\|ky768\|kyber\|kem\|composite"; then
  echo "PQC validation: PASS - $GPG_FILE uses PQC encryption"
  exit 0
fi

# If we can't confirm PQC from packets, check if the recipient key is PQC
# This happens when the key ID is available
KEY_IDS=$(echo "$PACKET_INFO" | grep -oP 'keyid [A-F0-9]+' | awk '{print $2}' || true)

for KEY_ID in $KEY_IDS; do
  KEY_ALGO=$(gpg --list-keys --with-colons "$KEY_ID" 2>/dev/null | grep "^pub\|^sub" | cut -d: -f4 || true)
  if echo "$KEY_ALGO" | grep -qi "kem\|kyber\|ml-kem"; then
    echo "PQC validation: PASS - $GPG_FILE encrypted to PQC key $KEY_ID"
    exit 0
  fi
done

echo "ERROR: PQC validation FAILED for $GPG_FILE"
echo "This file does not appear to be encrypted with PQC (ML-KEM) algorithms."
echo "Re-encrypt using: scripts/gpg-encrypt.sh"
echo ""
echo "Packet info:"
echo "$PACKET_INFO" | head -20
exit 1
