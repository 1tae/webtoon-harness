const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');

const AGENTS_DIR = path.join(__dirname, '..', '.claude', 'agents');
const SKILLS_DIR = path.join(__dirname, '..', '.claude', 'skills');

const VALID_SKILLS = [
  'webtoon-assembly',
  'webtoon-orchestrator',
  'webtoon-panel-breakdown',
  'webtoon-panel-render',
  'webtoon-scenario',
  'webtoon-trend-research',
];

const VALID_AGENTS = fs
  .readdirSync(AGENTS_DIR)
  .filter((f) => f.endsWith('.md'))
  .map((f) => f.replace('.md', ''));

function loadFile(filePath) {
  return fs.readFileSync(filePath, 'utf-8');
}

function extractSkillRefs(content) {
  const matches = content.match(/webtoon-[\w-]+/g) || [];
  return [...new Set(matches)].filter((m) =>
    m.match(/^webtoon-(assembly|orchestrator|panel-breakdown|panel-render|scenario|trend-research)$/),
  );
}

function extractAgentRefs(content) {
  const agentPattern = new RegExp(
    `\\b(${VALID_AGENTS.join('|')})\\b`,
    'g',
  );
  const matches = content.match(agentPattern) || [];
  return [...new Set(matches)];
}

describe('Cross-reference integrity', () => {
  describe('agent skill references', () => {
    const agentFiles = fs
      .readdirSync(AGENTS_DIR)
      .filter((f) => f.endsWith('.md'));

    test.each(agentFiles)(
      '%s references only valid skills',
      (filename) => {
        const content = loadFile(path.join(AGENTS_DIR, filename));
        const skillSection = content.match(
          /## 사용 스킬[\s\S]*?(?=\n## |$)/,
        );
        if (skillSection) {
          const refs = extractSkillRefs(skillSection[0]);
          for (const ref of refs) {
            expect(VALID_SKILLS).toContain(ref);
          }
        }
      },
    );
  });

  describe('orchestrator agent references', () => {
    let orchestratorContent;

    beforeAll(() => {
      orchestratorContent = loadFile(
        path.join(SKILLS_DIR, 'webtoon-orchestrator', 'SKILL.md'),
      );
    });

    test('references all 27 agents in the agent table', () => {
      for (const agent of VALID_AGENTS) {
        expect(orchestratorContent).toContain(agent);
      }
    });

    test('defines 4 teams', () => {
      const teamNames = ['리서치팀', '시나리오팀', '비주얼팀', '조립검수팀'];
      for (const team of teamNames) {
        expect(orchestratorContent).toContain(team);
      }
    });

    test('defines 6 phases (0-5 plus 마무리)', () => {
      expect(orchestratorContent).toContain('Phase 0');
      expect(orchestratorContent).toContain('Phase 1');
      expect(orchestratorContent).toContain('Phase 2');
      expect(orchestratorContent).toContain('Phase 3');
      expect(orchestratorContent).toContain('Phase 4');
      expect(orchestratorContent).toContain('Phase 5');
      expect(orchestratorContent).toContain('Phase 6');
    });
  });

  describe('team composition consistency', () => {
    const TEAM_MEMBERS = {
      research: [
        'trend-scout',
        'platform-ranker',
        'audience-analyst',
        'hook-analyst',
        'trend-synthesizer',
      ],
      scenario: [
        'concept-architect',
        'worldbuilder',
        'character-designer',
        'series-plotter',
        'twist-master',
        'tension-engineer',
        'episode-outliner',
        'dialogue-writer',
        'script-editor',
      ],
      visual: [
        'art-director',
        'ref-sheet-artist',
        'panel-director',
        'letterer',
        'prompt-smith',
        'panel-artist-a',
        'panel-artist-b',
        'panel-artist-c',
        'panel-validator',
      ],
      assembly: [
        'episode-compositor',
        'quality-reviewer',
        'continuity-manager',
        'showrunner',
      ],
    };

    test('all team members are valid agents', () => {
      const allMembers = Object.values(TEAM_MEMBERS).flat();
      for (const member of allMembers) {
        expect(VALID_AGENTS).toContain(member);
      }
    });

    test('all agents belong to exactly one team', () => {
      const allMembers = Object.values(TEAM_MEMBERS).flat();
      expect(allMembers.sort()).toEqual(VALID_AGENTS.sort());
    });

    test('team sizes match (5 + 9 + 9 + 4 = 27)', () => {
      expect(TEAM_MEMBERS.research).toHaveLength(5);
      expect(TEAM_MEMBERS.scenario).toHaveLength(9);
      expect(TEAM_MEMBERS.visual).toHaveLength(9);
      expect(TEAM_MEMBERS.assembly).toHaveLength(4);
      const total = Object.values(TEAM_MEMBERS).reduce(
        (sum, m) => sum + m.length,
        0,
      );
      expect(total).toBe(27);
    });
  });

  describe('skill-agent bidirectional references', () => {
    const SKILL_AGENT_MAP = {
      'webtoon-trend-research': [
        'trend-scout',
        'platform-ranker',
        'audience-analyst',
        'hook-analyst',
        'trend-synthesizer',
      ],
      'webtoon-scenario': [
        'concept-architect',
        'worldbuilder',
        'character-designer',
        'series-plotter',
        'twist-master',
        'tension-engineer',
        'episode-outliner',
        'dialogue-writer',
        'script-editor',
      ],
      'webtoon-panel-breakdown': ['art-director', 'panel-director'],
      'webtoon-panel-render': [
        'ref-sheet-artist',
        'prompt-smith',
        'panel-artist-a',
        'panel-artist-b',
        'panel-artist-c',
        'panel-validator',
      ],
      'webtoon-assembly': [
        'episode-compositor',
        'quality-reviewer',
        'continuity-manager',
        'showrunner',
        'letterer',
      ],
    };

    test.each(Object.entries(SKILL_AGENT_MAP))(
      'agents using %s reference it in their skill section',
      (skillName, agents) => {
        for (const agentName of agents) {
          const content = loadFile(
            path.join(AGENTS_DIR, `${agentName}.md`),
          );
          expect(content).toContain(skillName);
        }
      },
    );
  });

  describe('communication protocol references', () => {
    test.each(VALID_AGENTS)(
      '%s references only valid agents in communication protocol',
      (agentName) => {
        const content = loadFile(
          path.join(AGENTS_DIR, `${agentName}.md`),
        );
        const commSection = content.match(
          /## 팀 통신 프로토콜[\s\S]*?(?=\n## |$)/,
        );
        if (commSection) {
          const referencedAgents = extractAgentRefs(commSection[0]);
          for (const ref of referencedAgents) {
            expect(VALID_AGENTS).toContain(ref);
          }
        }
      },
    );
  });
});
