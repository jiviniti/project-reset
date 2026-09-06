export type SavedQuestionCardItem = {
  theme: string;
  question: string;
};

const CARD_WIDTH = 900;
const SIDE = 72;
const TEXT_WIDTH = CARD_WIDTH - SIDE * 2;
const QUESTION_FONT = "600 36px Poppins, Arial, sans-serif";
const QUESTION_LINE_HEIGHT = 48;

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

function roundedRect(context: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number) {
  context.beginPath();
  context.moveTo(x + radius, y);
  context.lineTo(x + width - radius, y);
  context.quadraticCurveTo(x + width, y, x + width, y + radius);
  context.lineTo(x + width, y + height - radius);
  context.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  context.lineTo(x + radius, y + height);
  context.quadraticCurveTo(x, y + height, x, y + height - radius);
  context.lineTo(x, y + radius);
  context.quadraticCurveTo(x, y, x + radius, y);
  context.closePath();
}

export async function downloadSavedQuestionsCard(items: SavedQuestionCardItem[]) {
  await document.fonts.ready;
  const measuringCanvas = document.createElement("canvas");
  const measuringContext = measuringCanvas.getContext("2d");
  if (!measuringContext) throw new Error("canvas_unavailable");
  measuringContext.font = QUESTION_FONT;

  const layouts = items.map((item) => {
    const lines = wrapText(measuringContext, item.question, TEXT_WIDTH - 72);
    return { ...item, lines, height: 116 + lines.length * QUESTION_LINE_HEIGHT };
  });
  const questionsHeight = layouts.reduce((total, item) => total + item.height + 22, 0);
  const cardHeight = 430 + questionsHeight;
  const canvas = document.createElement("canvas");
  canvas.width = CARD_WIDTH;
  canvas.height = cardHeight;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("canvas_unavailable");

  context.fillStyle = "#fbf1e8";
  context.fillRect(0, 0, CARD_WIDTH, cardHeight);
  context.fillStyle = "#52292b";
  context.fillRect(0, 0, 24, cardHeight);

  context.fillStyle = "#1d1d1d";
  context.font = "700 19px Poppins, Arial, sans-serif";
  context.letterSpacing = "5px";
  context.fillText("PROJECT", SIDE, 66);
  context.letterSpacing = "0px";
  context.font = "600 66px Poppins, Arial, sans-serif";
  context.fillStyle = "#de5240";
  context.fillText("re", SIDE, 127);
  const reWidth = context.measureText("re").width;
  context.fillStyle = "#1d1d1d";
  context.fillText("set.", SIDE + reWidth - 2, 127);

  context.fillStyle = "#de5240";
  context.font = "700 20px Poppins, Arial, sans-serif";
  context.letterSpacing = "4px";
  context.fillText("CONTINUE THE CONVERSATION", SIDE, 200);
  context.letterSpacing = "0px";
  context.fillStyle = "#52292b";
  context.font = "600 48px Poppins, Arial, sans-serif";
  context.fillText("Questions I want to keep open", SIDE, 260);
  context.fillStyle = "#6f6660";
  context.font = "500 22px Poppins, Arial, sans-serif";
  context.fillText(`${items.length} ${items.length === 1 ? "question" : "questions"} saved`, SIDE, 306);

  let y = 350;
  layouts.forEach((item, index) => {
    context.save();
    context.shadowColor = "rgba(82, 41, 43, 0.12)";
    context.shadowBlur = 14;
    context.shadowOffsetY = 5;
    roundedRect(context, SIDE, y, TEXT_WIDTH, item.height, 8);
    context.fillStyle = index % 2 === 0 ? "#ffffff" : "#f8dfd0";
    context.fill();
    context.restore();

    context.fillStyle = "#de5240";
    context.font = "700 20px Poppins, Arial, sans-serif";
    context.fillText(String(index + 1).padStart(2, "0"), SIDE + 30, y + 42);
    context.fillStyle = "#52292b";
    context.font = "700 16px Poppins, Arial, sans-serif";
    context.letterSpacing = "2px";
    context.fillText(item.theme.toUpperCase(), SIDE + 94, y + 41);
    context.letterSpacing = "0px";
    context.fillStyle = "#1d1d1d";
    context.font = QUESTION_FONT;
    item.lines.forEach((line, lineIndex) => {
      context.fillText(line, SIDE + 30, y + 96 + lineIndex * QUESTION_LINE_HEIGHT);
    });
    y += item.height + 22;
  });

  context.fillStyle = "#286b72";
  context.fillRect(24, cardHeight - 58, CARD_WIDTH - 24, 58);
  context.fillStyle = "#ffffff";
  context.font = "600 18px Poppins, Arial, sans-serif";
  context.fillText("Continue the conversation. Your answers stay with you.", SIDE, cardHeight - 23);

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
