import { notFound } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { reviewReport } from '../actions'

export const metadata = { title: 'Moderation queue | Qampus' }

export default async function ModerationPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (user?.app_metadata?.role !== 'moderator') notFound()

  const admin = createAdminClient()
  const { data: reports, error } = await admin
    .from('reports')
    .select('id, reporter_id, post_id, reported_profile_id, reason, status, created_at')
    .eq('status', 'open')
    .order('created_at', { ascending: true })

  if (error) throw new Error('Unable to load moderation reports')

  const postIds = [...new Set((reports ?? []).flatMap((report) => report.post_id ? [report.post_id] : []))]
  const { data: posts } = postIds.length
    ? await admin.from('posts').select('id, title, author_id').in('id', postIds)
    : { data: [] }
  const postById = new Map((posts ?? []).map((post) => [post.id, post]))
  const profileIds = [...new Set((reports ?? []).flatMap((report) => [
    report.reporter_id,
    ...(report.reported_profile_id ? [report.reported_profile_id] : []),
    ...(report.post_id && postById.get(report.post_id) ? [postById.get(report.post_id)!.author_id] : []),
  ]))]
  const { data: profiles } = profileIds.length
    ? await admin.from('profiles').select('id, handle, display_name').in('id', profileIds)
    : { data: [] }
  const profileById = new Map((profiles ?? []).map((profile) => [profile.id, profile]))

  return (
    <section className="platform-page moderation-page">
      <div className="platform-page-heading">
        <div><p className="section-label">[ TRUST & SAFETY ]</p><h1>Moderation queue</h1><p>Review reports submitted by Qampus members. Decisions only update report status; they do not remove content.</p></div>
      </div>
      <div className="moderation-summary"><span>{reports?.length ?? 0}</span> open {(reports?.length ?? 0) === 1 ? 'report' : 'reports'}</div>
      {!reports?.length ? (
        <div className="moderation-empty"><h2>Queue is clear</h2><p>New member reports will appear here.</p></div>
      ) : (
        <div className="moderation-list">
          {reports.map((report) => {
            const reportedProfile = report.reported_profile_id ? profileById.get(report.reported_profile_id) : null
            const post = report.post_id ? postById.get(report.post_id) : null
            const author = post ? profileById.get(post.author_id) : null
            const reporter = profileById.get(report.reporter_id)
            return (
              <article className="moderation-card" key={report.id}>
                <div className="moderation-card-top"><span className="feed-type-chip">{post ? 'POST REPORT' : 'PROFILE REPORT'}</span><time dateTime={report.created_at}>{new Date(report.created_at).toLocaleString()}</time></div>
                <h2>{post?.title || (reportedProfile ? `@${reportedProfile.handle}` : 'Unavailable content')}</h2>
                <p className="moderation-target">{post ? `Post by ${author?.display_name ?? 'Qampus member'}${author?.handle ? ` · @${author.handle}` : ''}` : reportedProfile?.display_name ?? 'Profile unavailable'}</p>
                <blockquote>{report.reason}</blockquote>
                <p className="moderation-reporter">Reported by {reporter?.display_name ?? 'Qampus member'}{reporter?.handle ? ` · @${reporter.handle}` : ''}</p>
                <form action={reviewReport} className="moderation-actions">
                  <input type="hidden" name="report_id" value={report.id} />
                  <button className="platform-outline-button" type="submit" name="decision" value="dismissed">Dismiss report</button>
                  <button className="button-primary" type="submit" name="decision" value="resolved">Mark reviewed</button>
                </form>
              </article>
            )
          })}
        </div>
      )}
    </section>
  )
}
