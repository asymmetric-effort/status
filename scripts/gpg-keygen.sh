#!/usr/bin/env bash
set -euo pipefail

# Generate a PQC composite GPG keypair for Balefire subscriber encryption.
#
# Creates a composite key:
#   Primary:    ed25519 + ML-DSA-65 (signing)
#   Subkey:     cv25519 + ML-KEM-768 (encryption)
#
# Usage:
#   ./scripts/gpg-keygen.sh --name "Balefire Status" --email "status@example.com"
#
# The public key is exported to subscribers/subscribers.gpg.pub
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
      echo "Generates a PQC composite GPG keypair for Balefire."
      echo "  Primary: ed25519 + ML-DSA-65 (signing)"
      echo "  Subkey:  cv25519 + ML-KEM-768 (encryption)"
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
echo "  Sign:  ed25519 + ML-DSA-65"
echo "  Encrypt: cv25519 + ML-KEM-768"
echo ""

# Generate primary key (signing): ed25519 composite with ML-DSA-65
gpg --batch --passphrase "" --quick-gen-key "$NAME <$EMAIL>" ed25519+ml-dsa-65 sign 0

# Get the fingerprint of the key we just created
FINGERPRINT=$(gpg --list-keys --with-colons "$EMAIL" 2>/dev/null | grep "^fpr:" | head -1 | cut -d: -f10)

if [ -z "$FINGERPRINT" ]; then
  echo "ERROR: Failed to retrieve key fingerprint."
  exit 1
fi

echo "Primary key fingerprint: $FINGERPRINT"

# Add encryption subkey: cv25519 composite with ML-KEM-768
gpg --batch --passphrase "" --quick-add-key "$FINGERPRINT" cv25519+ml-kem-768 encr 0

echo ""
echo "Keypair generated successfully."

# Export public key
mkdir -p "$ROOT_DIR/subscribers"
gpg --armor --export "$FINGERPRINT" > "$ROOT_DIR/subscribers/subscribers.gpg.pub"
echo "Public key exported to: subscribers/subscribers.gpg.pub"

# Export private key for GitHub secrets
PRIVATE_KEY_FILE="$ROOT_DIR/subscribers/PRIVATE_KEY.asc"
gpg --armor --export-secret-keys "$FINGERPRINT" > "$PRIVATE_KEY_FILE"
echo "Private key exported to: subscribers/PRIVATE_KEY.asc"
echo ""
echo "IMPORTANT: Store the private key in GitHub secrets as GPG_PRIVATE_KEY:"
echo "  gh secret set GPG_PRIVATE_KEY < subscribers/PRIVATE_KEY.asc"
echo ""
echo "Then DELETE the private key file:"
echo "  rm subscribers/PRIVATE_KEY.asc"
echo ""
echo "NEVER commit the private key to the repository."
