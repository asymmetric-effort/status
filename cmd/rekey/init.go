package main

import (
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"strconv"
	"strings"

	"github.com/spf13/cobra"
)

var initCmd = &cobra.Command{
	Use:   "init",
	Short: "Generate initial GPG keypair and encrypt status.yaml",
	Long: `Generate a PQC composite GPG keypair, encrypt the plaintext status.yaml,
store the private key in GitHub Secrets, and export the public key to data/.

Prerequisites:
  - GnuPG >= 2.5.20 installed
  - A local GPG key to sign the new keypair
  - GitHub CLI (gh) authenticated with repo access`,
	RunE: runInit,
}

func init() {
	rootCmd.AddCommand(initCmd)
}

func runInit(cmd *cobra.Command, args []string) error {
	repoRoot, err := findRepoRoot()
	if err != nil {
		return fmt.Errorf("not in a git repository: %w", err)
	}

	// Check prerequisites
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
	if err := os.MkdirAll(dataDir, 0o755); err != nil {
		return fmt.Errorf("failed to create data/: %w", err)
	}

	statusPath := filepath.Join(repoRoot, "status.yaml")
	if _, err := os.Stat(statusPath); os.IsNotExist(err) {
		return fmt.Errorf("status.yaml not found at %s", statusPath)
	}

	fmt.Println("Generating PQC composite GPG keypair...")
	fmt.Printf("  Expiration: %d days\n", expiresIn)

	// Generate the keypair
	fingerprint, err := generateKeypair(expiresIn)
	if err != nil {
		return fmt.Errorf("failed to generate keypair: %w", err)
	}
	fmt.Printf("  Fingerprint: %s\n", fingerprint)

	// Sign the new key with the local user's key
	fmt.Println("Signing new key with local GPG key...")
	if err := signKey(fingerprint); err != nil {
		return fmt.Errorf("failed to sign key: %w", err)
	}

	// Export public key to data/
	pubKeyPath := filepath.Join(dataDir, "public.gpg")
	fmt.Printf("Exporting public key to %s...\n", pubKeyPath)
	if err := exportPublicKey(fingerprint, pubKeyPath); err != nil {
		return fmt.Errorf("failed to export public key: %w", err)
	}

	// Export private key and store in GitHub Secrets
	fmt.Println("Storing private key in GitHub Secrets (STATUS_GPG_PRIVATE_KEY)...")
	if err := storePrivateKeyInSecrets(fingerprint); err != nil {
		return fmt.Errorf("failed to store private key: %w", err)
	}

	// Encrypt status.yaml → data/status.yaml.gpg
	encPath := filepath.Join(dataDir, "status.yaml.gpg")
	fmt.Printf("Encrypting status.yaml → %s...\n", encPath)
	if err := encryptFile(statusPath, encPath, fingerprint); err != nil {
		return fmt.Errorf("failed to encrypt status.yaml: %w", err)
	}

	// Remove plaintext status.yaml
	fmt.Println("Removing plaintext status.yaml...")
	if err := os.Remove(statusPath); err != nil {
		return fmt.Errorf("failed to remove status.yaml: %w", err)
	}

	// Delete the private key from the local keyring
	fmt.Println("Deleting private key from local keyring...")
	if err := deletePrivateKey(fingerprint); err != nil {
		fmt.Fprintf(os.Stderr, "WARNING: Failed to delete local private key: %v\n", err)
		fmt.Fprintln(os.Stderr, "Manually delete it with: gpg --delete-secret-keys "+fingerprint)
	}

	fmt.Println("")
	fmt.Println("Initialization complete.")
	fmt.Println("")
	fmt.Println("Next steps:")
	fmt.Println("  1. git add data/ && git rm status.yaml")
	fmt.Println("  2. git commit -m 'feat: encrypt status.yaml'")
	fmt.Println("  3. git push")

	return nil
}

func findRepoRoot() (string, error) {
	out, err := exec.Command("git", "rev-parse", "--show-toplevel").Output()
	if err != nil {
		return "", err
	}
	return strings.TrimSpace(string(out)), nil
}

