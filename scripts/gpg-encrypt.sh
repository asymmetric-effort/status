#!/usr/bin/env bash
set -euo pipefail

# Encrypt a file using the BaleFire PQC public key.
# Rejects encryption if the key does not use PQC algorithms.
#
# Usage:
#   ./scripts/gpg-encrypt.sh <input-file> <output-file>
#
# The public key must exist at data/public.gpg

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
PUBKEY="$ROOT_DIR/data/public.gpg"

if [ $# -lt 2 ]; then
  echo "Usage: gpg-encrypt.sh <input-file> <output-file>"
  exit 1
fi

INPUT_FILE="$1"
OUTPUT_FILE="$2"

if [ ! -f "$INPUT_FILE" ]; then
  echo "ERROR: Input file not found: $INPUT_FILE"
  exit 1
fi

if [ ! -f "$PUBKEY" ]; then
  echo "ERROR: Public key not found: $PUBKEY"
  echo "Run scripts/gpg-keygen.sh first to generate the keypair."
  exit 1
fi

# Verify the public key contains PQC algorithms
KEY_INFO=$(gpg --import-options show-only --import "$PUBKEY" 2>&1)

if ! echo "$KEY_INFO" | grep -qi "ml-kem\|ky768\|kyber\|kem"; then
  echo "ERROR: Public key does not contain ML-KEM (Kyber) encryption subkey."
  echo "This project requires PQC composite keys."
  echo "Regenerate the key with: scripts/gpg-keygen.sh"
  exit 1
fi

if ! echo "$KEY_INFO" | grep -qi "ml-dsa\|dil\|dilithium"; then
  echo "ERROR: Public key does not contain ML-DSA (Dilithium) signing key."
  echo "This project requires PQC composite keys."
  echo "Regenerate the key with: scripts/gpg-keygen.sh"
  exit 1
fi

# Encrypt with the PQC public key
gpg --encrypt --armor \
  --trust-model always \
  --recipient-file "$PUBKEY" \
  --output "$OUTPUT_FILE" \
  "$INPUT_FILE"

echo "Encrypted: $INPUT_FILE → $OUTPUT_FILE"
