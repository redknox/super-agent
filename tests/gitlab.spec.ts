import { describe, expect, it, vi } from 'vitest'
import { Commands } from '../src/infra/commands.ts'
import { Engine, type Assessor, type Executor, type Trigger } from '../src/core/index.ts'
import { SourceRegistry } from '../src/sources/registry.ts'
import { gitlabKind } from '../src/sources/gitlab.ts'
import { HealthBoard } from '../src/infra/health.ts'
import { testDeployment } from './fixtures/deployment.ts'
import { SettingsSchema, settingsPolicy } from '../src/policy.ts'
import { sourceContextOf, type SourceContextDeps } from '../src/app/source-context.ts'
import { Store } from '../src/app/store.ts'
import { mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

function host(overrides: Partial<SourceContextDeps> = {}) {
  const store = new Store(join(mkdtempSync(join(tmpdir(), 'gitlab-')), 'db.sqlite'))
  const settings = SettingsSchema.parse({ policy: { sources: { gitlab: { allowed: [{ id: 'alice' }] } } }, eval: { mode: 'auto' }, sources: { gitlab: { enabled: true, config: { projects: [{ id: '123', listen: 'mentions' }] } } } })
  store.saveSettings(settings)
  const board = new HealthBoard()
  const sources = new SourceRegistry(() => store.settings(), board)
  const deployment = testDeployment()
  sources.register(gitlabKind)
  const assessor: Assessor = { request: vi.fn(async () => {}) }
  const executor: Executor = { start: vi.fn(async () => {}), deliver: vi.fn(async () => {}), stop: vi.fn(async () => {}) }
  const outbox = { send: () => {}, status: () => undefined, withdraw: () => {} }
  const engine = new Engine({ repo: store, scope: sources, policy: () => settingsPolicy(store.settings(), sources), assessor, executor, outbox })
  const commands = new Commands(() => deployment, {}, new AbortController().signal)
  const receive = vi.fn(async (trigger: Trigger) => { const result = engine.receive(trigger); engine.evaluateDue(); return result })
  const parts: SourceContextDeps = { store, engine, outbox: { send: message => { store.receipts.add(message) } }, commands, sources, deployment,
    ready: Promise.resolve(), configured: () => true, receive, ...overrides }
  const context = sourceContextOf(parts, gitlabKind)
  return { ...parts, ...context, store, engine, commands: parts.commands, receive, executor, health: board.all }
}

describe('gitlab source', () => {
  it('registers its kind', async () => {
    const value = host()
    const registered = value.sources.kind('gitlab')
    expect(registered).toBeDefined()
    expect(registered!.kind).toBe('gitlab')
  })
})
