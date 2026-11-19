import Link from 'next/link'
import { ArrowLeft, Fingerprint } from 'lucide-react'
import { NewPostForm } from '@/components/qampus/new-post-form'

export default async function NewPostPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams
  return (
    <div className="platform-page composer-page">
      <Link href="/feed" className="platform-back-link"><ArrowLeft size={15} /> Back to campus</Link>
      <div className="platform-page-heading composer-heading">
        <div><p className="section-label">[ 02 / RECORD A MILESTONE ]</p><h1>Give the work a home.</h1><p>Share the story first. Add proof when you are ready.</p></div>
        <div className="composer-mark"><Fingerprint size={23} /><span>CONTENT<br />STAYS YOURS</span></div>
      </div>
      <section className="composer-panel" aria-labelledby="composer-title">
        <div className="composer-panel-heading"><div><h2 id="composer-title">Your milestone</h2><p>Every field is yours to shape; only the title and story are required.</p></div><span className="composer-step">01 <i /> 01</span></div>
        <NewPostForm error={error} />
      </section>
      <p className="composer-security-note">No wallet signature is requested to publish. QoreX is only involved if you choose to anchor a milestone later.</p>
    </div>
  )
}
