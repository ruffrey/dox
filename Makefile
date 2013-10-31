
TESTS = test/*.test.js
REPORTER = dot

test:
	@NODE_ENV=test ./node_modules/.bin/mocha \
		--ui exports \
		--reporter $(REPORTER) \
		$(TESTS)

docs:
	@mkdir -p docs; \
	./bin/dox --api < lib/dox.js > \
	docs/index.md

doc-server:
	@./bin/dox \
		--server docs

.PHONY: test docs