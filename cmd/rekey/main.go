package main

import (
	"fmt"
	"os"

	"github.com/spf13/cobra"
)

var expiresIn int

var rootCmd = &cobra.Command{
	Use:   "rekey",
	Short: "GPG key management for BaleFire status encryption",
	Long: `rekey manages GPG keypairs used to encrypt status.yaml in the BaleFire
status page project. The public key is stored in data/ and the private
key is stored in GitHub Secrets.

All keypairs use PQC composite algorithms:
  Signing:    ed25519 + ML-DSA-65
  Encryption: cv25519 + ML-KEM-768`,
}

func init() {
	rootCmd.PersistentFlags().IntVar(&expiresIn, "expires-in", 3650, "Number of days until the keypair expires")
}

func main() {
	if err := rootCmd.Execute(); err != nil {
		fmt.Fprintln(os.Stderr, err)
		os.Exit(1)
	}
}
