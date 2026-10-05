import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const editorSource = await readFile(new URL('../src/Editor.tsx', import.meta.url), 'utf8');
const editorCss = await readFile(new URL('../src/editor.css', import.meta.url), 'utf8');
const analyticsSource = await readFile(new URL('../src/analytics.ts', import.meta.url), 'utf8');
const funnelSource = await readFile(new URL('../worker/funnel.ts', import.meta.url), 'utf8');

test('Editor: 3-stage progress indicator maps tabs to compact stages', () => {
  assert.match(editorSource, /editor-stages/, 'Editor must render the 3-stage progress list');
  assert.match(editorSource, /stageOfTab/, 'Editor must compute the current stage from the active tab');
  assert.match(editorSource, /'The essentials'/, 'Stage 1 label must read "The essentials"');
  assert.match(editorSource, /'Make it yours'/, 'Stage 2 label must read "Make it yours"');
  assert.match(editorSource, /'Ready to share'/, 'Stage 3 label must read "Ready to share"');
  assert.match(editorSource, /aria-current=\{stage===item\.stage\?'step':undefined\}/, 'Active stage must announce itself as the current step');
});

test('Editor: save status shows a short mobile chip and the long desktop label', () => {
  assert.match(editorSource, /save-status-chip--short/, 'Editor must render a short save-status chip');
  assert.match(editorSource, /save-status-text--long/, 'Editor must keep a long save-status text variant');
  assert.match(editorCss, /\.save-status-chip--short\{display:none\}/, 'Short chip must be hidden on desktop by default');
  assert.match(editorCss, /\.save-status-text--long\{display:inline\}/, 'Long text must be visible on desktop by default');
  assert.match(editorCss, /@media\(max-width:767px\)\{[\s\S]*?\.save-status-text--long\{display:none!important\}[\s\S]*?\.save-status-chip--short\{display:inline-flex/, 'On mobile the long text hides and the short chip shows');
});

test('Editor: validation does not force the user out of mobile preview mode', () => {
  assert.match(editorSource, /fieldRef/, 'Editor must keep refs to required fields for focus management');
  const continueBlock = editorSource.match(/async function continueToCheckout\(\)\{([\s\S]*?setError\('This device couldn)|(async function continueToCheckout\(\)\{[\s\S]*)/);
  const body = continueBlock ? continueBlock[1] || continueBlock[2] : null;
  assert.ok(body, 'Editor must define continueToCheckout');
  assert.doesNotMatch(body, /setError\('Add both names/, 'continueToCheckout must not set the old "Add both names" top-level error');
  assert.match(body, /setErrors\(previous=>\(\{\.\.\.previous,\.\.\.fieldErrors\}\)/, 'continueToCheckout must merge field errors into the errors state');
  assert.match(body, /scrollIntoView/, 'continueToCheckout must scroll to the first invalid field');
  assert.match(body, /focus\(\{preventScroll:true\}\)/, 'continueToCheckout must focus the invalid field');
  assert.match(body, /if\(mobilePreview\)setMobilePreview\(false\)/, 'continueToCheckout must only exit preview mode when the user is on mobile preview');
});

test('Editor: per-field error state replaces the single top-level error for field validation', () => {
  assert.match(editorSource, /const \[errors,setErrors\]=useState/, 'Editor must track field errors as a record');
  assert.match(editorSource, /const \[touched,setTouched\]=useState/, 'Editor must track touched fields');
  assert.match(editorSource, /markTouched/, 'Editor must expose a markTouched helper');
  assert.match(editorSource, /clearError/, 'Editor must expose a clearError helper');
  assert.match(editorSource, /Field[\s\S]*?error=\{touched\.name1\?errors\.name1\|\|'':''\}/, 'Essentials name1 field must show its field error inline');
  assert.match(editorSource, /Field[\s\S]*?error=\{touched\.name2\?errors\.name2\|\|'':''\}/, 'Essentials name2 field must show its field error inline');
});

test('Editor: required and optional fields are consistently labeled', () => {
  assert.match(editorSource, /function Field\([\s\S]*?required\?:boolean/, 'Field component must support a required prop');
  assert.match(editorSource, /function Field\([\s\S]*?optional\?:boolean/, 'Field component must support an optional prop');
  assert.match(editorSource, /function Field\([\s\S]*?counter\?:string/, 'Field component must support a character counter prop');
  assert.match(editorSource, /function Field\([\s\S]*?counterMax\?:number/, 'Field component must support a counter max prop');
  assert.match(editorSource, /Field label="Your name" required/, 'Your name must be marked required');
  assert.match(editorSource, /Field label="Their name" required/, 'Their name must be marked required');
  assert.match(editorSource, /Field label="Event name" required/, 'Event name must be marked required');
  assert.match(editorSource, /Field label="Your welcome" optional/, 'Your welcome must be marked optional');
  assert.match(editorCss, /\.field-required\{/, 'field-required CSS class must be defined');
  assert.match(editorCss, /\.field-optional\{/, 'field-optional CSS class must be defined');
  assert.match(editorCss, /\.field-counter\{/, 'field-counter CSS class must be defined');
  assert.match(editorCss, /\.field-error\{/, 'field-error CSS class must be defined');
  assert.match(editorCss, /\.field\.is-invalid/, 'is-invalid state must highlight the field input border');
});

test('Editor: blur-time validation fires for required name fields and clears errors as the user types', () => {
  assert.match(editorSource, /onBlur=\{\(\)=>\{markTouched\('name1'\);if\(!data\.name1\.trim\(\)\)setErrors/, 'name1 must validate on blur');
  assert.match(editorSource, /onBlur=\{\(\)=>\{markTouched\('name2'\);if\(!data\.name2\.trim\(\)\)setErrors/, 'name2 must validate on blur');
  assert.match(editorSource, /onChange=\{e=>\{const value=e\.target\.value;update\(\{name1:value\}\);if\(value\.trim\(\)\)clearError\('name1'\);/, 'name1 must clear its error as the user types');
  assert.match(editorSource, /onChange=\{e=>\{const value=e\.target\.value;update\(\{name2:value\}\);if\(value\.trim\(\)\)clearError\('name2'\);/, 'name2 must clear its error as the user types');
});

test('Editor: character counters are wired for the long text fields', () => {
  assert.match(editorSource, /Field label="Your name" required htmlFor="editor-name1"[\s\S]*?counter=\{data\.name1\} counterMax=\{45\}/, 'name1 field must show a 45-character counter');
  assert.match(editorSource, /Field label="Their name" required htmlFor="editor-name2"[\s\S]*?counter=\{data\.name2\} counterMax=\{45\}/, 'name2 field must show a 45-character counter');
  assert.match(editorSource, /Field label="Your welcome" optional counter=\{data\.welcome\} counterMax=\{900\}/, 'welcome field must show a 900-character counter');
  assert.match(editorSource, /Field label="Your story" optional counter=\{data\.story\} counterMax=\{1800\}/, 'story field must show a 1800-character counter');
  assert.match(editorSource, /Field label="Dress code" optional counter=\{data\.dressCode\} counterMax=\{500\}/, 'dress code field must show a 500-character counter');
  assert.match(editorSource, /Field label="A note about gifts" optional counter=\{data\.gifts\} counterMax=\{500\}/, 'gifts field must show a 500-character counter');
});

test('Editor: editor_validation_shown funnel event is wired for measurement', () => {
  assert.match(editorSource, /trackStep\('editor_validation_shown'/, 'Editor must fire editor_validation_shown on validation');
  assert.match(analyticsSource, /'editor_validation_shown'/, 'analytics.ts must allow editor_validation_shown');
  assert.match(funnelSource, /'editor_validation_shown'/, 'worker/funnel.ts must allow editor_validation_shown');
});
