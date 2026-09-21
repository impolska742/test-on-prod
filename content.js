(() => {
  "use strict";

  const toolbarId = "pr-test-files-toolbar";
  if (document.getElementById(toolbarId)) return;

  // GitHub's React diff component and the older Files changed view.
  const headerSelector = '.file-header, [class*="Diff-module__diffHeaderWrapper"]';
  const toggleSelector =
    'button[aria-label="Toggle diff contents"], button:has(.octicon-chevron-down, .octicon-chevron-right)';
  const testDirectory = /(^|\/)(__tests?__|tests?|__specs?__|specs?|e2e|testing|test-d|test[-_](utils|helpers|support)|__fixtures?__|fixtures|__mocks?__|__snapshots__)(\/|$)/i;
  const cypressDirectory = /(^|\/)cypress\/(e2e|integration|component|fixtures|support|plugins)(\/|$)/i;
  // Jest/Vitest/Playwright/Cypress and Bun's underscore variants, including
  // qualified names such as button.test.browser.tsx and index.test-d.ts.
  const testSuffix = /(^|[\/._-])(test|spec|test-d|type-test|e2e|cy|fixture)(\.[^/.]+)*\.[cm]?[jt]sx?$/i;
  const testPrefix = /(^|\/)test[-_][^/]+\.[cm]?[jt]sx?$/i;

  let route = "";
  let mode = false;
  let timer = null;
  const overrides = new Map();
  const deletedOverrides = new Map();
  const deletedAnchors = new Set();
  const attempted = new WeakMap();

  const toolbar = document.createElement("section");
  toolbar.id = toolbarId;
  toolbar.setAttribute("aria-label", "Test file controls");

  const count = document.createElement("span");
  count.className = "prtf-count";
  count.textContent = "Test files";
  count.title = "Amber headers are tests, fixtures, and test support. Bulk actions also apply as GitHub loads more files.";

  const actions = document.createElement("div");
  actions.className = "prtf-actions";
  const collapse = makeButton("Collapse tests", false);
  const expand = makeButton("Expand tests", true);
  actions.append(collapse, expand);

  toolbar.append(count, actions);

  function makeButton(label, expanded) {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = label;
    button.addEventListener("click", () => {
      mode = expanded;
      overrides.clear();
      sync(true);
    });
    return button;
  }

  function isTest(path) {
    // Include test fixtures and support assets; keep documentation visible.
    return !/\.(md|mdx|txt)$/i.test(path) && (
      testDirectory.test(path) ||
      cypressDirectory.test(path) ||
      testSuffix.test(path) ||
      testPrefix.test(path) ||
      /\.snap$/i.test(path)
    );
  }

  function isDeleted(header) {
    return header.getAttribute("data-file-deleted") === "true" ||
      header.closest(".js-file")?.getAttribute("data-file-deleted") === "true" ||
      deletedAnchors.has(header.querySelector('a[href^="#diff-"]')?.getAttribute("href"));
  }

  function filePath(header) {
    // Prefer GitHub's full path metadata, never a truncated visual filename.
    const path = header.getAttribute("data-path") ||
      header.querySelector("[data-file-path]")?.getAttribute("data-file-path") ||
      header.querySelector("a[href^='#diff-'][title]")?.getAttribute("title") ||
      header.querySelector("h3 a, h3 code")?.textContent || "";
    // React wraps filenames in direction markers; they are not part of the path.
    return path.replace(/[\u200e\u200f\u202a-\u202e\u2066-\u2069]/g, "").trim();
  }

  function expandedState(toggle) {
    const value = toggle.getAttribute("aria-expanded");
    if (value === "true" || value === "false") return value === "true";
    if (toggle.querySelector(".octicon-chevron-down")) return true;
    if (toggle.querySelector(".octicon-chevron-right")) return false;
    return null;
  }

  function removeMarks() {
    document.querySelectorAll("[data-prtf-test], [data-prtf-deleted]").forEach(header => {
      header.removeAttribute("data-prtf-test");
      header.removeAttribute("data-prtf-deleted");
    });
  }

  function sync(force = false) {
    const active = /^\/[^/]+\/[^/]+\/pull\/\d+\/(changes|files)(\/|$)/.test(location.pathname);
    const nextRoute = location.pathname + location.search;
    if (nextRoute !== route) {
      route = nextRoute;
      mode = false;
      overrides.clear();
      deletedOverrides.clear();
      deletedAnchors.clear();
      removeMarks();
    }
    if (!active) {
      toolbar.remove();
      return;
    }
    // The React header omits file status. Its file-tree icon carries the actual
    // deletion status, including when the sidebar is hidden. Never infer a
    // deleted file from a diff that merely has zero additions.
    for (const icon of document.querySelectorAll('[role="treeitem"] :is(.octicon-file-removed, .octicon-diff-removed)')) {
      const item = icon.closest('[role="treeitem"]');
      const anchor = item.querySelector('a[href^="#diff-"]')?.getAttribute("href");
      if (anchor) deletedAnchors.add(anchor);
    }
    const headers = document.querySelectorAll(headerSelector);
    const firstFile = document.getElementById("diff-content-parent") ||
      headers[0]?.closest('.js-diff-progressive-container, [class*="Diff-module__diffTargetable"]');
    if (!toolbar.isConnected && firstFile) firstFile.before(toolbar);

    let settled = true;
    for (const header of headers) {
      const path = filePath(header);
      if (!path) continue;
      const test = isTest(path);
      const deleted = isDeleted(header);
      header.toggleAttribute("data-prtf-test", test);
      header.toggleAttribute("data-prtf-deleted", deleted);
      if (!test && !deleted) continue;
      const toggle = header.querySelector(toggleSelector);
      const expanded = toggle ? expandedState(toggle) : null;
      if (!toggle || toggle.disabled || expanded === null) {
        if (test) settled = false;
        continue;
      }
      const fileOverrides = test ? overrides : deletedOverrides;
      const desired = fileOverrides.has(path) ? fileOverrides.get(path) : test ? mode : false;
      if (desired === expanded) {
        attempted.delete(toggle);
        continue;
      }
      // Avoid repeated clicks while React commits an asynchronous state update.
      // A deliberate new bulk action can retry a previously unresponsive button.
      const previous = attempted.get(toggle);
      if ((force && test) || !previous || previous.route !== route || previous.desired !== desired) {
        attempted.set(toggle, { route, desired });
        toggle.click();
        schedule();
      }
      if (test && expandedState(toggle) !== desired) settled = false;
    }

    // A manual override makes the bulk actions available again, including for
    // files currently unmounted by GitHub's virtualized list.
    for (const expanded of overrides.values()) {
      if (expanded !== mode) {
        settled = false;
        break;
      }
    }
    collapse.disabled = settled && mode === false;
    expand.disabled = settled && mode === true;
    collapse.setAttribute("aria-pressed", String(collapse.disabled));
    expand.setAttribute("aria-pressed", String(expand.disabled));
  }

  function schedule() {
    if (timer !== null) return;
    timer = window.setTimeout(() => {
      timer = null;
      sync();
    }, 100);
  }

  // A manual toggle wins over the last bulk choice, even after a React remount.
  document.addEventListener("click", event => {
    if (!event.isTrusted || !(event.target instanceof Element)) return;
    const toggle = event.target.closest("button");
    const header = toggle?.closest(headerSelector);
    if (!header || !toggle.matches(toggleSelector)) return;
    const path = filePath(header);
    const expanded = expandedState(toggle);
    if (expanded === null) return;
    if (isTest(path)) overrides.set(path, !expanded);
    else if (isDeleted(header)) deletedOverrides.set(path, !expanded);
  }, true);

  const observer = new MutationObserver(records => {
    if (records.some(record => {
      if (toolbar.contains(record.target)) return false;
      if (record.type === "attributes") return true;
      return [...record.addedNodes, ...record.removedNodes].some(node => node !== toolbar);
    })) schedule();
  });
  observer.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ["aria-expanded", "data-path", "data-file-path", "data-file-deleted", "class"],
  });
  window.addEventListener("popstate", schedule);
  window.navigation?.addEventListener("navigatesuccess", schedule);
  document.addEventListener("turbo:load", schedule);
  document.addEventListener("pjax:end", schedule);
  sync();
})();
