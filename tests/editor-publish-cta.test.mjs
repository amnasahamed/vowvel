import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { stripTypeScriptTypes } from 'node:module';
import { renderToStaticMarkup } from 'react-dom/server';
import React from 'react';

const editorSource = await readFile(new URL('../src/Editor.tsx', import.meta.url), 'utf8');
const analyticsSource = await readFile(new URL('../src/analytics.ts', import.meta.url), 'utf8');
const { trackStep } = await import('data:text/javascript;base64,' + Buffer.from(stripTypeScriptTypes(analyticsSource)).toString('base64'));

function extractBanner(source){
  const match = source.match(/<div className="editor-publish-banner">([\s\S]+?)<\/div>/);
  assert.ok(match, 'editor must render an editor-publish-banner element');
  return match[1];
}

function extractContinueToCheckout(source){
  const start = source.indexOf('async function continueToCheckout');
  if (start < 0) return null;
  const open = source.indexOf('{', start);
  if (open < 0) return null;
  let depth = 1;
  let i = open + 1;
  while (i < source.length && depth > 0){
    const ch = source[i];
    if (ch === '{') depth += 1;
    else if (ch === '}') depth -= 1;
    i += 1;
  }
  if (depth !== 0) return null;
  return source.slice(open + 1, i - 1);
}

test('editor-publish-banner renders zero buttons after the duplicate CTA is removed', () => {
  const banner = extractBanner(editorSource);
  assert.equal(/<button/i.test(banner), false, 'banner must not contain any <button> element');
});

test('editor-publish-banner copy is informational only and matches the new wording exactly', () => {
  const banner = extractBanner(editorSource);
  const paragraph = banner.match(/<p>([\s\S]+?)<\/p>/);
  assert.ok(paragraph, 'banner must contain a <p> with the pricing copy');
  assert.equal(
    paragraph[1],
    'Draft free · ₹2,499 or $40 internationally — publish when you’re ready.',
    'banner copy must match the exact string from the audit',
  );
  assert.equal(
    /Ready to publish|Continue to publish|Start free|Publish now/i.test(paragraph[1]),
    false,
    'banner <p> must not contain CTA-shaped verbs',
  );
  assert.equal(
    /[Pp]ublish when ready/.test(paragraph[1]),
    false,
    'banner <p> must not echo the old "Publish when ready" wording',
  );
});

test('the header keeps exactly one Ready to publish CTA wired to continueToCheckout', () => {
  const headerMatch = editorSource.match(/<header className="editor-header">([\s\S]+?)<\/header>/);
  assert.ok(headerMatch, 'editor must render an editor-header element');
  const header = headerMatch[1];
  const readyButtons = [...header.matchAll(/>Ready to publish </g)];
  assert.equal(readyButtons.length, 1, 'header must contain exactly one "Ready to publish" CTA');
  assert.match(
    header,
    /<button className="button compact" onClick=\{continueToCheckout\}>Ready to publish /,
    'header CTA must call continueToCheckout',
  );
});

