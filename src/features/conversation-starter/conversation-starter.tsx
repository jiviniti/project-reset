"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import { BrandedReset, ResetBrand } from "@/components/brand/reset-brand";
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
export const SAVED_QUESTIONS_STORAGE_KEY = "project-reset:conversation-saved:v1";
const ACROSS_PROMPT_IDS = ["burnout-earned", "food-culture-carry", "pace-fastest", "land-last-meal", "access-assumed-resources", "climate-believable-hope"] as const;

function isTheme(value: string | null): value is ConversationThemeChoice {
  return value === "across" || THEME_IDS.includes(value as ConversationThemeId);
}

function promptsFor(theme: ConversationThemeChoice): ConversationPrompt[] {
  if (theme === "across") return ACROSS_PROMPT_IDS.map((id) => getPrompt(id)).filter((prompt): prompt is ConversationPrompt => Boolean(prompt));
  return CONVERSATION_PROMPTS.filter((prompt) => prompt.theme === theme);
}

export function validatedPromptIds(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.filter((id): id is string => typeof id === "string" && Boolean(getPrompt(id))))];
}

export function savedQuestionsText(ids: string[]) {
  const lines = ids.flatMap((id, index) => {
    const prompt = getPrompt(id);
    return prompt ? [`${index + 1}. ${CONVERSATION_THEMES[prompt.theme].label}`, prompt.question, ""] : [];
  });
  return ["Continue the Conversation", "Questions saved from Project RESET", "", ...lines].join("\n").trimEnd();
}

function PathwayBand() {
  return <div className={styles.pathwayBand} aria-hidden="true"><span /><span /><span /><span /><span /></div>;
}

function FilmLockup() {
  return <div className={styles.filmLockup}><strong>Third Degree<br />Burnout</strong><span>A Survivor&apos;s Guide</span></div>;
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
      <p className={styles.safety}>For educational purposes only; not therapy, medical advice, or crisis support. Participation is voluntary. Pause or stop at any time if you experience discomfort or distress.</p>
      <PathwayBand />
    </footer>
  );
}

function ThemeButton({ themeId, selected, onSelect }: { themeId: ConversationThemeId; selected: boolean; onSelect: (theme: ConversationThemeId) => void }) {
  const theme = CONVERSATION_THEMES[themeId];
  return <button type="button" aria-pressed={selected} onClick={() => onSelect(themeId)}><b>{theme.number}</b><span>{theme.label}</span><small>{theme.description}</small><i aria-hidden="true">{selected ? "✓" : "→"}</i></button>;
}

async function copyText(value: string) {
  if (navigator.clipboard?.writeText) return navigator.clipboard.writeText(value);
  const textarea = document.createElement("textarea");
  textarea.value = value;
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  document.body.appendChild(textarea);
  textarea.select();
  const copied = document.execCommand("copy");
  textarea.remove();
  if (!copied) throw new Error("copy_failed");
}

