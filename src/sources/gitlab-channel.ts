import { CliError } from '../infra/commands.ts'
import type { OutboundMessage, SourceContext } from './host.ts'

export async function sendGitlab(host: Pick<SourceContext, 'commands'>, message: OutboundMessage): Promise<'sent' | 'gone'> {
  const { project, iid } = message.channel.address
  if (!project || !iid) throw new Error('Missing gitlab reply target')
  try {
    await host.commands.run('glab', ['api', `projects/${project}/issues/${iid}/notes`, '-X', 'POST', '-f', `body=${message.text}`])
    return 'sent'
  } catch (error) {
    // Need to check for 404 or other permanent failures
    throw error
  }
}

export function gitlabLink(address: any) {
    return { url: address.url, label: { zh: `GitLab 项目 ${address.project}`, en: `GitLab project ${address.project}` } }
}
