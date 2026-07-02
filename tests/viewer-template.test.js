const fs = require('fs');
const path = require('path');

const TEMPLATE_PATH = path.join(
  __dirname,
  '..',
  '.claude',
  'skills',
  'webtoon-assembly',
  'assets',
  'viewer-template.html',
);

let htmlContent;

beforeAll(() => {
  htmlContent = fs.readFileSync(TEMPLATE_PATH, 'utf-8');
});

function extractScriptContent(html) {
  const match = html.match(/<script>([\s\S]*?)<\/script>/);
  return match ? match[1] : '';
}

function extractStyleContent(html) {
  const match = html.match(/<style>([\s\S]*?)<\/style>/);
  return match ? match[1] : '';
}

describe('Viewer template HTML structure', () => {
  test('has correct DOCTYPE', () => {
    expect(htmlContent.trimStart()).toMatch(/^<!DOCTYPE html>/i);
  });

  test('has Korean lang attribute', () => {
    expect(htmlContent).toMatch(/<html\s+lang="ko">/);
  });

  test('has UTF-8 charset meta', () => {
    expect(htmlContent).toMatch(/<meta\s+charset="UTF-8"\s*\/?>/);
  });

  test('has viewport meta tag', () => {
    expect(htmlContent).toMatch(/<meta\s+name="viewport"/);
  });

  test('has sticky header with title and episode elements', () => {
    expect(htmlContent).toContain('header class="viewer-head"');
    expect(htmlContent).toContain('id="m-title"');
    expect(htmlContent).toContain('id="m-ep"');
  });

  test('has strip container as main element', () => {
    expect(htmlContent).toMatch(/<main\s+class="strip"\s+id="strip"/);
  });

  test('has footer element', () => {
    expect(htmlContent).toContain('id="foot"');
  });

  test('is a self-contained single-file viewer (no external dependencies)', () => {
    expect(htmlContent).not.toMatch(/<link\s+.*href="http/);
    expect(htmlContent).not.toMatch(/<script\s+.*src="http/);
  });
});

describe('Viewer template CSS variables', () => {
  let cssContent;

  beforeAll(() => {
    cssContent = extractStyleContent(htmlContent);
  });

  test('defines --max-w custom property', () => {
    expect(cssContent).toContain('--max-w');
  });

  test('defines --panel-gap custom property', () => {
    expect(cssContent).toContain('--panel-gap');
  });

  test('defines --page-bg custom property', () => {
    expect(cssContent).toContain('--page-bg');
  });

  test('defines --strip-bg custom property', () => {
    expect(cssContent).toContain('--strip-bg');
  });

  test('defines --bubble-fs custom property', () => {
    expect(cssContent).toContain('--bubble-fs');
  });

  test('max-w defaults to 720px (mobile-first)', () => {
    expect(cssContent).toMatch(/--max-w:\s*720px/);
  });

  test('panel-gap defaults to 0px (seamless connection)', () => {
    expect(cssContent).toMatch(/--panel-gap:\s*0px/);
  });
});

describe('Viewer template bubble type styles', () => {
  let cssContent;

  beforeAll(() => {
    cssContent = extractStyleContent(htmlContent);
  });

  test('defines dialogue bubble styles', () => {
    expect(cssContent).toContain('.bubble.dialogue');
  });

  test('defines thought bubble styles with dashed border', () => {
    expect(cssContent).toContain('.bubble.thought');
    const thoughtBlock = cssContent.match(
      /\.bubble\.thought\s*\{[^}]+\}/,
    );
    expect(thoughtBlock).not.toBeNull();
    expect(thoughtBlock[0]).toContain('dashed');
  });

  test('defines shout bubble styles with thick border', () => {
    expect(cssContent).toContain('.bubble.shout');
    const shoutBlock = cssContent.match(
      /\.bubble\.shout\s*\{[^}]+\}/,
    );
    expect(shoutBlock).not.toBeNull();
    expect(shoutBlock[0]).toContain('border-width: 3px');
  });

  test('defines narration bubble styles with dark background', () => {
    expect(cssContent).toContain('.bubble.narration');
    const narrationBlock = cssContent.match(
      /\.bubble\.narration\s*\{[^}]+\}/,
    );
    expect(narrationBlock).not.toBeNull();
    expect(narrationBlock[0]).toContain('border-radius: 4px');
  });

  test('defines tail direction variants (left, right, up, down)', () => {
    expect(cssContent).toContain('.tail.left');
    expect(cssContent).toContain('.tail.right');
    expect(cssContent).toContain('.tail.up');
    expect(cssContent).toContain('.tail.down');
  });
});

