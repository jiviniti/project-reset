"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { ResetBrand } from "@/components/brand/reset-brand";
import {
  CONVERSATION_PROMPTS,
  CONVERSATION_THEMES,
  getPrompt,
  getThemeLabel,
  type ConversationPrompt,
  type ConversationThemeChoice,
  type ConversationThemeId,
} from "./conversation-prompts";
import styles from "./conversation-starter.module.css";

const THEME_IDS = Object.keys(CONVERSATION_THEMES) as ConversationThemeId[];
const FEATURED_THEMES: readonly ConversationThemeId[] = ["burnout", "food", "access", "connection"];
const ACROSS_PROMPT_IDS = [
  "burnout-earned",
  "food-culture-carry",
  "pace-fastest",
  "land-last-meal",
  "access-assumed-resources",
  "climate-believable-hope",
] as const;

function isTheme(value: string | null): value is ConversationThemeChoice {
  return value === "across" || THEME_IDS.includes(value as ConversationThemeId);
}

function promptsFor(theme: ConversationThemeChoice): ConversationPrompt[] {
  if (theme === "across") {
    return ACROSS_PROMPT_IDS.map((id) => getPrompt(id)).filter((prompt): prompt is ConversationPrompt => Boolean(prompt));
  }
  return CONVERSATION_PROMPTS.filter((prompt) => prompt.theme === theme);
}

function PathwayBand() {
  return <div className={styles.pathwayBand} aria-hidden="true"><span /><span /><span /><span /><span /></div>;
}

function FilmLockup() {
  return (
    <div className={styles.filmLockup}>
      <strong>Third Degree<br />Burnout</strong>
      <span>A Survivor&apos;s Guide</span>
    </div>
  );
}

function PartnerFooter() {
  return (
    <footer className={styles.footer}>
      <div className={styles.partnerPlate} aria-label="Brought to you by JIVINITI in partnership with Picture Motion">
        <span>Brought to you by</span>
        <Image src="/images/jiviniti-wordmark.png" width={1118} height={518} alt="JIVINITI by The Virsa Foundation" />
        <span>in partnership with</span>
        <Image src="/images/picture-motion.jpg" width={200} height={200} alt="Picture Motion" />
      </div>
      <p className={styles.safety}>This is a conversation guide, not therapy or crisis support. Pause if anyone feels overwhelmed.</p>
      <PathwayBand />
    </footer>
  );
}

function ThemeButton({ themeId, selected, onSelect }: {
  themeId: ConversationThemeId;
  selected: boolean;
  onSelect: (theme: ConversationThemeId) => void;
}) {
  const theme = CONVERSATION_THEMES[themeId];
  return (
    <button type="button" aria-pressed={selected} onClick={() => onSelect(themeId)}>
      <b>{theme.number}</b><span>{theme.label}</span><small>{theme.description}</small><i aria-hidden="true">→</i>
    </button>
  );
}

