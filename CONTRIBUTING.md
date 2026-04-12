# Contributing to Ravenswood Archive

Thanks for your interest in contributing! This guide covers **code contributions** to the Ravenswood Archive web app. A few things are handled elsewhere - please read the relevant section before opening a PR.

## What goes where

- **Script submissions** are handled through the website UI, not GitHub. Sign in at [ravenswoodarchive.com](https://ravenswoodarchive.com) and use the submit form.
- **Translations** live on Weblate at [translation.botc.app/projects/botc-app](https://translation.botc.app/projects/botc-app/). The files in `public/translations/` are pulled from Weblate by an automated workflow - **please do not edit them directly in this repo.** PRs that modify those files will be closed.
- **Code, bug fixes, and features** - that's what this repo is for.

## Questions and discussion

- General questions or ideas: open a [GitHub Discussion](https://github.com/Dan-314/ravenswood-archive/discussions)
- Bug reports and feature requests: open a [GitHub Issue](https://github.com/Dan-314/ravenswood-archive/issues)
- Anything sensitive or off-topic for public threads: email [dan@ravenswoodarchive.com](mailto:dan@ravenswoodarchive.com)

If you're planning a larger change, please open an issue or discussion first so we can talk through the approach before you spend time on it.

## Development setup

See the [README](README.md#getting-started) for prerequisites, environment variables, and how to run the dev server.

Quick version:

```bash
npm install
cp .env.example .env.local   # fill in Supabase credentials
npx supabase db push
npm run dev
```

Before opening a PR, please run:

```bash
npm run lint
npm run build
```

Both should pass cleanly.

## Pull request workflow

1. Fork the repo and create a branch from `main`.
2. Make your changes. Keep PRs focused - one logical change per PR is much easier to review than a sprawling one.
3. Run lint and build locally.
4. Open a PR against `main`. Describe **what** changed and **why**, and link any related issue.
5. A maintainer will review. Expect some back-and-forth - it's normal, not personal.

If your PR touches the database schema, include the migration in `supabase/migrations/` and explain any backfill or RLS implications in the PR description.

## Commit messages

Keep it simple: a short imperative summary, lowercase, no trailing period.

Good:

```
fix bracket seeding off-by-one
add markdown preview to submit form
update supabase types
```

Less good:

```
Fixed a bug.
WIP
asdf
```

If a commit needs more context than fits in the summary, add a blank line and a paragraph explaining the why.

## Code style

- **TypeScript** - prefer explicit types at module boundaries; let inference handle the rest.
- **ESLint** - `npm run lint` must pass. Don't disable rules without a reason in a comment.
- **Components** - match the conventions of existing files in the same directory (server vs. client components, file naming, prop shapes).
- **No comments for what the code does** - the code should say that. Reserve comments for *why* something non-obvious is the way it is.

## Reporting security issues

Please **do not** open public issues for security vulnerabilities. Email [dan@ravenswoodarchive.com](mailto:dan@ravenswoodarchive.com) directly and we'll coordinate a fix.

## Code of Conduct

This project follows the [Contributor Covenant](CODE_OF_CONDUCT.md). By participating, you agree to abide by its terms.

## License

By contributing, you agree that your contributions will be licensed under the [GNU Affero General Public License v3.0](LICENSE), the same license as the rest of the project.
