import assert from 'node:assert/strict';
import { published, byPersona, searchSchemes, getScheme, inScope } from '../src/lib/search';
import { parseBlocks, formatDate } from '../src/lib/text';
import { schemes } from '../src/data/schemes';

const names = (list: { shortName: string }[]) => list.map((s) => s.shortName);

// Publishing rule: the breakfast scheme has no official link, so it is held back.
assert.equal(schemes.length, 9);
assert.equal(published.length, 8);
assert.ok(!published.some((s) => s.slug === 'kamarajar-breakfast-scheme'));

// Screen 3: Tamil Nadu + Woman -> State Government first, then Union/Central.
assert.deepEqual(names(byPersona('Tamil Nadu', 'Woman')), ['Magalir Urimai Thogai', 'NEEDS', 'Mahalir Thittam (TNSRLM)', 'PMEGP', 'DAY-NRLM']);
assert.deepEqual(names(byPersona('Tamil Nadu', 'Farmer')), ['PM-KISAN']);
assert.deepEqual(names(byPersona('Tamil Nadu', 'Student')), ['PM-Vidyalaxmi']);
assert.deepEqual(names(byPersona('Tamil Nadu', 'Home seeker / House owner')), ['PMAY-Urban 2.0']);
assert.deepEqual(names(byPersona('Tamil Nadu', 'MSME')), ['NEEDS', 'PMEGP']);

// Scope rule: a state that has no schemes still shows only Union/Central schemes.
assert.deepEqual(names(byPersona('Kerala', 'Woman')), ['PMEGP', 'DAY-NRLM']);
assert.ok(inScope(schemes[0], 'Kerala'));
assert.ok(!inScope(schemes[4], 'Kerala'));
assert.ok(inScope(schemes[4], 'Tamil Nadu'));
assert.ok(inScope(schemes[4]));

// Search with no state: all states + Union/Central.
assert.deepEqual(names(searchSchemes('loan')).sort(), ['DAY-NRLM', 'Mahalir Thittam (TNSRLM)', 'NEEDS', 'PM-Vidyalaxmi', 'PMAY-Urban 2.0', 'PMEGP']);
// Search with a state: only that state + Union/Central.
assert.deepEqual(names(searchSchemes('loan', 'Kerala')).sort(), ['DAY-NRLM', 'PM-Vidyalaxmi', 'PMAY-Urban 2.0', 'PMEGP']);
assert.deepEqual(names(searchSchemes('loan', 'Tamil Nadu')).sort(), ['DAY-NRLM', 'Mahalir Thittam (TNSRLM)', 'NEEDS', 'PM-Vidyalaxmi', 'PMAY-Urban 2.0', 'PMEGP']);
// Name match ranks first; every typed word must match.
assert.equal(searchSchemes('kisan')[0].shortName, 'PM-KISAN');
assert.deepEqual(searchSchemes('zzzz'), []);
assert.deepEqual(names(searchSchemes('pm kisan')), ['PM-KISAN']);
// Tamil search works.
assert.deepEqual(names(searchSchemes('மகளிர் உரிமைத்')), ['Magalir Urimai Thogai']);
// Empty query lists everything in scope.
assert.equal(searchSchemes('').length, 8);
assert.equal(searchSchemes('', 'Kerala').length, 5);
assert.equal(getScheme('pm-kisan')?.shortName, 'PM-KISAN');
assert.equal(getScheme('kamarajar-breakfast-scheme'), undefined);

// Text helpers
assert.deepEqual(parseBlocks('Intro\n• a\n• b\n1. one\n2. two\nEnd'), [
  { type: 'p', text: 'Intro' },
  { type: 'ul', items: ['a', 'b'] },
  { type: 'ol', items: ['one', 'two'] },
  { type: 'p', text: 'End' },
]);
assert.equal(formatDate('2026-10-18'), '18 Oct 2026');
assert.equal(formatDate('bad'), 'bad');

console.log('logic tests passed');
