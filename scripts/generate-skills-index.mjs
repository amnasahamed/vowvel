import fs from 'node:fs/promises';
import crypto from 'node:crypto';
import path from 'node:path';

const SKILLS_DIR = 'public/.well-known/agent-skills';
const INDEX_FILE = path.join(SKILLS_DIR, 'index.json');
const SCHEMA_URL = 'https://schemas.agentskills.io/discovery/0.2.0/schema.json';
const SKILL_FILE = 'SKILL.md';

const die = (msg, err) => {
  console.error(`generate-skills-index: ${msg}`);
  if (err) console.error(err.stack || err.message || err);
  process.exit(1);
};

const extractDescription = (text) => {
  let sawH1 = false;
  for (const raw of text.split('\n')) {
    const line = raw.trim();
    if (!sawH1) {
      if (line.startsWith('# ')) sawH1 = true;
      continue;
    }
    if (line === '') continue;
    if (line.startsWith('#')) continue;
    return line;
  }
  return '';
};

const main = async () => {
  let entries;
  try {
    entries = await fs.readdir(SKILLS_DIR, { withFileTypes: true });
  } catch (err) {
    die(`cannot read skills directory "${SKILLS_DIR}"`, err);
  }

  const skills = [];
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const name = entry.name;
    if (name.startsWith('.')) continue;
    const skillPath = path.join(SKILLS_DIR, name, SKILL_FILE);
    let bytes;
    try {
      bytes = await fs.readFile(skillPath);
    } catch (err) {
      if (err.code === 'ENOENT') continue;
      die(`cannot read ${skillPath}`, err);
    }
    const sha256 = crypto.createHash('sha256').update(bytes).digest('hex');
    const description = extractDescription(bytes.toString('utf8'));
    skills.push({
      name,
      type: 'skill-md',
      description,
      url: `/.well-known/agent-skills/${name}/${SKILL_FILE}`,
      digest: `sha256:${sha256}`
    });
  }

  skills.sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0));

  const index = { $schema: SCHEMA_URL, skills };

  const body = JSON.stringify(index, null, 2) + '\n';
  try {
    await fs.writeFile(INDEX_FILE, body);
  } catch (err) {
    die(`cannot write ${INDEX_FILE}`, err);
  }

  console.log(`generate-skills-index: wrote ${INDEX_FILE} (${skills.length} skill${skills.length === 1 ? '' : 's'})`);
};

main().catch((err) => die('unexpected failure', err));