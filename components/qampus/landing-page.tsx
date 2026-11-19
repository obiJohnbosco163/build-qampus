import Link from 'next/link'
import {
  ArrowDown,
  ArrowRight,
  ArrowUpRight,
  Fingerprint,
  LockKeyhole,
  Orbit,
  ShieldCheck,
  UsersRound,
} from 'lucide-react'
import { NetworkStatus } from '@/components/qampus/network-status'
import { TerminalIntro } from '@/components/qampus/terminal-intro'

const features = [
  {
    number: '01',
    icon: UsersRound,
    title: 'Campus, by nature',
    description:
      'Keep the people around your work in context — course mates, project partners, mentors, and the friends who showed up.',
    label: 'CONSENTED CIRCLES',
  },
  {
    number: '02',
    icon: Fingerprint,
    title: 'Proof when it matters',
    description:
      'Choose a milestone to anchor. Its content fingerprint can be checked without publishing the story itself on-chain.',
    label: 'POST-QUANTUM READY',
  },
  {
    number: '03',
    icon: LockKeyhole,
    title: 'Your work, your audience',
    description:
      'Share a public milestone or prepare private work for the people you choose. Privacy should be part of the flow.',
    label: 'PRIVATE BY DESIGN',
  },
]

export function LandingPage() {
  return (
    <main className="qampus-shell">
      <TerminalIntro />
      <div className="qampus-grid-glow" aria-hidden="true" />
      <header className="qampus-header">
        <Link className="qampus-brand" href="/" aria-label="Qampus home">
          <span className="qampus-brand-mark"><Orbit size={19} strokeWidth={1.8} /></span>
          <span>qampus<span className="brand-period">.</span></span>
        </Link>
        <nav className="qampus-nav" aria-label="Main navigation">
          <a href="#how-it-works">How it works</a>
          <a href="#trust-layer">Trust layer</a>
          <a href="#about">About</a>
        </nav>
        <a className="qampus-header-cta" href="#how-it-works">
          Explore Qampus <ArrowUpRight size={15} aria-hidden="true" />
        </a>
      </header>

      <section className="qampus-hero" aria-labelledby="hero-title">
        <div className="qampus-hero-copy">
          <div className="qampus-kicker"><span className="status-dot" /> A STORY WORTH KEEPING</div>
          <h1 id="hero-title">Your campus<br /><span>story, proven.</span></h1>
          <p className="qampus-hero-lede">
            The projects, people, and hard-won milestones that make your years on campus yours. Keep them together. Make the important ones verifiable.
          </p>
          <div className="qampus-hero-actions">
            <a className="button-primary" href="#how-it-works">See how it works <ArrowRight size={16} aria-hidden="true" /></a>
            <a className="button-quiet" href="#trust-layer">Meet the trust layer <ArrowDown size={14} aria-hidden="true" /></a>
          </div>
          <div className="qampus-hero-footnote">
            <ShieldCheck size={16} aria-hidden="true" />
            <span>Built for campus life. Designed for records that last.</span>
          </div>
        </div>

        <div className="passport-stage" aria-label="Illustrative Qampus student passport preview">
          <div className="stage-orbit orbit-one" aria-hidden="true" />
          <div className="stage-orbit orbit-two" aria-hidden="true" />
          <div className="passport-card">
            <div className="passport-topline">
              <span className="mono-label">QAMPUS / PASSPORT</span>
              <span className="preview-chip">PRODUCT PREVIEW</span>
            </div>
            <div className="passport-profile">
              <div className="passport-avatar" aria-hidden="true">AO</div>
              <div>
                <p className="passport-name">Ada Okafor</p>
                <p className="passport-school">FUTO <span>·</span> Computer Engineering</p>
              </div>
              <span className="profile-menu" aria-hidden="true">•••</span>
            </div>
            <div className="passport-divider" />
            <div className="passport-section-heading">
              <span className="mono-label">RECENT MILESTONES</span>
              <span className="item-count">02</span>
            </div>
            <article className="milestone-preview">
              <div className="milestone-icon"><span>01</span></div>
              <div className="milestone-copy">
                <p className="milestone-title">Built a campus power monitor</p>
                <p className="milestone-meta">PROJECT <span>·</span> 4 MIN READ</p>
              </div>
              <ArrowUpRight size={15} aria-hidden="true" />
            </article>
            <article className="milestone-preview">
              <div className="milestone-icon violet-icon"><span>02</span></div>
              <div className="milestone-copy">
                <p className="milestone-title">SIWES, from logbook to lessons</p>
                <p className="milestone-meta">EXPERIENCE <span>·</span> 6 MIN READ</p>
              </div>
              <ArrowUpRight size={15} aria-hidden="true" />
            </article>
            <div className="passport-bottomline">
              <span className="preview-hash"><span className="hash-dot" /> ANCHOR WHEN YOU&apos;RE READY</span>
              <span className="chain-mark">Q</span>
            </div>
          </div>
          <div className="floating-note note-top"><span className="note-icon"><UsersRound size={14} /></span><span>People are part of the story</span></div>
          <div className="floating-note note-bottom"><span className="note-icon note-icon-violet"><Fingerprint size={14} /></span><span>Proof, on your terms</span></div>
        </div>
      </section>

      <div className="qampus-divider-band" aria-label="Designed around student milestones, consent, and cryptographic proof">
        <span>STUDENT MILESTONES</span><i />
        <span>CONSENT FIRST</span><i />
        <span>CRYPTOGRAPHIC PROOF</span><i />
        <span>YOUR CAMPUS. YOUR STORY.</span>
      </div>

      <section className="qampus-how" id="how-it-works" aria-labelledby="how-title">
        <div className="section-heading-row">
          <div>
            <p className="section-label">[ 01 / THE IDEA ]</p>
            <h2 id="how-title">More than a feed.<br /><span>A record of becoming.</span></h2>
          </div>
          <p className="section-intro">Every semester leaves something behind. Qampus gives the work, the people, and the proof a home that moves with you.</p>
        </div>
        <div className="feature-grid">
          {features.map(({ number, icon: Icon, title, description, label }) => (
            <article className="feature-card" key={number}>
              <div className="feature-card-top"><span className="feature-number">{number} / 03</span><Icon size={19} strokeWidth={1.6} aria-hidden="true" /></div>
              <h3>{title}</h3>
              <p>{description}</p>
              <span className="feature-label">{label}</span>
            </article>
          ))}
        </div>
      </section>

      <section className="qampus-trust" id="trust-layer" aria-labelledby="trust-title">
        <div className="trust-copy">
          <p className="section-label">[ 02 / TRUST, WITHOUT THE NOISE ]</p>
          <h2 id="trust-title">The work stays yours.<br /><span>The proof can travel.</span></h2>
          <p>A milestone can live as a story with its own audience. When you choose to anchor it, a cryptographic fingerprint can make later edits detectable — without putting your private files on a public chain.</p>
          <a className="text-link" href="#about">Why proof belongs on campus <ArrowRight size={15} aria-hidden="true" /></a>
        </div>
        <div className="trust-visual" aria-label="Illustration of a milestone fingerprint connected to a public verification record">
          <div className="trust-visual-header"><span className="mono-label">MILESTONE / TRUST PATH</span><span className="trust-live-dot" />
          </div>
          <div className="trust-flow">
            <div className="trust-node story-node"><span className="node-icon"><Fingerprint size={19} /></span><span><b>Your milestone</b><small>Story + chosen audience</small></span></div>
            <div className="trust-connector"><span>content fingerprint</span><i /></div>
            <div className="trust-node chain-node"><span className="node-icon violet-node"><ShieldCheck size={18} /></span><span><b>QoreChain record</b><small>Verification metadata</small></span></div>
          </div>
          <div className="trust-visual-footer"><span>CONTENT STAYS OFF-CHAIN</span><span>DIANA TESTNET</span></div>
        </div>
      </section>

      <section className="qampus-final-cta" id="about" aria-labelledby="final-title">
        <div className="cta-orb" aria-hidden="true"><Orbit size={44} strokeWidth={1} /></div>
        <p className="section-label">[ YOUR STORY IS STILL BEING WRITTEN ]</p>
        <h2 id="final-title">Make the work count.<br /><span>Keep the people close.</span></h2>
        <p>Qampus is being built for the moments you&apos;ll want to prove — and the ones you&apos;ll simply want to remember.</p>
        <a className="button-primary" href="#how-it-works">Explore the idea <ArrowRight size={16} aria-hidden="true" /></a>
      </section>

      <footer className="qampus-footer">
        <Link className="qampus-brand footer-brand" href="/" aria-label="Qampus home"><span className="qampus-brand-mark"><Orbit size={17} /></span><span>qampus<span className="brand-period">.</span></span></Link>
        <span className="footer-tagline">Your campus story, proven.</span>
        <NetworkStatus />
      </footer>
    </main>
  )
}
