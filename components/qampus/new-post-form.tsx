import { createPost } from '@/app/(campus)/actions'

const types = [
  ['siwes', 'SIWES'],
  ['project', 'Project'],
  ['internal_defence', 'Internal defence'],
  ['external_defence', 'External defence'],
  ['experience', 'Experience'],
  ['general', 'General milestone'],
]

export function NewPostForm({ error }: { error?: string }) {
  return (
    <form action={createPost} className="post-composer-form">
      <label className="platform-label" htmlFor="milestone-type">Milestone type</label>
      <select className="platform-input" id="milestone-type" name="milestone_type" defaultValue="project" required>
        {types.map(([value, label]) => <option value={value} key={value}>{label}</option>)}
      </select>

      <label className="platform-label" htmlFor="milestone-title">Title</label>
      <input className="platform-input" id="milestone-title" name="title" minLength={3} maxLength={120} placeholder="What did you make happen?" required />

      <label className="platform-label" htmlFor="milestone-summary">Short summary <span>Optional · 140 characters max</span></label>
      <textarea className="platform-input platform-summary-input" id="milestone-summary" name="summary" maxLength={140} rows={2} placeholder="A line that gives people the headline." />

      <label className="platform-label" htmlFor="milestone-story">The story</label>
      <textarea className="platform-input platform-story-input" id="milestone-story" name="story" minLength={10} maxLength={8000} rows={8} placeholder="The challenge, the work, the people who helped, and what you learned." required />

      <div className="platform-field-row">
        <div>
          <label className="platform-label" htmlFor="milestone-visibility">Who can see this?</label>
          <select className="platform-input" id="milestone-visibility" name="visibility" defaultValue="public">
            <option value="public">Public · shareable on your Passport</option>
            <option value="campus">Campus · signed-in Qampus members</option>
          </select>
        </div>
        <div className="platform-privacy-note"><span className="status-dot" /> You can anchor a published milestone after it is saved. Private Circle and sealed sharing are not offered until their recipient encryption flow is ready.</div>
      </div>

      {error && <p className="auth-error" role="alert">{error === 'validation' ? 'Check the title, summary, story, and visibility fields.' : 'Your milestone could not be saved. Please try again.'}</p>}
      <div className="composer-footer"><span>Stories are stored off-chain. Nothing is anchored by publishing.</span><button className="button-primary" type="submit">Publish milestone <span aria-hidden="true">→</span></button></div>
    </form>
  )
}
