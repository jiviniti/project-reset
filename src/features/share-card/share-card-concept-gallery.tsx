"use client";

import { useEffect, useRef, useState } from "react";
import {
  CARD_HEIGHT,
  CARD_WIDTH,
  SHARE_CARD_CONCEPTS,
  type ConceptCardData,
  type ConceptCardResources,
  type ShareCardConcept,
} from "@/features/share-card/concept-renderers";
import styles from "./share-card-concept-gallery.module.css";

const PATHWAY_OPTIONS = [
  { key: "nourish", label: "Nourish" },
  { key: "move", label: "Move" },
  { key: "restore", label: "Restore" },
  { key: "connect", label: "Connect" },
  { key: "rebalance", label: "Rebalance" },
];

const DEFAULT_DATA: ConceptCardData = {
  name: "Sha",
  pathways: [
    { key: "nourish", label: "Nourish" },
    { key: "rebalance", label: "Rebalance" },
  ],
  practices: ["More plant protein", "Home cooking", "Creative work"],
  signupUrl: process.env.NEXT_PUBLIC_PROJECT_RESET_SIGNUP_URL ?? "https://projectreset.example/signup",
};

const PRESETS: Array<{ label: string; data: Omit<ConceptCardData, "signupUrl"> }> = [
  {
    label: "Typical",
    data: {
      name: "Sha",
      pathways: [PATHWAY_OPTIONS[0], PATHWAY_OPTIONS[4]],
      practices: ["More plant protein", "Home cooking", "Creative work"],
    },
  },
  {
    label: "1 pathway",
    data: {
      name: "Sha",
      pathways: [PATHWAY_OPTIONS[0]],
      practices: ["More plant protein", "Home cooking", "Creative work"],
    },
  },
  {
    label: "1 pathway + 1 practice",
    data: {
      name: "Sha",
      pathways: [PATHWAY_OPTIONS[0]],
      practices: ["More plant protein"],
    },
  },
  {
    label: "All 5 pathways",
    data: {
      name: "Sha",
      pathways: PATHWAY_OPTIONS,
      practices: ["More plant protein", "Home cooking", "Creative work"],
    },
  },
  {
    label: "Long name",
    data: {
      name: "Alexandria-Montgomery",
      pathways: [PATHWAY_OPTIONS[2], PATHWAY_OPTIONS[3]],
      practices: ["Sleeping", "In-person meetings", "Journaling"],
    },
  },
  {
    label: "Non-ASCII",
    data: {
      name: "María-José 李",
      pathways: [PATHWAY_OPTIONS[1], PATHWAY_OPTIONS[2]],
      practices: ["Dancing", "Less social media", "Tiempo con mi familia"],
    },
  },
  {
    label: "Long entries",
    data: {
      name: "Christopher-Alexander",
      pathways: [PATHWAY_OPTIONS[3]],
      practices: [
        "Taking a quiet walk without my phone",
        "Cooking a nourishing dinner with friends",
        "Making uninterrupted time for creative work",
      ],
    },
  },
  {
    label: "Minimal",
    data: {
      name: "",
      pathways: [],
      practices: [],
    },
  },
];

function loadImage(source: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("concept_asset_failed"));
    image.src = source;
  });
}

function ConceptCanvas({ concept, data, rank, resources }: { concept: ShareCardConcept; data: ConceptCardData; rank?: number; resources: ConceptCardResources | null }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [status, setStatus] = useState("");

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context || !resources) return;
    canvas.width = CARD_WIDTH;
    canvas.height = CARD_HEIGHT;
    concept.render(context, data, resources);
    canvas.dataset.rendered = "true";
  }, [concept, data, resources]);

  function download() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.toBlob((blob) => {
      if (!blob) {
        setStatus("Could not export this concept.");
        return;
      }
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `project-reset-share-card-${concept.id}.png`;
      link.click();
      URL.revokeObjectURL(url);
      setStatus("Downloaded as a 1080 × 1350 PNG.");
    }, "image/png");
  }

  return (
    <article className={styles.concept} data-concept-id={concept.id}>
      {rank && <p className={styles.shortlistRank}>Shortlist {String(rank).padStart(2, "0")}</p>}
      <canvas className={styles.canvas} ref={canvasRef} aria-label={`${concept.name} Project RESET share-card concept`} />
      <div className={styles.meta}>
        <h2>{concept.name}</h2>
        <p>{concept.description}</p>
        <button type="button" onClick={download}>Download PNG</button>
      </div>
      <p className={styles.status} aria-live="polite">{status}</p>
    </article>
  );
}

