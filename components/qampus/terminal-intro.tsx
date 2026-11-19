'use client'

import { useState } from 'react'

export function TerminalIntro() {
  const [visible, setVisible] = useState(true)

  if (!visible) return null

  return (
    <div
      className="qampus-intro"
      role="status"
      aria-label="Qampus interface introduction"
      onAnimationEnd={() => setVisible(false)}
    >
      <div className="intro-terminal">
        <span className="intro-prompt">&gt;_</span>
        <span className="intro-command"> Qampus.verify</span>
        <span className="intro-cursor" aria-hidden="true" />
        <span className="intro-result">campus stories, made verifiable.</span>
      </div>
      <button className="intro-skip" type="button" onClick={() => setVisible(false)}>
        Skip intro <span aria-hidden="true">↗</span>
      </button>
    </div>
  )
}
