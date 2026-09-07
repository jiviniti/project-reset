export type SavedQuestionCardItem = {
  theme: string;
  question: string;
};

const CARD_WIDTH = 900;
const FRAME = 34;
const SIDE = 58;
const CONTENT_WIDTH = CARD_WIDTH - SIDE * 2;
const QUESTION_FONT = "600 38px Poppins, Arial, sans-serif";
const QUESTION_LINE_HEIGHT = 47;

function wrapText(context: CanvasRenderingContext2D, text: string, maxWidth: number) {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (current && context.measureText(candidate).width > maxWidth) {
      lines.push(current);
      current = word;
    } else {
      current = candidate;
    }
  }
  if (current) lines.push(current);
  return lines;
}

function loadImage(source: string) {
  return new Promise<HTMLImageElement | null>((resolve) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => resolve(null);
    image.src = source;
  });
}

function fitImage(context: CanvasRenderingContext2D, image: HTMLImageElement, x: number, y: number, maxWidth: number, maxHeight: number) {
  const scale = Math.min(maxWidth / image.naturalWidth, maxHeight / image.naturalHeight);
  const width = image.naturalWidth * scale;
  const height = image.naturalHeight * scale;
  context.drawImage(image, x + maxWidth - width, y + maxHeight - height, width, height);
}

function drawContainedImage(context: CanvasRenderingContext2D, image: HTMLImageElement, x: number, y: number, maxWidth: number, maxHeight: number) {
  const scale = Math.min(maxWidth / image.naturalWidth, maxHeight / image.naturalHeight);
  const width = image.naturalWidth * scale;
  const height = image.naturalHeight * scale;
  context.drawImage(image, x, y + (maxHeight - height) / 2, width, height);
}