export function ShareCardConceptGallery() {
  const [resources, setResources] = useState<ConceptCardResources | null>(null);
  const [cardData, setCardData] = useState<ConceptCardData>(DEFAULT_DATA);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function prepare() {
      try {
        const [filmCollage] = await Promise.all([
          loadImage("/images/share-card-film-collage.png"),
          document.fonts.ready,
        ]);
        if (cancelled) return;
        const rootStyles = getComputedStyle(document.documentElement);
        setResources({
          filmCollage,
          fonts: {
            sans: rootStyles.getPropertyValue("--font-poppins").trim() || "Arial, sans-serif",
            script: rootStyles.getPropertyValue("--font-reset-script").trim() || "cursive",
            cloud: rootStyles.getPropertyValue("--font-eb-garamond").trim() || "Georgia, serif",
          },
        });
      } catch {
        if (!cancelled) setError("The documentary collage could not be loaded.");
      }
    }
    void prepare();
    return () => { cancelled = true; };
  }, []);

  const renderedData: ConceptCardData = {
    ...cardData,
    practices: cardData.practices.map((practice) => practice.trim()).filter(Boolean),
  };

  function applyPreset(preset: (typeof PRESETS)[number]) {
    setCardData((current) => ({ ...preset.data, signupUrl: current.signupUrl }));
  }

  function togglePathway(pathway: (typeof PATHWAY_OPTIONS)[number]) {
    setCardData((current) => {
      const selected = current.pathways.some((item) => item.key === pathway.key);
      return {
        ...current,
        pathways: selected
          ? current.pathways.filter((item) => item.key !== pathway.key)
          : [...current.pathways, pathway],
      };
    });
  }

  function updatePractice(index: number, value: string) {
    setCardData((current) => {
      const practices = [...current.practices];
      while (practices.length < 3) practices.push("");
      practices[index] = value;
      return { ...current, practices };
    });
  }

  return (
    <main className={styles.page}>
      <header className={styles.intro}>
        <h1>Share-card directions</h1>
        <p>Eleven deterministic, code-rendered 4:5 concepts using the same sample answers. Download any card as a production-size PNG for review.</p>
        {error && <p role="alert">{error}</p>}
      </header>
      <section className={styles.playground} aria-labelledby="card-playground-title">
        <div className={styles.playgroundHeading}>
          <div>
            <p className={styles.eyebrow}>Live card playground</p>
            <h2 id="card-playground-title">Try different participant answers</h2>
          </div>
          <button className={styles.resetButton} type="button" onClick={() => setCardData(DEFAULT_DATA)}>Reset sample</button>
        </div>

        <div className={styles.presets} aria-label="Test cases">
          <span>Test cases</span>
          {PRESETS.map((preset) => (
            <button type="button" key={preset.label} onClick={() => applyPreset(preset)}>{preset.label}</button>
          ))}
        </div>

        <div className={styles.fields}>
          <label className={styles.field}>
            <span>Name or initials</span>
            <input
              type="text"
              maxLength={64}
              placeholder="Leave blank for My RESET"
              value={cardData.name}
              onChange={(event) => setCardData((current) => ({ ...current, name: event.target.value }))}
            />
          </label>

          <fieldset className={styles.pathways}>
            <legend>RESET pathways <small>Choose one or all five</small></legend>
            <div>
              {PATHWAY_OPTIONS.map((pathway) => {
                const selected = cardData.pathways.some((item) => item.key === pathway.key);
                return (
                  <button
                    type="button"
                    aria-pressed={selected}
                    key={pathway.key}
                    onClick={() => togglePathway(pathway)}
                  >
                    {pathway.label}
                  </button>
                );
              })}
            </div>
          </fieldset>

          <fieldset className={styles.practices}>
            <legend>Practices <small>Up to three</small></legend>
            {[0, 1, 2].map((index) => (
              <label key={index}>
                <span>Practice {index + 1}</span>
                <input
                  type="text"
                  maxLength={90}
                  placeholder={index === 0 ? "A practice that helps you RESET" : "Optional"}
                  value={cardData.practices[index] ?? ""}
                  onChange={(event) => updatePractice(index, event.target.value)}
                />
              </label>
            ))}
          </fieldset>

          <label className={styles.field}>
            <span>Campaign URL</span>
            <input
              type="url"
              value={cardData.signupUrl}
              onChange={(event) => setCardData((current) => ({ ...current, signupUrl: event.target.value }))}
            />
          </label>
        </div>
        <p className={styles.hint}>All eleven cards below update as you type. Empty answers use neutral campaign language.</p>
      </section>
      <section className={styles.collection} aria-labelledby="shortlist-title">
        <div className={styles.collectionHeading}>
          <p className={styles.eyebrow}>Nivi’s selections</p>
          <h2 id="shortlist-title">Shortlisted directions</h2>
        </div>
        <div className={styles.grid}>
          {SHARE_CARD_CONCEPTS.slice(0, 2).map((concept, index) => (
            <ConceptCanvas concept={concept} data={renderedData} rank={index + 1} resources={resources} key={concept.id} />
          ))}
        </div>
      </section>
      <section className={styles.collection} aria-labelledby="other-directions-title">
        <div className={styles.collectionHeading}>
          <p className={styles.eyebrow}>Additional studies</p>
          <h2 id="other-directions-title">Other directions</h2>
        </div>
        <div className={styles.grid}>
          {SHARE_CARD_CONCEPTS.slice(2).map((concept) => (
            <ConceptCanvas concept={concept} data={renderedData} resources={resources} key={concept.id} />
          ))}
        </div>
      </section>
    </main>
  );
}