export function ConversationStarter() {
  const [hydrated, setHydrated] = useState(false);
  const [selectedTheme, setSelectedTheme] = useState<ConversationThemeChoice | null>(null);
  const [showAllThemes, setShowAllThemes] = useState(false);
  const [expandedPrompt, setExpandedPrompt] = useState<string | null>(null);
  const [carriedPrompt, setCarriedPrompt] = useState<string | null>(null);
  const [shareStatus, setShareStatus] = useState("");
  const [shareFallback, setShareFallback] = useState("");
  const themeHeadingRef = useRef<HTMLHeadingElement>(null);
  const themeSelectorRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const restore = window.setTimeout(() => {
      const params = new URLSearchParams(window.location.search);
      const theme = params.get("theme");
      const question = params.get("question");
      if (isTheme(theme)) {
        setSelectedTheme(theme);
        if (theme !== "across" && !FEATURED_THEMES.includes(theme)) setShowAllThemes(true);
        if (question && promptsFor(theme).some((prompt) => prompt.id === question)) {
          setExpandedPrompt(question);
          setCarriedPrompt(question);
        }
      }
      setHydrated(true);
    }, 0);
    return () => window.clearTimeout(restore);
  }, []);

  useEffect(() => {
    if (!hydrated || !selectedTheme) return;
    const frame = requestAnimationFrame(() => {
      themeHeadingRef.current?.focus({ preventScroll: true });
      themeHeadingRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
    return () => cancelAnimationFrame(frame);
  }, [hydrated, selectedTheme]);

  function updateUrl(theme: ConversationThemeChoice | null, question?: string | null) {
    const url = new URL(window.location.href);
    url.search = "";
    if (theme) url.searchParams.set("theme", theme);
    if (theme && question) url.searchParams.set("question", question);
    window.history.replaceState({}, "", url);
  }

  function selectTheme(theme: ConversationThemeChoice) {
    setSelectedTheme(theme);
    setExpandedPrompt(null);
    setCarriedPrompt(null);
    setShareStatus("");
    setShareFallback("");
    updateUrl(theme);
  }

  function chooseAnotherTheme() {
    themeSelectorRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    const firstButton = themeSelectorRef.current?.querySelector<HTMLButtonElement>("button");
    firstButton?.focus();
  }

  function carryForward(promptId: string) {
    if (!selectedTheme) return;
    setCarriedPrompt(promptId);
    setExpandedPrompt(promptId);
    setShareStatus("");
    updateUrl(selectedTheme, promptId);
  }

  function shareUrl() {
    const url = new URL(`${window.location.origin}/take-it-to-the-table`);
    if (selectedTheme) url.searchParams.set("theme", selectedTheme);
    if (selectedTheme && carriedPrompt) url.searchParams.set("question", carriedPrompt);
    return url.toString();
  }

  async function shareConversation() {
    const url = shareUrl();
    const prompt = carriedPrompt ? getPrompt(carriedPrompt) : undefined;
    const shareData = {
      title: "Take It to the Table",
      text: prompt ? `A question worth talking about: ${prompt.question}` : `Questions about ${selectedTheme ? getThemeLabel(selectedTheme) : "Third Degree Burnout"}.`,
      url,
    };
    try {
      if (navigator.share) {
        await navigator.share(shareData);
        setShareStatus("Conversation shared.");
      } else {
        await navigator.clipboard.writeText(url);
        setShareStatus("Link copied. Paste it into a message to invite someone.");
      }
      setShareFallback("");
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        setShareStatus("Sharing cancelled. Nothing was lost.");
        return;
      }
      try {
        await navigator.clipboard.writeText(url);
        setShareStatus("Link copied. Paste it into a message to invite someone.");
        setShareFallback("");
      } catch {
        setShareStatus("Copy this link and paste it into a message.");
        setShareFallback(url);
      }
    }
  }

  if (!hydrated) return <main className={styles.page}><p className={styles.loading}>Preparing the questions…</p></main>;

  const visibleThemes = showAllThemes ? THEME_IDS : FEATURED_THEMES;
  const prompts = selectedTheme ? promptsFor(selectedTheme) : [];
  const carried = carriedPrompt ? getPrompt(carriedPrompt) : undefined;

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
              <p>Choose what feels relevant today. You do not need to have seen the film or know the perfect answer.</p>
            </div>
            <div className={styles.collage} aria-hidden="true" />
          </div>
          <div className={styles.tornBand}><p>Questions for meals, walks, calls, classrooms, and gatherings.</p></div>
        </header>

        <section ref={themeSelectorRef} className={styles.startPanel} aria-labelledby="choose-theme-title">
          <div className={styles.stepLabel}><span>01</span><p>Choose a topic</p></div>
          <h2 id="choose-theme-title">What feels worth talking about?</h2>
          <p className={styles.introText}>Select a theme to see every question in it. You can change themes whenever you like.</p>

          <div className={styles.themeGrid}>
            <button className={styles.acrossTheme} aria-pressed={selectedTheme === "across"} type="button" onClick={() => selectTheme("across")}>
              <b>Not sure where to begin?</b><span>Browse six questions drawn from across the film&apos;s themes.</span><i aria-hidden="true">→</i>
            </button>
            {visibleThemes.map((themeId) => <ThemeButton key={themeId} themeId={themeId} selected={selectedTheme === themeId} onSelect={selectTheme} />)}
          </div>
          <button className={styles.showThemesButton} type="button" aria-expanded={showAllThemes} onClick={() => setShowAllThemes((shown) => !shown)}>
            {showAllThemes ? "Show the four featured themes" : "Show all 10 themes"}
          </button>

          <aside className={styles.agreement}>
            <p className={styles.eyebrow}>A few things to hold gently</p>
            <ul>
              <li>Share only what feels comfortable.</li>
              <li>Skip any question, pause, or stop.</li>
              <li>Listen without needing to fix anything.</li>
              <li>Keep personal stories private.</li>
            </ul>
          </aside>
        </section>

        {selectedTheme && (
          <section key={selectedTheme} className={styles.questionLibrary} aria-labelledby="question-library-heading">
            <div className={styles.libraryHeading}>
              <div>
                <p className={styles.eyebrow}>Browse at your own pace</p>
                <h2 id="question-library-heading" ref={themeHeadingRef} tabIndex={-1}>Questions about {getThemeLabel(selectedTheme)}</h2>
                <p>Choose any question that opens something useful. There is no required order and nothing to submit.</p>
              </div>
              <button type="button" onClick={chooseAnotherTheme}>Choose another theme</button>
            </div>

            <div className={styles.questionGrid}>
              {prompts.map((prompt, index) => {
                const expanded = expandedPrompt === prompt.id;
                const carriedForward = carriedPrompt === prompt.id;
                return (
                  <article className={`${styles.questionCard}${carriedForward ? ` ${styles.carriedCard}` : ""}`} key={prompt.id}>
                    <div className={styles.questionNumber}><span>{String(index + 1).padStart(2, "0")}</span><small>{CONVERSATION_THEMES[prompt.theme].label}</small></div>
                    <p>{prompt.context}</p>
                    <h3>{prompt.question}</h3>
                    <button className={styles.followUpButton} type="button" aria-expanded={expanded} onClick={() => setExpandedPrompt(expanded ? null : prompt.id)}>
                      {expanded ? "Close the deeper prompt" : "Go a little deeper"}
                    </button>
                    {expanded && <div className={styles.followUp}><span>Consider this too</span>{prompt.followUp}</div>}
                    <button className={styles.carryButton} type="button" aria-pressed={carriedForward} onClick={() => carryForward(prompt.id)}>
                      {carriedForward ? "Carrying this question forward" : "Carry this question forward"}
                    </button>
                  </article>
                );
              })}
            </div>

            {carried && (
              <aside className={styles.carryPanel} aria-live="polite">
                <div className={styles.miniBurst} aria-hidden="true"><span /><span /><span /><span /><span /></div>
                <p className={styles.eyebrow}>Carry it forward</p>
                <h2>You found a question worth keeping open.</h2>
                <blockquote>{carried.question}</blockquote>
                <p>Share a link that opens this question, or choose another theme. Your answer is never collected.</p>
                <div className={styles.carryActions}>
                  <button className={styles.primaryButton} type="button" onClick={() => void shareConversation()}>Share this conversation</button>
                  <button className={styles.secondaryButton} type="button" onClick={chooseAnotherTheme}>Choose another theme</button>
                </div>
                <p className={styles.shareStatus} aria-live="polite">{shareStatus}</p>
                {shareFallback && <input aria-label="Conversation link" readOnly value={shareFallback} onFocus={(event) => event.currentTarget.select()} />}
              </aside>
            )}
          </section>
        )}
        <PartnerFooter />
      </div>
    </main>
  );
}
