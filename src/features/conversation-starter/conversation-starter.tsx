"use client";

import { useEffect, useRef, useState } from "react";
import { ResetBrand } from "@/components/brand/reset-brand";
import {
  buildConversationSession,
  CONVERSATION_CONTENT_VERSION,
  CONVERSATION_MODES,
  CONVERSATION_THEMES,
  findReplacementPrompt,
  getPrompt,
  getThemeLabel,
  type ConversationMode,
  type ConversationThemeChoice,
  type ConversationThemeId,
} from "./conversation-prompts";
import styles from "./conversation-starter.module.css";

const STORAGE_KEY = "project-reset-take-it-to-the-table-v2";
const LEGACY_STORAGE_KEY = "project-reset-take-it-to-the-table-v1";
const THEME_IDS = Object.keys(CONVERSATION_THEMES) as ConversationThemeId[];
const MODE_IDS = Object.keys(CONVERSATION_MODES) as ConversationMode[];

type ConversationSession = {
  version: typeof CONVERSATION_CONTENT_VERSION;
  theme: ConversationThemeChoice;
  mode: ConversationMode;
  seed: number;
  promptIds: string[];
  passedPromptIds: string[];
  currentIndex: number;
  complete: boolean;
};

function isTheme(value: unknown): value is ConversationThemeChoice {
  return value === "across" || THEME_IDS.includes(value as ConversationThemeId);
}

function isMode(value: unknown): value is ConversationMode {
  return MODE_IDS.includes(value as ConversationMode);
}

function parseStoredSession(value: string | null): ConversationSession | null {
  if (!value) return null;
  try {
    const candidate = JSON.parse(value) as Partial<ConversationSession>;
    if (
      candidate.version !== CONVERSATION_CONTENT_VERSION
      || !isTheme(candidate.theme)
      || !isMode(candidate.mode)
      || typeof candidate.seed !== "number"
      || !Array.isArray(candidate.promptIds)
      || candidate.promptIds.length !== CONVERSATION_MODES[candidate.mode].count
      || !candidate.promptIds.every((id) => typeof id === "string" && getPrompt(id))
      || !Array.isArray(candidate.passedPromptIds)
      || !candidate.passedPromptIds.every((id) => typeof id === "string")
      || typeof candidate.currentIndex !== "number"
      || candidate.currentIndex < 0
      || candidate.currentIndex >= candidate.promptIds.length
      || typeof candidate.complete !== "boolean"
    ) return null;
    return candidate as ConversationSession;
  } catch {
    return null;
  }
}

function createSeed() {
  const values = new Uint32Array(1);
  crypto.getRandomValues(values);
  return values[0] || 1;
}

