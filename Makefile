.PHONY: clean lint test build pdv cover version version/major version/minor version/patch

clean:
	rm -rf dist .build coverage test-results playwright-report

lint:
	npx tsc --noEmit
	node --experimental-strip-types scripts/lint-status.ts

test:
	node --experimental-strip-types --test tests/unit/**/*.test.ts tests/integration/**/*.test.ts

build:
	node --experimental-strip-types scripts/build.ts

pdv:
	npx playwright test --config playwright.config.ts

cover:
	node --experimental-strip-types scripts/check-coverage.ts

version:
	@if [ -z "$$(git tag -l)" ]; then \
		git tag v0.0.0; \
		echo "Tagged v0.0.0"; \
	else \
		$(MAKE) version/patch; \
	fi

version/major:
	node --experimental-strip-types scripts/bump-version.ts major

version/minor:
	node --experimental-strip-types scripts/bump-version.ts minor

version/patch:
	node --experimental-strip-types scripts/bump-version.ts patch
