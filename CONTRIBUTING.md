# Contributing to BaleFire

Thank you for your interest in contributing to BaleFire.

## Getting Started

1. Fork the repository
2. Clone your fork: `git clone git@github.com:YOUR_USERNAME/status.git`
3. Install dependencies: `npm install`
4. Set up git hooks: `cp git-hooks/pre-commit .git/hooks/pre-commit && chmod +x .git/hooks/pre-commit`

## Development Workflow

```bash
make build          # Build the SPA
make test           # Run unit + integration tests
make lint           # TypeScript type checking
make cover          # Coverage report (must be >= 98%)
make pdv            # Post-deployment verification (requires running server)
make clean          # Clean build artifacts
```

## Before Submitting a PR

The pre-commit hook enforces all checks automatically:

1. `make clean` -- clean build state
2. `make lint` -- TypeScript type checking passes
3. `make test` -- all tests pass
4. `make build` -- SPA builds successfully
5. `make cover` -- coverage >= 98%

## Commit Messages

Use conventional commits:
- `feat:` -- new feature
- `fix:` -- bug fix
- `test:` -- test additions
- `docs:` -- documentation
- `refactor:` -- code restructuring
- `perf:` -- performance improvement
- `chore:` -- tooling, CI, etc.
- `status:` -- service status update

## Code Style

- TypeScript strict mode
- No third-party dependencies without explicit authorization
- Write tests for new functionality
- Keep pull requests focused and small

## Intellectual Property

- All code must be original work or compatible with the MIT license
- Do not copy code from other projects without license verification

## Security

- Report vulnerabilities privately (see [SECURITY.md](SECURITY.md))
