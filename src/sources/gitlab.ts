import type { Context } from '@deepseek-ai/cordis'
import { setTimeout as delay } from 'node:timers/promises'
import { z } from 'zod'
import { key, threadKey, type OutboundMessage, type Trigger } from '../core/index.ts'
import { CliError } from '../infra/commands.ts'
import { KV } from '../kv.ts'
import { health, sourceContext, type SourceContext } from './host.ts'
import type { SourceKind } from './kind.ts'
import { gitlabTrigger, type GitlabEvent } from './gitlab-trigger.ts'
import { sendGitlab, gitlabLink } from './gitlab-channel.ts'

const ConfigSchema = z.object({
  projects: z.array(z.object({
    id: z.string(), // project id or path
    listen: z.enum(['mentions', 'all']),
  }).strict()).default([]),
  pollSeconds: z.number().int().min(10).max(3600).default(30),
}).strict()

export type GitlabConfig = z.infer<typeof ConfigSchema>

export const gitlabKind: SourceKind<GitlabConfig> = {
  kind: 'gitlab',
  title: { zh: 'GitLab', en: 'GitLab' },
  description: { zh: '接收 GitLab 项目的议题和合并请求。', en: 'Receives issues and merge requests from GitLab projects.' },
  schema: ConfigSchema,
  fields: [
    { key: 'projects', type: 'rows', label: { zh: '监控的项目', en: 'Projects' }, columns: [
      { key: 'id', type: 'text', label: { zh: '项目 ID', en: 'Project ID/Path' } },
      { key: 'listen', type: 'select', label: { zh: '接收', en: 'Receive' }, options: [
        { value: 'mentions', label: { zh: '仅 @', en: '@ only' } }, { value: 'all', label: { zh: '全部事件', en: 'All' } }] },
    ] },
    { key: 'pollSeconds', type: 'number', advanced: true, min: 10, max: 3600,
      label: { zh: '轮询间隔 / 秒', en: 'Polling interval / seconds' } },
  ],
  health: ['gitlab'],
  scope: ({ meta }, config) => {
    const project = config.projects.find(item => item.id === String(meta.project))
    if (!project) return { listened: false, reason: 'project_not_listed' }
    return { listened: true, observed: project.listen === 'all', row: project.id }
  },
  channel: {
    allowed: (address, config) => config.projects.some(item => item.id === address.project),
    send: sendGitlab,
    link: gitlabLink,
  },
}

export const name = 'dsh-superagent-gitlab'
export const inject = ['orchestrator']
export function apply(ctx: Context): void {
  ctx.effect(() => ctx.orchestrator.sources.register(gitlabKind), 'gitlab: source kind')
  ctx.effect(() => {
    const source = sourceContext(ctx.orchestrator, gitlabKind)
    const controller = new AbortController()
    const running = watch(source, controller.signal)
      .catch((error: unknown) => { source.report('gitlab', { state: 'error', detail: String(error) }) })
    return async () => { controller.abort(); await running }
  })
}

async function watch(ctx: SourceContext, signal: AbortSignal): Promise<void> {
  await ctx.ready
  if (!ctx.configured()) { ctx.report('gitlab', health('paused', 'setupPending')); return }
  while (!signal.aborted) {
    const config = ctx.config<GitlabConfig>('gitlab')
    if (!config) ctx.report('gitlab', health('paused', 'sourceOff'))
    else {
      try {
        await poll(ctx, signal)
        ctx.report('gitlab', { state: 'ready', detail: 'Polling GitLab', at: new Date().toISOString() })
      } catch (error) {
        ctx.report('gitlab', health('error', 'pollFailures', { error: String(error) }))
      }
    }
    await delay((config?.pollSeconds ?? 30) * 1000, undefined, { signal }).catch(() => {})
  }
}

async function poll(ctx: SourceContext, signal: AbortSignal): Promise<void> {
  // Simplified polling logic
  const config = ctx.config<GitlabConfig>('gitlab')
  if (!config) return
  for (const project of config.projects) {
    if (signal.aborted) return
    const output = await ctx.commands.withSignal(signal).run('glab', ['api', `projects/${project.id}/issues`, '--paginate'])
    const issues = JSON.parse(output)
    for (const issue of issues) {
       // Need to handle event parsing and cursor
    }
  }
}
