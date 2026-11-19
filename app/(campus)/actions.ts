'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/admin'
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
  const handles = [...new Set(String(formData.get('tag_handles') ?? '').split(/[\s,]+/).map((handle) => handle.trim().replace(/^@/, '').toLowerCase()).filter(Boolean))]

  if (!milestoneTypes.has(milestoneType) || title.length < 3 || title.length > 120 || summary.length > 140 || story.length < 10 || story.length > 8000 || !['public', 'campus'].includes(visibility) || handles.length > 10 || handles.some((handle) => !/^[a-z0-9_]{3,24}$/.test(handle))) {
    redirect('/post/new?error=validation')
  }

  const { data: taggedProfiles, error: lookupError } = handles.length
    ? await supabase.from('profiles').select('id, handle').in('handle', handles)
    : { data: [], error: null }
  if (lookupError || (taggedProfiles?.length ?? 0) !== handles.length || taggedProfiles?.some((profile) => profile.id === user.id)) {
    redirect('/post/new?error=tag')
  }

  const postId = crypto.randomUUID()
  const { error } = await supabase
    .from('posts')
    .insert({ id: postId, author_id: user.id, milestone_type: milestoneType, title, summary: summary || null, story, visibility })

  if (error) redirect(`/post/new?error=save&code=${encodeURIComponent(error.code ?? 'unknown')}`)
  if (taggedProfiles?.length) {
    const { error: tagError } = await supabase.from('post_tags').insert(taggedProfiles.map((profile) => ({
      post_id: postId,
      tagged_by: user.id,
      tagged_user_id: profile.id,
    })))
    if (tagError) {
      console.log('[v0] Post tags insert error:', tagError)
      console.log('[v0] Tag error code:', tagError.code)
      console.log('[v0] Tag error message:', tagError.message)
      redirect('/post/new?error=tag-save')
    }
  }
  revalidatePath('/feed')
  revalidatePath('/inbox')
  redirect(`/p/${postId}`)
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

export async function reportPost(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/sign-in')

  const postId = String(formData.get('post_id') ?? '')
  const reason = String(formData.get('reason') ?? '').trim()
  if (!/^[0-9a-f-]{36}$/i.test(postId) || reason.length < 3 || reason.length > 500) {
    redirect(`/p/${encodeURIComponent(postId)}?report=validation`)
  }

  const { data: post } = await supabase
    .from('posts')
    .select('id, author_id')
    .eq('id', postId)
    .maybeSingle()
  if (!post || post.author_id === user.id) redirect(`/p/${postId}?report=unavailable`)

  const { error } = await supabase.from('reports').insert({
    reporter_id: user.id,
    post_id: post.id,
    reported_profile_id: null,
    reason,
  })
  if (error) redirect(`/p/${postId}?report=failed`)

  revalidatePath(`/p/${postId}`)
  redirect(`/p/${postId}?report=submitted`)
}

export async function reviewReport(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (user?.app_metadata?.role !== 'moderator') redirect('/feed')

  const reportId = String(formData.get('report_id') ?? '')
  const decision = String(formData.get('decision') ?? '')
  if (!/^[0-9a-f-]{36}$/i.test(reportId) || !['resolved', 'dismissed'].includes(decision)) redirect('/moderation?error=validation')

  const admin = createAdminClient()
  const { error } = await admin
    .from('reports')
    .update({ status: decision })
    .eq('id', reportId)
    .eq('status', 'open')
  if (error) redirect('/moderation?error=save')

  revalidatePath('/moderation')
  redirect('/moderation')
}

export async function respondToPostTag(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/sign-in')

  const tagId = String(formData.get('tag_id') ?? '')
  const status = String(formData.get('status') ?? '')
  if (!/^[0-9a-f-]{36}$/i.test(tagId) || !['accepted', 'hidden', 'removed'].includes(status)) redirect('/inbox?error=validation')

  const { error } = await supabase.from('post_tags').update({ status }).eq('id', tagId).eq('tagged_user_id', user.id).eq('status', 'pending')
  if (error) redirect('/inbox?error=save')
  const { data: notification } = await supabase.from('notifications').select('id').eq('tag_id', tagId).maybeSingle()
  if (notification) await supabase.from('notifications').update({ read_at: new Date().toISOString() }).eq('id', notification.id)
  revalidatePath('/inbox')
  revalidatePath('/feed')
  redirect('/inbox')
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
