"use client";

import Image from "next/image";
import { FormEvent, useState } from "react";
import { Chip } from "@/components/ui/chip";
import { IllustrativeDashboard } from "@/features/learning-lab/illustrative-dashboard";
import { ShareCard } from "@/features/share-card/share-card";
import { submissionResultSchema } from "@/lib/validation/submission";
import type { SubmissionResult } from "@/types/pathway";
import type { ScreeningConfig } from "@/types/screening";

type View = "hero" | "flow" | "success" | "lab";

type FormState = {
  firstName: string;
  email: string;
  city: string;
  ageBand: string;
  occupation: string;
  consent: boolean;
  futureCommunications: boolean;
  emotions: string[];
  burnoutCustomTags: string[];
  burnoutNote: string;
  pathways: string[];
  practices: string[];
  resetCustomTags: string[];
  ritual: string;
};

const initialForm: FormState = {
  firstName: "",
  email: "",
  city: "",
  ageBand: "",
  occupation: "",
  consent: false,
  futureCommunications: false,
  emotions: [],
  burnoutCustomTags: [],
  burnoutNote: "",
  pathways: [],
  practices: [],
  resetCustomTags: [],
  ritual: "",
};

const DONATION_URL = process.env.NEXT_PUBLIC_DONATE_URL ?? "https://thirddegreeburnout.com/donate";
const TRAILER_URL = process.env.NEXT_PUBLIC_PROJECT_RESET_TRAILER_URL?.trim() || "https://www.thirddegreeburnout.com/";

const pathwayPresentation: Record<string, { blurb: string; color: string }> = {
  nourish: { blurb: "plants, water, earth", color: "#458284" },
  restore: { blurb: "sleep, stillness", color: "#82bcc8" },
  move: { blurb: "body in motion", color: "#de5240" },
  connect: { blurb: "people, animals", color: "#fa8757" },
  rebalance: { blurb: "limits, meaning", color: "#d4953b" },
};

function ProgressHeader({ step, onBack, complete = false }: { step: number; onBack?: () => void; complete?: boolean }) {
  return (
    <header className="progress-header">
      <div className="progress-header__row">
        {onBack ? <button type="button" className="back-button" onClick={onBack}>← Back</button> : <span>Completed</span>}
        <span>Step 0{step} of 04</span>
      </div>
      <div className="progress-track" aria-label={`Step ${step} of 4`} aria-valuemin={1} aria-valuemax={4} aria-valuenow={step} role="progressbar">
        <span className={complete ? "progress-track__bar progress-track__bar--complete" : "progress-track__bar"} style={{ width: `${step * 25}%` }} />
      </div>
    </header>
  );
}

function CustomTagField({
  side,
  input,
  tags,
  onInput,
  onAdd,
  onRemove,
  dark = false,
}: {
  side: "burnout" | "reset";
  input: string;
  tags: string[];
  onInput: (value: string) => void;
  onAdd: () => void;
  onRemove: (value: string) => void;
  dark?: boolean;
}) {
  const trimmed = input.trim().slice(0, 60);
  const label = side === "burnout" ? "burnout" : "RESET";
  return (
    <div className={`custom-tags${dark ? " custom-tags--dark" : ""}`}>
      <p className="field-group-label">Can’t find the right option? Add your own response</p>
      {tags.length > 0 && <div className="chips" aria-label={`Your private ${label} tags`}>{tags.map((tag) => (
        <button type="button" className="chip chip--selected custom-tag" key={tag} onClick={() => onRemove(tag)} aria-label={`Remove ${tag}`}>
          {tag}<span aria-hidden="true"> ×</span>
        </button>
      ))}</div>}
      <div className="tag-composer">
        <input
          aria-label={`Add a ${label} tag`}
          maxLength={60}
          placeholder={side === "burnout" ? "Start typing, e.g. doomscrolling" : "Start typing, e.g. painting"}
          value={input}
          onChange={(event) => onInput(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              onAdd();
            }
          }}
        />
        {trimmed && tags.length < 6 ? (
          <button className="tag-suggestion" type="button" onClick={onAdd}>
            <span aria-hidden="true">＋</span>
            <span>Add “{trimmed}”<small>Saved in your own words</small></span>
          </button>
        ) : null}
      </div>
      {tags.length > 0 ? <small>{tags.length} of 6 added. Your responses are saved with your check-in and won’t appear in the live visualization yet.</small> : <small>Optional. Your response is saved with your check-in and won’t appear in the live visualization yet.</small>}
    </div>
  );
}

