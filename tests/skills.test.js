const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');

const SKILLS_DIR = path.join(__dirname, '..', '.claude', 'skills');

const EXPECTED_SKILLS = [
  'webtoon-assembly',
  'webtoon-orchestrator',
  'webtoon-panel-breakdown',
  'webtoon-panel-render',
  'webtoon-scenario',
  'webtoon-trend-research',
];

function loadSkill(name) {
  const filePath = path.join(SKILLS_DIR, name, 'SKILL.md');
  const raw = fs.readFileSync(filePath, 'utf-8');
  return matter(raw);
}

function extractH2Sections(content) {
  const regex = /^## (.+)$/gm;
  const sections = [];
  let match;
  while ((match = regex.exec(content)) !== null) {
    sections.push(match[1].trim());
  }
  return sections;
}

describe('Skill definitions', () => {
  test('skills directory exists', () => {
    expect(fs.existsSync(SKILLS_DIR)).toBe(true);
  });

  test('contains exactly 6 skill directories', () => {
    const dirs = fs
      .readdirSync(SKILLS_DIR)
      .filter((d) =>
        fs.statSync(path.join(SKILLS_DIR, d)).isDirectory(),
      );
    expect(dirs).toHaveLength(6);
  });

  test('all expected skills are present', () => {
    const dirs = fs.readdirSync(SKILLS_DIR);
    for (const skill of EXPECTED_SKILLS) {
      expect(dirs).toContain(skill);
    }
  });

  describe.each(EXPECTED_SKILLS)('skill: %s', (skillName) => {
    let parsed;
    let skillDir;

    beforeAll(() => {
      skillDir = path.join(SKILLS_DIR, skillName);
      parsed = loadSkill(skillName);
    });

    test('has SKILL.md file', () => {
      expect(
        fs.existsSync(path.join(skillDir, 'SKILL.md')),
      ).toBe(true);
    });

    test('has valid YAML frontmatter', () => {
      expect(parsed.data).toBeDefined();
      expect(typeof parsed.data).toBe('object');
    });

    test('frontmatter has "name" field', () => {
      expect(parsed.data.name).toBeDefined();
      expect(typeof parsed.data.name).toBe('string');
      expect(parsed.data.name.length).toBeGreaterThan(0);
    });

    test('frontmatter "name" matches directory name', () => {
      expect(parsed.data.name).toBe(skillName);
    });

    test('frontmatter has "description" field', () => {
      expect(parsed.data.description).toBeDefined();
      expect(typeof parsed.data.description).toBe('string');
      expect(parsed.data.description.length).toBeGreaterThan(0);
    });

    test('has a top-level H1 heading', () => {
      const h1Match = parsed.content.match(/^# .+$/m);
      expect(h1Match).not.toBeNull();
    });

    test('description is non-trivial (> 50 chars)', () => {
      expect(parsed.data.description.length).toBeGreaterThan(50);
    });

    test('body content is substantial (> 500 chars)', () => {
      expect(parsed.content.trim().length).toBeGreaterThan(500);
    });

    test('has at least 2 H2 sections', () => {
      const sections = extractH2Sections(parsed.content);
      expect(sections.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('skill reference files', () => {
    const EXPECTED_REFERENCES = {
      'webtoon-assembly': ['qa-checks.md'],
      'webtoon-scenario': ['genre-tropes.md', 'twist-patterns.md'],
      'webtoon-panel-breakdown': ['composition-grammar.md'],
      'webtoon-trend-research': ['observation-frames.md'],
    };

    test.each(Object.entries(EXPECTED_REFERENCES))(
      '%s has expected reference files',
      (skillName, expectedFiles) => {
        const refsDir = path.join(SKILLS_DIR, skillName, 'references');
        expect(fs.existsSync(refsDir)).toBe(true);
        const files = fs.readdirSync(refsDir);
        for (const expected of expectedFiles) {
          expect(files).toContain(expected);
        }
      },
    );

    test('webtoon-assembly has viewer-template.html asset', () => {
      const assetPath = path.join(
        SKILLS_DIR,
        'webtoon-assembly',
        'assets',
        'viewer-template.html',
      );
      expect(fs.existsSync(assetPath)).toBe(true);
    });
  });
});
