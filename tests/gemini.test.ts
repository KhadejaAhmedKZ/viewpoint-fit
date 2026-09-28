import test from 'node:test';
import assert from 'node:assert/strict';
import { geminiJson } from '../src/lib/ai/gemini.server';
import { analyzeFoodPhoto } from '../src/lib/fuel/photo.server';

test('Gemini food adapter sends inline image only to Google and validates structured report', async () => {
  const original = globalThis.fetch;
  globalThis.fetch = async (url, init) => {
    assert.match(String(url), /^https:\/\/generativelanguage.googleapis.com\//);
    assert.ok(!String(url).includes('test-secret'));
    assert.equal((init?.headers as Record<string,string>)['x-goog-api-key'], 'test-secret');
    const body = JSON.parse(String(init?.body));
    assert.ok(!String(init?.body).includes('test-secret'));
    assert.deepEqual(body.contents[0].parts[1], { inlineData: { mimeType: 'image/jpeg', data: 'synthetic' } });
    return Response.json({ candidates: [{ finishReason: 'STOP', content: { parts: [{ text: JSON.stringify({ items: [], notes: ['No identifiable food'], confidence: 'low' }) }] } }] });
  };
  try {
    const result = await analyzeFoodPhoto('data:image/jpeg;base64,synthetic', 'test-secret', 'gemini');
    assert.equal(result.confidence, 'low');
    assert.deepEqual(result.items, []);
  } finally { globalThis.fetch = original; }
});

test('Gemini rejects incomplete and malformed responses without leaking provider error bodies', async () => {
  const original = globalThis.fetch;
  try {
    for (const response of [
      Response.json({ candidates: [{ finishReason: 'MAX_TOKENS', content: { parts: [{ text: '{}' }] } }] }),
      Response.json({ candidates: [{ finishReason: 'STOP', content: { parts: [{ text: 'invalid JSON' }] } }] }),
      new Response('sensitive upstream detail', { status: 403 }),
    ]) {
      globalThis.fetch = async () => response;
      await assert.rejects(() => geminiJson('test-secret', 'safe instructions', [], {}), (error: Error) => {
        assert.ok(!error.message.includes('sensitive upstream detail'));
        assert.ok(!error.message.includes('test-secret'));
        return true;
      });
    }
  } finally { globalThis.fetch = original; }
});
