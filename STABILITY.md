# API Stability Policy

Bailfire follows [Semantic Versioning 2.0.0](https://semver.org/).

## Versioning

| Version Component | When to Bump | Examples |
|---|---|---|
| **Major (X.0.0)** | Breaking API changes | Removing an export, changing a function signature |
| **Minor (0.X.0)** | New backwards-compatible features | Adding a new module or function |
| **Patch (0.0.X)** | Bug fixes and non-functional changes | Fixing a bug, improving performance |

## Stability Tiers

### Tier 1: Stable

Public APIs follow the full deprecation process before removal.

### Tier 2: Experimental

APIs marked `@experimental` may change in minor releases without a deprecation period.

### Tier 3: Internal

Unexported internals have no stability guarantees.

## Deprecation Process

1. Old API is marked deprecated with a warning in a minor release
2. Documentation is updated with migration guidance
3. Deprecated API is removed in the next major release

## Reporting Issues

If you encounter an unintended breaking change, please file an issue.
