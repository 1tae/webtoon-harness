const fs = require('fs');
const path = require('path');

const QA_CHECKS_PATH = path.join(
  __dirname,
  '..',
  '.claude',
  'skills',
  'webtoon-assembly',
  'references',
  'qa-checks.md',
);

let qaContent;

beforeAll(() => {
  qaContent = fs.readFileSync(QA_CHECKS_PATH, 'utf-8');
});

describe('QA checks reference', () => {
  test('file exists', () => {
    expect(fs.existsSync(QA_CHECKS_PATH)).toBe(true);
  });

  test('has H1 title', () => {
    expect(qaContent).toMatch(/^# .+/m);
  });

  describe('required check sections', () => {
    test('has panel count check (50+)', () => {
      expect(qaContent).toMatch(/패널 수/);
      expect(qaContent).toContain('50');
    });

    test('has zero-byte file check', () => {
      expect(qaContent).toMatch(/0바이트/);
      expect(qaContent).toContain('-size 0');
    });

    test('has corrupt PNG check (magic bytes)', () => {
      expect(qaContent).toMatch(/손상/);
      expect(qaContent).toContain('89504e470d0a1a0a');
    });

    test('has missing panel number check', () => {
      expect(qaContent).toMatch(/번호 결손|빠진 패널/);
    });

    test('has viewer integrity check', () => {
      expect(qaContent).toMatch(/뷰어 무결성/);
      expect(qaContent).toContain('index.html');
    });
  });

  describe('bash command validity', () => {
    function extractBashBlocks(content) {
      const regex = /```bash\n([\s\S]*?)```/g;
      const blocks = [];
      let match;
      while ((match = regex.exec(content)) !== null) {
        blocks.push(match[1].trim());
      }
      return blocks;
    }

    test('contains at least 4 bash code blocks', () => {
      const blocks = extractBashBlocks(qaContent);
      expect(blocks.length).toBeGreaterThanOrEqual(4);
    });

    test('bash blocks use consistent EP variable', () => {
      const blocks = extractBashBlocks(qaContent);
      for (const block of blocks) {
        if (block.includes('EP=')) {
          expect(block).toMatch(/EP=\d+/);
        }
      }
    });

    test('bash blocks reference correct panel directory pattern', () => {
      const blocks = extractBashBlocks(qaContent);
      const panelDirBlocks = blocks.filter((b) =>
        b.includes('05_panels'),
      );
      expect(panelDirBlocks.length).toBeGreaterThan(0);
      for (const block of panelDirBlocks) {
        expect(block).toMatch(/_workspace\/05_panels/);
      }
    });

    test('md5 duplicate check is documented in assembly skill', () => {
      const assemblySkill = fs.readFileSync(
        path.join(
          __dirname,
          '..',
          '.claude',
          'skills',
          'webtoon-assembly',
          'SKILL.md',
        ),
        'utf-8',
      );
      expect(assemblySkill).toMatch(/md5/);
      expect(assemblySkill).toContain('uniq -d');
    });
  });

  describe('judgment criteria', () => {
    test('defines PASS/FIX/REDO grades', () => {
      expect(qaContent).toContain('PASS');
      expect(qaContent).toContain('FIX');
      expect(qaContent).toContain('REDO');
    });
  });
});
