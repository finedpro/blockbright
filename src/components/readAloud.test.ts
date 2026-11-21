// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { readableText } from './ReadAloud';

describe('read aloud text', () => {
  it('keeps the words, drops buttons, icons and English term hints', () => {
    const div = document.createElement('div');
    div.innerHTML = `
      <p class="activity-tag"><svg></svg>Think of it like this</p>
      <p>Your <span class="term"><button class="term-button">taastefraas</button><span class="term-english"> (seed phrase)</span></span> is yours.</p>
      <button class="why-link">Why?</button>
      <ul><li><button class="choice-button">Share it</button></li></ul>
      <button class="btn">Next</button>`;
    expect(readableText(div)).toEqual(['Think of it like this', 'Your taastefraas is yours.', 'Share it']);
  });
});
