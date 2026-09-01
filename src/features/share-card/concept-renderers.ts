export const CARD_WIDTH = 1080;
export const CARD_HEIGHT = 1350;

export type ConceptCardData = {
  name: string;
  pathways: Array<{ key: string; label: string }>;
  practices: string[];
  signupUrl: string;
};

export type ConceptCardResources = {
  filmCollage: CanvasImageSource;
  fonts: {
    sans: string;
    script: string;
    cloud: string;
  };
};

export type ShareCardConcept = {
  id: string;
  name: string;
  description: string;
  render: (context: CanvasRenderingContext2D, data: ConceptCardData, resources: ConceptCardResources) => void;
};

const COLORS = {
  ink: "#211b1a",
  black: "#171514",
  burgundy: "#52292b",
  coral: "#ef805b",
  coralDark: "#dc5743",
  peach: "#f1bca6",
  cream: "#fbf1e8",
  paper: "#f8e7dc",
  teal: "#286b72",
  tealBright: "#458b8d",
  sky: "#82bcc8",
  gold: "#d4953b",
  white: "#ffffff",
};

const PATHWAY_COLORS: Record<string, string> = {
  nourish: "#458284",
  restore: "#82bcc8",
  move: "#de5240",
  connect: "#fa8757",
  rebalance: "#d4953b",
};

const COMMUNITY_WORDS = [
  "Walking", "Sleeping", "Family", "Friends", "Yoga", "Meditation",
  "Breathwork", "Journaling", "Hydration", "Community", "Reading",
  "Animals", "Volunteering", "Strength training", "Digital detox",
];

function begin(context: CanvasRenderingContext2D, fill: string) {
  context.save();
  context.setTransform(1, 0, 0, 1, 0, 0);
  context.globalAlpha = 1;
  context.globalCompositeOperation = "source-over";
  context.textAlign = "left";
  context.textBaseline = "alphabetic";
  context.clearRect(0, 0, CARD_WIDTH, CARD_HEIGHT);
  context.fillStyle = fill;
  context.fillRect(0, 0, CARD_WIDTH, CARD_HEIGHT);
  context.restore();
}

function font(context: CanvasRenderingContext2D, size: number, family: string, weight = 600, style = "normal") {
  context.font = `${style} ${weight} ${size}px ${family}`;
}

function fitFont(
  context: CanvasRenderingContext2D,
  text: string,
  maximumWidth: number,
  initialSize: number,
  family: string,
  weight = 600,
  minimumSize = 30,
) {
  let size = initialSize;
  font(context, size, family, weight);
  while (context.measureText(text).width > maximumWidth && size > minimumSize) {
    size -= 2;
    font(context, size, family, weight);
  }
  return size;
}

function fillFitted(
  context: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maximumWidth: number,
  initialSize: number,
  family: string,
  weight = 600,
  minimumSize = 30,
) {
  fitFont(context, text, maximumWidth, initialSize, family, weight, minimumSize);
  context.fillText(text, x, y, maximumWidth);
}

function wrapText(context: CanvasRenderingContext2D, text: string, maximumWidth: number) {
  const words = text.split(/\s+/).filter(Boolean).flatMap((word) => {
    if (context.measureText(word).width <= maximumWidth) return [word];
    const chunks: string[] = [];
    let chunk = "";
    for (const character of Array.from(word)) {
      const candidate = `${chunk}${character}`;
      if (chunk && context.measureText(candidate).width > maximumWidth) {
        chunks.push(chunk);
        chunk = character;
      } else chunk = candidate;
    }
    if (chunk) chunks.push(chunk);
    return chunks;
  });
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word;
    if (context.measureText(candidate).width <= maximumWidth || !line) line = candidate;
    else {
      lines.push(line);
      line = word;
    }
  }
  if (line) lines.push(line);
  return lines;
}

function drawFittedWrapped(
  context: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maximumWidth: number,
  maximumHeight: number,
  initialSize: number,
  family: string,
  weight = 700,
  minimumSize = 16,
  lineHeightRatio = 1.05,
) {
  let size = initialSize;
  let lines: string[] = [];
  let lineHeight = size * lineHeightRatio;

  while (size >= minimumSize) {
    font(context, size, family, weight);
    lines = wrapText(context, text, maximumWidth);
    lineHeight = size * lineHeightRatio;
    const hasOverlongWord = text.split(/\s+/).filter(Boolean).some((word) => context.measureText(word).width > maximumWidth);
    if (!hasOverlongWord && lines.length * lineHeight <= maximumHeight) break;
    size -= 2;
  }

  font(context, Math.max(size, minimumSize), family, weight);
  lines = wrapText(context, text, maximumWidth);
  lineHeight = Math.max(size, minimumSize) * lineHeightRatio;
  lines.forEach((line, index) => context.fillText(line, x, y + Math.max(size, minimumSize) + index * lineHeight, maximumWidth));
  return { height: lines.length * lineHeight, lines, size: Math.max(size, minimumSize) };
}