describe('Viewer template JavaScript functions', () => {
  let scriptContent;

  beforeAll(() => {
    scriptContent = extractScriptContent(htmlContent);
  });

  test('defines el() helper function', () => {
    expect(scriptContent).toMatch(/function\s+el\s*\(/);
  });

  test('defines renderBubble() function', () => {
    expect(scriptContent).toMatch(/function\s+renderBubble\s*\(/);
  });

  test('defines renderPanel() function', () => {
    expect(scriptContent).toMatch(/function\s+renderPanel\s*\(/);
  });

  test('defines META constant with title and episode', () => {
    expect(scriptContent).toContain('const META');
    expect(scriptContent).toMatch(/title:\s*"/);
    expect(scriptContent).toMatch(/episode:\s*"/);
  });

  test('defines PANELS data array', () => {
    expect(scriptContent).toContain('const PANELS');
  });

  test('has auto-init IIFE', () => {
    expect(scriptContent).toMatch(/\(function\s+init\s*\(\)\s*\{/);
  });

  describe('el() function implementation', () => {
    test('creates element with document.createElement', () => {
      expect(scriptContent).toContain('document.createElement');
    });

    test('sets className', () => {
      expect(scriptContent).toMatch(/\.className\s*=/);
    });

    test('sets textContent', () => {
      expect(scriptContent).toMatch(/\.textContent\s*=/);
    });
  });

  describe('renderBubble() implementation', () => {
    test('creates bubble div with type class', () => {
      expect(scriptContent).toMatch(/["']bubble\s*["']\s*\+/);
    });

    test('sets position via style.left and style.top', () => {
      expect(scriptContent).toContain('style.left');
      expect(scriptContent).toContain('style.top');
    });

    test('handles maxWidth from w property', () => {
      expect(scriptContent).toContain('maxWidth');
    });

    test('creates tail span for non-none tail values', () => {
      expect(scriptContent).toMatch(/tail.*none/);
    });
  });

  describe('renderPanel() implementation', () => {
    test('creates Image element', () => {
      expect(scriptContent).toContain('new Image()');
    });

    test('sets lazy loading', () => {
      expect(scriptContent).toContain('loading');
      expect(scriptContent).toContain('"lazy"');
    });

    test('sets async decoding', () => {
      expect(scriptContent).toContain('decoding');
      expect(scriptContent).toContain('"async"');
    });

    test('handles image load error with placeholder', () => {
      expect(scriptContent).toContain('onerror');
      expect(scriptContent).toContain('missing');
    });

    test('generates padded alt text from index', () => {
      expect(scriptContent).toContain('padStart');
    });

    test('iterates over bubbles array', () => {
      expect(scriptContent).toMatch(/bubbles.*forEach/);
    });
  });

  describe('init() implementation', () => {
    test('sets document title from META', () => {
      expect(scriptContent).toContain('document.title');
    });

    test('populates strip with panels', () => {
      expect(scriptContent).toContain('strip');
      expect(scriptContent).toContain('appendChild');
    });

    test('sets footer panel count', () => {
      expect(scriptContent).toContain('PANELS.length');
    });
  });
});

describe('Viewer template PANELS data structure', () => {
  let scriptContent;

  beforeAll(() => {
    scriptContent = extractScriptContent(htmlContent);
  });

  test('sample panels have src property', () => {
    expect(scriptContent).toMatch(/src:\s*"/);
  });

  test('sample panels have alt property', () => {
    expect(scriptContent).toMatch(/alt:\s*"/);
  });

  test('sample panels have bubbles array', () => {
    expect(scriptContent).toContain('bubbles:');
  });

  test('sample bubbles have type property', () => {
    const bubbleTypes = ['narration', 'dialogue', 'thought', 'shout'];
    const foundTypes = bubbleTypes.filter((t) =>
      scriptContent.includes(`type: "${t}"`),
    );
    expect(foundTypes.length).toBeGreaterThanOrEqual(2);
  });

  test('sample bubbles have text, x, y properties', () => {
    expect(scriptContent).toMatch(/text:\s*"/);
    expect(scriptContent).toMatch(/x:\s*\d+/);
    expect(scriptContent).toMatch(/y:\s*\d+/);
  });

  test('sample panels reference correct path pattern', () => {
    expect(scriptContent).toMatch(/05_panels\/ep\{NN\}\/panel_\d+\.png/);
  });
});

describe('Viewer template accessibility', () => {
  test('has aria-label on strip container', () => {
    expect(htmlContent).toContain('aria-label');
  });

  test('images have alt attributes via renderPanel', () => {
    const scriptContent = extractScriptContent(htmlContent);
    expect(scriptContent).toContain('.alt');
  });
});

describe('Viewer template Korean text support', () => {
  let cssContent;

  beforeAll(() => {
    cssContent = extractStyleContent(htmlContent);
  });

  test('uses Korean font stack', () => {
    expect(cssContent).toMatch(
      /Apple SD Gothic Neo|Noto Sans KR|Malgun Gothic/,
    );
  });

  test('uses word-break: keep-all for Korean word wrapping', () => {
    expect(cssContent).toContain('word-break: keep-all');
  });
});
