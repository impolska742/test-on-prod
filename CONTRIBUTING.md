# Contributing

Small, focused improvements are welcome. Open an issue before adding a large feature or a dependency.

## Development

1. Fork and clone the repository.
2. Load the folder as an unpacked extension in Chrome, following the README.
3. Edit `content.js`, `content.css`, or `manifest.json`.
4. Reload the extension in `chrome://extensions` and refresh GitHub.

There is no build step or dependency installation. `icons/icon.svg` is the original artwork; the PNGs are its Chrome-compatible exports at 16, 32, 48, and 128 pixels.

If Node.js is installed, check JavaScript syntax with:

```sh
node --check content.js
```

## Before opening a pull request

- Test on a public GitHub PR with both tests and ordinary source files.
- Check initial auto-collapse, both bulk buttons, and manual expansion. A manual override should remain respected when files are loaded again.
- Check deleted source files, deleted tests, and modified files that only remove lines. Only actual deletions should receive a Deleted label.
- Confirm test buttons leave deleted non-test files and Viewed checkboxes alone.
- Check GitHub's current React changes view and legacy files view when available, including in-page navigation and a hidden file tree.
- For UI changes, check light/dark themes and keyboard operation; attach a screenshot without private data.
- Keep changes small, avoid unrelated formatting, and update the README when supported behavior changes.

There is no automated test suite or CI bot. Include the scenarios you exercised in your pull request; a syntax check alone does not prove browser behavior. Focused regression tests are welcome when they defend real behavior without adding unnecessary tooling.

## Bug reports and conduct

Include Chrome version, the affected filename pattern, expected/actual behavior, and a public reproduction when possible. Do not include credentials, private repository content, or screenshots containing sensitive information.

Be respectful. Harassment, discrimination, and sharing others' private information are not welcome. Maintainers may remove abusive content or limit participation. Contributions are accepted under the project's MIT license.