func checkGPGVersion() error {
	out, err := exec.Command("gpg", "--version").Output()
	if err != nil {
		return fmt.Errorf("GnuPG not found. Install GnuPG >= 2.5.20")
	}
	lines := strings.Split(string(out), "\n")
	if len(lines) == 0 {
		return fmt.Errorf("could not parse gpg version")
	}
	// Extract version from "gpg (GnuPG) X.Y.Z"
	parts := strings.Fields(lines[0])
	if len(parts) < 3 {
		return fmt.Errorf("unexpected gpg version format: %s", lines[0])
	}
	version := parts[len(parts)-1]
	segments := strings.Split(version, ".")
	if len(segments) < 3 {
		return fmt.Errorf("unexpected version format: %s", version)
	}
	major, _ := strconv.Atoi(segments[0])
	minor, _ := strconv.Atoi(segments[1])
	patch, _ := strconv.Atoi(segments[2])

	if major < 2 || (major == 2 && minor < 5) || (major == 2 && minor == 5 && patch < 20) {
		return fmt.Errorf("GnuPG %s is too old. Requires >= 2.5.20 for PQC support", version)
	}
	return nil
}

func checkGHCLI() error {
	if _, err := exec.LookPath("gh"); err != nil {
		return fmt.Errorf("GitHub CLI (gh) not found. Install from https://cli.github.com")
	}
	out, err := exec.Command("gh", "auth", "status").CombinedOutput()
	if err != nil {
		return fmt.Errorf("gh is not authenticated: %s", string(out))
	}
	return nil
}

func checkLocalGPGKey() error {
	out, err := exec.Command("gpg", "--list-secret-keys", "--with-colons").Output()
	if err != nil {
		return fmt.Errorf("failed to list GPG keys: %w", err)
	}
	if !strings.Contains(string(out), "sec:") {
		return fmt.Errorf("no local GPG secret keys found. Generate one with: gpg --full-generate-key")
	}
	return nil
}

func generateKeypair(days int) (string, error) {
	expiry := fmt.Sprintf("%dd", days)

	// Generate primary key (signing)
	uid := "BaleFire Status <status@balefire.local>"
	cmd := exec.Command("gpg", "--batch", "--passphrase", "",
		"--quick-gen-key", uid, "ed25519+ml-dsa-65", "sign", expiry)
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr
	if err := cmd.Run(); err != nil {
		return "", fmt.Errorf("failed to generate primary key: %w", err)
	}

	// Get fingerprint
	out, err := exec.Command("gpg", "--list-keys", "--with-colons", uid).Output()
	if err != nil {
		return "", fmt.Errorf("failed to get fingerprint: %w", err)
	}

	var fingerprint string
	for _, line := range strings.Split(string(out), "\n") {
		if strings.HasPrefix(line, "fpr:") {
			fields := strings.Split(line, ":")
			if len(fields) >= 10 {
				fingerprint = fields[9]
				break
			}
		}
	}
	if fingerprint == "" {
		return "", fmt.Errorf("could not find fingerprint")
	}

	// Add encryption subkey
	cmd = exec.Command("gpg", "--batch", "--passphrase", "",
		"--quick-add-key", fingerprint, "cv25519+ml-kem-768", "encr", expiry)
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr
	if err := cmd.Run(); err != nil {
		return "", fmt.Errorf("failed to add encryption subkey: %w", err)
	}

	return fingerprint, nil
}

func signKey(fingerprint string) error {
	cmd := exec.Command("gpg", "--batch", "--yes", "--sign-key", fingerprint)
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr
	return cmd.Run()
}

func exportPublicKey(fingerprint, path string) error {
	out, err := exec.Command("gpg", "--armor", "--export", fingerprint).Output()
	if err != nil {
		return err
	}
	return os.WriteFile(path, out, 0o644)
}

func storePrivateKeyInSecrets(fingerprint string) error {
	privKey, err := exec.Command("gpg", "--armor", "--export-secret-keys", fingerprint).Output()
	if err != nil {
		return fmt.Errorf("failed to export private key: %w", err)
	}

	cmd := exec.Command("gh", "secret", "set", "STATUS_GPG_PRIVATE_KEY",
		"--body", string(privKey))
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr
	return cmd.Run()
}

func encryptFile(inputPath, outputPath, fingerprint string) error {
	cmd := exec.Command("gpg", "--encrypt", "--armor",
		"--trust-model", "always",
		"--recipient", fingerprint,
		"--output", outputPath,
		inputPath)
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr
	return cmd.Run()
}

func deletePrivateKey(fingerprint string) error {
	cmd := exec.Command("gpg", "--batch", "--yes", "--delete-secret-keys", fingerprint)
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr
	return cmd.Run()
}