export function ConversationStarter() {
  const [session, setSession] = useState<ConversationSession | null>(null);
  const [selectedTheme, setSelectedTheme] = useState<ConversationThemeChoice | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [followUpOpen, setFollowUpOpen] = useState(false);
  const [copyStatus, setCopyStatus] = useState("");
  const [copyFallback, setCopyFallback] = useState("");
  const focusRef = useRef<HTMLHeadingElement>(null);
  const modeHeadingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    const restore = window.setTimeout(() => {
      setSession(parseStoredSession(sessionStorage.getItem(STORAGE_KEY)));
      sessionStorage.removeItem(LEGACY_STORAGE_KEY);
      setHydrated(true);
    }, 0);
    return () => window.clearTimeout(restore);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    if (session) sessionStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    else sessionStorage.removeItem(STORAGE_KEY);
  }, [hydrated, session]);

  useEffect(() => {
    if (!hydrated || !session) return;
    const frame = requestAnimationFrame(() => focusRef.current?.focus());
    return () => cancelAnimationFrame(frame);
  }, [hydrated, session]);

  function chooseTheme(theme: ConversationThemeChoice) {
    setSelectedTheme(theme);
    requestAnimationFrame(() => modeHeadingRef.current?.focus());
  }

  function start(mode: ConversationMode) {
    if (!selectedTheme) return;
    const seed = createSeed();
    setFollowUpOpen(false);
    setSession({
      version: CONVERSATION_CONTENT_VERSION,
      theme: selectedTheme,
      mode,
      seed,
      promptIds: buildConversationSession(selectedTheme, mode, seed),
      passedPromptIds: [],
      currentIndex: 0,
      complete: false,
    });
  }

  function advance() {
    if (!session) return;
    setFollowUpOpen(false);
    if (session.currentIndex === session.promptIds.length - 1) {
      setSession({ ...session, complete: true });
      return;
    }
    setSession({ ...session, currentIndex: session.currentIndex + 1 });
  }

  function goBack() {
    if (!session) return;
    setFollowUpOpen(false);
    if (session.complete) {
      setSession({ ...session, complete: false });
      return;
    }
    if (session.currentIndex > 0) setSession({ ...session, currentIndex: session.currentIndex - 1 });
  }

  function pass() {
    if (!session) return;
    setFollowUpOpen(false);
    const currentId = session.promptIds[session.currentIndex];
    const replacement = findReplacementPrompt(
      currentId,
      session.promptIds,
      session.passedPromptIds,
      session.seed + session.passedPromptIds.length + session.currentIndex + 1,
    );
    if (!replacement) {
      advance();
      return;
    }
    const promptIds = [...session.promptIds];
    promptIds[session.currentIndex] = replacement.id;
    setSession({ ...session, promptIds, passedPromptIds: [...session.passedPromptIds, currentId] });
  }

  function restart() {
    setCopyStatus("");
    setCopyFallback("");
    setSelectedTheme(null);
    setSession(null);
  }

  async function copyLink() {
    const url = `${window.location.origin}/take-it-to-the-table`;
    try {
      await navigator.clipboard.writeText(url);
      setCopyStatus("Link copied. Invite someone to the table.");
      setCopyFallback("");
    } catch {
      setCopyStatus("Copy this link to share the conversation.");
      setCopyFallback(url);
    }
  }

  if (!hydrated) return <main className={styles.page}><p className={styles.loading}>Preparing the table…</p></main>;

  if (!session) {
    return (
      <main className={styles.page}>
        <div className={styles.shell}>
          <header className={styles.hero}>
            <div className={styles.heroTop}>
              <ResetBrand light />
              <div className={styles.filmLockup}><strong>Third Degree<br />Burnout</strong><span>A Survivor’s Guide</span></div>
            </div>
            <p className={styles.reviewFlag}>Draft for Foundation review</p>
            <div className={styles.heroCopy}>
              <p className={styles.kicker}>A conversation worth making room for</p>
              <h1>Take it to<br /><em>the table.</em></h1>
              <p>Choose what is on your mind. No prior viewing, preparation, or perfect answer is required.</p>
            </div>
            <div className={styles.collage} aria-hidden="true" />
          </header>

          <section className={styles.startPanel} aria-labelledby="choose-theme-title">
            <p className={styles.eyebrow}>Begin where you are</p>
            <h2 id="choose-theme-title">What do you want to talk about?</h2>
            <p className={styles.introText}>Themes come from <em>Third Degree Burnout</em>, but every question stands on its own.</p>

            <div className={styles.themeGrid}>
              <button className={styles.acrossTheme} type="button" aria-pressed={selectedTheme === "across"} onClick={() => chooseTheme("across")}>
                <span>Across the film</span><small>Let the tool move between several themes</small>
              </button>
              {THEME_IDS.map((themeId) => {
                const theme = CONVERSATION_THEMES[themeId];
                return (
                  <button type="button" aria-pressed={selectedTheme === themeId} onClick={() => chooseTheme(themeId)} key={themeId}>
                    <b>{theme.number}</b><span>{theme.label}</span><small>{theme.description}</small>
                  </button>
                );
              })}
            </div>

            {selectedTheme && (
              <div className={styles.modePanel}>
                <p className={styles.eyebrow}>You chose · {getThemeLabel(selectedTheme)}</p>
                <h3 ref={modeHeadingRef} tabIndex={-1}>How would you like to begin?</h3>
                <div className={styles.modeGrid}>
                  {MODE_IDS.map((mode) => (
                    <button type="button" onClick={() => start(mode)} key={mode}>
                      <strong>{CONVERSATION_MODES[mode].label}</strong>
                      <span>{CONVERSATION_MODES[mode].description}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className={styles.agreement}>
              <p className={styles.eyebrow}>Before you begin</p>
              <ul>
                <li>Passing is always allowed.</li>
                <li>Listen to understand, not immediately fix.</li>
                <li>Speak from your own experience.</li>
                <li>Keep personal stories private.</li>
              </ul>
            </div>
          </section>
          <footer className={styles.safety}><p>This is a conversation guide, not therapy or crisis support. Pause if anyone feels overwhelmed.</p></footer>
        </div>
      </main>
    );
  }

  if (session.complete) {
    return (
      <main className={styles.page}>
        <div className={`${styles.shell} ${styles.sessionShell}`}>
          <header className={styles.compactHeader}><ResetBrand light /><p>{getThemeLabel(session.theme)}</p></header>
          <section className={styles.completion}>
            <p className={styles.reviewFlag}>Draft for Foundation review</p>
            <p className={styles.eyebrow}>The conversation can stay open</p>
            <h1 ref={focusRef} tabIndex={-1}>Which question will you carry with you?</h1>
            <p>You do not need to settle on an answer. Sometimes noticing what deserves another conversation is enough.</p>
            <p className={styles.scriptLine}>Keep listening for what comes next.</p>
            <div className={styles.completionActions}>
              <button className={styles.primaryButton} type="button" onClick={restart}>Choose another theme</button>
              <button className={styles.secondaryButton} type="button" onClick={() => void copyLink()}>Copy link to this tool</button>
              <button className={styles.textButton} type="button" onClick={goBack}>Back to the last question</button>
            </div>
            <p className={styles.copyStatus} aria-live="polite">{copyStatus}</p>
            {copyFallback && <input className={styles.copyFallback} aria-label="Conversation tool link" readOnly value={copyFallback} onFocus={(event) => event.currentTarget.select()} />}
          </section>
          <footer className={styles.safety}><p>This is a conversation guide, not therapy or crisis support. Pause if anyone feels overwhelmed.</p></footer>
        </div>
      </main>
    );
  }

  const currentPrompt = getPrompt(session.promptIds[session.currentIndex]);
  if (!currentPrompt) return null;
  const theme = CONVERSATION_THEMES[currentPrompt.theme];
  const remaining = session.promptIds.length - session.currentIndex - 1;
  const progress = ((session.currentIndex + 1) / session.promptIds.length) * 100;

  return (
    <main className={styles.page}>
      <div className={`${styles.shell} ${styles.sessionShell}`}>
        <header className={styles.compactHeader}><ResetBrand light /><p>{getThemeLabel(session.theme)}</p></header>
        <div className={styles.progress} aria-hidden="true"><span style={{ width: `${progress}%` }} /></div>
        <p className={styles.progressText} aria-live="polite">Question {session.currentIndex + 1} of {session.promptIds.length}. {remaining ? `${remaining} remaining.` : "Final question."}</p>
        <article className={`${styles.promptCard} ${styles[`theme_${currentPrompt.theme}`]}`} key={currentPrompt.id}>
          <div className={styles.stageHeading}><p>{theme.label}</p><span>{theme.number}</span></div>
          <p className={styles.context}>{currentPrompt.context}</p>
          <h1 ref={focusRef} tabIndex={-1}>{currentPrompt.question}</h1>
          <div className={styles.followUp}>
            <button type="button" aria-expanded={followUpOpen} onClick={() => setFollowUpOpen((open) => !open)}>{followUpOpen ? "Close the follow-up" : "Go a little deeper"}</button>
            {followUpOpen && <p>{currentPrompt.followUp}</p>}
          </div>
        </article>
        <nav className={styles.controls} aria-label="Conversation questions">
          <button className={styles.textButton} type="button" onClick={goBack} disabled={session.currentIndex === 0}>Back</button>
          <button className={styles.secondaryButton} type="button" onClick={pass}>Pass · another question</button>
          <button className={styles.primaryButton} type="button" onClick={advance}>{remaining ? "Continue" : "Finish conversation"}</button>
        </nav>
        <footer className={styles.safety}><p>Passing is always allowed. Listen to understand, not immediately fix.</p></footer>
      </div>
    </main>
  );
}
