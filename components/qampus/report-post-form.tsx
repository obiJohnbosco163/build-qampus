'use client'

import { useState } from 'react'
import { reportPost } from '@/app/(campus)/actions'

export function ReportPostForm({ postId, status }: { postId: string; status?: string }) {
  const [open, setOpen] = useState(false)

  if (status === 'submitted') {
    return <p className="report-confirmation" role="status">Thanks. Your report has been submitted for review.</p>
  }

  return (
    <section className="post-report" aria-label="Report this milestone">
      {!open ? (
        <button className="post-report-trigger" type="button" onClick={() => setOpen(true)}>Report this milestone</button>
      ) : (
        <form action={reportPost} className="post-report-form">
          <input type="hidden" name="post_id" value={postId} />
          <label className="platform-label" htmlFor={`report-reason-${postId}`}>Why are you reporting this?</label>
          <textarea className="platform-input" id={`report-reason-${postId}`} name="reason" minLength={3} maxLength={500} rows={3} required placeholder="Tell the moderation team what is concerning." />
          {status && <p className="auth-error" role="alert">{status === 'validation' ? 'Add a short explanation (3–500 characters).' : status === 'unavailable' ? 'This milestone can no longer be reported.' : 'Your report could not be submitted. Please try again.'}</p>}
          <div className="post-report-actions">
            <button className="platform-outline-button" type="button" onClick={() => setOpen(false)}>Cancel</button>
            <button className="button-primary" type="submit">Submit report</button>
          </div>
        </form>
      )}
    </section>
  )
}
