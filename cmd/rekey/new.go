package main

import (
	"fmt"
	"os"
	"os/exec"
	"path/filepath"

	"github.com/spf13/cobra"
)

var newCmd = &cobra.Command{
	Use:   "new",
	Short: "Re-key: decrypt status, generate new keypair, re-encrypt",
	Long: `Decrypt data/status.yaml.gpg using the current private key (from GitHub
Secrets or local keyring), generate a new PQC composite keypair, re-encrypt
the status data, and store the new private key in GitHub Secrets.

The old keypair is replaced entirely.`,
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
	encPath := filepath.Join(dataDir, "status.yaml.gpg")
	plainPath := filepath.Join(repoRoot, "status.yaml.plain.tmp")

	if _, err := os.Stat(encPath); os.IsNotExist(err) {
		return fmt.Errorf("encrypted status not found at %s\nRun 'rekey init' first", encPath)
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

	// Store new private key in GitHub Secrets
	fmt.Println("Storing new private key in GitHub Secrets (STATUS_GPG_PRIVATE_KEY)...")
	if err := storePrivateKeyInSecrets(fingerprint); err != nil {
		return fmt.Errorf("failed to store private key: %w", err)
	}

	// Re-encrypt with new key
	fmt.Printf("Re-encrypting status data with new key...\n")
	if err := os.Remove(encPath); err != nil {
		return fmt.Errorf("failed to remove old encrypted file: %w", err)
	}
	if err := encryptFile(plainPath, encPath, fingerprint); err != nil {
		return fmt.Errorf("failed to re-encrypt: %w", err)
	}

	// Delete private key from local keyring
	fmt.Println("Deleting new private key from local keyring...")
	if err := deletePrivateKey(fingerprint); err != nil {
		fmt.Fprintf(os.Stderr, "WARNING: Failed to delete local private key: %v\n", err)
		fmt.Fprintln(os.Stderr, "Manually delete it with: gpg --delete-secret-keys "+fingerprint)
	}

	fmt.Println("")
	fmt.Println("Re-key complete.")
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