export async function downloadSavedQuestionsCard(items: SavedQuestionCardItem[]) {
  await document.fonts.ready;
  const measuringCanvas = document.createElement("canvas");
  const measuringContext = measuringCanvas.getContext("2d");
  if (!measuringContext) throw new Error("canvas_unavailable");
  measuringContext.font = QUESTION_FONT;

  const layouts = items.map((item) => {
    const lines = wrapText(measuringContext, item.question, CONTENT_WIDTH);
    return { ...item, lines, height: 120 + lines.length * QUESTION_LINE_HEIGHT };
  });
  const questionsHeight = layouts.reduce((total, item) => total + item.height, 0);
  const footerHeight = 390;
  const cardHeight = 290 + questionsHeight + footerHeight;
  const canvas = document.createElement("canvas");
  canvas.width = CARD_WIDTH;
  canvas.height = cardHeight;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("canvas_unavailable");

  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, CARD_WIDTH, cardHeight);
  context.strokeStyle = "#1d1d1d";
  context.lineWidth = 2;
  context.strokeRect(FRAME, FRAME, CARD_WIDTH - FRAME * 2, cardHeight - FRAME * 2);

  context.fillStyle = "#1d1d1d";
  context.font = "700 15px Poppins, Arial, sans-serif";
  context.letterSpacing = "4px";
  context.fillText("PROJECT", SIDE, 78);
  context.letterSpacing = "0px";
  context.font = "600 48px Poppins, Arial, sans-serif";
  context.fillStyle = "#de5240";
  context.fillText("re", SIDE, 125);
  const reWidth = context.measureText("re").width;
  context.fillStyle = "#1d1d1d";
  context.fillText("set.", SIDE + reWidth - 1, 125);

  context.fillStyle = "#de5240";
  context.font = "700 17px Poppins, Arial, sans-serif";
  context.letterSpacing = "3px";
  context.fillText("CONTINUE THE CONVERSATION", SIDE, 183);
  context.letterSpacing = "0px";
  context.fillStyle = "#1d1d1d";
  context.font = "600 48px Poppins, Arial, sans-serif";
  context.fillText("Questions I saved", SIDE, 242);

  let y = 290;
  layouts.forEach((item, index) => {
    context.fillStyle = "#de5240";
    context.font = "700 18px Poppins, Arial, sans-serif";
    context.fillText(String(index + 1).padStart(2, "0"), SIDE, y + 22);

    context.fillStyle = "#656565";
    context.font = "600 14px Poppins, Arial, sans-serif";
    context.letterSpacing = "1.6px";
    const theme = item.theme.toUpperCase();
    context.fillText(theme, CARD_WIDTH - SIDE - context.measureText(theme).width, y + 21);
    context.letterSpacing = "0px";

    context.fillStyle = "#1d1d1d";
    context.font = QUESTION_FONT;
    item.lines.forEach((line, lineIndex) => {
      context.fillText(line, SIDE, y + 82 + lineIndex * QUESTION_LINE_HEIGHT);
    });

    const ruleY = y + item.height - 26;
    context.strokeStyle = "#edbaa6";
    context.lineWidth = 2;
    context.beginPath();
    context.moveTo(SIDE, ruleY);
    context.lineTo(CARD_WIDTH - SIDE, ruleY);
    context.stroke();
    y += item.height;
  });

  const [collage, jiviniti, pictureMotion] = await Promise.all([
    loadImage("/images/share-card-film-collage.png"),
    loadImage("/images/jiviniti-wordmark.png"),
    loadImage("/images/picture-motion.jpg"),
  ]);
  const footerTop = cardHeight - footerHeight;
  context.fillStyle = "#52292b";
  context.font = "700 17px Poppins, Arial, sans-serif";
  context.letterSpacing = "2.5px";
  context.fillText("THIRD DEGREE BURNOUT", SIDE, footerTop + 82);
  context.letterSpacing = "0px";
  context.font = "500 21px Poppins, Arial, sans-serif";
  context.fillText("A Survivor's Guide", SIDE, footerTop + 116);
  context.fillStyle = "#555555";
  context.font = "500 17px Poppins, Arial, sans-serif";
  context.fillText("A question worth keeping open.", SIDE, footerTop + 170);
  context.fillText("thirddegreeburnout.com", SIDE, footerTop + 203);
  if (collage) fitImage(context, collage, CARD_WIDTH - SIDE - 235, footerTop + 28, 235, 220);

  const partnerTop = footerTop + 265;
  context.fillStyle = "#656565";
  context.font = "600 13px Poppins, Arial, sans-serif";
  context.fillText("BROUGHT TO YOU BY", SIDE, partnerTop - 14);
  const jivinitiWidth = 145;
  const partnerGap = 16;
  const partnerLabel = "IN PARTNERSHIP WITH";
  context.font = "500 13px Poppins, Arial, sans-serif";
  const partnerLabelWidth = context.measureText(partnerLabel).width;
  const partnerLabelX = SIDE + jivinitiWidth + partnerGap;
  const pictureMotionX = partnerLabelX + partnerLabelWidth + partnerGap;
  if (jiviniti) {
    context.save();
    context.filter = "brightness(0)";
    drawContainedImage(context, jiviniti, SIDE, partnerTop, jivinitiWidth, 58);
    context.restore();
  }
  context.fillStyle = "#656565";
  context.fillText(partnerLabel, partnerLabelX, partnerTop + 34);
  if (pictureMotion) drawContainedImage(context, pictureMotion, pictureMotionX, partnerTop, 58, 58);

  const bandWidth = (CARD_WIDTH - FRAME * 2) / 5;
  ["#458284", "#82bcc8", "#de5240", "#fa8757", "#d4953b"].forEach((color, index) => {
    context.fillStyle = color;
    context.fillRect(FRAME + bandWidth * index, cardHeight - FRAME - 12, bandWidth, 12);
  });

  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png"));
  if (!blob) throw new Error("image_export_failed");
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "project-reset-saved-questions.png";
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
