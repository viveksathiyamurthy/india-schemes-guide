import assert from 'node:assert/strict';
import { published, byPersona, searchSchemes, getScheme, inScope, searchStates, searchSchemeNames, searchPersonas, searchPersonaSchemes } from '../src/lib/search';
import { parseBlocks, formatDate } from '../src/lib/text';
import { schemes } from '../src/data/schemes';

const names = (list: { shortName: string }[]) => list.map((s) => s.shortName);

// Publishing rule: only Active + Verified rows with an official link show.
// All 25 rows are verified; the breakfast scheme has no official link, so 24 show.
assert.equal(schemes.length, 25);
assert.equal(published.length, 24);
assert.ok(published.every((s) => s.reviewStatus === 'Verified' && s.status === 'Active' && s.officialLink));
assert.ok(published.some((s) => s.userTypes.includes('Senior Citizen')), 'Senior Citizen schemes now show');
// Every page address is unique, and existing addresses did not move.
assert.equal(new Set(schemes.map((s) => s.slug)).size, schemes.length);
assert.deepEqual(schemes.slice(0, 9).map((s) => s.slug), ['pm-kisan', 'pmegp', 'pmay-urban-2', 'pm-vidyalaxmi', 'magalir-urimai-thogai', 'kamarajar-breakfast-scheme', 'needs', 'mahalir-thittam', 'day-nrlm']);
// Union/Central schemes carry Malayalam, Telugu and Kannada text for the other states.
assert.ok(schemes[0].translations?.ml?.name && schemes[0].translations?.te?.name && schemes[0].translations?.kn?.name);
assert.ok(!published.some((s) => s.slug === 'kamarajar-breakfast-scheme'));

// Screen 3: Tamil Nadu + Woman -> State Government first, then Union/Central.
assert.deepEqual(names(byPersona('Tamil Nadu', 'Woman')), ['Magalir Urimai Thogai', 'NEEDS', 'Mahalir Thittam (TNSRLM)', 'Destitute Widow Pension Scheme', 'Destitute Deserted Woman Pension Scheme', 'Unmarried Women Pension Scheme', 'Income Certificate', 'Widow Certificate', 'PMEGP', 'DAY-NRLM']);
assert.equal(byPersona('Tamil Nadu', 'Farmer').length, 6);
assert.equal(names(byPersona('Tamil Nadu', 'Farmer')).at(-1), 'PM-KISAN');
assert.equal(byPersona('Tamil Nadu', 'Student').length, 6);
assert.equal(byPersona('Tamil Nadu', 'Senior Citizen').length, 2);
assert.equal(byPersona('Tamil Nadu', 'Others').length, 3);
assert.deepEqual(names(byPersona('Tamil Nadu', 'Home seeker / House owner')), ['PMAY-Urban 2.0']);
assert.deepEqual(names(byPersona('Tamil Nadu', 'MSME')), ['NEEDS', 'PMEGP']);

// Scope rule: a state that has no schemes still shows only Union/Central schemes.
assert.deepEqual(names(byPersona('Kerala', 'Woman')), ['PMEGP', 'DAY-NRLM']);
assert.ok(inScope(schemes[0], 'Kerala'));
assert.ok(!inScope(schemes[4], 'Kerala'));
assert.ok(inScope(schemes[4], 'Tamil Nadu'));
assert.ok(inScope(schemes[4]));

// Search with no state: all states + Union/Central.
assert.deepEqual(names(searchSchemes('loan')).sort(), ['DAY-NRLM', 'Mahalir Thittam (TNSRLM)', 'NEEDS', 'PM-Vidyalaxmi', 'PMAY-Urban 2.0', 'PMEGP', 'Small / Marginal Farmer Certificate']);
// Search with a state: only that state + Union/Central.
assert.deepEqual(names(searchSchemes('loan', 'Kerala')).sort(), ['DAY-NRLM', 'PM-Vidyalaxmi', 'PMAY-Urban 2.0', 'PMEGP']);
assert.deepEqual(names(searchSchemes('loan', 'Tamil Nadu')).sort(), ['DAY-NRLM', 'Mahalir Thittam (TNSRLM)', 'NEEDS', 'PM-Vidyalaxmi', 'PMAY-Urban 2.0', 'PMEGP', 'Small / Marginal Farmer Certificate']);
// Name match ranks first; every typed word must match.
assert.equal(searchSchemes('kisan')[0].shortName, 'PM-KISAN');
assert.deepEqual(searchSchemes('zzzz'), []);
assert.deepEqual(names(searchSchemes('pm kisan')), ['PM-KISAN']);
// Tamil search works.
assert.deepEqual(names(searchSchemes('மகளிர் உரிமைத்')), ['Magalir Urimai Thogai']);
// Empty query lists everything in scope.
assert.equal(searchSchemes('').length, 24);
assert.equal(searchSchemes('', 'Kerala').length, 5);
assert.equal(getScheme('pm-kisan')?.shortName, 'PM-KISAN');
assert.equal(getScheme('kamarajar-breakfast-scheme'), undefined);

// Screen 1: states (English, Tamil or own-language name) and scheme names only.
assert.deepEqual(searchStates('tamil').map((s) => s.slug), ['tamil-nadu']);
assert.deepEqual(searchStates('கேரளா').map((s) => s.slug), ['kerala']);
assert.deepEqual(searchStates('ಕರ್ನಾಟಕ').map((s) => s.slug), ['karnataka']);
assert.deepEqual(searchStates('pradesh').map((s) => s.slug), ['andhra-pradesh']);
assert.deepEqual(searchStates(''), []);
assert.deepEqual(names(searchSchemeNames('kisan')), ['PM-KISAN']);
// Only PM-Vidyalaxmi has "loan" in its name; the other loan schemes mention it only in their details.
assert.deepEqual(names(searchSchemeNames('loan')), ['PM-Vidyalaxmi'], 'screen 1 matches names, not descriptions');

// Screen 2: personas by label, Tamil label or everyday words.
assert.deepEqual(searchPersonas('farm').map((p) => p.slug), ['farmer']);
assert.deepEqual(searchPersonas('விவசாயி').map((p) => p.slug), ['farmer']);
assert.deepEqual(searchPersonas('house').map((p) => p.slug), ['home']);
assert.deepEqual(searchPersonas('college').map((p) => p.slug), ['student']);
assert.deepEqual(searchPersonas('shop').map((p) => p.slug), ['msme']);
assert.deepEqual(searchPersonas('women').map((p) => p.slug), ['woman']);
assert.deepEqual(searchPersonas('zzzz'), []);

// Screen 3: only the chosen state and persona's schemes.
assert.deepEqual(names(searchPersonaSchemes('Tamil Nadu', 'Woman', '')), names(byPersona('Tamil Nadu', 'Woman')));
assert.deepEqual(names(searchPersonaSchemes('Tamil Nadu', 'Woman', 'loan')).sort(), ['DAY-NRLM', 'Mahalir Thittam (TNSRLM)', 'NEEDS', 'PMEGP']);
assert.deepEqual(searchPersonaSchemes('Tamil Nadu', 'Farmer', 'housing'), [], 'a housing scheme is not in the farmer list');

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
