"use client";

import Image from "next/image";
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

function PathwayBand() {
  return (
    <div className={styles.pathwayBand} aria-hidden="true">
      <span /><span /><span /><span /><span />
    </div>
  );
}

function FilmLockup() {
  return (
    <div className={styles.filmLockup}>
      <strong>Third Degree<br />Burnout</strong>
      <span>A Survivor&apos;s Guide</span>
    </div>
  );
}

function PartnerFooter({ reminder }: { reminder?: string }) {
  return (
    <footer className={styles.footer}>
      {reminder && <p>{reminder}</p>}
      <div className={styles.partnerPlate} aria-label="Brought to you by JIVINITI in partnership with Picture Motion">
        <span>Brought to you by</span>
        <Image src="/images/jiviniti-wordmark.png" width={1118} height={518} alt="JIVINITI by The Virsa Foundation" />
        <span>in partnership with</span>
        <Image src="/images/picture-motion.jpg" width={200} height={200} alt="Picture Motion" />
      </div>
      <p className={styles.safety}>This is a conversation guide, not therapy or crisis support. Please pause if anyone feels overwhelmed.</p>
      <PathwayBand />
    </footer>
  );
}

function CompactHeader({ topic }: { topic?: string }) {
  return (
    <>
      <header className={styles.compactHeader}>
        <ResetBrand light />
        <FilmLockup />
      </header>
      {topic && <p className={styles.topicMarker}><span>Topic</span>{topic}</p>}
    </>
  );
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

  useEffect(() => {
    if (!hydrated || !selectedTheme || session) return;
    const frame = requestAnimationFrame(() => modeHeadingRef.current?.focus());
    return () => cancelAnimationFrame(frame);
  }, [hydrated, selectedTheme, session]);

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
      setCopyStatus("Link copied. Paste it into a message to invite someone.");
      setCopyFallback("");
    } catch {
      setCopyStatus("Copy this link and paste it into a message.");
      setCopyFallback(url);
    }
  }

  if (!hydrated) return <main className={styles.page}><p className={styles.loading}>Preparing the conversation…</p></main>;

  if (!session && !selectedTheme) {
    return (
      <main className={styles.page}>
        <div className={styles.shell}>
          <header className={styles.hero}>
            <div className={styles.heroTop}><ResetBrand light /><FilmLockup /></div>
            <div className={styles.heroBody}>
              <div className={styles.heroCopy}>
                <p className={styles.reviewFlag}>Draft for Foundation review</p>
                <p className={styles.eyebrow}>A conversation worth making room for</p>
                <h1>Take it to the table.</h1>
                <p>Choose something that feels relevant today. You do not need to have seen the film.</p>
              </div>
              <div className={styles.collage} aria-hidden="true" />
            </div>
            <div className={styles.tornBand}>
              <p>Questions for meals, walks, calls, classrooms, and gatherings.</p>
            </div>
          </header>

          <section className={styles.startPanel} aria-labelledby="choose-theme-title">
            <div className={styles.stepLabel}><span>01</span><p>Choose a topic</p></div>
            <h2 id="choose-theme-title">What feels worth talking about?</h2>
            <p className={styles.introText}>Pick what is on your mind. Every question can be discussed whether or not you have watched <em>Third Degree Burnout</em>.</p>

            <div className={styles.themeGrid}>
              <button className={styles.acrossTheme} type="button" onClick={() => setSelectedTheme("across")}>
                <b>Across the film</b><span>Move between several themes</span><i aria-hidden="true">→</i>
              </button>
              {THEME_IDS.map((themeId) => {
                const theme = CONVERSATION_THEMES[themeId];
                return (
                  <button type="button" onClick={() => setSelectedTheme(themeId)} key={themeId}>
                    <b>{theme.number}</b><span>{theme.label}</span><small>{theme.description}</small><i aria-hidden="true">→</i>
                  </button>
                );
              })}
            </div>

            <aside className={styles.agreement}>
              <p className={styles.eyebrow}>A few things to hold gently</p>
              <ul>
                <li>Share only what feels comfortable.</li>
                <li>You can skip any question, pause, or stop.</li>
                <li>Listen without feeling that you need to fix anything.</li>
                <li>Keep personal stories private.</li>
              </ul>
            </aside>
          </section>
          <PartnerFooter />
        </div>
      </main>
    );
  }

  if (!session && selectedTheme) {
    return (
      <main className={styles.page}>
        <div className={`${styles.shell} ${styles.sessionShell}`}>
          <CompactHeader />
          <section className={styles.modePanel}>
            <div className={styles.stepLabel}><span>02</span><p>Choose how far to go</p></div>
            <p className={styles.selectedLabel}>You chose</p>
            <h1 ref={modeHeadingRef} tabIndex={-1}>{getThemeLabel(selectedTheme)}</h1>
            <button className={styles.changeTopic} type="button" onClick={() => setSelectedTheme(null)}>← Change topic</button>
            <p className={styles.modeIntro}>Start small or make more room. There is no timer, and you can stop whenever you need to.</p>
            <div className={styles.modeGrid}>
              {MODE_IDS.map((mode) => (
                <button type="button" onClick={() => start(mode)} key={mode}>
                  <span>{CONVERSATION_MODES[mode].count.toString().padStart(2, "0")}</span>
                  <strong>{CONVERSATION_MODES[mode].label}</strong>
                  <small>{CONVERSATION_MODES[mode].description}</small>
                  <i aria-hidden="true">→</i>
                </button>
              ))}
            </div>
          </section>
          <PartnerFooter reminder="Share only what feels comfortable. You can skip any question, pause, or stop." />
        </div>
      </main>
    );
  }

  if (!session) return null;

  if (session.complete) {
    return (
      <main className={styles.page}>
        <div className={`${styles.shell} ${styles.sessionShell}`}>
          <CompactHeader topic={getThemeLabel(session.theme)} />
          <section className={styles.completion}>
            <p className={styles.reviewFlag}>Draft for Foundation review</p>
            <p className={styles.eyebrow}>Carry it forward</p>
            <h1 ref={focusRef} tabIndex={-1}>Which question would you like to keep thinking about?</h1>
            <p>You do not need to settle on an answer. Sometimes noticing what deserves another conversation is enough.</p>
            <div className={styles.completionActions}>
              <button className={styles.primaryButton} type="button" onClick={restart}>Explore another topic</button>
              <button className={styles.secondaryButton} type="button" onClick={() => void copyLink()}>Invite someone to a conversation</button>
              <button className={styles.textButton} type="button" onClick={goBack}>Back to the last question</button>
            </div>
            <p className={styles.copyStatus} aria-live="polite">{copyStatus}</p>
            {copyFallback && <input className={styles.copyFallback} aria-label="Conversation tool link" readOnly value={copyFallback} onFocus={(event) => event.currentTarget.select()} />}
          </section>
          <PartnerFooter />
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
        <CompactHeader topic={getThemeLabel(session.theme)} />
        <div className={styles.progress} aria-hidden="true"><span style={{ width: `${progress}%` }} /></div>
        <p className={styles.progressText} aria-live="polite">Question {session.currentIndex + 1} of {session.promptIds.length}<span>{remaining ? `${remaining} remaining` : "Final question"}</span></p>
        <article className={styles.promptCard} key={currentPrompt.id}>
          <div className={styles.stageHeading}><p>{theme.label}</p><span>{theme.number}</span></div>
          <p className={styles.context}>{currentPrompt.context}</p>
          <h1 ref={focusRef} tabIndex={-1}>{currentPrompt.question}</h1>
          <div className={styles.followUp}>
            <button type="button" aria-expanded={followUpOpen} onClick={() => setFollowUpOpen((open) => !open)}>{followUpOpen ? "Hide the follow-up" : "Explore this a little further"}</button>
            {followUpOpen && <p>{currentPrompt.followUp}</p>}
          </div>
          <PathwayBand />
        </article>
        <nav className={styles.controls} aria-label="Conversation questions">
          <button className={styles.textButton} type="button" onClick={goBack} disabled={session.currentIndex === 0}>Back</button>
          <button className={styles.secondaryButton} type="button" onClick={pass}>Try another question</button>
          <button className={styles.primaryButton} type="button" onClick={advance}>{remaining ? "Continue" : "Finish conversation"}</button>
        </nav>
        <PartnerFooter reminder="Share only what feels comfortable. You can skip any question, pause, or stop." />
      </div>
    </main>
  );
}
