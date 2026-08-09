package main

import (
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"strings"

	"github.com/spf13/cobra"
)

var clearCmd = &cobra.Command{
	Use:   "clear",
	Short: "Remove all BaleFire GPG keys from keyring, secrets, and data/",
	Long: `Remove all BaleFire GPG keypairs: deletes keys from the local GPG keyring,
clears the STATUS_GPG_PRIVATE_KEY GitHub Secret, removes data/public.gpg
and all archived keys in data/keys/.

This does NOT preserve old keys. Use this to start fresh before 'rekey init'.`,
	RunE: runClear,
}

func init() {
	rootCmd.AddCommand(clearCmd)
}

func runClear(cmd *cobra.Command, args []string) error {
	repoRoot, err := findRepoRoot()
	if err != nil {
		return fmt.Errorf("not in a git repository: %w", err)
	}

	if err := checkGHCLI(); err != nil {
		return err
	}

	dataDir := filepath.Join(repoRoot, "data")
	keysDir := filepath.Join(dataDir, "keys")

	// Remove BaleFire keys from local keyring
	fmt.Println("Removing BaleFire keys from local GPG keyring...")
	removeBalefireKeys()

	// Remove public key
	pubKeyPath := filepath.Join(dataDir, "public.gpg")
	if _, err := os.Stat(pubKeyPath); err == nil {
		fmt.Println("Removing data/public.gpg...")
		os.Remove(pubKeyPath)
	}

	// Remove archived keys
	if _, err := os.Stat(keysDir); err == nil {
		fmt.Println("Removing data/keys/...")
		os.RemoveAll(keysDir)
	}

	// Remove encrypted status
	encPath := filepath.Join(dataDir, "status.yaml.gpg")
	if _, err := os.Stat(encPath); err == nil {
		fmt.Println("Removing data/status.yaml.gpg...")
		os.Remove(encPath)
	}

	// Clear GitHub Secret
	fmt.Println("Clearing STATUS_GPG_PRIVATE_KEY from GitHub Secrets...")
	clearCmd := exec.Command("gh", "secret", "delete", "STATUS_GPG_PRIVATE_KEY")
	clearCmd.Stdout = os.Stdout
	clearCmd.Stderr = os.Stderr
	if err := clearCmd.Run(); err != nil {
		fmt.Fprintf(os.Stderr, "WARNING: Could not delete secret (may not exist): %v\n", err)
	}

	fmt.Println("")
	fmt.Println("All BaleFire GPG keys cleared.")
	fmt.Println("Run 'rekey init' to generate a fresh keypair.")

	return nil
}

func removeBalefireKeys() {
	// Find all keys with "BaleFire" in the UID
	out, err := exec.Command("gpg", "--list-keys", "--with-colons").Output()
	if err != nil {
		return
	}

	var fingerprints []string
	for _, line := range strings.Split(string(out), "\n") {
		if strings.HasPrefix(line, "uid:") && strings.Contains(line, "BaleFire") {
			// Look back for the fingerprint
		}
		if strings.HasPrefix(line, "fpr:") {
			fields := strings.Split(line, ":")
			if len(fields) >= 10 {
				fingerprints = append(fingerprints, fields[9])
			}
		}
	}

	// More targeted: find keys matching our UID
	uidOut, _ := exec.Command("gpg", "--list-keys", "--with-colons",
		"BaleFire Status").Output()
	for _, line := range strings.Split(string(uidOut), "\n") {
		if strings.HasPrefix(line, "fpr:") {
			fields := strings.Split(line, ":")
			if len(fields) >= 10 {
				fp := fields[9]
				fmt.Printf("  Deleting key %s...\n", fp)
				exec.Command("gpg", "--batch", "--yes", "--delete-secret-and-public-key", fp).Run()
			}
		}
	}
}