export function ResetExperience({ screening }: { screening: ScreeningConfig }) {
  const [view, setView] = useState<View>("hero");
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<FormState>(initialForm);
  const [showMoreEmotions, setShowMoreEmotions] = useState(false);
  const [burnoutTagInput, setBurnoutTagInput] = useState("");
  const [resetTagInput, setResetTagInput] = useState("");
  const [submissionStatus, setSubmissionStatus] = useState<"idle" | "submitting" | "error">("idle");
  const [submissionResult, setSubmissionResult] = useState<SubmissionResult | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [idempotencyKey, setIdempotencyKey] = useState(() => crypto.randomUUID());

  const question = (key: string) => screening.questions.find((item) => item.key === key)!;
  const emotionOptions = question("burnout_signs").options;
  const pathwayOptions = question("reset_pathways").options;
  const practiceOptions = question("reset_practices").options;
  const visibleEmotions = showMoreEmotions ? emotionOptions : emotionOptions.slice(0, 10);
  const selectedPracticeOptions = practiceOptions.filter((option) => form.practices.includes(option.key));
  const selectedPathwayOptions = pathwayOptions.filter((option) => form.pathways.includes(option.key));

  const practicesByPathway = Object.fromEntries(
    pathwayOptions.map((pathway) => [
      pathway.key,
      practiceOptions.filter((option) => option.parentOptionKey === pathway.key),
    ]),
  );

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function toggleList(key: "emotions" | "pathways" | "practices", value: string) {
    setForm((current) => {
      const selected = current[key].includes(value);
      const next = selected ? current[key].filter((item) => item !== value) : [...current[key], value];
      if (key === "pathways" && selected) {
        const practices = current.practices.filter((practiceKey) => {
          const practice = practiceOptions.find((option) => option.key === practiceKey);
          return practice?.parentOptionKey !== value;
        });
        return { ...current, pathways: next, practices };
      }
      return { ...current, [key]: next };
    });
  }

  function addCustomTag(side: "burnout" | "reset") {
    const input = side === "burnout" ? burnoutTagInput : resetTagInput;
    const value = input.trim().slice(0, 60);
    if (!value) return;
    const key = side === "burnout" ? "burnoutCustomTags" : "resetCustomTags";
    setForm((current) => {
      if (current[key].some((tag) => tag.localeCompare(value, undefined, { sensitivity: "accent" }) === 0)) {
        return current;
      }
      return { ...current, [key]: [...current[key], value].slice(0, 6) };
    });
    if (side === "burnout") setBurnoutTagInput("");
    else setResetTagInput("");
  }

  function removeCustomTag(side: "burnout" | "reset", value: string) {
    const key = side === "burnout" ? "burnoutCustomTags" : "resetCustomTags";
    setForm((current) => ({ ...current, [key]: current[key].filter((tag) => tag !== value) }));
  }

  function start() {
    setView("flow");
    setStep(1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function back() {
    if (step === 1) setView("hero");
    else setStep((current) => current - 1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function goToStep(nextStep: number) {
    setStep(nextStep);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function submitFinalStep(event: FormEvent) {
    event.preventDefault();
    const target = event.currentTarget as HTMLFormElement;
    if (!target.reportValidity()) return;
    void submit();
  }

  async function submit() {
    setSubmissionStatus("submitting");
    setErrorMessage("");
    const answers = [
      { questionKey: "burnout_signs", optionKeys: form.emotions },
      { questionKey: "burnout_custom_tags", text: form.burnoutCustomTags.join("\n") },
      { questionKey: "burnout_note", text: form.burnoutNote },
      { questionKey: "reset_pathways", optionKeys: form.pathways },
      { questionKey: "reset_practices", optionKeys: form.practices },
      { questionKey: "reset_custom_tags", text: form.resetCustomTags.join("\n") },
      { questionKey: "reset_ritual", text: form.ritual },
    ];

    try {
      const response = await fetch("/api/v1/submissions", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          apiVersion: "1",
          idempotencyKey,
          screeningSlug: screening.slug,
          participant: { firstName: form.firstName, email: form.email },
          demographics: {
            city: form.city || undefined,
            ageBand: form.ageBand || undefined,
            occupation: form.occupation || undefined,
          },
          consent: { dataUseAccepted: form.consent, policyVersion: screening.policyVersion },
          communication: { futureCommunicationsAllowed: form.futureCommunications },
          answers,
        }),
      });
      if (!response.ok) throw new Error("submission_failed");
      const result = submissionResultSchema.parse(await response.json());
      setSubmissionResult(result);
      setSubmissionStatus("idle");
      setView("success");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch {
      setSubmissionStatus("error");
      setErrorMessage("We couldn’t save your RESET. Your answers are still here—please try again.");
    }
  }

  function resetFlow() {
    setForm(initialForm);
    setIdempotencyKey(crypto.randomUUID());
    setSubmissionStatus("idle");
    setSubmissionResult(null);
    setErrorMessage("");
    setBurnoutTagInput("");
    setResetTagInput("");
    start();
  }

  if (view === "lab") {
    return <main className="experience"><div className="phone-shell"><IllustrativeDashboard onContribute={resetFlow} /></div></main>;
  }

  return (
    <main className="experience">
      <div className="phone-shell">
        {view === "hero" && (
          <section className="hero">
            <nav className="nav" aria-label="Project RESET">
              <Image src="/images/jiviniti-wordmark.png" alt="JIVINITI" width={108} height={50} className="nav__logo" />
              <a className="nav__action" href={DONATION_URL} target="_blank" rel="noreferrer">Donate</a>
            </nav>
            <div className="hero__content">
              <div className="reset-brand" aria-label="Project RESET">
                <span className="reset-brand__project">Project</span>
                <span className="reset-brand__word"><b>re</b>set<b>.</b></span>
                <span className="reset-brand__tagline">Choose Better. Together.</span>
              </div>
              <div className="film-lockup">
                <p>An educational initiative based on the award-winning documentary</p>
                <strong>Third Degree Burnout</strong>
                <em>A Survivor’s Guide</em>
              </div>
              <p className="eyebrow eyebrow--orange">The Learning Lab</p>
              <h1>How do you reset?</h1>
              <p className="hero__lede">The film asks the questions. Project RESET is where you answer them—carrying the conversation beyond the screen.</p>
              <p>Created by JIVINITI in partnership with Picture Motion, this living Learning Lab gathers what burnout feels like and what helps us come back to ourselves.</p>
              <div className="hero__image-frame">
                <Image src="/images/reset-collage.avif" alt="A collage of everyday movement, nourishment, rest, nature, and community" width={900} height={500} priority className="hero__image" />
              </div>
              {screening.eventWindowStatus === "event_expired" ? (
                <p className="pathway-notice">This event’s film-access window has ended. You can still contribute your RESET and watch the trailer.</p>
              ) : null}
              {screening.eventWindowStatus === "event_not_started" ? (
                <p className="pathway-notice">Film access for this event is not active yet. You can still contribute through the trailer pathway.</p>
              ) : null}
              <button type="button" className="button button--coral" onClick={start}>Contribute your RESET <span aria-hidden="true">→</span></button>
              <p className="hero__meta">About 90 seconds · public results are de-identified · {screening.rewardType === "film_access" ? "film access by email" : "trailer access after check-in"}</p>
              <button type="button" className="text-button" onClick={() => setView("lab")}>Explore the Learning Lab <span aria-hidden="true">→</span></button>
            </div>
          </section>
        )}

        {view === "flow" && (
          <section className="flow">
            <ProgressHeader step={step} onBack={back} />

            {step === 1 && (
              <section className="step step--dark">
                <p className="eyebrow eyebrow--orange">01 · The burnout landscape</p>
                <h2>How does burnout show up for you?</h2>
                <p>Choose as many as feel true.</p>
                <div className="chips">{visibleEmotions.map((option) => <Chip tone="dark" key={option.key} selected={form.emotions.includes(option.key)} onClick={() => toggleList("emotions", option.key)}>{option.label}</Chip>)}</div>
                <button type="button" className="text-button text-button--peach" onClick={() => setShowMoreEmotions((current) => !current)}>{showMoreEmotions ? "Show fewer" : `+ ${emotionOptions.length - 10} more ways it shows up`}</button>
                <CustomTagField side="burnout" input={burnoutTagInput} tags={form.burnoutCustomTags} onInput={setBurnoutTagInput} onAdd={() => addCustomTag("burnout")} onRemove={(tag) => removeCustomTag("burnout", tag)} dark />
                <label>Tell us more (optional)<textarea rows={3} maxLength={1500} value={form.burnoutNote} onChange={(event) => update("burnoutNote", event.target.value)} /></label>
                <button className="button button--coral" type="button" onClick={() => goToStep(2)}>Continue · {form.emotions.length + form.burnoutCustomTags.length} selected</button>
              </section>
            )}

            {step === 2 && (
              <section className="step step--peach">
                <p className="eyebrow">02 · Your RESET map</p>
                <h2>What helps you reset?</h2>
                <p>Pick one or two pathways, then the practices inside them.</p>
                <div className="pathway-grid">{pathwayOptions.map((option) => {
                  const selected = form.pathways.includes(option.key);
                  const presentation = pathwayPresentation[option.key];
                  return <button type="button" aria-pressed={selected} key={option.key} className="pathway-card" style={selected ? { background: presentation.color, borderColor: presentation.color } : undefined} onClick={() => toggleList("pathways", option.key)}><strong>{option.label}</strong><span>{presentation.blurb}</span></button>;
                })}</div>
                {form.pathways.map((pathwayKey) => <fieldset className="practice-group" key={pathwayKey}><legend>{pathwayOptions.find((option) => option.key === pathwayKey)?.label}—what exactly?</legend><div className="chips">{practicesByPathway[pathwayKey].map((option) => <Chip key={option.key} selected={form.practices.includes(option.key)} onClick={() => toggleList("practices", option.key)}>{option.label}</Chip>)}</div></fieldset>)}
                <CustomTagField side="reset" input={resetTagInput} tags={form.resetCustomTags} onInput={setResetTagInput} onAdd={() => addCustomTag("reset")} onRemove={(tag) => removeCustomTag("reset", tag)} />
                <label>Tell us about your RESET ritual (optional)<textarea rows={3} maxLength={1500} value={form.ritual} onChange={(event) => update("ritual", event.target.value)} /></label>
                <button className="button button--primary" type="button" onClick={() => goToStep(3)}>Continue · {form.practices.length + form.resetCustomTags.length} selected</button>
              </section>
            )}

            {step === 3 && (
              <form className="step step--light" onSubmit={submitFinalStep}>
                <p className="eyebrow eyebrow--orange">03 · Complete your check-in</p>
                <h2>{screening.rewardType === "film_access" ? "Where should we send your film?" : "Complete your check-in"}</h2>
                <p>Complete your details to finish your check-in.</p>
                <label>Name / initials (required)<input required autoComplete="given-name" maxLength={80} value={form.firstName} onChange={(event) => update("firstName", event.target.value)} /></label>
                <label>Email (required)<input required type="email" autoComplete="email" maxLength={254} value={form.email} onChange={(event) => update("email", event.target.value)} /></label>
                <div className="optional-fields-intro">
                  <p className="field-group-label">A little more about you</p>
                  <p>Optional—city, age range, and occupation help us understand broad patterns.</p>
                </div>
                <label>City<input autoComplete="address-level2" maxLength={120} value={form.city} onChange={(event) => update("city", event.target.value)} /></label>
                <fieldset><legend>Age range</legend><div className="chips">{["18–24", "25–34", "35–44", "45–54", "55+"].map((age) => <Chip key={age} selected={form.ageBand === age} onClick={() => update("ageBand", form.ageBand === age ? "" : age)}>{age}</Chip>)}</div></fieldset>
                <label>Occupation<input autoComplete="organization-title" maxLength={120} value={form.occupation} onChange={(event) => update("occupation", event.target.value)} /></label>
                <label className="check-row"><input required type="checkbox" checked={form.consent} onChange={(event) => update("consent", event.target.checked)} /><span>{screening.policyText}</span></label>
                <label className="check-row"><input type="checkbox" checked={form.futureCommunications} onChange={(event) => update("futureCommunications", event.target.checked)} /><span>Virsa may contact me about future programs. This is optional and off by default.</span></label>
                <button className="button button--primary" type="submit" disabled={submissionStatus === "submitting"}>{submissionStatus === "submitting" ? "Saving your RESET…" : "Finish"}</button>
                <p className="error-message" role="alert">{errorMessage}</p>
                <a className="donation-link" href={DONATION_URL} target="_blank" rel="noreferrer">We go wherever we go because of your kindness—donate</a>
              </form>
            )}
          </section>
        )}

        {view === "success" && (
          <section className="flow">
            <div className="success">
              <header className="success__confirmation">
                <p className="eyebrow">Your check-in is complete</p>
                <h2>Thank you—your RESET has been added to the picture.</h2>
              </header>

              <IllustrativeDashboard mode="post_submission" />

              <section className="success__reward" aria-labelledby="reset-access-heading">
                <p className="eyebrow">Your access</p>
                {(submissionResult?.rewardType ?? screening.rewardType) === "film_access" ? (
                  <div className="reward-card">
                    <h3 id="reset-access-heading">Film access is being prepared.</h3>
                    <p>We’ve recorded your access request. Film delivery will be enabled after the KINEMA process is confirmed.</p>
                  </div>
                ) : (
                  <div className="reward-card">
                    <h3 id="reset-access-heading">Watch the trailer.</h3>
                    <p>{(submissionResult?.eventWindowStatus ?? screening.eventWindowStatus) === "event_expired" ? "This event’s film-access window has ended, but you can still watch the trailer. " : ""}Visit the film’s website to continue.</p>
                    <a className="button button--coral reward-card__action" href={TRAILER_URL} target="_blank" rel="noreferrer">Watch the Trailer <span aria-hidden="true">→</span></a>
                  </div>
                )}
              </section>

              <div className="success__card-target">
                <ShareCard firstName={form.firstName.trim().split(/\s+/)[0]} pathways={selectedPathwayOptions.map(({ key, label }) => ({ key, label }))} practices={selectedPracticeOptions.map(({ label }) => label)} />
              </div>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
