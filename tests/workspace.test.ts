import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawn, type ChildProcess } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { once } from 'node:events';
import { refineHarness } from '../src/core/browserGemini';
import { synthesizeHarnessFromInput } from '../src/core/harnessArchitectAgent';
import { executeByocWithSkills, handleMcpJsonRpc } from '../src/core/agentSkillConnector';

const base = () => synthesizeHarnessFromInput({ rawInstructions: 'Validate a ledger before reporting its signed total.', preferredSubstrate: 'oc' });
const settings = { key: 'test-only-secret', model: 'gemini-test', instructions: 'test', notes: '' };
test('BYOK sends only to Google, header credential, no URL key or cookies', async () => {
  const before = base();
  const result = await refineHarness(before, settings, async (url, init) => {
    assert.equal(url, 'https://generativelanguage.googleapis.com/v1beta/models/gemini-test:generateContent');
    assert.equal((init!.headers as Record<string,string>)['x-goog-api-key'], settings.key);
    assert.equal(init!.credentials, 'omit'); assert.equal(init!.redirect, 'error');
    assert.ok(!String(url).includes(settings.key)); assert.ok(!String(init!.body).includes(settings.key));
    return Response.json({ candidates: [{ content: { parts: [{ text: JSON.stringify({ refinedTitle: 'Title', refinedSummary: 'Summary', substrateRationale: 'Reason', recursionRationale: 'Budget' }) }] } }] });
  });
  assert.equal(result.title, 'Title'); assert.equal(result.generatedTree, before.generatedTree);
});
test('provider errors are reported without echoing secrets or silent fallback', async () => {
  await assert.rejects(refineHarness(base(), settings, async () => new Response(settings.key, {status:401})), /HTTP 401/);
  await assert.rejects(refineHarness(base(), settings, async () => Response.json({})), /no usable refinement/);
  await assert.rejects(refineHarness(base(), {...settings, model:'bad/path'}, async () => { throw Error('should not call'); }), /valid Gemini model/);
});
test('server BYOC cannot evaluate code, including the MCP route', () => {
  const result = executeByocWithSkills({ code: 'globalThis.__probe = true; return process.env;', language:'typescript', inputJson:'{}', skillIds:[] });
  assert.equal(result.status,'ERROR'); assert.equal((globalThis as any).__probe, undefined);
  const rpc = handleMcpJsonRpc({ method:'tools/call', params:{name:'run_byoc_sandbox', arguments:{language:'typescript',code:'throw new Error("executed")',inputJson:'{}'}} });
  assert.ok(JSON.stringify(rpc).includes('Server-side arbitrary code execution is unavailable'));
});
test('Dart and Python report previews rather than passing runtime verification', () => {
  for (const language of ['dart','python'] as const) {
    const result = executeByocWithSkills({code:'INVALID CODE', language, inputJson:'{}', skillIds:[]});
    assert.equal(result.status,'WARN'); assert.match(result.verificationSummary,/not executed/); assert.deepEqual(result.mcpToolsBound,[]);
  }
});
test('production owner gate, deterministic APIs, unsupported deploy, and restart persistence', async () => {
  const dir = mkdtempSync(`${tmpdir()}/harness-test-`);
  const port = 31971; const url = `http://127.0.0.1:${port}`;
  let child: ChildProcess;
  const start = async () => {
    child = spawn(process.execPath, ['--import','tsx','server.ts'], {env:{...process.env,NODE_ENV:'production',OWNER_PASSWORD:'local-test-password',DATA_DIR:dir,PORT:String(port),GEMINI_API_KEY:'must-never-be-used'}, stdio:['ignore','pipe','pipe']});
    let logs=''; child.stdout!.on('data', d => logs+=d); child.stderr!.on('data',d=>logs+=d);
    for (let i=0;i<100;i++) {
      try { if ((await fetch(url+'/health')).ok) return; } catch {}
      if (child.exitCode !== null) throw Error(logs);
      await new Promise(resolve => setTimeout(resolve,100));
    }
    throw Error('Server startup timed out: '+logs);
  };
  const stop = async () => { if (child && child.exitCode === null) { child.kill(); await once(child,'exit'); } };
  try {
    await start();
    assert.equal((await fetch(url+'/api/state')).status,401);
    assert.match(await (await fetch(url+'/welcome')).text(), /Harness²/);
    assert.equal((await fetch(url+'/owner-login',{method:'POST',body:'password=local-test-password',headers:{'Content-Type':'application/x-www-form-urlencoded'},redirect:'manual'})).status,403);
    const login = await fetch(url+'/owner-login',{method:'POST',body:'password=local-test-password',headers:{'Content-Type':'application/x-www-form-urlencoded','Origin':`https://127.0.0.1:${port}`,'x-forwarded-proto':'https'},redirect:'manual'});
    assert.equal(login.status,303);
    const raw = login.headers.get('set-cookie')!; assert.match(raw,/HttpOnly/); assert.match(raw,/Secure/);
    const headers = { Cookie:raw.split(';')[0], Origin:`https://127.0.0.1:${port}`, 'x-forwarded-proto':'https','Content-Type':'application/json' };
    const post = (route:string, body:unknown) => fetch(url+route,{method:'POST',headers,body:JSON.stringify(body)});
    assert.equal((await fetch(url+'/api/state',{headers})).status,200);
    assert.equal((await fetch(url+'/api/tasks',{method:'POST',headers:{...headers,Origin:'https://evil.invalid'},body:'{}'})).status,403);
    assert.equal((await post('/api/gcp-deployments',{})).status,501);
    const synthesis = await (await post('/api/harness-architect/synthesize',{rawInstructions:'Validate ledger totals'})).json();
    assert.equal(synthesis.synthesisEngine,'deterministic-architect');
    assert.equal((await post('/api/tasks',{id:'restart-task',amounts:[10,-4]})).status,200);
    await stop(); await start();
    const state = await (await fetch(url+'/api/state',{headers})).json();
    assert.ok(state.tasks.some((t:any) => t.id==='restart-task'));
    assert.ok(!JSON.stringify(state).includes('must-never-be-used'));
  } finally { await stop(); rmSync(dir,{recursive:true,force:true}); }
});
