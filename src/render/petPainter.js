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

    const palette = pet.genes?.palette ?? ["#ffa5cb", "#ffe4f0", "#b47ec7"];
    const t = timeMs * 0.001;
    const bob = Math.sin(t * (1.2 + (pet.genes?.wobbleSeed ?? 1) * 0.15)) * 5;
    const stageScale = 0.74 + pet.stage * 0.1;

    const cx = w * 0.5;
    const cy = h * 0.57 + bob;
    const size = Math.min(w, h) * 0.18 * stageScale;

    this.#drawBackdrop(ctx, w, h, palette, t, pet.stage);

    ctx.save();
    this.#drawShadow(ctx, cx, cy, size);
    this.#drawTail(ctx, pet, cx, cy, size, t);
    this.#drawBody(ctx, pet, cx, cy, size, t);
    this.#drawPattern(ctx, pet, cx, cy, size, t);
    this.#drawEyes(ctx, pet, cx, cy, size, t);
    this.#drawHorns(ctx, pet, cx, cy, size, t);
    this.#drawMouth(ctx, pet, cx, cy, size, t);
    this.#drawFxParticles(ctx, pet, cx, cy, size, t);
    if (pet.stage >= 5) {
      this.#drawAura(ctx, pet, cx, cy, size, t);
    }
    ctx.restore();
  }

  #drawPlaceholder(ctx, w, h) {
    const gradient = ctx.createLinearGradient(0, 0, 0, h);
    gradient.addColorStop(0, "#fff3f9");
    gradient.addColorStop(1, "#eafdf6");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, w, h);

    ctx.fillStyle = "rgba(129, 86, 107, 0.88)";
    ctx.font = "700 19px 'Baloo 2', 'Noto Sans SC', sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("等待研发中", w * 0.5, h * 0.5 - 8);

    ctx.fillStyle = "rgba(150, 106, 128, 0.9)";
    ctx.font = "600 13px 'Baloo 2', 'Noto Sans SC', sans-serif";
    ctx.fillText("创建奇物后会在这里显示动态形态", w * 0.5, h * 0.5 + 16);
  }

  #drawBackdrop(ctx, w, h, palette, t, stage) {
    const gradient = ctx.createRadialGradient(w * 0.5, h * 0.22, 22, w * 0.5, h * 0.5, h * 0.8);
    gradient.addColorStop(0, addAlpha(palette[1], 0.5));
    gradient.addColorStop(0.45, addAlpha(palette[0], 0.34));
    gradient.addColorStop(1, "rgba(255, 245, 251, 0.94)");

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, w, h);

    const sparkleCount = 10 + stage * 2;
    for (let idx = 0; idx < sparkleCount; idx += 1) {
      const x = ((idx * 71 + t * (10 + stage * 1.6)) % (w + 140)) - 70;
      const y = h * (0.14 + (idx % 6) * 0.13);
      const r = 1.5 + (idx % 3);
      ctx.fillStyle = idx % 2 === 0 ? addAlpha(palette[2], 0.13) : "rgba(255, 170, 218, 0.16)";
      ctx.beginPath();
      ctx.arc(x, y, r, 0, TWO_PI);
      ctx.fill();
    }
  }

  #drawShadow(ctx, cx, cy, size) {
    ctx.fillStyle = "rgba(163, 93, 126, 0.22)";
    ctx.beginPath();
    ctx.ellipse(cx, cy + size * 0.95, size * 1.2, size * 0.34, 0, 0, TWO_PI);
    ctx.fill();
  }

  #drawBody(ctx, pet, cx, cy, size, t) {
    const shape = pet.genes?.shape ?? "blob";
    const palette = pet.genes?.palette ?? ["#ffa5cb", "#ffe4f0", "#b47ec7"];

    const fill = ctx.createLinearGradient(cx - size, cy - size, cx + size, cy + size);
    fill.addColorStop(0, palette[1]);
    fill.addColorStop(0.58, palette[0]);
    fill.addColorStop(1, palette[2]);
    ctx.fillStyle = fill;

    if (shape === "orb") {
      const rx = size * (1 + Math.sin(t * 2.2) * 0.06);
      const ry = size * (0.9 + Math.cos(t * 1.7) * 0.05);
      ctx.beginPath();
      ctx.ellipse(cx, cy, rx, ry, 0, 0, TWO_PI);
      ctx.fill();
    } else if (shape === "cube") {
      const side = size * 1.7;
      const wobble = Math.sin(t * 1.6) * 0.06;
      roundedRect(ctx, cx - side / 2, cy - side / 2, side, side, 20 + pet.stage * 2, wobble);
      ctx.fill();
    } else if (shape === "spiky") {
      starShape(ctx, cx, cy, size * 0.92, size * 1.2, 10, t * 0.55);
      ctx.fill();
    } else if (shape === "jelly") {
      jellyShape(ctx, cx, cy, size, t);
      ctx.fill();
    } else {
      blobShape(ctx, cx, cy, size, 10, t * 0.8);
      ctx.fill();
    }

    ctx.strokeStyle = "rgba(255,255,255,0.46)";
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = "rgba(255,255,255,0.32)";
    ctx.beginPath();
    ctx.ellipse(cx - size * 0.24, cy - size * 0.3, size * 0.2, size * 0.12, -0.55, 0, TWO_PI);
    ctx.fill();
  }

  #drawPattern(ctx, pet, cx, cy, size, t) {
    if (pet.stage < 3) {
      return;
    }

    const pattern = pet.genes?.pattern ?? "dot";
    ctx.save();
    ctx.globalAlpha = 0.2 + pet.stage * 0.05;
    ctx.fillStyle = "#fff";
    ctx.strokeStyle = "#fff";

    if (pattern === "stripe") {
      ctx.lineWidth = 2;
      for (let idx = -2; idx <= 2; idx += 1) {
        const y = cy + idx * (size * 0.24);
        ctx.beginPath();
        ctx.moveTo(cx - size * 0.64, y + Math.sin(t + idx) * 3);
        ctx.lineTo(cx + size * 0.64, y - Math.cos(t + idx) * 3);
        ctx.stroke();
      }
    } else if (pattern === "ring") {
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(cx, cy, size * 0.34, 0, TWO_PI);
      ctx.stroke();
      if (pet.stage >= 4) {
        ctx.beginPath();
        ctx.arc(cx, cy, size * 0.58, 0, TWO_PI);
        ctx.stroke();
      }
    } else if (pattern === "patch") {
      ctx.fillRect(cx - size * 0.55, cy - size * 0.2, size * 0.3, size * 0.24);
      ctx.fillRect(cx + size * 0.08, cy + size * 0.07, size * 0.3, size * 0.18);
    } else {
      for (let idx = 0; idx < 6; idx += 1) {
        const x = cx + (idx - 2.5) * size * 0.22;
        const y = cy + Math.sin(t + idx * 0.9) * size * 0.12;
        ctx.beginPath();
        ctx.arc(x, y, 3 + (idx % 2), 0, TWO_PI);
        ctx.fill();
      }
    }

    ctx.restore();
  }

  #drawEyes(ctx, pet, cx, cy, size, t) {
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

      ctx.fillStyle = "#433040";
      const lookX = Math.sin(t * 1.45 + idx * 0.72) * radius * 0.22;
      const lookY = Math.cos(t * 1.2 + idx * 0.43) * radius * 0.22;
      ctx.beginPath();
      ctx.arc(x + lookX, y + lookY, radius * 0.52, 0, TWO_PI);
      ctx.fill();

      ctx.fillStyle = "rgba(255,255,255,0.76)";
      ctx.beginPath();
      ctx.arc(x - radius * 0.15, y - radius * 0.2, radius * 0.22, 0, TWO_PI);
      ctx.fill();
    }
  }

  #drawHorns(ctx, pet, cx, cy, size, t) {
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

    ctx.fillStyle = "rgba(255, 248, 238, 0.95)";
    ctx.strokeStyle = "rgba(132, 80, 109, 0.35)";
    ctx.lineWidth = 2;

    if (style === "spike") {
      triangle(ctx, leftX, topY, size * 0.2, size * 0.34);
      triangle(ctx, rightX, topY, size * 0.2, size * 0.34);
    } else if (style === "leaf") {
      leafShape(ctx, leftX, topY + Math.sin(t * 2.2) * 2, size * 0.23, -0.5);
      leafShape(ctx, rightX, topY + Math.cos(t * 2.1) * 2, size * 0.23, 0.5);
    } else {
      antenna(ctx, leftX, topY + size * 0.2, size * 0.34, t * 2.4);
      antenna(ctx, rightX, topY + size * 0.2, size * 0.34, t * 2.2 + 1);
    }
  }

  #drawTail(ctx, pet, cx, cy, size, t) {
    if (pet.stage < 3) {
      return;
    }

    const tail = pet.genes?.tailStyle ?? "none";
    if (tail === "none") {
      return;
    }

    const anchorX = cx + size * 0.66;
    const anchorY = cy + size * 0.1;

    ctx.strokeStyle = "rgba(255,255,255,0.8)";
    ctx.fillStyle = "rgba(255,255,255,0.8)";
    ctx.lineWidth = 3;

    if (tail === "ribbon") {
      ctx.beginPath();
      ctx.moveTo(anchorX, anchorY);
      ctx.bezierCurveTo(
        anchorX + size * 0.2,
        anchorY - size * 0.2,
        anchorX + size * 0.45,
        anchorY + size * 0.05,
        anchorX + size * 0.56,
        anchorY + Math.sin(t * 3) * size * 0.2,
      );
      ctx.stroke();
    } else if (tail === "coil") {
      ctx.beginPath();
      ctx.arc(anchorX + size * 0.15, anchorY + size * 0.1, size * 0.28, 0.1, TWO_PI * 0.85);
      ctx.stroke();
    } else if (tail === "smoke") {
      ctx.globalAlpha = 0.58;
      for (let idx = 0; idx < 3; idx += 1) {
        ctx.beginPath();
        ctx.arc(
          anchorX + idx * 8 + Math.sin(t * 2 + idx) * 3,
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

  #drawMouth(ctx, pet, cx, cy, size, t) {
    ctx.strokeStyle = "rgba(94, 54, 76, 0.8)";
    ctx.lineWidth = 2.8;

    const mood = pet.stats?.mood ?? 50;
    const smile = (mood - 50) / 90;
    const y = cy + size * 0.34;

    ctx.beginPath();
    ctx.moveTo(cx - size * 0.2, y);
    ctx.quadraticCurveTo(cx, y + size * 0.18 * smile + Math.sin(t * 3.1) * 1.2, cx + size * 0.2, y);
    ctx.stroke();
  }

  #drawFxParticles(ctx, pet, cx, cy, size, t) {
    const effects = Array.isArray(pet.effects) ? pet.effects : [];
    const hasNegative = effects.some((effect) => ["bloated", "grimy", "starving"].includes(effect.id));
    const hasPositive = effects.some((effect) => ["hyper", "resonance"].includes(effect.id));

    if (!hasNegative && !hasPositive && (pet.stats?.mood ?? 0) < 78 && pet.stage < 4) {
      return;
    }

    const count = hasNegative ? 6 : 7;
    for (let idx = 0; idx < count; idx += 1) {
      const angle = t * (hasNegative ? 0.6 : 1) + idx * (TWO_PI / count);
      const ring = size * (1.35 + Math.sin(t + idx) * 0.06);
      const x = cx + Math.cos(angle) * ring;
      const y = cy + Math.sin(angle) * ring * (hasNegative ? 0.8 : 0.6);

      if (hasNegative) {
        ctx.fillStyle = "rgba(181, 124, 153, 0.32)";
        ctx.beginPath();
        ctx.arc(x, y, 3, 0, TWO_PI);
        ctx.fill();
      } else {
        drawStarDot(ctx, x, y, 4 + (idx % 2), "rgba(255, 174, 218, 0.75)");
      }
    }
  }

  #drawAura(ctx, pet, cx, cy, size, t) {
    const color = pet.rarity === "hidden" ? "#ff88b6" : "#ffcf77";
    ctx.save();
    ctx.strokeStyle = addAlpha(color, 0.45);
    ctx.lineWidth = 2;

    ctx.beginPath();
    ctx.arc(cx, cy, size * (1.3 + Math.sin(t * 2) * 0.05), 0, TWO_PI);
    ctx.stroke();

    for (let idx = 0; idx < 8; idx += 1) {
      const angle = t * 0.85 + idx * (TWO_PI / 8);
      const x = cx + Math.cos(angle) * size * 1.5;
      const y = cy + Math.sin(angle) * size * 1.4;
      drawStarDot(ctx, x, y, 3 + (idx % 2), addAlpha(color, 0.78));
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

function drawStarDot(ctx, x, y, size, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, size * 0.5, 0, TWO_PI);
  ctx.fill();

  ctx.strokeStyle = color;
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(x - size, y);
  ctx.lineTo(x + size, y);
  ctx.moveTo(x, y - size);
  ctx.lineTo(x, y + size);
  ctx.stroke();
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

function jellyShape(ctx, cx, cy, radius, t) {
  ctx.beginPath();
  ctx.moveTo(cx - radius, cy + radius * 0.12);
  ctx.quadraticCurveTo(cx - radius * 0.9, cy - radius * 0.88, cx, cy - radius);
  ctx.quadraticCurveTo(cx + radius * 0.9, cy - radius * 0.88, cx + radius, cy + radius * 0.12);

  for (let idx = 0; idx < 4; idx += 1) {
    const part = idx / 3;
    const x = cx + radius - part * radius * 2;
    const y = cy + radius * 0.12 + Math.sin(t * 3.5 + idx) * radius * 0.1;
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
