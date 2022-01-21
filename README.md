# The Data Explorer API

---

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://github.com/zimmerman-team/the-data-explorer/blob/main/LICENSE.MD)

## What is the Data Explorer API?

## About the project

- Website: <a href="https://data.theglobalfund.org" target="_blank">data.theglobalfund.org</a>
- Authors: <a href="https://www.zimmerman.team/" target="_blank">Zimmerman</a>
- Github Repo:
  - Frontend: <a href="https://github.com/zimmerman-zimmerman/the-data-explorer" target="_blank">https://github.com/zimmerman-zimmerman/the-data-explorer</a>
  - Backend: <a href="https://github.com/zimmerman-zimmerman/the-data-explorer-api" target="_blank">https://github.com/zimmerman-zimmerman/the-data-explorer-api</a>

## Install dependencies

Whenever dependencies in `package.json` are changed, run the following command:

```sh
yarn install
```

## Run the application in development mode

```sh
yarn dev
```

Open http://localhost:4200 in your browser. Changes will be reflected once you save them.

## Build and deploy with pm2

```sh
yarn deploy
```

## Fix code style and formatting issues

```sh
yarn run lint
```

To automatically fix such issues:

```sh
yarn run lint:fix
```

## Other useful commands

- `yarn run openapi-spec`: Generate OpenAPI spec into a file
- `yarn run docker:build`: Build a Docker image for this application
- `yarn run docker:run`: Run this application inside a Docker container

## How should I contribute?

- As we use semantic-release for automated git releases your commits must comply with the following commit types:

```
feat: A new feature
fix: A bug fix
docs: Documentation only changes
style: Changes that do not affect the meaning of the code (white-space, formatting, missing semi-colons, etc)
refactor: A code change that neither fixes a bug nor adds a feature
perf: A code change that improves performance
test: Adding missing or correcting existing tests
chore: Changes to the build process or auxiliary tools and libraries such as documentation generation
```

- Always try to reference issues in commit messages or pull requests ("related to #614", "closes #619" and etc.).
- Avoid huge code commits where the difference can not even be rendered by browser based web apps (Github for example). Smaller commits make it much easier to understand why and how the changes were made, why (if) it results in certain bugs and etc.
- If there's a reason to commit code that is commented out (there usually should be none), always leave a "FIXME" or "TODO" comment so it's clear for other developers why this was done.
- Automatic code quality / testing checks (continuous integration tools) are implemented to check all these things automatically when pushing / merging new branches. Quality is the key!
