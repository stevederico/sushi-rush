import { describe, expect, it } from 'vitest';
import { makeShareLinksAbsolute } from './shareLinks.ts';

const HTML = [
  '<meta property="og:type" content="website" />',
  '<meta property="og:image" content="./og-image.png" />',
  '<meta name="twitter:image" content="./og-image.png" />',
  '<link rel="icon" href="./favicon.svg" />',
].join('\n');

describe('makeShareLinksAbsolute', () => {
  it('leaves the page alone without an address', () => {
    expect(makeShareLinksAbsolute(HTML, '')).toBe(HTML);
  });

  it('makes the og image a full URL', () => {
    expect(makeShareLinksAbsolute(HTML, 'https://sushi.example.com')).toContain(
      '<meta property="og:image" content="https://sushi.example.com/og-image.png" />',
    );
  });

  it('makes the twitter image a full URL', () => {
    expect(makeShareLinksAbsolute(HTML, 'https://sushi.example.com/')).toContain(
      '<meta name="twitter:image" content="https://sushi.example.com/og-image.png" />',
    );
  });

  it('adds og:url', () => {
    expect(makeShareLinksAbsolute(HTML, 'https://sushi.example.com')).toContain(
      '<meta property="og:url" content="https://sushi.example.com/" />',
    );
  });

  it('keeps other relative links relative', () => {
    expect(makeShareLinksAbsolute(HTML, 'https://sushi.example.com')).toContain('href="./favicon.svg"');
  });
});
