package main

import (
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
	"time"

	"github.com/spf13/cobra"
)

var newCmd = &cobra.Command{
	Use:   "new",
	Short: "Re-key: decrypt status, generate new keypair, re-encrypt",
	Long: `Decrypt data/status.yaml.gpg using the current private key (from GitHub
Secrets or local keyring), generate a new PQC composite keypair, re-encrypt
the status data, and store the new private key in GitHub Secrets.

The old keypair is retained in data/keys/ so historical encrypted data
can still be decrypted. The GitHub Secret (STATUS_GPG_PRIVATE_KEY)
contains all private keys (current + previous) so CI can decrypt any
version of the data from git history.`,
	RunE: runNew,
}

func init() {
	rootCmd.AddCommand(newCmd)
}

func runNew(cmd *cobra.Command, args []string) error {
	repoRoot, err := findRepoRoot()
	if err != nil {
		return fmt.Errorf("not in a git repository: %w", err)
	}

	if err := checkGPGVersion(); err != nil {
		return err
	}

	if err := checkGHCLI(); err != nil {
		return err
	}

	if err := checkLocalGPGKey(); err != nil {
		return err
	}

	dataDir := filepath.Join(repoRoot, "data")
	keysDir := filepath.Join(dataDir, "keys")
	encPath := filepath.Join(dataDir, "status.yaml.gpg")
	plainPath := filepath.Join(repoRoot, "status.yaml.plain.tmp")

	if _, err := os.Stat(encPath); os.IsNotExist(err) {
		return fmt.Errorf("encrypted status not found at %s\nRun 'rekey init' first", encPath)
	}

	if err := os.MkdirAll(keysDir, 0o755); err != nil {
		return fmt.Errorf("failed to create data/keys/: %w", err)
	}

	// Archive the current public key before replacing it
	currentPubKey := filepath.Join(dataDir, "public.gpg")
	if _, err := os.Stat(currentPubKey); err == nil {
		oldFingerprint := getKeyFingerprint(currentPubKey)
		timestamp := time.Now().UTC().Format("20060102T150405Z")
		archiveName := fmt.Sprintf("public-%s-%s.gpg", timestamp, shortFingerprint(oldFingerprint))
		archivePath := filepath.Join(keysDir, archiveName)
		fmt.Printf("Archiving current public key → data/keys/%s\n", archiveName)
		if err := copyFile(currentPubKey, archivePath); err != nil {
			return fmt.Errorf("failed to archive public key: %w", err)
		}
	}

	// Decrypt current file
	fmt.Println("Decrypting current status data...")
	if err := decryptFile(encPath, plainPath); err != nil {
		return fmt.Errorf("failed to decrypt: %w\nEnsure the current private key is in your local keyring", err)
	}
	defer os.Remove(plainPath)

	// Generate new keypair
	fmt.Println("Generating new PQC composite keypair...")
	fmt.Printf("  Expiration: %d days\n", expiresIn)

	fingerprint, err := generateKeypair(expiresIn)
	if err != nil {
		return fmt.Errorf("failed to generate new keypair: %w", err)
	}
	fmt.Printf("  Fingerprint: %s\n", fingerprint)

	// Sign with local key
	fmt.Println("Signing new key with local GPG key...")
	if err := signKey(fingerprint); err != nil {
		return fmt.Errorf("failed to sign key: %w", err)
	}

	// Export new public key
	pubKeyPath := filepath.Join(dataDir, "public.gpg")
	fmt.Printf("Exporting new public key to %s...\n", pubKeyPath)
	if err := exportPublicKey(fingerprint, pubKeyPath); err != nil {
		return fmt.Errorf("failed to export public key: %w", err)
	}

	// Export ALL private keys (current + previous) to GitHub Secrets
	// This ensures CI can decrypt data encrypted with any historical key
	fmt.Println("Storing all private keys in GitHub Secrets (STATUS_GPG_PRIVATE_KEY)...")
	if err := storeAllPrivateKeysInSecrets(); err != nil {
		return fmt.Errorf("failed to store private keys: %w", err)
	}

	// Re-encrypt with new key
	fmt.Printf("Re-encrypting status data with new key...\n")
	if err := os.Remove(encPath); err != nil {
		return fmt.Errorf("failed to remove old encrypted file: %w", err)
	}
	if err := encryptFile(plainPath, encPath, fingerprint); err != nil {
		return fmt.Errorf("failed to re-encrypt: %w", err)
	}

	// Delete only the NEW private key from local keyring
	// Old keys stay so the user can decrypt historical data locally
	fmt.Println("Deleting new private key from local keyring...")
	if err := deletePrivateKey(fingerprint); err != nil {
		fmt.Fprintf(os.Stderr, "WARNING: Failed to delete local private key: %v\n", err)
		fmt.Fprintln(os.Stderr, "Manually delete it with: gpg --delete-secret-keys "+fingerprint)
	}

	fmt.Println("")
	fmt.Println("Re-key complete. Previous keys retained in data/keys/.")
	fmt.Println("")
	fmt.Println("Next steps:")
	fmt.Println("  1. git add data/")
	fmt.Println("  2. git commit -m 'chore: re-key status encryption'")
	fmt.Println("  3. git push")

	return nil
}

func decryptFile(inputPath, outputPath string) error {
	cmd := exec.Command("gpg", "--batch", "--yes",
		"--decrypt",
		"--output", outputPath,
		inputPath)
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr
	return cmd.Run()
}

func getKeyFingerprint(pubKeyPath string) string {
	out, err := exec.Command("gpg", "--import-options", "show-only",
		"--import", "--with-colons", pubKeyPath).Output()
	if err != nil {
		return "unknown"
	}
	for _, line := range strings.Split(string(out), "\n") {
		if strings.HasPrefix(line, "fpr:") {
			fields := strings.Split(line, ":")
			if len(fields) >= 10 {
				return fields[9]
			}
		}
	}
	return "unknown"
}

func shortFingerprint(fp string) string {
	if len(fp) >= 16 {
		return fp[len(fp)-16:]
	}
	return fp
}

func copyFile(src, dst string) error {
	data, err := os.ReadFile(src)
	if err != nil {
		return err
	}
	return os.WriteFile(dst, data, 0o644)
}

// storeAllPrivateKeysInSecrets exports every secret key in the local
// keyring and stores the combined ASCII armored output in GitHub Secrets.
// This allows CI to decrypt data encrypted with any historical key.
func storeAllPrivateKeysInSecrets() error {
	privKeys, err := exec.Command("gpg", "--armor", "--export-secret-keys").Output()
	if err != nil {
		return fmt.Errorf("failed to export private keys: %w", err)
	}

	cmd := exec.Command("gh", "secret", "set", "STATUS_GPG_PRIVATE_KEY",
		"--body", string(privKeys))
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr
	return cmd.Run()
}
