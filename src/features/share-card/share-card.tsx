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

function fitFont(context: CanvasRenderingContext2D, text: string, maximumWidth: number, initialSize: number, family: string, weight = 600) {
  let size = initialSize;
  do {
    context.font = `${weight} ${size}px ${family}`;
    size -= 2;
  } while (context.measureText(text).width > maximumWidth && size > 38);
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
    let cancelled = false;
    const draw = () => {
      if (cancelled) return;
      const styles = getComputedStyle(document.documentElement);
      const sans = styles.getPropertyValue("--font-poppins").trim() || "Arial, sans-serif";
      const serif = styles.getPropertyValue("--font-eb-garamond").trim() || "Georgia, serif";
      const title = firstName.trim() ? `${firstName.trim()}’s RESET` : "My RESET";
      canvas.width = 1080;
      canvas.height = 1350;
      context.fillStyle = "#52292b";
      context.fillRect(0, 0, 1080, 1350);
      context.fillStyle = accent;
      context.fillRect(0, 0, 1080, 34);
      context.fillStyle = "#ef805b";
      context.font = `600 27px ${sans}`;
      context.fillText("PROJECT RESET · THE LEARNING LAB", 84, 104);
      context.fillStyle = "#ffffff";
      fitFont(context, title, 910, 92, sans, 600);
      context.fillText(title, 84, 250, 910);
      context.fillStyle = "#f1bca6";
      context.font = `italic 49px ${serif}`;
      context.fillText("This is how I come back to myself.", 86, 334, 900);
      context.fillStyle = "#f8e7dc";
      roundedRect(context, 64, 420, 952, 724, 44);
      context.fillStyle = "#52292b";
      context.font = `600 24px ${sans}`;
      context.fillText("MY RESET PATHWAYS", 122, 522);
      let chipX = 122;
      let chipY = 580;
      context.font = `600 30px ${sans}`;
      for (const pathway of pathways.length ? pathways : [{ key: "", label: "Begin again" }]) {
        const width = Math.min(350, context.measureText(pathway.label).width + 64);
        if (chipX + width > 950) { chipX = 122; chipY += 82; }
        context.fillStyle = PATHWAY_COLORS[pathway.key] ?? accent;
        roundedRect(context, chipX, chipY, width, 60, 30);
        context.fillStyle = pathway.key === "restore" || pathway.key === "connect" || pathway.key === "rebalance" ? "#261e1d" : "#ffffff";
        context.fillText(pathway.label, chipX + 32, chipY + 41);
        chipX += width + 18;
      }
      context.fillStyle = "#52292b";
      context.font = `600 24px ${sans}`;
      context.fillText("WHAT HELPS ME RESET", 122, 790);
      context.font = `500 36px ${sans}`;
      (practices.slice(0, 3).length ? practices.slice(0, 3) : ["Rest. Reconnect. Begin again."]).forEach((label, index) => {
        const y = 876 + index * 72;
        context.fillStyle = accent;
        context.beginPath();
        context.arc(140, y - 12, 7, 0, Math.PI * 2);
        context.fill();
        context.fillStyle = "#261e1d";
        fitFont(context, label, 760, 36, sans, 500);
        context.fillText(label, 172, y, 760);
      });
      context.fillStyle = "#ef805b";
      roundedRect(context, 64, 1174, 952, 118, 30);
      context.fillStyle = "#ffffff";
      context.textAlign = "center";
      context.textBaseline = "middle";
      const displaySignupUrl = signupUrl.replace(/^https?:\/\//, "").trim();
      context.font = `600 31px ${sans}`;
      context.fillText("What does your RESET look like?", 540, displaySignupUrl ? 1218 : 1233, 835);
      if (displaySignupUrl) {
        context.font = `400 23px ${sans}`;
        context.fillText(displaySignupUrl, 540, 1260, 835);
      }
    };
    void document.fonts.ready.then(draw);
    draw();
    return () => { cancelled = true; };
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
      <p className="eyebrow">Your personalized share card</p>
      <h3 id="share-card-title">A snapshot of your RESET.</h3>
      <canvas ref={canvasRef} className="share-card__canvas" aria-label={`${firstName || "My"} Project RESET share card`} />
      <div className="button-stack">
        <button type="button" className="button button--light" onClick={download}>Save card as PNG</button>
        <button type="button" className="button button--outline-light" onClick={share}>Share to an app</button>
      </div>
      <p className="status" aria-live="polite">{status}</p>
      <p className="share-card__device-note">Available sharing options depend on your device and installed apps.</p>
      <small>Only your first name, selected pathways, and up to three selected practices appear. Your email, demographics, burnout answers, free text, and private tags are excluded.</small>
    </section>
  );
}
