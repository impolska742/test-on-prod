# Test on Prod 🗿

A small Chrome extension for reviewing GitHub pull requests without wading through every test and deleted file.

## What it does

- Auto-collapses test/support files and fully deleted files on PR `/changes` and `/files` pages.
- Marks tests with amber headers, deleted files with red headers, and deleted tests with both labels.
- Adds **Collapse tests** and **Expand tests**. Green means available; yellow means active and disabled. No click notifications.
- Handles files loaded later and respects manual expansion within the current view.
- Leaves ordinary source files and GitHub's **Viewed** status alone. Test buttons do not change deleted non-test files.

## Install

1. Download this repository with **Code → Download ZIP** and extract it, or clone it:
   ```sh
   git clone https://github.com/impolska742/test-on-prod.git
   ```
2. Open `chrome://extensions` and enable **Developer mode**.
3. Click **Load unpacked** and select the folder containing `manifest.json`.
4. Refresh your GitHub PR's changes page.

No build, package installation, account, or token required. To update, pull/download the latest files, reload the extension, then refresh GitHub.

## Language and test support

| Language | Extensions |
| --- | --- |
| JavaScript | `.js`, `.jsx`, `.mjs`, `.cjs` |
| TypeScript | `.ts`, `.tsx`, `.mts`, `.cts` |

Recognizes common Jest, Vitest, Playwright, Cypress, Bun, Node.js, AVA, Mocha, and Jasmine naming conventions:

- `*.test.*`, `*.spec.*`, `*_test.*`, `*_spec.*`, `*-test.*`, `test.*`, `test-*`, `test_*`
- `*.cy.*`, `*.e2e.*`, `*.e2e-spec.*`, `*.test-d.*`, `*.type-test.*`, `*.fixture.*`, `*.snap`
- Qualified names such as `button.test.browser.tsx`
- Test folders such as `test/`, `tests/`, `__tests__/`, `spec/`, `specs/`, `__specs__/`, `e2e/`, `testing/`, and `test-d/`
- Test support such as `test-utils/`, `test-helpers/`, `test-support/`, `fixtures/`, `__fixtures__/`, `__mocks__/`, and `__snapshots__/`
- Cypress `e2e/`, `integration/`, `component/`, `support/`, `fixtures/`, and `plugins/` folders

Files inside recognized test/support folders are grouped regardless of extension. Markdown and `.txt` files stay visible unless deleted. Fully deleted files are recognized independently of language.

Detection is based on paths and GitHub's file-status markers, not source analysis or test-runner configuration. Arbitrarily named tests may not be detected. GitHub UI changes can require selector updates; GitHub Enterprise domains are not currently supported.

## Privacy

Runs locally on `github.com`. No analytics, network requests, storage, remote code, or GitHub token. It reads file paths and status markers from the page and operates GitHub's own collapse controls. Access to GitHub pages also allows it to handle in-page navigation.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md). Report vulnerabilities privately using [SECURITY.md](SECURITY.md).

## License

[MIT](LICENSE), including the original icon artwork. Independent project; not affiliated with GitHub.