test('continueToCheckout fires editor_ready_to_publish_clicked exactly once on entry', () => {
  const body = extractContinueToCheckout(editorSource);
  assert.ok(body, 'continueToCheckout handler must exist');
  const occurrences = (body.match(/editor_ready_to_publish_clicked/g) || []).length;
  assert.equal(
    occurrences,
    1,
    'continueToCheckout must call trackStep("editor_ready_to_publish_clicked", …) exactly once — no double-fire',
  );
  assert.ok(
    /trackStep\(\s*['"]editor_ready_to_publish_clicked['"]\s*,\s*\{/.test(body),
    'the call must pass the funnel params object',
  );
});

test('the editor source contains exactly one "Ready to publish" CTA after the duplicate is removed', () => {
  const occurrences = (editorSource.match(/Ready to publish </g) || []).length;
  assert.equal(occurrences, 1, 'only the header CTA should remain after the duplicate is removed');
});

function EditorSurface({ theme: _theme }){
  const onContinue = () => {
    trackStep('editor_ready_to_publish_clicked', { theme: _theme, review: false, updating: false });
  };
  return React.createElement(
    'div',
    { className: 'editor-page' },
    React.createElement(
      'header',
      { className: 'editor-header' },
      React.createElement(
        'div',
        { className: 'editor-actions' },
        React.createElement(
          'button',
          { className: 'button compact', onClick: onContinue, type: 'button' },
          'Ready to publish ',
          React.createElement('span', { 'data-arrow': true, className: 'arrow' }),
        ),
      ),
    ),
    React.createElement(
      'div',
      { className: 'editor-publish-banner' },
      React.createElement('p', null, 'Draft free · ₹2,499 or $40 internationally — publish when you’re ready.'),
    ),
    React.createElement('div', { className: 'editor-mobile-switch' }),
  );
}

function stubBrowser(){
  const tracking = { gtag: [], fetch: [] };
  const originalWindow = globalThis.window;
  const originalLocation = globalThis.location;
  const originalFetch = globalThis.fetch;
  globalThis.window = { gtag: (...args) => { tracking.gtag.push(args); }, location: { hash: '#/create/gulmohar' } };
  globalThis.location = globalThis.window.location;
  globalThis.fetch = (url, options) => {
    tracking.fetch.push({ url, options });
    return Promise.resolve(new Response(null, { status: 204 }));
  };
  return {
    tracking,
    restore(){
      globalThis.fetch = originalFetch;
      if (originalWindow !== undefined) globalThis.window = originalWindow; else delete globalThis.window;
      if (originalLocation !== undefined) globalThis.location = originalLocation; else delete globalThis.location;
    },
  };
}

test('rendered editor surface shows exactly one Ready to publish CTA and zero banner buttons', () => {
  const env = stubBrowser();
  try {
    const html = renderToStaticMarkup(React.createElement(EditorSurface, { theme: 'gulmohar' }));

    const bannerMatch = html.match(/<div class="editor-publish-banner">([\s\S]*?)<\/div><div class="editor-mobile-switch"/);
    assert.ok(bannerMatch, 'rendered HTML must include the editor-publish-banner before the mobile switch');
    assert.equal(/<button/i.test(bannerMatch[1]), false, 'rendered banner must not contain a <button> element');
    assert.match(
      bannerMatch[1],
      /Draft free · ₹2,499 or \$40 internationally — publish when you(?:&rsquo;|’)re ready\./,
      'rendered banner copy must match the new wording',
    );

    const readyToPublishMatches = [...html.matchAll(/>Ready to publish </g)];
    assert.equal(readyToPublishMatches.length, 1, 'rendered HTML must contain exactly one Ready to publish CTA');

    const headerMatch = html.match(/<header class="editor-header"[\s\S]*?<\/header>/);
    assert.ok(headerMatch, 'rendered HTML must include the editor-header');
    assert.match(headerMatch[0], /<button class="button compact"[^>]*>Ready to publish /);
  } finally {
    env.restore();
  }
});

test('clicking the only Ready to publish CTA fires editor_ready_to_publish_clicked exactly once per click', () => {
  const env = stubBrowser();
  try {
    let clickHandler = null;
    function ClickCapturingEditor(){
      clickHandler = () => {
        trackStep('editor_ready_to_publish_clicked', { theme: 'gulmohar', review: false, updating: false });
      };
      return React.createElement(
        'div',
        null,
        React.createElement(
          'header',
          { className: 'editor-header' },
          React.createElement(
            'button',
            { className: 'button compact', onClick: clickHandler, type: 'button' },
            'Ready to publish ',
          ),
        ),
        React.createElement(
          'div',
          { className: 'editor-publish-banner' },
          React.createElement('p', null, 'Draft free · ₹2,499 or $40 internationally — publish when you’re ready.'),
        ),
      );
    }

    renderToStaticMarkup(React.createElement(ClickCapturingEditor));
    assert.equal(typeof clickHandler, 'function', 'rendering must produce a click handler');

    clickHandler();
    clickHandler();

    const funnelEvents = env.tracking.fetch
      .map(call => { try { return JSON.parse(call.options.body).eventName; } catch { return null; } })
      .filter(name => name === 'editor_ready_to_publish_clicked');
    assert.equal(funnelEvents.length, 2, 'one trackStep call per click → two clicks → two funnel events');
    assert.equal(
      env.tracking.gtag.filter(args => args[1] === 'editor_ready_to_publish_clicked').length,
      2,
      'one gtag event per click → two clicks → two gtag calls',
    );
  } finally {
    env.restore();
  }
});
