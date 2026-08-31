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

function drawBrandLockup(context: CanvasRenderingContext2D, sans: string, script: string) {
  context.textAlign = "left";
  context.textBaseline = "alphabetic";
  context.fillStyle = "#ffffff";
  context.font = `600 19px ${sans}`;
  context.fillText("PROJECT", 76, 87);
  context.font = `600 66px ${sans}`;
  context.fillStyle = "#ef805b";
  context.fillText("re", 72, 148);
  const prefixWidth = context.measureText("re").width;
  context.fillStyle = "#ffffff";
  context.fillText("set", 72 + prefixWidth, 148);
  const wordWidth = context.measureText("set").width;
  context.fillStyle = "#ef805b";
  context.fillText(".", 72 + prefixWidth + wordWidth, 148);
  context.fillStyle = "#f1bca6";
  context.font = `400 20px ${script}`;
  context.fillText("Choose Better. Together.", 76, 180);
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
      const script = styles.getPropertyValue("--font-reset-script").trim() || "cursive";
      const title = firstName.trim() ? `${firstName.trim()}’s RESET` : "MY RESET";
      const pathwayLabels = pathways.map((pathway) => pathway.label).slice(0, 3);
      const practiceLabels = practices.slice(0, 3);
      canvas.width = 1080;
      canvas.height = 1350;
      context.fillStyle = "#52292b";
      context.fillRect(0, 0, 1080, 1350);
      context.fillStyle = accent;
      context.fillRect(0, 0, 28, 1350);

      drawBrandLockup(context, sans, script);
      context.fillStyle = "#f8dfd0";
      context.fillRect(670, 70, 2, 112);
      context.fillStyle = "#ffffff";
      context.font = `600 24px ${sans}`;
      context.fillText("THIRD DEGREE", 710, 105);
      context.fillText("BURNOUT", 710, 137);
      context.fillStyle = "#f1bca6";
      context.font = `400 22px ${script}`;
      context.fillText("A Survivor’s Guide", 710, 174);

      context.fillStyle = "#ffffff";
      fitFont(context, title, 920, 102, sans, 600);
      context.fillText(title, 76, 310, 920);
      context.fillStyle = "#f1bca6";
      context.font = `400 42px ${script}`;
      context.fillText("This is how I come back to myself.", 80, 376, 900);

      context.fillStyle = "#f8e7dc";
      roundedRect(context, 64, 438, 952, 676, 44);
      context.fillStyle = accent;
      roundedRect(context, 64, 438, 952, 118, 44);
      context.fillRect(64, 500, 952, 56);
      context.fillStyle = "#ffffff";
      context.font = `600 21px ${sans}`;
      context.fillText("MY RESET PATHWAYS", 116, 486);
      const pathwayLine = pathwayLabels.length ? pathwayLabels.join("  ·  ").toUpperCase() : "MY RESET STARTS HERE";
      fitFont(context, pathwayLine, 850, 52, sans, 600);
      context.fillText(pathwayLine, 116, 535, 850);

      context.fillStyle = "#52292b";
      context.font = `600 21px ${sans}`;
      context.fillText("WHAT HELPS ME RESET", 116, 628);
      const editorialPractices = practiceLabels.length ? practiceLabels : ["A moment to pause", "A way back to myself"];
      editorialPractices.forEach((label, index) => {
        const y = 720 + index * 128;
        const x = 116 + (index % 2) * 48;
        context.fillStyle = index % 2 === 0 ? "#261e1d" : accent;
        fitFont(context, label, 790, 60, sans, 600);
        context.fillText(label, x, y, 790);
        context.fillStyle = accent;
        context.fillRect(x, y + 20, Math.min(250 + index * 80, 500), 8);
      });

      context.fillStyle = "#52292b";
      context.font = `400 29px ${script}`;
      context.fillText("Small choices. Shared change.", 116, 1060);

      context.fillStyle = "#ef805b";
      roundedRect(context, 64, 1150, 952, 136, 30);
      context.fillStyle = "#ffffff";
      context.textAlign = "center";
      context.textBaseline = "middle";
      const displaySignupUrl = signupUrl.replace(/^https?:\/\//, "").trim();
      context.font = `600 33px ${sans}`;
      context.fillText("What does your RESET look like?", 540, displaySignupUrl ? 1198 : 1218, 835);
      if (displaySignupUrl) {
        context.font = `400 21px ${sans}`;
        context.fillText(displaySignupUrl, 540, 1247, 835);
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
        text: `I shared how I reset through Project RESET, inspired by Third Degree Burnout. What does your RESET look like? ${signupUrl}`,
        files: [file],
      });
      setStatus("Your share card is ready.");
    } catch (error) {
      setStatus(error instanceof DOMException && error.name === "AbortError" ? "Sharing cancelled. Your card is still ready to download." : "Sharing isn’t available here — download your card to post it.");
    }
  }

  return (
    <section className="share-card" aria-labelledby="share-card-title">
      <p className="eyebrow">Your personal RESET</p>
      <h3 id="share-card-title">My RESET card</h3>
      <p className="share-card__intro">Save or share your card to bring someone else into the conversation.</p>
      <canvas ref={canvasRef} className="share-card__canvas" aria-label={`${firstName || "My"} Project RESET share card`} />
      <div className="button-stack">
        <button type="button" className="button button--light" onClick={download}>Save card to device</button>
        <button type="button" className="button button--outline-light" onClick={share}>Share with your network</button>
      </div>
      <p className="status" aria-live="polite">{status}</p>
      <p className="share-card__device-note">Available sharing options depend on your device and installed apps.</p>
      <small>Only your first name, selected pathways, and up to three selected practices appear. Your email, demographics, burnout answers, free text, and private tags are excluded.</small>
    </section>
  );
}
