# BaleFire

A minimal, self-hosted status page built on GitHub Pages. Fork this repo, configure your services, and deploy a clean status page with zero infrastructure.

## Quick Start

1. Fork this repository
2. Run `./setup --url "status.example.com"`
3. Add services: `./update-status --service "API" --status up --message "All systems operational"`
4. Push to trigger deployment

## How It Works

- **`status.yaml`** holds the current status of all services
- **`./update-status`** modifies `status.yaml`, commits, and pushes
- **GitHub Actions** rebuilds and deploys the status page on every `status.yaml` change
- **Playwright PDV tests** verify the deployment after each push

## Usage

### Update a service status

```bash
./update-status --service "API" --status down --message "Investigating connectivity issues"
```

Valid statuses: `up`, `down`, `degraded`

### Setup a fresh fork

```bash
./setup --url "status.example.com"
```

This resets `status.yaml` to defaults, sets the CNAME, installs dependencies, and configures git hooks.

## Development

```bash
npm install                 # Install dependencies
make build                  # Build the SPA
make test                   # Run unit + integration tests
make lint                   # TypeScript type checking
make cover                  # Coverage (must be >= 98%)
make pdv                    # Post-deployment verification tests
make clean                  # Clean build artifacts
```

### Versioning

```bash
make version                # Tag v0.0.0 or bump patch
make version/major          # Bump major version
make version/minor          # Bump minor version
make version/patch          # Bump patch version
```

## Tech Stack

- [SpecifyJS](https://github.com/asymmetric-effort/specifyjs) -- UI framework
- [NogginLessDom](https://www.npmjs.com/package/@asymmetric-effort/nogginlessdom) -- Testing framework
- [Steamroller](https://www.npmjs.com/package/@asymmetric-effort/steamroller) -- Bundler
- [Playwright](https://playwright.dev) -- Post-deployment verification
- GitHub Pages -- Hosting
- GitHub Actions -- CI/CD

## DNS Configuration

Point your custom domain to GitHub Pages:

| Type  | Name   | Value                              |
|-------|--------|------------------------------------|
| CNAME | status | `<your-org>.github.io`             |

## License

[MIT](LICENSE.txt)