export function ConversationStarter() {
  const [hydrated, setHydrated] = useState(false);
  const [selectedTheme, setSelectedTheme] = useState<ConversationThemeChoice | null>(null);
  const [showAllThemes, setShowAllThemes] = useState(false);
  const [expandedPrompt, setExpandedPrompt] = useState<string | null>(null);
  const [savedPromptIds, setSavedPromptIds] = useState<string[]>([]);
  const [saveStatus, setSaveStatus] = useState("");
  const [confirmClear, setConfirmClear] = useState(false);
  const themeHeadingRef = useRef<HTMLHeadingElement>(null);
  const themeSelectorRef = useRef<HTMLElement>(null);
  const questionLibraryRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const restore = window.setTimeout(() => {
      const params = new URLSearchParams(window.location.search);
      const theme = params.get("theme");
      const question = params.get("question");
      let stored: string[] = [];
      try { stored = validatedPromptIds(JSON.parse(window.localStorage.getItem(SAVED_QUESTIONS_STORAGE_KEY) ?? "[]")); } catch { stored = []; }
      if (isTheme(theme)) {
        setSelectedTheme(theme);
        if (theme !== "across" && !FEATURED_THEMES.includes(theme)) setShowAllThemes(true);
        if (question && promptsFor(theme).some((prompt) => prompt.id === question)) {
          setExpandedPrompt(question);
          stored = validatedPromptIds([...stored, question]);
        }
      }
      setSavedPromptIds(stored);
      try { window.localStorage.setItem(SAVED_QUESTIONS_STORAGE_KEY, JSON.stringify(stored)); } catch { /* Browser storage may be unavailable. */ }
      setHydrated(true);
    }, 0);
    return () => window.clearTimeout(restore);
  }, []);

  useEffect(() => {
    if (hydrated) {
      try { window.localStorage.setItem(SAVED_QUESTIONS_STORAGE_KEY, JSON.stringify(savedPromptIds)); } catch { /* Keep the in-memory session usable. */ }
    }
  }, [hydrated, savedPromptIds]);

  useEffect(() => {
    if (!hydrated || !selectedTheme) return;
    const frame = requestAnimationFrame(() => {
      themeHeadingRef.current?.focus({ preventScroll: true });
      questionLibraryRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
    return () => cancelAnimationFrame(frame);
  }, [hydrated, selectedTheme]);

  const savedPrompts = useMemo(() => savedPromptIds.map((id) => getPrompt(id)).filter((prompt): prompt is ConversationPrompt => Boolean(prompt)), [savedPromptIds]);

  function updateUrl(theme: ConversationThemeChoice | null) {
    const url = new URL(window.location.href);
    url.search = "";
    if (theme) url.searchParams.set("theme", theme);
    window.history.replaceState({}, "", url);
  }

  function selectTheme(theme: ConversationThemeChoice) {
    setSelectedTheme(theme);
    setExpandedPrompt(null);
    setSaveStatus("");
    setConfirmClear(false);
    updateUrl(theme);
  }

  function chooseAnotherTheme() {
    themeSelectorRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    themeSelectorRef.current?.querySelector<HTMLButtonElement>("button")?.focus();
  }

  function toggleSaved(promptId: string) {
    const removing = savedPromptIds.includes(promptId);
    setSavedPromptIds((current) => current.includes(promptId) ? current.filter((id) => id !== promptId) : [...current, promptId]);
    setSaveStatus(removing ? "Question removed." : "Question saved. Keep browsing or choose another theme.");
    setConfirmClear(false);
  }

  function viewSavedQuestions() {
    document.getElementById("saved-questions")?.scrollIntoView({ behavior: "smooth", block: "start" });
    document.getElementById("saved-questions-heading")?.focus({ preventScroll: true });
  }

  async function copySavedQuestions() {
    try {
      await copyText(savedQuestionsText(savedPromptIds));
      setSaveStatus("Your saved questions were copied.");
    } catch {
      setSaveStatus("Copying did not work on this device. Download the text file instead.");
    }
  }

  function downloadSavedQuestions() {
    const blob = new Blob([savedQuestionsText(savedPromptIds)], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "project-reset-conversation-questions.txt";
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    setSaveStatus("Your saved questions were downloaded.");
  }

  if (!hydrated) return <main className={styles.page}><p className={styles.loading}>Preparing the questions…</p></main>;

  const visibleThemes = showAllThemes ? THEME_IDS : FEATURED_THEMES;
  const prompts = selectedTheme ? promptsFor(selectedTheme) : [];

  return (
    <main className={styles.page}>
      {savedPromptIds.length > 0 ? <button type="button" className={styles.savedIndicator} onClick={viewSavedQuestions}>{savedPromptIds.length} {savedPromptIds.length === 1 ? "question" : "questions"} saved</button> : null}
      <div className={styles.shell}>
        <header className={styles.hero}>
          <div className={styles.heroTop}><ResetBrand light /><FilmLockup /></div>
          <div className={styles.heroBody}>
            <div className={styles.heroCopy}><p className={styles.reviewFlag}>Draft for Foundation review</p><p className={styles.eyebrow}>A conversation worth making room for</p><h1>Continue the conversation.</h1><p>Choose what feels relevant. You don’t need to have seen the film or have the answers.</p></div>
            <div className={styles.collage} aria-hidden="true" />
          </div>
          <div className={styles.tornBand}><p>Questions for meals, walks, calls, classrooms, and gatherings.</p></div>
        </header>

        <section ref={themeSelectorRef} className={styles.startPanel} aria-labelledby="choose-theme-title">
          <div className={styles.stepLabel}><span>01</span><p>Choose a topic</p></div>
          <h2 id="choose-theme-title">What feels worth talking about?</h2>
          <p className={styles.introText}>Choose a theme. You can switch anytime.</p>
          <div className={styles.themeGrid}>
            <button className={styles.acrossTheme} aria-pressed={selectedTheme === "across"} type="button" onClick={() => selectTheme("across")}><b>Not sure where to begin?</b><span>Browse six questions drawn from across the film&apos;s themes.</span><i aria-hidden="true">{selectedTheme === "across" ? "✓" : "→"}</i></button>
            {visibleThemes.map((themeId) => <ThemeButton key={themeId} themeId={themeId} selected={selectedTheme === themeId} onSelect={selectTheme} />)}
          </div>
          <button className={styles.showThemesButton} type="button" aria-expanded={showAllThemes} onClick={() => setShowAllThemes((shown) => !shown)}>{showAllThemes ? "Show the four featured themes" : "Show all 10 themes"}</button>
          <aside className={styles.agreement}><p className={styles.eyebrow}>A few things to hold gently</p><ul><li>Share only what feels comfortable.</li><li>Skip any question, pause, or stop.</li><li>Listen without needing to fix anything.</li><li>Keep personal stories private.</li></ul></aside>
        </section>

        {selectedTheme ? (
          <section id="question-library" ref={questionLibraryRef} key={selectedTheme} className={styles.questionLibrary} aria-labelledby="question-library-heading">
            <div className={styles.libraryHeading}><div><div className={`${styles.stepLabel} ${styles.stepLabelDark}`}><span>02</span><p>Explore the questions</p></div><h2 id="question-library-heading" ref={themeHeadingRef} tabIndex={-1}>Questions about {getThemeLabel(selectedTheme)}</h2><p>Choose any question that opens something useful. There is no required order and nothing to submit.</p></div><button type="button" onClick={chooseAnotherTheme}>Choose another theme</button></div>
            <div className={styles.questionGrid}>
              {prompts.map((prompt, index) => {
                const expanded = expandedPrompt === prompt.id;
                const saved = savedPromptIds.includes(prompt.id);
                return <article className={`${styles.questionCard}${saved ? ` ${styles.savedCard}` : ""}`} key={prompt.id}><div className={styles.questionNumber}><span>{String(index + 1).padStart(2, "0")}</span><small>{CONVERSATION_THEMES[prompt.theme].label}</small></div><p>{prompt.context}</p><h3>{prompt.question}</h3><button className={styles.followUpButton} type="button" aria-expanded={expanded} onClick={() => setExpandedPrompt(expanded ? null : prompt.id)}>{expanded ? "Close the deeper prompt" : "Go a little deeper"}</button>{expanded ? <div className={styles.followUp}><span>Consider this too</span>{prompt.followUp}</div> : null}<button className={styles.saveButton} type="button" aria-pressed={saved} onClick={() => toggleSaved(prompt.id)}>{saved ? <><span aria-hidden="true">✓</span> Saved. Remove question.</> : "Save this question."}</button></article>;
              })}
            </div>
          </section>
        ) : null}

        {savedPrompts.length > 0 ? (
          <section id="saved-questions" className={styles.savedPanel} aria-labelledby="saved-questions-heading">
            <p className={styles.eyebrow}>Keep what stayed with you</p>
            <h2 id="saved-questions-heading" tabIndex={-1}>My saved questions</h2>
            <p>Saved on this browser and device only. Your choices are not sent to Project <BrandedReset uppercase />.</p>
            <ol>{savedPrompts.map((prompt) => <li key={prompt.id}><small>{CONVERSATION_THEMES[prompt.theme].label}</small><p>{prompt.question}</p><button type="button" onClick={() => toggleSaved(prompt.id)}>Remove</button></li>)}</ol>
            <div className={styles.savedActions}><button className={styles.primaryButton} type="button" onClick={() => void copySavedQuestions()}>Copy my questions</button><button className={styles.secondaryButton} type="button" onClick={downloadSavedQuestions}>Download my questions</button></div>
            {!confirmClear ? <button className={styles.clearButton} type="button" onClick={() => setConfirmClear(true)}>Clear saved questions</button> : <div className={styles.clearConfirmation} role="group" aria-label="Confirm clearing saved questions"><p>Remove all saved questions from this device?</p><button type="button" onClick={() => { setSavedPromptIds([]); setConfirmClear(false); setSaveStatus("All saved questions were cleared."); }}>Yes, clear all</button><button type="button" onClick={() => setConfirmClear(false)}>Keep my questions</button></div>}
          </section>
        ) : null}
        <p className={styles.saveStatus} aria-live="polite">{saveStatus}</p>
        <PartnerFooter />
      </div>
    </main>
  );
}