function roundRect(context: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number, fill: string) {
  context.fillStyle = fill;
  context.beginPath();
  context.roundRect(x, y, width, height, radius);
  context.fill();
}

function drawBrand(context: CanvasRenderingContext2D, resources: ConceptCardResources, x: number, y: number, dark = true, scale = 1) {
  const { sans, script } = resources.fonts;
  context.textAlign = "left";
  context.fillStyle = dark ? COLORS.white : COLORS.burgundy;
  font(context, 18 * scale, sans, 700);
  context.fillText("PROJECT", x, y);
  font(context, 64 * scale, sans, 600);
  context.fillStyle = COLORS.coral;
  context.fillText("re", x - 2, y + 61 * scale);
  const reWidth = context.measureText("re").width;
  context.fillStyle = dark ? COLORS.white : COLORS.burgundy;
  context.fillText("set", x - 2 + reWidth, y + 61 * scale);
  const setWidth = context.measureText("set").width;
  context.fillStyle = COLORS.coral;
  context.fillText(".", x - 2 + reWidth + setWidth, y + 61 * scale);
  context.fillStyle = dark ? COLORS.peach : COLORS.burgundy;
  font(context, 19 * scale, script, 400);
  context.fillText("Choose Better. Together.", x, y + 92 * scale);
}

function drawFilmLockup(
  context: CanvasRenderingContext2D,
  resources: ConceptCardResources,
  x: number,
  y: number,
  dark = true,
  align: CanvasTextAlign = "left",
  colors?: { primary: string; secondary: string },
) {
  context.textAlign = align;
  context.fillStyle = colors?.primary ?? (dark ? COLORS.white : COLORS.burgundy);
  font(context, 22, resources.fonts.sans, 700);
  context.fillText("THIRD DEGREE", x, y);
  context.fillText("BURNOUT", x, y + 29);
  context.fillStyle = colors?.secondary ?? (dark ? COLORS.peach : COLORS.coral);
  font(context, 22, resources.fonts.script, 400);
  context.fillText("A Survivor’s Guide", x, y + 63);
  context.textAlign = "left";
}

function displayName(data: ConceptCardData) {
  const cleaned = data.name.trim();
  return cleaned ? `${cleaned}’s RESET` : "MY RESET";
}

function pathwayLine(data: ConceptCardData) {
  return data.pathways.length
    ? data.pathways.slice(0, 5).map((item) => item.label.toUpperCase()).join("  ·  ")
    : "MY RESET STARTS HERE";
}

function practices(data: ConceptCardData) {
  return data.practices.length
    ? data.practices.slice(0, 3)
    : ["A moment to pause", "A way back to myself", "A small beginning"];
}

function accent(data: ConceptCardData, index = 0) {
  return PATHWAY_COLORS[data.pathways[index]?.key] ?? [COLORS.tealBright, COLORS.coral, COLORS.gold][index % 3];
}

