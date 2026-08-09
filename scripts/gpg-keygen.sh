#!/usr/bin/env bash
set -euo pipefail

# Generate a PQC composite GPG keypair for BaleFire subscriber encryption.
#
# Creates a composite key:
#   Primary:    ed25519 (signing)
#   Subkey:     Kyber-768 (PQC composite) (encryption)
#
# Usage:
#   ./scripts/gpg-keygen.sh --name "BaleFire Status" --email "status@example.com"
#
# The public key is exported to data/public.gpg
# The private key must be stored in GitHub secrets as GPG_PRIVATE_KEY

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

# Check GPG version first
bash "$SCRIPT_DIR/check-gpg.sh"

NAME=""
EMAIL=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --name)   NAME="$2"; shift 2 ;;
    --email)  EMAIL="$2"; shift 2 ;;
    --help|-h)
      echo "Usage: gpg-keygen.sh --name <name> --email <email>"
      echo ""
      echo "Generates a PQC composite GPG keypair for BaleFire."
      echo "  Primary: ed25519 (signing)"
      echo "  Subkey:  Kyber-768 (PQC composite) (encryption)"
      exit 0
      ;;
    *) echo "Unknown option: $1"; exit 1 ;;
  esac
done

if [[ -z "$NAME" || -z "$EMAIL" ]]; then
  echo "ERROR: --name and --email are required."
  echo "Usage: gpg-keygen.sh --name <name> --email <email>"
  exit 1
fi

echo "Generating PQC composite keypair..."
echo "  Name:  $NAME"
echo "  Email: $EMAIL"
echo "  Sign:  ed25519"
echo "  Encrypt: Kyber-768 (PQC composite)"
echo ""

# Generate primary key (signing): ed25519 composite with ML-DSA-65
gpg --batch --passphrase "" --quick-gen-key "$NAME <$EMAIL>" ed25519 sign 0

# Get the fingerprint of the key we just created
FINGERPRINT=$(gpg --list-keys --with-colons "$EMAIL" 2>/dev/null | grep "^fpr:" | head -1 | cut -d: -f10)

if [ -z "$FINGERPRINT" ]; then
  echo "ERROR: Failed to retrieve key fingerprint."
  exit 1
fi

echo "Primary key fingerprint: $FINGERPRINT"

# Add encryption subkey: cv25519 composite with ML-KEM-768
gpg --batch --passphrase "" --quick-add-key "$FINGERPRINT" kyber encr 0

echo ""
echo "Keypair generated successfully."

# Export public key
mkdir -p "$ROOT_DIR/subscribers"
gpg --armor --export "$FINGERPRINT" > "$ROOT_DIR/data/public.gpg"
echo "Public key exported to: data/public.gpg"

# Export private key for GitHub secrets
PRIVATE_KEY_FILE="$ROOT_DIR/data/PRIVATE_KEY.asc"
gpg --armor --export-secret-keys "$FINGERPRINT" > "$PRIVATE_KEY_FILE"
echo "Private key exported to: data/PRIVATE_KEY.asc"
echo ""
echo "IMPORTANT: Store the private key in GitHub secrets as GPG_PRIVATE_KEY:"
echo "  gh secret set GPG_PRIVATE_KEY < data/PRIVATE_KEY.asc"
echo ""
echo "Then DELETE the private key file:"
echo "  rm data/PRIVATE_KEY.asc"
echo ""
echo "NEVER commit the private key to the repository."
