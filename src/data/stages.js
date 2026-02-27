export const MAX_STAGE = 5;

export const STAGES = [
  {
    level: 1,
    name: "胚团",
    description: "刚诞生，形态不稳定。",
    requiredGrowth: 70,
  },
  {
    level: 2,
    name: "幼体",
    description: "开始主动回应照料。",
    requiredGrowth: 100,
  },
  {
    level: 3,
    name: "少成体",
    description: "性格成形，外观差异明显。",
    requiredGrowth: 130,
  },
  {
    level: 4,
    name: "成体",
    description: "具备完整习性与能力。",
    requiredGrowth: 160,
  },
  {
    level: 5,
    name: "奇变体",
    description: "最终阶段，稀有特征觉醒。",
    requiredGrowth: 0,
  },
];

export function getStage(stageLevel) {
  return STAGES.find((stage) => stage.level === stageLevel) ?? STAGES[0];
}
