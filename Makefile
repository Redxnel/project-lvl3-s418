install:
	npm install

start:
	npx babel-node -- src/bin/page-loader.js

publish:
	npm publish

lint:
	npx eslint .

test:
	npm test

test-watch:
	npm test -- --watch

.PHONY: test