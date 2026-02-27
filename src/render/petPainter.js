const TWO_PI = Math.PI * 2;

export class PetPainter {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.width = 0;
    this.height = 0;
  }

  render(pet, timeMs) {
    this.#resizeIfNeeded();
    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;

    ctx.clearRect(0, 0, w, h);

    if (!pet) {
      this.#drawPlaceholder(ctx, w, h);
      return;
    }

    const palette = pet.genes?.palette ?? ["#6fd5b5", "#d8fff0", "#2f8d73"];
    const floatT = timeMs * 0.001;
    const bob = Math.sin(floatT * (1 + (pet.genes?.wobbleSeed ?? 1) * 0.2)) * 6;
    const stageScale = 0.74 + pet.stage * 0.1;

    this.#drawBackdrop(ctx, w, h, palette, floatT);

    const cx = w * 0.5;
    const cy = h * 0.57 + bob;
    const size = Math.min(w, h) * 0.18 * stageScale;

    ctx.save();
    this.#drawShadow(ctx, cx, cy, size, pet.stage);
    this.#drawTail(ctx, pet, cx, cy, size, floatT);
    this.#drawBody(ctx, pet, cx, cy, size, floatT);
    this.#drawPattern(ctx, pet, cx, cy, size, floatT);
    this.#drawEyes(ctx, pet, cx, cy, size, floatT);
    this.#drawHorns(ctx, pet, cx, cy, size, floatT);
    this.#drawMouth(ctx, pet, cx, cy, size, floatT);
    if (pet.stage >= 5) {
      this.#drawAura(ctx, pet, cx, cy, size, floatT);
    }
    ctx.restore();
  }

  #drawPlaceholder(ctx, w, h) {
    const gradient = ctx.createLinearGradient(0, 0, 0, h);
    gradient.addColorStop(0, "rgba(112, 197, 178, 0.22)");
    gradient.addColorStop(1, "rgba(8, 18, 24, 0.9)");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, w, h);

    ctx.fillStyle = "rgba(235,255,248,0.82)";
    ctx.font = "700 20px Outfit, Noto Sans SC, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("等待研发中", w * 0.5, h * 0.5 - 10);

    ctx.fillStyle = "rgba(184,220,210,0.9)";
    ctx.font = "500 14px Outfit, Noto Sans SC, sans-serif";
    ctx.fillText("创建奇物后会在这里显示实时形态", w * 0.5, h * 0.5 + 16);
  }

  #drawBackdrop(ctx, w, h, palette, time) {
    const gradient = ctx.createRadialGradient(w * 0.5, h * 0.2, 20, w * 0.5, h * 0.5, h * 0.8);
    gradient.addColorStop(0, addAlpha(palette[1], 0.3));
    gradient.addColorStop(0.45, addAlpha(palette[0], 0.18));
    gradient.addColorStop(1, "rgba(4, 11, 14, 0.88)");

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, w, h);

    for (let idx = 0; idx < 8; idx += 1) {
      const x = ((idx * 77 + time * 18) % (w + 120)) - 60;
      const y = h * (0.18 + (idx % 5) * 0.12);
      ctx.fillStyle = addAlpha(palette[2], 0.07);
      ctx.beginPath();
      ctx.arc(x, y, 2 + (idx % 4), 0, TWO_PI);
      ctx.fill();
    }
  }

  #drawShadow(ctx, cx, cy, size, stage) {
    ctx.fillStyle = "rgba(0, 0, 0, 0.28)";
    ctx.beginPath();
    ctx.ellipse(cx, cy + size * (0.85 + stage * 0.05), size * 1.2, size * 0.34, 0, 0, TWO_PI);
    ctx.fill();
  }

  #drawBody(ctx, pet, cx, cy, size, time) {
    const shape = pet.genes?.shape ?? "blob";
    const palette = pet.genes?.palette ?? ["#79d5b7", "#e5fff4", "#2f8d73"];

    const fill = ctx.createLinearGradient(cx - size, cy - size, cx + size, cy + size);
    fill.addColorStop(0, palette[1]);
    fill.addColorStop(0.55, palette[0]);
    fill.addColorStop(1, palette[2]);
    ctx.fillStyle = fill;

    if (shape === "orb") {
      const rx = size * (1 + Math.sin(time * 2.1) * 0.06);
      const ry = size * (0.88 + Math.cos(time * 1.8) * 0.05);
      ctx.beginPath();
      ctx.ellipse(cx, cy, rx, ry, 0, 0, TWO_PI);
      ctx.fill();
    } else if (shape === "cube") {
      const side = size * 1.7;
      const wobble = Math.sin(time * 1.7) * 0.06;
      roundedRect(ctx, cx - side / 2, cy - side / 2, side, side, 20 + pet.stage * 2, wobble);
      ctx.fill();
    } else if (shape === "spiky") {
      starShape(ctx, cx, cy, size * 0.9, size * 1.2, 10, time * 0.5);
      ctx.fill();
    } else if (shape === "jelly") {
      jellyShape(ctx, cx, cy, size, time);
      ctx.fill();
    } else {
      blobShape(ctx, cx, cy, size, 10, time * 0.8);
      ctx.fill();
    }

    ctx.strokeStyle = addAlpha("#ffffff", 0.25);
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = "rgba(255, 255, 255, 0.25)";
    ctx.beginPath();
    ctx.ellipse(cx - size * 0.25, cy - size * 0.3, size * 0.2, size * 0.12, -0.55, 0, TWO_PI);
    ctx.fill();
  }

  #drawPattern(ctx, pet, cx, cy, size, time) {
    if (pet.stage < 3) {
      return;
    }

    const pattern = pet.genes?.pattern ?? "dot";
    ctx.save();
    ctx.globalAlpha = 0.24 + pet.stage * 0.06;
    ctx.fillStyle = "#ffffff";
    ctx.strokeStyle = "#ffffff";

    if (pattern === "stripe") {
      for (let idx = -2; idx <= 2; idx += 1) {
        const y = cy + idx * (size * 0.25);
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(cx - size * 0.65, y + Math.sin(time + idx) * 3);
        ctx.lineTo(cx + size * 0.65, y - Math.cos(time + idx) * 3);
        ctx.stroke();
      }
    } else if (pattern === "ring") {
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(cx, cy, size * 0.35, 0, TWO_PI);
      ctx.stroke();
      if (pet.stage >= 4) {
        ctx.beginPath();
        ctx.arc(cx, cy, size * 0.58, 0, TWO_PI);
        ctx.stroke();
      }
    } else if (pattern === "patch") {
      ctx.fillRect(cx - size * 0.55, cy - size * 0.2, size * 0.28, size * 0.24);
      ctx.fillRect(cx + size * 0.08, cy + size * 0.06, size * 0.3, size * 0.2);
    } else {
      for (let idx = 0; idx < 5; idx += 1) {
        const x = cx + (idx - 2) * size * 0.24;
        const y = cy + Math.sin(time + idx * 0.9) * size * 0.12;
        ctx.beginPath();
        ctx.arc(x, y, 4 + (idx % 2), 0, TWO_PI);
        ctx.fill();
      }
    }

    ctx.restore();
  }

  #drawEyes(ctx, pet, cx, cy, size, time) {
    const eyeCount = Math.max(1, pet.genes?.eyeCount ?? 2);
    const spacing = eyeCount > 1 ? (size * 1.02) / (eyeCount - 1) : 0;
    const baseX = cx - (spacing * (eyeCount - 1)) / 2;
    const y = cy - size * 0.14;

    for (let idx = 0; idx < eyeCount; idx += 1) {
      const x = baseX + idx * spacing;
      const radius = size * (0.11 + pet.stage * 0.008);

      ctx.fillStyle = "#fff";
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, TWO_PI);
      ctx.fill();

      ctx.fillStyle = "#182a2f";
      const lookX = Math.sin(time * 1.5 + idx * 0.7) * radius * 0.22;
      const lookY = Math.cos(time * 1.3 + idx * 0.4) * radius * 0.22;
      ctx.beginPath();
      ctx.arc(x + lookX, y + lookY, radius * 0.5, 0, TWO_PI);
      ctx.fill();

      ctx.fillStyle = "rgba(255,255,255,0.7)";
      ctx.beginPath();
      ctx.arc(x - radius * 0.15, y - radius * 0.2, radius * 0.22, 0, TWO_PI);
      ctx.fill();
    }
  }

  #drawHorns(ctx, pet, cx, cy, size, time) {
    if (pet.stage < 2) {
      return;
    }

    const style = pet.genes?.hornStyle ?? "none";
    if (style === "none") {
      return;
    }

    const topY = cy - size * 0.9;
    const leftX = cx - size * 0.4;
    const rightX = cx + size * 0.4;

    ctx.fillStyle = "rgba(255, 248, 214, 0.9)";
    ctx.strokeStyle = "rgba(35, 60, 68, 0.5)";
    ctx.lineWidth = 2;

    if (style === "spike") {
      triangle(ctx, leftX, topY, size * 0.2, size * 0.35);
      triangle(ctx, rightX, topY, size * 0.2, size * 0.35);
    } else if (style === "leaf") {
      leafShape(ctx, leftX, topY + Math.sin(time * 2.2) * 2, size * 0.23, -0.5);
      leafShape(ctx, rightX, topY + Math.cos(time * 2.1) * 2, size * 0.23, 0.5);
    } else {
      antenna(ctx, leftX, topY + size * 0.2, size * 0.34, time * 2.4);
      antenna(ctx, rightX, topY + size * 0.2, size * 0.34, time * 2.2 + 1);
    }
  }

  #drawTail(ctx, pet, cx, cy, size, time) {
    if (pet.stage < 3) {
      return;
    }

    const tail = pet.genes?.tailStyle ?? "none";
    if (tail === "none") {
      return;
    }

    const anchorX = cx + size * 0.66;
    const anchorY = cy + size * 0.1;

    ctx.strokeStyle = "rgba(255,255,255,0.75)";
    ctx.fillStyle = "rgba(255,255,255,0.75)";
    ctx.lineWidth = 3;

    if (tail === "ribbon") {
      ctx.beginPath();
      ctx.moveTo(anchorX, anchorY);
      ctx.bezierCurveTo(
        anchorX + size * 0.2,
        anchorY - size * 0.2,
        anchorX + size * 0.45,
        anchorY + size * 0.05,
        anchorX + size * 0.55,
        anchorY + Math.sin(time * 3) * size * 0.2,
      );
      ctx.stroke();
    } else if (tail === "coil") {
      ctx.beginPath();
      ctx.arc(anchorX + size * 0.15, anchorY + size * 0.1, size * 0.28, 0.1, TWO_PI * 0.85);
      ctx.stroke();
    } else if (tail === "smoke") {
      ctx.globalAlpha = 0.6;
      for (let idx = 0; idx < 3; idx += 1) {
        ctx.beginPath();
        ctx.arc(
          anchorX + idx * 8 + Math.sin(time * 2 + idx) * 3,
          anchorY - idx * 8,
          size * (0.1 + idx * 0.08),
          0,
          TWO_PI,
        );
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    } else {
      ctx.beginPath();
      ctx.moveTo(anchorX, anchorY);
      ctx.quadraticCurveTo(anchorX + size * 0.45, anchorY - size * 0.2, anchorX + size * 0.55, anchorY + size * 0.22);
      ctx.stroke();
    }
  }

  #drawMouth(ctx, pet, cx, cy, size, time) {
    ctx.strokeStyle = "rgba(21, 42, 48, 0.8)";
    ctx.lineWidth = 3;

    const mood = pet.stats?.mood ?? 50;
    const smile = (mood - 50) / 90;
    const y = cy + size * 0.34;

    ctx.beginPath();
    ctx.moveTo(cx - size * 0.2, y);
    ctx.quadraticCurveTo(cx, y + size * 0.18 * smile + Math.sin(time * 3.1) * 1.2, cx + size * 0.2, y);
    ctx.stroke();
  }

  #drawAura(ctx, pet, cx, cy, size, time) {
    const color = pet.rarity === "hidden" ? "#ffb2b2" : "#fff2aa";
    ctx.save();
    ctx.strokeStyle = addAlpha(color, 0.45);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cx, cy, size * (1.35 + Math.sin(time * 2) * 0.05), 0, TWO_PI);
    ctx.stroke();

    for (let idx = 0; idx < 7; idx += 1) {
      const angle = time * 0.8 + idx * (TWO_PI / 7);
      const x = cx + Math.cos(angle) * size * 1.5;
      const y = cy + Math.sin(angle) * size * 1.5;
      ctx.fillStyle = addAlpha(color, 0.72);
      ctx.beginPath();
      ctx.arc(x, y, 2 + (idx % 2), 0, TWO_PI);
      ctx.fill();
    }

    ctx.restore();
  }

  #resizeIfNeeded() {
    const rect = this.canvas.getBoundingClientRect();
    const width = Math.max(1, Math.floor(rect.width));
    const height = Math.max(1, Math.floor(rect.height));
    const ratio = window.devicePixelRatio || 1;

    const nextW = Math.floor(width * ratio);
    const nextH = Math.floor(height * ratio);

    if (this.canvas.width === nextW && this.canvas.height === nextH) {
      this.width = width;
      this.height = height;
      return;
    }

    this.canvas.width = nextW;
    this.canvas.height = nextH;
    this.ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    this.width = width;
    this.height = height;
  }
}

