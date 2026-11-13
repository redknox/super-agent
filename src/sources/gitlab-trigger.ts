import { key, type Trigger } from '../core/index.ts'

export interface GitlabEvent {
  id: string
  project_id: number
  object_kind: 'issue' | 'merge_request' | 'note'
  user: { username: string; id: number }
  object_attributes: {
    id: number
    iid: number
    url: string
    title?: string
    description?: string
    state: string
  }
  // Simplified for now
}

export function gitlabTrigger(event: GitlabEvent, me: string): Trigger | undefined {
  if (event.user.username === me) return undefined
  // For GitLab, thread key is usually conversation_id:message_id
  const thread = `${event.project_id}:${event.object_attributes.iid}`
  return {
    id: key('gitlab', String(event.object_attributes.id)),
    source: 'gitlab',
    threads: [{ source: 'gitlab', id: thread }],
    actor: { source: 'gitlab', id: String(event.user.id) },
    human: true, // Need to refine this
    text: event.object_attributes.description || event.object_attributes.title || '',
    channel: { source: 'gitlab', thread: `gitlab:${thread}`, address: { project: String(event.project_id), iid: String(event.object_attributes.iid), url: event.object_attributes.url } },
    meta: { project: event.project_id, iid: event.object_attributes.iid },
  }
}