function drawFooter(context: CanvasRenderingContext2D, data: ConceptCardData, resources: ConceptCardResources, options?: { dark?: boolean; y?: number; centered?: boolean }) {
  const dark = options?.dark ?? true;
  const y = options?.y ?? 1262;
  const centered = options?.centered ?? true;
  const x = centered ? CARD_WIDTH / 2 : 72;
  context.textAlign = centered ? "center" : "left";
  context.fillStyle = dark ? COLORS.white : COLORS.burgundy;
  font(context, 28, resources.fonts.sans, 700);
  context.fillText("WHAT DOES YOUR RESET LOOK LIKE?", x, y);
  context.fillStyle = dark ? COLORS.peach : COLORS.teal;
  font(context, 18, resources.fonts.sans, 500);
  context.fillText(data.signupUrl.replace(/^https?:\/\//, ""), x, y + 34);
  context.textAlign = "left";
}

function seededRandom(seed: number) {
  let state = seed >>> 0;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

function paperGrain(context: CanvasRenderingContext2D, color: string, opacity = 0.08, seed = 14) {
  const random = seededRandom(seed);
  context.save();
  context.fillStyle = color;
  context.globalAlpha = opacity;
  for (let index = 0; index < 360; index += 1) {
    const size = 1 + random() * 3;
    context.fillRect(random() * CARD_WIDTH, random() * CARD_HEIGHT, size, size);
  }
  context.restore();
}

function tornPaperPath(x: number, y: number, width: number, height: number, seed: number) {
  const random = seededRandom(seed);
  const path = new Path2D();
  const segments = 18;
  path.moveTo(x, y + (random() - 0.5) * 16);
  for (let step = 1; step <= segments; step += 1) path.lineTo(x + (width * step) / segments, y + (random() - 0.5) * 18);
  for (let step = 1; step <= segments; step += 1) path.lineTo(x + width + (random() - 0.5) * 14, y + (height * step) / segments);
  for (let step = segments; step >= 0; step -= 1) path.lineTo(x + (width * step) / segments, y + height + (random() - 0.5) * 18);
  for (let step = segments; step >= 0; step -= 1) path.lineTo(x + (random() - 0.5) * 14, y + (height * step) / segments);
  path.closePath();
  return path;
}

function drawTornPaper(context: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, fill: string, seed: number, rotation = 0) {
  context.save();
  context.translate(x + width / 2, y + height / 2);
  context.rotate(rotation);
  context.translate(-(x + width / 2), -(y + height / 2));
  context.shadowColor = "rgba(40, 25, 20, .2)";
  context.shadowBlur = 20;
  context.shadowOffsetY = 10;
  const path = tornPaperPath(x, y, width, height, seed);
  context.fillStyle = fill;
  context.fill(path);
  context.restore();
}

function drawImageContain(context: CanvasRenderingContext2D, image: CanvasImageSource, x: number, y: number, width: number, height: number) {
  const sourceWidth = "naturalWidth" in image ? image.naturalWidth : (image as { width: number }).width;
  const sourceHeight = "naturalHeight" in image ? image.naturalHeight : (image as { height: number }).height;
  const ratio = Math.min(width / sourceWidth, height / sourceHeight);
  const drawWidth = sourceWidth * ratio;
  const drawHeight = sourceHeight * ratio;
  context.drawImage(image, x + (width - drawWidth) / 2, y + (height - drawHeight) / 2, drawWidth, drawHeight);
}

function starburst(context: CanvasRenderingContext2D, x: number, y: number, innerRadius: number, outerRadius: number, points: number, fill: string) {
  context.beginPath();
  for (let index = 0; index < points * 2; index += 1) {
    const radius = index % 2 === 0 ? outerRadius : innerRadius;
    const angle = -Math.PI / 2 + (Math.PI * index) / points;
    const pointX = x + Math.cos(angle) * radius;
    const pointY = y + Math.sin(angle) * radius;
    if (index === 0) context.moveTo(pointX, pointY);
    else context.lineTo(pointX, pointY);
  }
  context.closePath();
  context.fillStyle = fill;
  context.fill();
}

const filmCollagePoster: ShareCardConcept = {
  id: "film-collage-poster",
  name: "Film Collage Poster",
  description: "Documentary artwork, torn-paper typography, and a strong campaign masthead.",
  render(context, data, resources) {
    begin(context, COLORS.burgundy);
    paperGrain(context, COLORS.white, 0.035, 4);
    drawBrand(context, resources, 70, 72, true, 0.9);
    context.strokeStyle = COLORS.peach;
    context.lineWidth = 2;
    context.beginPath(); context.moveTo(668, 62); context.lineTo(668, 178); context.stroke();
    drawFilmLockup(context, resources, 710, 95, true);
    context.fillStyle = COLORS.cream;
    fillFitted(context, displayName(data).toUpperCase(), 66, 330, 940, 124, resources.fonts.sans, 700, 64);
    context.fillStyle = COLORS.peach;
    font(context, 45, resources.fonts.script, 400);
    context.fillText("This is how I come back to myself.", 70, 392, 860);
    context.save();
    context.globalAlpha = 0.96;
    drawImageContain(context, resources.filmCollage, 370, 360, 760, 770);
    context.restore();
    const selected = practices(data);
    selected.forEach((label, index) => {
      const y = 660 + index * 146;
      drawTornPaper(context, 58 + index * 26, y - 76, 540, 118, index === 1 ? COLORS.coral : COLORS.cream, 10 + index, index % 2 ? -0.018 : 0.014);
      context.fillStyle = index === 1 ? COLORS.white : index === 2 ? COLORS.burgundy : accent(data);
      fillFitted(context, label, 92 + index * 26, y, 470, 58, resources.fonts.sans, 700, 34);
    });
    roundRect(context, 58, 1105, 600, 72, 4, COLORS.teal);
    context.fillStyle = COLORS.white;
    fillFitted(context, pathwayLine(data), 86, 1155, 545, 32, resources.fonts.sans, 700, 22);
    drawFooter(context, data, resources, { dark: true, y: 1260 });
  },
};

const typeManifesto: ShareCardConcept = {
  id: "type-manifesto",
  name: "Type Is the Poster",
  description: "The three selected practices become the entire composition.",
  render(context, data, resources) {
    const gradient = context.createLinearGradient(0, 0, CARD_WIDTH, CARD_HEIGHT);
    gradient.addColorStop(0, "#351e20"); gradient.addColorStop(1, "#592f31");
    begin(context, COLORS.burgundy);
    context.fillStyle = gradient; context.fillRect(0, 0, CARD_WIDTH, CARD_HEIGHT);
    paperGrain(context, COLORS.white, 0.025, 22);
    drawBrand(context, resources, 62, 62, true, 0.75);
    drawFilmLockup(context, resources, 1010, 82, true, "right");
    context.fillStyle = COLORS.coral;
    font(context, 36, resources.fonts.sans, 700);
    context.fillText(displayName(data).toUpperCase(), 62, 264, 930);
    const selected = practices(data);
    const colors = [COLORS.cream, accent(data), COLORS.coral];
    const boxes = [
      { x: 58, y: 300, width: 950, height: 235 },
      { x: 122, y: 590, width: 900, height: 235 },
      { x: 58, y: 880, width: 950, height: 235 },
    ];
    selected.forEach((label, index) => {
      context.fillStyle = colors[index];
      const box = boxes[index];
      drawFittedWrapped(context, label.toUpperCase(), box.x, box.y, box.width, box.height, index === 1 ? 150 : 168, resources.fonts.sans, 700, 34, 0.94);
      context.fillStyle = index === 1 ? COLORS.coral : COLORS.tealBright;
      context.fillRect(box.x + 4, box.y + box.height + 8, 350 + index * 90, 5);
    });
    context.fillStyle = COLORS.peach;
    font(context, 30, resources.fonts.script, 400);
    context.fillText("Small choices. Shared change.", 66, 1188);
    context.fillStyle = COLORS.tealBright;
    font(context, 25, resources.fonts.sans, 700);
    context.fillText(pathwayLine(data), 66, 1250, 930);
    context.fillStyle = COLORS.peach;
    font(context, 16, resources.fonts.sans, 500);
    context.fillText(data.signupUrl.replace(/^https?:\/\//, ""), 66, 1290);
  },
};

const communitySpotlight: ShareCardConcept = {
  id: "community-spotlight",
  name: "Community Spotlight",
  description: "Personal practices rise out of the wider community RESET vocabulary.",
  render(context, data, resources) {
    begin(context, COLORS.cream);
    context.fillStyle = COLORS.tealBright; context.fillRect(0, 0, 26, CARD_HEIGHT);
    paperGrain(context, COLORS.burgundy, 0.025, 19);
    drawBrand(context, resources, 72, 72, false, 0.82);
    context.strokeStyle = COLORS.burgundy; context.lineWidth = 2;
    context.beginPath(); context.moveTo(670, 64); context.lineTo(670, 180); context.stroke();
    drawFilmLockup(context, resources, 720, 92, false);
    context.fillStyle = COLORS.burgundy;
    fillFitted(context, displayName(data).toUpperCase(), 70, 335, 930, 88, resources.fonts.sans, 700, 48);
    context.fillStyle = COLORS.coral;
    font(context, 42, resources.fonts.script, 400);
    context.fillText("This is how I come back to myself.", 72, 393, 900);
    roundRect(context, 72, 440, 620, 72, 8, COLORS.tealBright);
    context.fillStyle = COLORS.white;
    fillFitted(context, pathwayLine(data), 100, 489, 565, 32, resources.fonts.sans, 700, 21);
    context.save();
    context.globalAlpha = 0.12;
    COMMUNITY_WORDS.forEach((word, index) => {
      context.fillStyle = [COLORS.teal, COLORS.coral, COLORS.gold, COLORS.burgundy][index % 4];
      font(context, 38 + (index % 4) * 8, resources.fonts.cloud, 500, index % 3 === 0 ? "italic" : "normal");
      context.fillText(word, 58 + (index * 173) % 760, 590 + (index * 83) % 560, 430);
    });
    context.restore();
    const selected = practices(data);
    const yPositions = [740, 910, 1082];
    selected.forEach((label, index) => {
      context.fillStyle = [COLORS.teal, COLORS.coral, COLORS.burgundy][index];
      fillFitted(context, label, 130 + (index % 2) * 55, yPositions[index], 850, 74, resources.fonts.sans, 700, 42);
      context.fillRect(130 + (index % 2) * 55, yPositions[index] + 18, 310 + index * 130, 6);
    });
    context.fillStyle = COLORS.burgundy;
    font(context, 28, resources.fonts.script, 400);
    context.textAlign = "center";
    context.fillText("Part of the community RESET map.", CARD_WIDTH / 2, 1195);
    context.textAlign = "left";
    drawFooter(context, data, resources, { dark: false, y: 1260 });
  },
};

function organicShape(context: CanvasRenderingContext2D, fill: string, points: Array<[number, number]>) {
  const path = new Path2D();
  path.moveTo(points[0][0], points[0][1]);
  for (let index = 1; index < points.length; index += 3) {
    const first = points[index];
    const second = points[index + 1] ?? points[index];
    const end = points[index + 2] ?? points[0];
    path.bezierCurveTo(first[0], first[1], second[0], second[1], end[0], end[1]);
  }
  path.closePath();
  context.fillStyle = fill;
  context.fill(path);
}

const pathwayWorlds: ShareCardConcept = {
  id: "pathway-worlds",
  name: "Pathway Worlds",
  description: "Each pathway becomes an organic colored space for a personal practice.",
  render(context, data, resources) {
    begin(context, COLORS.black);
    drawBrand(context, resources, 66, 58, true, 0.72);
    drawFilmLockup(context, resources, 1012, 78, true, "right");
    context.fillStyle = COLORS.cream;
    fillFitted(context, displayName(data).toUpperCase(), 64, 294, 930, 86, resources.fonts.sans, 700, 45);
    context.fillStyle = COLORS.peach;
    font(context, 40, resources.fonts.script, 400);
    context.fillText("This is how I come back to myself.", 66, 350, 900);
    organicShape(context, accent(data, 0), [[-80, 460], [180, 390], [510, 410], [612, 610], [690, 840], [360, 900], [-40, 962], [-120, 720], [-80, 460]]);
    organicShape(context, accent(data, 1), [[620, 440], [800, 350], [1110, 360], [1130, 650], [1110, 850], [845, 820], [640, 760], [590, 570], [620, 440]]);
    organicShape(context, accent(data, 2), [[-60, 900], [230, 820], [520, 940], [660, 1160], [590, 1390], [280, 1390], [-80, 1350], [-110, 1110], [-60, 900]]);
    const selected = practices(data);
    const blocks = [
      { x: 72, y: 555, width: 510, color: COLORS.cream },
      { x: 665, y: 555, width: 350, color: COLORS.ink },
      { x: 70, y: 1070, width: 510, color: COLORS.cream },
    ];
    selected.forEach((label, index) => {
      const block = blocks[index];
      context.fillStyle = block.color;
      font(context, 25, resources.fonts.sans, 700);
      context.fillText(data.pathways[index]?.label?.toUpperCase() ?? "MY RESET", block.x, block.y);
      const textBoxHeight = index === 0 ? 225 : index === 1 ? 130 : 120;
      const fitted = drawFittedWrapped(
        context,
        label,
        block.x,
        block.y + 48,
        block.width,
        textBoxHeight,
        index === 1 ? 55 : 78,
        index === 1 ? resources.fonts.sans : resources.fonts.cloud,
        index === 1 ? 500 : 600,
        18,
        1.02,
      );
      context.fillRect(block.x, block.y + 68 + fitted.height, 170, 5);
    });
    context.fillStyle = COLORS.white;
    font(context, 20, resources.fonts.sans, 700);
    context.textAlign = "right";
    context.fillText(data.signupUrl.replace(/^https?:\/\//, ""), 1010, 1300);
    context.textAlign = "left";
  },
};

const personalScrapbook: ShareCardConcept = {
  id: "personal-scrapbook",
  name: "Personal Scrapbook",
  description: "Torn notes, documentary collage, and tactile paper layers.",
  render(context, data, resources) {
    begin(context, COLORS.cream);
    paperGrain(context, COLORS.burgundy, 0.055, 7);
    context.fillStyle = COLORS.burgundy; context.fillRect(0, 0, 32, CARD_HEIGHT);
    drawBrand(context, resources, 72, 62, false, 0.78);
    drawFilmLockup(context, resources, 1010, 84, false, "right");
    drawTornPaper(context, 150, 220, 730, 315, "#f6e7d8", 31, -0.018);
    context.fillStyle = COLORS.burgundy;
    fillFitted(context, displayName(data).toUpperCase(), 210, 360, 640, 92, resources.fonts.sans, 700, 48);
    context.fillStyle = COLORS.coral;
    font(context, 38, resources.fonts.cloud, 500, "italic");
    context.fillText("This is how I come back to myself.", 220, 430, 610);
    context.save();
    context.globalAlpha = 0.92;
    drawImageContain(context, resources.filmCollage, -70, 530, 700, 740);
    context.restore();
    starburst(context, 835, 720, 58, 120, 12, "#efc72f");
    const selected = practices(data);
    const notes = selected.length === 1 ? [
      { x: 565, y: 650, w: 455, h: 330, fill: "#f5e5d7", rotation: 0.018 },
    ] : [
      { x: 610, y: 540, w: 400, h: 170, fill: "#f5e5d7", rotation: 0.026 },
      { x: 650, y: 755, w: 360, h: 180, fill: COLORS.tealBright, rotation: -0.018 },
      { x: 560, y: 975, w: 450, h: 180, fill: COLORS.coral, rotation: 0.016 },
    ];
    selected.forEach((label, index) => {
      const note = notes[index];
      drawTornPaper(context, note.x, note.y, note.w, note.h, note.fill, 60 + index, note.rotation);
      context.save();
      context.translate(note.x + note.w / 2, note.y + note.h / 2);
      context.rotate(note.rotation);
      context.translate(-(note.x + note.w / 2), -(note.y + note.h / 2));
      context.fillStyle = index === 0 ? COLORS.burgundy : COLORS.white;
      drawFittedWrapped(
        context,
        label,
        note.x + 32,
        note.y + (selected.length === 1 ? 72 : 22),
        note.w - 64,
        note.h - (selected.length === 1 ? 130 : 66),
        selected.length === 1 ? 72 : 52,
        resources.fonts.sans,
        700,
        18,
        1.02,
      );
      context.fillRect(note.x + 32, note.y + note.h - 35, Math.min(190 + index * 45, note.w - 70), 5);
      context.restore();
    });
    roundRect(context, 88, 1178, 590, 66, 2, COLORS.teal);
    context.fillStyle = COLORS.white;
    fillFitted(context, pathwayLine(data), 112, 1223, 540, 29, resources.fonts.sans, 700, 20);
    drawFooter(context, data, resources, { dark: false, y: 1290 });
  },
};

const magazineIssue: ShareCardConcept = {
  id: "magazine-issue",
  name: "The Community Issue",
  description: "An editorial cover where the participant becomes the feature story.",
  render(context, data, resources) {
    begin(context, "#21191a");
    paperGrain(context, COLORS.white, 0.03, 41);
    drawBrand(context, resources, 64, 58, true, 0.74);
    drawFilmLockup(context, resources, 770, 78, true);
    context.fillStyle = COLORS.coral;
    font(context, 54, resources.fonts.cloud, 500);
    context.fillText("02", 962, 88);
    context.fillStyle = COLORS.coral;
    font(context, 16, resources.fonts.sans, 700);
    context.textAlign = "right";
    context.fillText("THE COMMUNITY", 1012, 178);
    context.fillText("RESET ISSUE", 1012, 201);
    context.textAlign = "left";
    context.fillStyle = COLORS.cream;
    fillFitted(context, displayName(data).toUpperCase(), 58, 374, 740, 148, resources.fonts.sans, 700, 66);
    context.fillStyle = COLORS.peach;
    fillFitted(context, "This is how I come back to myself.", 64, 430, 500, 39, resources.fonts.script, 400, 26);
    context.save();
    context.globalAlpha = 0.96;
    drawImageContain(context, resources.filmCollage, 520, 320, 620, 820);
    context.restore();
    const selected = practices(data);
    selected.forEach((label, index) => {
      const y = 670 + index * 150;
      context.fillStyle = [COLORS.cream, COLORS.tealBright, COLORS.coral][index];
      fillFitted(context, label, 62, y, 580, 67, resources.fonts.sans, 700, 36);
      context.fillRect(64, y + 17, 260 + index * 75, 6);
    });
    context.fillStyle = COLORS.tealBright;
    font(context, 27, resources.fonts.sans, 700);
    context.fillText(pathwayLine(data), 64, 1180, 930);
    context.fillStyle = COLORS.peach;
    font(context, 27, resources.fonts.script, 400);
    context.fillText("Small choices. Shared change.", 64, 1230);
    context.fillStyle = COLORS.white;
    font(context, 17, resources.fonts.sans, 500);
    context.fillText(data.signupUrl.replace(/^https?:\/\//, ""), 64, 1285);
  },
};

const splitEditorial: ShareCardConcept = {
  id: "split-editorial",
  name: "Split Editorial",
  description: "A clean vertical split combining bold type with film imagery.",
  render(context, data, resources) {
    begin(context, COLORS.cream);
    context.fillStyle = COLORS.burgundy; context.fillRect(0, 0, 580, CARD_HEIGHT);
    context.fillStyle = accent(data); context.fillRect(580, 0, 500, CARD_HEIGHT);
    paperGrain(context, COLORS.white, 0.025, 99);
    drawBrand(context, resources, 60, 62, true, 0.72);
    drawFilmLockup(context, resources, 1020, 82, true, "right");
    context.fillStyle = COLORS.cream;
    fillFitted(context, displayName(data).toUpperCase(), 58, 310, 950, 88, resources.fonts.sans, 700, 48);
    context.fillStyle = COLORS.peach;
    font(context, 36, resources.fonts.script, 400);
    context.fillText("This is how I come back to myself.", 60, 365, 900);
    context.save();
    context.beginPath(); context.rect(500, 400, 580, 690); context.clip();
    drawImageContain(context, resources.filmCollage, 400, 385, 790, 735);
    context.restore();
    const selected = practices(data);
    selected.forEach((label, index) => {
      const y = 580 + index * 190;
      context.fillStyle = index === 1 ? COLORS.coral : COLORS.cream;
      fillFitted(context, label, 58, y, 420, 68, resources.fonts.sans, 700, 34);
      context.fillRect(58, y + 20, Math.min(200 + index * 70, 400), 6);
    });
    context.fillStyle = COLORS.white;
    font(context, 23, resources.fonts.sans, 700);
    context.fillText(pathwayLine(data), 60, 1185, 950);
    context.fillStyle = COLORS.peach;
    font(context, 26, resources.fonts.script, 400);
    context.fillText("What brings you back?", 60, 1236);
    context.fillStyle = COLORS.white;
    font(context, 17, resources.fonts.sans, 500);
    context.fillText(data.signupUrl.replace(/^https?:\/\//, ""), 60, 1282);
  },
};

const minimalEditorial: ShareCardConcept = {
  id: "minimal-editorial",
  name: "Minimal Editorial",
  description: "A quiet, premium poster with generous space and precise typography.",
  render(context, data, resources) {
    begin(context, COLORS.cream);
    context.fillStyle = COLORS.tealBright; context.fillRect(0, 0, 24, CARD_HEIGHT);
    paperGrain(context, COLORS.burgundy, 0.02, 90);
    drawBrand(context, resources, 74, 70, false, 0.78);
    context.strokeStyle = COLORS.burgundy; context.lineWidth = 2;
    context.beginPath(); context.moveTo(680, 62); context.lineTo(680, 178); context.stroke();
    drawFilmLockup(context, resources, 728, 94, false);
    context.fillStyle = COLORS.burgundy;
    fillFitted(context, displayName(data).toUpperCase(), 72, 360, 930, 92, resources.fonts.sans, 700, 48);
    context.fillStyle = COLORS.coral;
    font(context, 43, resources.fonts.script, 400);
    context.fillText("This is how I come back to myself.", 76, 424, 900);
    roundRect(context, 72, 475, 605, 70, 6, COLORS.tealBright);
    context.fillStyle = COLORS.white;
    fillFitted(context, pathwayLine(data), 100, 523, 550, 31, resources.fonts.sans, 700, 21);
    const selected = practices(data);
    selected.forEach((label, index) => {
      const y = 700 + index * 178;
      context.fillStyle = [COLORS.teal, COLORS.coral, COLORS.burgundy][index];
      fillFitted(context, label, 96 + index * 50, y, 860, 72, resources.fonts.sans, 700, 42);
      context.fillRect(96 + index * 50, y + 20, 260 + index * 90, 5);
    });
    context.strokeStyle = COLORS.coral; context.lineWidth = 2;
    context.beginPath(); context.moveTo(260, 1195); context.lineTo(820, 1195); context.stroke();
    context.fillStyle = COLORS.burgundy;
    font(context, 29, resources.fonts.script, 400);
    context.textAlign = "center";
    context.fillText("Small choices. Shared change.", CARD_WIDTH / 2, 1244);
    context.textAlign = "left";
    drawFooter(context, data, resources, { dark: false, y: 1293 });
  },
};

const colorBands: ShareCardConcept = {
  id: "color-bands",
  name: "Color Bands",
  description: "A high-impact sequence of pathway-colored typographic bands.",
  render(context, data, resources) {
    begin(context, COLORS.black);
    drawBrand(context, resources, 62, 56, true, 0.7);
    drawFilmLockup(context, resources, 1010, 76, true, "right");
    context.fillStyle = COLORS.white;
    fillFitted(context, displayName(data).toUpperCase(), 60, 286, 940, 92, resources.fonts.sans, 700, 48);
    context.fillStyle = COLORS.peach;
    font(context, 37, resources.fonts.script, 400);
    context.fillText("This is how I come back to myself.", 62, 342, 900);
    const selected = practices(data);
    const fills = [accent(data, 0), COLORS.coral, accent(data, 1)];
    selected.forEach((label, index) => {
      const y = 420 + index * 250;
      context.fillStyle = fills[index];
      context.fillRect(index === 1 ? 80 : 0, y, index === 1 ? 1000 : 1080, 220);
      context.fillStyle = index === 1 ? COLORS.burgundy : COLORS.white;
      fillFitted(context, label.toUpperCase(), 60 + (index === 1 ? 60 : 0), y + 142, 930, 100, resources.fonts.sans, 700, 50);
      context.fillStyle = index === 1 ? COLORS.burgundy : COLORS.peach;
      font(context, 17, resources.fonts.sans, 700);
      context.fillText(data.pathways[index]?.label?.toUpperCase() ?? "MY RESET", 65 + (index === 1 ? 60 : 0), y + 190);
    });
    context.fillStyle = COLORS.peach;
    font(context, 27, resources.fonts.script, 400);
    context.fillText("Small choices. Shared change.", 64, 1225);
    context.fillStyle = COLORS.white;
    font(context, 18, resources.fonts.sans, 600);
    context.fillText(data.signupUrl.replace(/^https?:\/\//, ""), 64, 1275);
  },
};

const posterGrid: ShareCardConcept = {
  id: "poster-grid",
  name: "Poster Grid",
  description: "A modular campaign system where every answer occupies its own tile.",
  render(context, data, resources) {
    begin(context, COLORS.cream);
    paperGrain(context, COLORS.burgundy, 0.025, 57);
    roundRect(context, 36, 36, 620, 285, 28, COLORS.burgundy);
    drawBrand(context, resources, 72, 76, true, 0.72);
    context.fillStyle = COLORS.white;
    fillFitted(context, displayName(data).toUpperCase(), 72, 278, 550, 54, resources.fonts.sans, 700, 34);
    const headerAccent = accent(data);
    const lightHeader = ["restore", "connect", "rebalance"].includes(data.pathways[0]?.key ?? "");
    const headerText = lightHeader ? COLORS.burgundy : COLORS.white;
    roundRect(context, 680, 36, 364, 285, 28, headerAccent);
    drawFilmLockup(context, resources, 715, 105, true, "left", {
      primary: headerText,
      secondary: headerText,
    });
    context.fillStyle = headerText;
    font(context, 22, resources.fonts.sans, 700);
    context.fillText("THE COMMUNITY", 715, 236);
    context.fillText("RESET", 715, 266);
    const selected = practices(data);
    if (selected.length === 1) {
      roundRect(context, 36, 345, 650, 789, 28, COLORS.tealBright);
      context.fillStyle = COLORS.white;
      font(context, 20, resources.fonts.sans, 700);
      context.fillText(data.pathways[0]?.label?.toUpperCase() ?? "MY RESET", 76, 407);
      drawFittedWrapped(
        context,
        selected[0],
        76,
        485,
        570,
        500,
        100,
        resources.fonts.sans,
        700,
        30,
        1.02,
      );
      context.fillRect(76, 1060, 260, 7);

      context.save();
      context.beginPath(); context.roundRect(710, 345, 334, 789, 28); context.clip();
      context.fillStyle = COLORS.gold; context.fillRect(710, 345, 334, 789);
      drawImageContain(context, resources.filmCollage, 585, 490, 590, 590);
      context.restore();
    } else {
    const tiles = [
      { x: 36, y: 345, w: 480, h: 370, fill: COLORS.tealBright, text: COLORS.white },
      { x: 540, y: 345, w: 504, h: 370, fill: COLORS.coral, text: COLORS.burgundy },
      { x: 36, y: 739, w: 620, h: 395, fill: COLORS.burgundy, text: COLORS.cream },
    ];
    selected.forEach((label, index) => {
      const tile = tiles[index];
      roundRect(context, tile.x, tile.y, tile.w, tile.h, 28, tile.fill);
      context.fillStyle = tile.text;
      font(context, 19, resources.fonts.sans, 700);
      context.fillText(data.pathways[index]?.label?.toUpperCase() ?? "MY RESET", tile.x + 34, tile.y + 52);
      drawFittedWrapped(
        context,
        label,
        tile.x + 34,
        tile.y + 82,
        tile.w - 68,
        tile.h - 155,
        index === 2 ? 76 : 66,
        index === 2 ? resources.fonts.cloud : resources.fonts.sans,
        700,
        18,
        1.03,
      );
      context.fillRect(tile.x + 34, tile.y + tile.h - 48, 180 + index * 70, 5);
    });
    context.save();
    context.beginPath(); context.roundRect(680, 739, 364, 395, 28); context.clip();
    context.fillStyle = COLORS.gold; context.fillRect(680, 739, 364, 395);
    drawImageContain(context, resources.filmCollage, 620, 700, 500, 500);
    context.restore();
    }
    roundRect(context, 36, 1158, 1008, 156, 28, COLORS.teal);
    context.fillStyle = COLORS.white;
    font(context, 27, resources.fonts.script, 400);
    context.textAlign = "center";
    context.fillText("Small choices. Shared change.", CARD_WIDTH / 2, 1218);
    font(context, 23, resources.fonts.sans, 700);
    context.fillText(pathwayLine(data), CARD_WIDTH / 2, 1260, 900);
    font(context, 16, resources.fonts.sans, 500);
    context.fillText(data.signupUrl.replace(/^https?:\/\//, ""), CARD_WIDTH / 2, 1290);
    context.textAlign = "left";
  },
};

const collageWindow: ShareCardConcept = {
  id: "collage-window",
  name: "Collage Window",
  description: "A restrained campaign poster with one dramatic documentary-image window.",
  render(context, data, resources) {
    begin(context, COLORS.burgundy);
    paperGrain(context, COLORS.white, 0.025, 72);
    drawBrand(context, resources, 64, 58, true, 0.72);
    drawFilmLockup(context, resources, 1010, 78, true, "right");
    context.fillStyle = COLORS.cream;
    fillFitted(context, displayName(data).toUpperCase(), 62, 300, 940, 92, resources.fonts.sans, 700, 48);
    context.fillStyle = COLORS.peach;
    font(context, 37, resources.fonts.script, 400);
    context.fillText("This is how I come back to myself.", 64, 355, 900);
    context.save();
    context.beginPath(); context.roundRect(60, 405, 960, 470, 34); context.clip();
    context.fillStyle = COLORS.tealBright; context.fillRect(60, 405, 960, 470);
    drawImageContain(context, resources.filmCollage, 255, 340, 820, 650);
    context.restore();
    const selected = practices(data);
    selected.forEach((label, index) => {
      const x = 65 + index * 330;
      context.fillStyle = [COLORS.cream, COLORS.coral, COLORS.sky][index];
      drawFittedWrapped(context, label, x, 920, 285, 165, 46, resources.fonts.sans, 700, 16, 1.03);
      context.fillRect(x, 1095, 180, 5);
    });
    context.fillStyle = COLORS.tealBright;
    font(context, 24, resources.fonts.sans, 700);
    context.fillText(pathwayLine(data), 65, 1178, 930);
    drawFooter(context, data, resources, { dark: true, y: 1260 });
  },
};

export const SHARE_CARD_CONCEPTS: ShareCardConcept[] = [
  personalScrapbook,
  posterGrid,
  filmCollagePoster,
  typeManifesto,
  communitySpotlight,
  pathwayWorlds,
  magazineIssue,
  splitEditorial,
  minimalEditorial,
  colorBands,
  collageWindow,
];