function addAlpha(color, alpha) {
  if (!color.startsWith("#")) {
    return color;
  }
  const hex = color.replace("#", "");
  const normalized = hex.length === 3 ? hex.split("").map((part) => `${part}${part}`).join("") : hex;
  const r = parseInt(normalized.slice(0, 2), 16);
  const g = parseInt(normalized.slice(2, 4), 16);
  const b = parseInt(normalized.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function roundedRect(ctx, x, y, width, height, radius, rotate = 0) {
  ctx.save();
  ctx.translate(x + width / 2, y + height / 2);
  ctx.rotate(rotate);
  ctx.beginPath();
  const left = -width / 2;
  const top = -height / 2;
  const right = width / 2;
  const bottom = height / 2;

  ctx.moveTo(left + radius, top);
  ctx.lineTo(right - radius, top);
  ctx.quadraticCurveTo(right, top, right, top + radius);
  ctx.lineTo(right, bottom - radius);
  ctx.quadraticCurveTo(right, bottom, right - radius, bottom);
  ctx.lineTo(left + radius, bottom);
  ctx.quadraticCurveTo(left, bottom, left, bottom - radius);
  ctx.lineTo(left, top + radius);
  ctx.quadraticCurveTo(left, top, left + radius, top);
  ctx.closePath();
  ctx.restore();
}

function starShape(ctx, cx, cy, inner, outer, spikes, rotate = 0) {
  ctx.beginPath();
  for (let idx = 0; idx < spikes * 2; idx += 1) {
    const radius = idx % 2 === 0 ? outer : inner;
    const angle = rotate + (idx * Math.PI) / spikes;
    const x = cx + Math.cos(angle) * radius;
    const y = cy + Math.sin(angle) * radius;
    if (idx === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
  }
  ctx.closePath();
}

function blobShape(ctx, cx, cy, radius, points, seed) {
  ctx.beginPath();
  for (let idx = 0; idx <= points; idx += 1) {
    const t = (idx / points) * TWO_PI;
    const wave = 0.82 + Math.sin(t * 3 + seed) * 0.08 + Math.cos(t * 4 + seed * 1.5) * 0.06;
    const x = cx + Math.cos(t) * radius * wave;
    const y = cy + Math.sin(t) * radius * wave;
    if (idx === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
  }
  ctx.closePath();
}

function jellyShape(ctx, cx, cy, radius, time) {
  ctx.beginPath();
  ctx.moveTo(cx - radius, cy + radius * 0.15);
  ctx.quadraticCurveTo(cx - radius * 0.9, cy - radius * 0.9, cx, cy - radius);
  ctx.quadraticCurveTo(cx + radius * 0.9, cy - radius * 0.9, cx + radius, cy + radius * 0.15);

  for (let idx = 0; idx < 4; idx += 1) {
    const part = idx / 3;
    const x = cx + radius - part * radius * 2;
    const y = cy + radius * 0.15 + Math.sin(time * 3.5 + idx) * radius * 0.1;
    ctx.lineTo(x, y + radius * (0.18 + (idx % 2) * 0.1));
  }

  ctx.closePath();
}

function triangle(ctx, x, y, width, height) {
  ctx.beginPath();
  ctx.moveTo(x, y - height);
  ctx.lineTo(x - width, y);
  ctx.lineTo(x + width, y);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
}

function leafShape(ctx, x, y, size, rotate) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rotate);
  ctx.beginPath();
  ctx.moveTo(0, -size);
  ctx.quadraticCurveTo(size, 0, 0, size);
  ctx.quadraticCurveTo(-size, 0, 0, -size);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

function antenna(ctx, x, y, length, phase) {
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.quadraticCurveTo(x + Math.sin(phase) * 4, y - length * 0.6, x + Math.sin(phase) * 7, y - length);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(x + Math.sin(phase) * 7, y - length, 4, 0, TWO_PI);
  ctx.fill();
}
