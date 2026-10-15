import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
test('OpenRouter key is server-only',()=>{assert.match(read('lib/ai/openrouter.ts'),/server-only/);assert.doesNotMatch(read('lib/ai/openrouter.ts'),/NEXT_PUBLIC_OPENROUTER/)});
test('route requires authentication',()=>assert.match(read('app/api/ai/generate/route.ts'),/authenticatedDatabase/));
test('models restricted to free',()=>assert.match(read('lib/ai/config.ts'),/endsWith\(':free'\)/));
test('source context filters owner and course',()=>{const x=read('lib/ai/context.ts');assert.match(x,/eq\('owner_id',userId\)/);assert.match(x,/eq\('course_id',courseId\)/)});
test('quota reservation is atomic',()=>assert.match(read('supabase/migrations/0003_openrouter_ai.sql'),/pg_advisory_xact_lock/));
