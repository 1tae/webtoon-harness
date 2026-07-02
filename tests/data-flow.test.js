const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');

const AGENTS_DIR = path.join(__dirname, '..', '.claude', 'agents');
const SKILLS_DIR = path.join(__dirname, '..', '.claude', 'skills');

function loadFile(filePath) {
  return fs.readFileSync(filePath, 'utf-8');
}

describe('Data flow and output path consistency', () => {
  describe('workspace directory structure', () => {
    const orchestratorContent = loadFile(
      path.join(SKILLS_DIR, 'webtoon-orchestrator', 'SKILL.md'),
    );

    test('orchestrator references standard workspace directories', () => {
      const expectedDirs = [
        '00_input',
        '01_research',
        '02_story',
        '03_episode',
        '04_visual',
        '05_panels',
        '06_assembly',
        'RELEASE',
      ];
      for (const dir of expectedDirs) {
        expect(orchestratorContent).toContain(dir);
      }
    });

    test('orchestrator mkdir command creates all directories', () => {
      expect(orchestratorContent).toContain(
        'mkdir -p _workspace/{00_input,01_research,02_story,03_episode,04_visual,05_panels,06_assembly,RELEASE}',
      );
    });
  });

  describe('scenario skill output paths match agent I/O', () => {
    const scenarioSkill = loadFile(
      path.join(SKILLS_DIR, 'webtoon-scenario', 'SKILL.md'),
    );

    const outputPathMap = {
      'concept-architect': '02_story/concept.md',
      worldbuilder: '02_story/world.md',
      'character-designer': '02_story/characters.md',
      'series-plotter': '02_story/series-arc.md',
      'twist-master': '02_story/twist-plan.md',
      'tension-engineer': '02_story/tension-curve.md',
    };

    test.each(Object.entries(outputPathMap))(
      '%s output path is documented in scenario skill',
      (agentName, expectedPath) => {
        expect(scenarioSkill).toContain(expectedPath);
      },
    );

    test.each(Object.entries(outputPathMap))(
      '%s agent references its output path',
      (agentName, expectedPath) => {
        const agentContent = loadFile(
          path.join(AGENTS_DIR, `${agentName}.md`),
        );
        expect(agentContent).toContain(expectedPath);
      },
    );
  });

  describe('visual pipeline data flow', () => {
    test('art-director outputs style-bible and character-sheets', () => {
      const content = loadFile(
        path.join(AGENTS_DIR, 'art-director.md'),
      );
      expect(content).toContain('style-bible');
      expect(content).toContain('character-sheets');
    });

    test('ref-sheet-artist outputs to refs/ directory', () => {
      const content = loadFile(
        path.join(AGENTS_DIR, 'ref-sheet-artist.md'),
      );
      expect(content).toMatch(/refs\//);
      expect(content).toContain('INDEX.md');
    });

    test('panel-validator outputs validation.md', () => {
      const content = loadFile(
        path.join(AGENTS_DIR, 'panel-validator.md'),
      );
      expect(content).toContain('validation.md');
    });

    test('episode-compositor outputs index.html', () => {
      const content = loadFile(
        path.join(AGENTS_DIR, 'episode-compositor.md'),
      );
      expect(content).toContain('index.html');
    });

    test('quality-reviewer outputs qa_report.md', () => {
      const content = loadFile(
        path.join(AGENTS_DIR, 'quality-reviewer.md'),
      );
      expect(content).toContain('qa_report.md');
    });

    test('showrunner outputs to RELEASE directory', () => {
      const content = loadFile(
        path.join(AGENTS_DIR, 'showrunner.md'),
      );
      expect(content).toContain('RELEASE/');
    });
  });

  describe('research team output paths', () => {
    const researchAgents = [
      'trend-scout',
      'platform-ranker',
      'audience-analyst',
      'hook-analyst',
    ];

    test.each(researchAgents)(
      '%s outputs to 01_research/',
      (agentName) => {
        const content = loadFile(
          path.join(AGENTS_DIR, `${agentName}.md`),
        );
        expect(content).toContain('01_research/');
      },
    );

    test('trend-synthesizer outputs trend-brief.md', () => {
      const content = loadFile(
        path.join(AGENTS_DIR, 'trend-synthesizer.md'),
      );
      expect(content).toContain('trend-brief.md');
    });
  });

  describe('error handling consistency', () => {
    const orchestratorContent = loadFile(
      path.join(SKILLS_DIR, 'webtoon-orchestrator', 'SKILL.md'),
    );

    test('orchestrator defines error handling table', () => {
      expect(orchestratorContent).toContain('에러 핸들링');
    });

    test('defines md5 duplicate handling', () => {
      expect(orchestratorContent).toContain('md5 중복');
    });

    test('defines codex render failure handling', () => {
      expect(orchestratorContent).toContain('0바이트');
      expect(orchestratorContent).toContain('손상');
    });

    test('defines panel count minimum enforcement', () => {
      expect(orchestratorContent).toContain('50개 미만');
    });

    test('defines infinite loop prevention (max retries)', () => {
      expect(orchestratorContent).toMatch(/최대 \d회/);
    });
  });
});
