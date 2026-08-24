"use client";

import { useEffect, useRef, useState } from "react";

const PATHWAY_COLORS: Record<string, string> = {
  nourish: "#458284",
  restore: "#82bcc8",
  move: "#de5240",
  connect: "#fa8757",
  rebalance: "#d4953b",
};

type ShareCardProps = {
  firstName: string;
  pathways: { key: string; label: string }[];
  practices: string[];
};

function roundedRect(context: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  context.beginPath();
  context.roundRect(x, y, w, h, r);
  context.fill();
}

export function ShareCard({ firstName, pathways, practices }: ShareCardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [status, setStatus] = useState("");
  const signupUrl = process.env.NEXT_PUBLIC_PROJECT_RESET_SIGNUP_URL ?? "https://projectreset.example/signup";
  const accent = PATHWAY_COLORS[pathways[0]?.key] ?? "#de5240";

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) return;
    canvas.width = 1080;
    canvas.height = 1350;
    context.fillStyle = "#f9dccb";
    context.fillRect(0, 0, 1080, 1350);
    context.fillStyle = "#52292b";
    context.fillRect(0, 0, 1080, 520);
    context.fillStyle = accent;
    context.fillRect(0, 0, 28, 1350);
    context.fillStyle = "#fa8757";
    context.font = "600 27px Arial, sans-serif";
    context.fillText("PROJECT RESET · LEARNING LAB", 92, 100);
    context.fillStyle = "white";
    context.font = "600 82px Arial, sans-serif";
    context.fillText(`${firstName.slice(0, 24)}’s RESET`, 92, 250, 890);
    context.fillStyle = "#edbaa6";
    context.font = "italic 48px Georgia, serif";
    context.fillText("This is how I come back to myself.", 94, 340);
    context.fillStyle = "white";
    roundedRect(context, 72, 452, 936, 690, 38);
    context.fillStyle = "#666";
    context.font = "600 23px Arial, sans-serif";
    context.fillText("MY RESET PATHWAYS", 126, 555);
    let chipX = 126;
    let chipY = 610;
    context.font = "600 30px Arial, sans-serif";
    for (const pathway of pathways.length ? pathways : [{ key: "", label: "Begin again" }]) {
      const width = Math.min(360, context.measureText(pathway.label).width + 64);
      if (chipX + width > 954) {
        chipX = 126;
        chipY += 82;
      }
      context.fillStyle = PATHWAY_COLORS[pathway.key] ?? accent;
      roundedRect(context, chipX, chipY, width, 60, 30);
      context.fillStyle = pathway.key === "restore" || pathway.key === "connect" || pathway.key === "rebalance" ? "#1d1d1d" : "white";
      context.fillText(pathway.label, chipX + 32, chipY + 41);
      chipX += width + 18;
    }
    context.fillStyle = "#666";
    context.font = "600 23px Arial, sans-serif";
    context.fillText("WHAT HELPS ME RESET", 126, 790);
    context.font = "500 36px Arial, sans-serif";
    (practices.slice(0, 3).length ? practices.slice(0, 3) : ["Rest. Reconnect. Begin again."]).forEach((label, index) => {
      const y = 870 + index * 72;
      context.fillStyle = accent;
      context.beginPath();
      context.arc(140, y - 12, 7, 0, Math.PI * 2);
      context.fill();
      context.fillStyle = "#1d1d1d";
      context.fillText(label, 172, y, 760);
    });
    context.fillStyle = "#52292b";
    roundedRect(context, 72, 1172, 936, 116, 30);
    context.fillStyle = "white";
    context.font = "600 31px Arial, sans-serif";
    context.fillText("What does your RESET look like?", 118, 1225);
    context.font = "400 23px Arial, sans-serif";
    context.fillText(signupUrl.replace(/^https?:\/\//, ""), 118, 1263, 830);
  }, [accent, firstName, pathways, practices, signupUrl]);

  function imageBlob(): Promise<Blob> {
    return new Promise((resolve, reject) => {
      canvasRef.current?.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("image_failed"))), "image/png");
    });
  }

  async function download() {
    try {
      const blob = await imageBlob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "my-project-reset-card.png";
      link.click();
      URL.revokeObjectURL(url);
      setStatus("Your card has downloaded.");
    } catch {
      setStatus("We couldn’t download the card. Please try again.");
    }
  }

  async function share() {
    try {
      if (!navigator.share) throw new Error("unsupported");
      const file = new File([await imageBlob()], "my-project-reset-card.png", { type: "image/png" });
      if (navigator.canShare && !navigator.canShare({ files: [file] })) throw new Error("unsupported");
      await navigator.share({
        title: "My Project RESET",
        text: "I shared how I reset. What does your RESET look like?",
        url: signupUrl,
        files: [file],
      });
      setStatus("Your share card is ready.");
    } catch (error) {
      setStatus(error instanceof DOMException && error.name === "AbortError" ? "Sharing cancelled. Your card is still ready to download." : "Sharing isn’t available here — download your card to post it.");
    }
  }

  return (
    <section className="share-card" aria-labelledby="share-card-title">
      <p className="eyebrow eyebrow--orange">Your share card</p>
      <h3 id="share-card-title">A personal snapshot of your RESET.</h3>
      <canvas ref={canvasRef} className="share-card__canvas" aria-label={`${firstName}’s Project RESET share card`} />
      <div className="button-stack">
        <button type="button" className="button button--light" onClick={download}>Download my card</button>
        <button type="button" className="button button--outline-light" onClick={share}>Share my card</button>
      </div>
      <p className="status" aria-live="polite">{status}</p>
      <small>Only your first name and selected pathways and practices appear on this card.</small>
    </section>
  );
}
