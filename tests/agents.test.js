const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');

const AGENTS_DIR = path.join(__dirname, '..', '.claude', 'agents');

const EXPECTED_AGENTS = [
  'art-director',
  'audience-analyst',
  'character-designer',
  'concept-architect',
  'continuity-manager',
  'dialogue-writer',
  'episode-compositor',
  'episode-outliner',
  'hook-analyst',
  'letterer',
  'panel-artist-a',
  'panel-artist-b',
  'panel-artist-c',
  'panel-director',
  'panel-validator',
  'platform-ranker',
  'prompt-smith',
  'quality-reviewer',
  'ref-sheet-artist',
  'script-editor',
  'series-plotter',
  'showrunner',
  'tension-engineer',
  'trend-scout',
  'trend-synthesizer',
  'twist-master',
  'worldbuilder',
];

const REQUIRED_SECTIONS = [
  '입력/출력 프로토콜',
  '사용 스킬',
  '팀 통신 프로토콜',
  '재호출 지침',
  '에러 핸들링',
  '협업',
];

function loadAgent(name) {
  const filePath = path.join(AGENTS_DIR, `${name}.md`);
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

describe('Agent definitions', () => {
  test('agents directory exists', () => {
    expect(fs.existsSync(AGENTS_DIR)).toBe(true);
  });

  test('contains exactly 27 agent files', () => {
    const files = fs.readdirSync(AGENTS_DIR).filter((f) => f.endsWith('.md'));
    expect(files).toHaveLength(27);
  });

  test('all expected agents are present', () => {
    const files = fs.readdirSync(AGENTS_DIR).map((f) => f.replace('.md', ''));
    for (const agent of EXPECTED_AGENTS) {
      expect(files).toContain(agent);
    }
  });

  describe.each(EXPECTED_AGENTS)('agent: %s', (agentName) => {
    let parsed;

    beforeAll(() => {
      parsed = loadAgent(agentName);
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

    test('frontmatter "name" matches filename', () => {
      expect(parsed.data.name).toBe(agentName);
    });

    test('frontmatter has "description" field', () => {
      expect(parsed.data.description).toBeDefined();
      expect(typeof parsed.data.description).toBe('string');
      expect(parsed.data.description.length).toBeGreaterThan(0);
    });

    test('frontmatter has "model" field set to "opus"', () => {
      expect(parsed.data.model).toBe('opus');
    });

    test('has a top-level H1 heading', () => {
      const h1Match = parsed.content.match(/^# .+$/m);
      expect(h1Match).not.toBeNull();
    });

    test.each(REQUIRED_SECTIONS)(
      'has required section: %s',
      (sectionPrefix) => {
        const sections = extractH2Sections(parsed.content);
        const found = sections.some((s) => s.includes(sectionPrefix));
        expect(found).toBe(true);
      },
    );

    test('description is non-trivial (> 20 chars)', () => {
      expect(parsed.data.description.length).toBeGreaterThan(20);
    });

    test('body content is non-empty', () => {
      expect(parsed.content.trim().length).toBeGreaterThan(100);
    });

    test('references at least one skill', () => {
      const skillSection = parsed.content.match(
        /## 사용 스킬[\s\S]*?(?=\n## |$)/,
      );
      expect(skillSection).not.toBeNull();
      expect(skillSection[0]).toMatch(/webtoon-/);
    });
  });
});
