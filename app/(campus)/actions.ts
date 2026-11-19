'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

const milestoneTypes = new Set(['siwes', 'project', 'internal_defence', 'external_defence', 'experience', 'general'])
const circleLabels = new Set([
  'Course rep', 'Course mate', 'Level mate', 'Class set mate', 'Lab partner',
  'Project partner', 'Supervisor', 'Lecturer', 'Departmental president',
  'Faculty president', 'Student union leader', 'Community lead', 'Mentor',
  'Mentee', 'Hackathon teammate', 'Tech bro', 'Tech sis', 'Dev bro',
  'Dev sis', 'Best friend', 'Roommate', 'Gist partner',
])

export async function createPost(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/sign-in')

  const milestoneType = String(formData.get('milestone_type') ?? '')
  const title = String(formData.get('title') ?? '').trim()
  const summary = String(formData.get('summary') ?? '').trim()
  const story = String(formData.get('story') ?? '').trim()
  const visibility = String(formData.get('visibility') ?? '')

  if (!milestoneTypes.has(milestoneType) || title.length < 3 || title.length > 120 || summary.length > 140 || story.length < 10 || story.length > 8000 || !['public', 'campus'].includes(visibility)) {
    redirect('/post/new?error=validation')
  }

  const { data: post, error } = await supabase
    .from('posts')
    .insert({ author_id: user.id, milestone_type: milestoneType, title, summary: summary || null, story, visibility })
    .select('id')
    .single()

  if (error || !post) redirect('/post/new?error=save')
  revalidatePath('/feed')
  redirect(`/p/${post.id}`)
}

export async function createCircleRequest(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/sign-in')

  const handle = String(formData.get('handle') ?? '').trim().replace(/^@/, '').toLowerCase()
  const label = String(formData.get('label') ?? '')
  if (!/^[a-z0-9_]{3,24}$/.test(handle) || !circleLabels.has(label)) redirect('/circles?error=validation')

  const { data: target } = await supabase.from('profiles').select('id').eq('handle', handle).maybeSingle()
  if (!target || target.id === user.id) redirect('/circles?error=not-found')

  const { error } = await supabase.from('circles').insert({
    owner_id: user.id,
    target_id: target.id,
    label,
    status: 'pending',
    owner_display_public: false,
    target_display_public: false,
  })
  if (error) redirect(`/circles?error=${error.code === '23505' ? 'exists' : 'save'}`)
  revalidatePath('/circles')
  redirect('/circles?sent=1')
}

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/auth/sign-in')
}

export async function respondToCircle(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/sign-in')

  const id = String(formData.get('id') ?? '')
  const status = String(formData.get('status') ?? '')
  if (!/^[0-9a-f-]{36}$/i.test(id) || !['accepted', 'declined'].includes(status)) redirect('/circles?error=validation')

  const { error } = await supabase
    .from('circles')
    .update({ status })
    .eq('id', id)
    .eq('target_id', user.id)
    .eq('status', 'pending')
  if (error) redirect('/circles?error=save')
  revalidatePath('/circles')
  redirect('/circles')
}
