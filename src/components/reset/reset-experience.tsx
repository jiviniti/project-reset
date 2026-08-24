"use client";

import Image from "next/image";
import { FormEvent, useState } from "react";
import { Chip } from "@/components/ui/chip";
import { IllustrativeDashboard } from "@/features/learning-lab/illustrative-dashboard";
import { ShareCard } from "@/features/share-card/share-card";
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
  burnoutNote: string;
  pathways: string[];
  practices: string[];
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
  burnoutNote: "",
  pathways: [],
  practices: [],
  ritual: "",
};

const pathwayPresentation: Record<string, { blurb: string; color: string }> = {
  nourish: { blurb: "plants, water, earth", color: "#458284" },
  restore: { blurb: "sleep, stillness", color: "#82bcc8" },
  move: { blurb: "body in motion", color: "#de5240" },
  connect: { blurb: "people, animals", color: "#fa8757" },
  rebalance: { blurb: "limits, meaning", color: "#d4953b" },
};

export function ResetExperience({ screening }: { screening: ScreeningConfig }) {
  const [view, setView] = useState<View>("hero");
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<FormState>(initialForm);
  const [showMoreEmotions, setShowMoreEmotions] = useState(false);
  const [submissionStatus, setSubmissionStatus] = useState<"idle" | "submitting" | "error">("idle");
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

  function start() {
    setView("flow");
    setStep(1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function back() {
    if (step === 1) setView("hero");
    else setStep((current) => current - 1);
  }

  function continueBasics(event: FormEvent) {
    event.preventDefault();
    const target = event.currentTarget as HTMLFormElement;
    if (!target.reportValidity()) return;
    setStep(2);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function submit() {
    setSubmissionStatus("submitting");
    setErrorMessage("");
    const answers = [
      { questionKey: "burnout_signs", optionKeys: form.emotions },
      { questionKey: "burnout_note", text: form.burnoutNote },
      { questionKey: "reset_pathways", optionKeys: form.pathways },
      { questionKey: "reset_practices", optionKeys: form.practices },
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
    setErrorMessage("");
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
              <button type="button" className="nav__action" onClick={start}>Contribute</button>
            </nav>
            <div className="hero__content">
              <p className="eyebrow">The documentary</p>
              <p className="film-title">Third Degree Burnout<br /><em>A Survivor’s Guide</em></p>
              <hr />
              <p className="eyebrow eyebrow--orange">Project RESET · The Learning Lab</p>
              <p className="script-line">Welcome.</p>
              <h1>How do you reset?</h1>
              <p>The film asks the questions. Project RESET is where you answer them—carrying the conversation beyond the screen.</p>
              <p>Every screening adds to our collective understanding of burnout and recovery.</p>
              <Image src="/images/reset-collage.avif" alt="Project RESET community collage" width={900} height={500} priority className="hero__image" />
              <button type="button" className="button button--coral" onClick={start}>Contribute your RESET</button>
              <p className="hero__meta">About 90 seconds · research contribution · film access by email</p>
              <button type="button" className="text-button" onClick={() => setView("lab")}>See the illustrative Learning Lab</button>
            </div>
          </section>
        )}

        {view === "flow" && (
          <section className="flow">
            <header className="progress-header">
              <div><button type="button" className="back-button" onClick={back}>← Back</button><span>Step 0{step} of 03</span></div>
              <div className="progress-track"><span style={{ width: `${step * 33.333}%` }} /></div>
            </header>

            {step === 1 && (
              <form className="step step--light" onSubmit={continueBasics}>
                <h2>First, the basics</h2>
                <p>We use your email to associate your participation and, later, send transactional film access.</p>
                <label>First name<input required autoComplete="given-name" maxLength={80} value={form.firstName} onChange={(event) => update("firstName", event.target.value)} /></label>
                <label>Email<input required type="email" autoComplete="email" maxLength={254} value={form.email} onChange={(event) => update("email", event.target.value)} /></label>
                <p className="field-group-label">Optional—helps us see patterns</p>
                <label>City<input autoComplete="address-level2" maxLength={120} value={form.city} onChange={(event) => update("city", event.target.value)} /></label>
                <fieldset><legend>Age range</legend><div className="chips">{["18–24", "25–34", "35–44", "45–54", "55+"].map((age) => <Chip key={age} selected={form.ageBand === age} onClick={() => update("ageBand", form.ageBand === age ? "" : age)}>{age}</Chip>)}</div></fieldset>
                <label>Occupation<input autoComplete="organization-title" maxLength={120} value={form.occupation} onChange={(event) => update("occupation", event.target.value)} /></label>
                <label className="check-row"><input required type="checkbox" checked={form.consent} onChange={(event) => update("consent", event.target.checked)} /><span>{screening.policyText}</span></label>
                <label className="check-row"><input type="checkbox" checked={form.futureCommunications} onChange={(event) => update("futureCommunications", event.target.checked)} /><span>Virsa may contact me about future programmes. Optional and off by default.</span></label>
                <button className="button button--primary" type="submit">Continue</button>
              </form>
            )}

            {step === 2 && (
              <section className="step step--dark">
                <p className="eyebrow eyebrow--orange">Question one</p>
                <h2>How does burnout show up for you?</h2>
                <p>Choose as many as feel true.</p>
                <div className="chips">{visibleEmotions.map((option) => <Chip tone="dark" key={option.key} selected={form.emotions.includes(option.key)} onClick={() => toggleList("emotions", option.key)}>{option.label}</Chip>)}</div>
                <button type="button" className="text-button text-button--peach" onClick={() => setShowMoreEmotions((current) => !current)}>{showMoreEmotions ? "Show fewer" : `+ ${emotionOptions.length - 10} more ways it shows up`}</button>
                <label>Tell us more (optional)<textarea rows={3} maxLength={1500} value={form.burnoutNote} onChange={(event) => update("burnoutNote", event.target.value)} /></label>
                <button className="button button--coral" type="button" onClick={() => setStep(3)}>Continue · {form.emotions.length} selected</button>
              </section>
            )}

            {step === 3 && (
              <section className="step step--peach">
                <p className="eyebrow">Question two</p>
                <h2>What helps you reset?</h2>
                <p>Pick one or two pathways, then the practices inside them.</p>
                <div className="pathway-grid">{pathwayOptions.map((option) => {
                  const selected = form.pathways.includes(option.key);
                  const presentation = pathwayPresentation[option.key];
                  return <button type="button" aria-pressed={selected} key={option.key} className="pathway-card" style={selected ? { background: presentation.color, borderColor: presentation.color } : undefined} onClick={() => toggleList("pathways", option.key)}><strong>{option.label}</strong><span>{presentation.blurb}</span></button>;
                })}</div>
                {form.pathways.map((pathwayKey) => <fieldset className="practice-group" key={pathwayKey}><legend>{pathwayOptions.find((option) => option.key === pathwayKey)?.label}—what exactly?</legend><div className="chips">{practicesByPathway[pathwayKey].map((option) => <Chip key={option.key} selected={form.practices.includes(option.key)} onClick={() => toggleList("practices", option.key)}>{option.label}</Chip>)}</div></fieldset>)}
                <label>Tell us about your RESET ritual (optional)<textarea rows={3} maxLength={1500} value={form.ritual} onChange={(event) => update("ritual", event.target.value)} /></label>
                <button className="button button--primary" type="button" disabled={submissionStatus === "submitting"} onClick={submit}>{submissionStatus === "submitting" ? "Saving your RESET…" : `Finish · ${form.practices.length} practices`}</button>
                <p className="error-message" role="alert">{errorMessage}</p>
              </section>
            )}
          </section>
        )}

        {view === "success" && (
          <section className="success">
            <Image src="/images/reset-mark.png" alt="" width={116} height={116} className="success__mark" />
            <h2>Thank you.</h2>
            <p>You’ve added your experience to a growing body of lived evidence about burnout, wellbeing and systems change.</p>
            <p className="script-line script-line--white">You’re part of it now.</p>
            <ShareCard firstName={form.firstName.trim().split(/\s+/)[0]} pathways={selectedPathwayOptions.map(({ key, label }) => ({ key, label }))} practices={selectedPracticeOptions.map(({ label }) => label)} />
            <section className="reward-card">
              <p className="eyebrow">Your film access</p>
              <h3>Email delivery is being configured.</h3>
              <p>Your transactional reward request has been recorded separately from marketing consent. No access email is sent by this preview milestone.</p>
            </section>
            <button type="button" className="button button--outline-light" onClick={() => setView("lab")}>Enter the illustrative Learning Lab</button>
          </section>
        )}
      </div>
    </main>
  );
}
