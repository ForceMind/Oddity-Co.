export const MATERIALS = [
  { id: "balloon", name: "气球", tag: "弹性", base: 8 },
  { id: "tape", name: "胶带", tag: "修补", base: 8 },
  { id: "dust", name: "灰尘", tag: "旧物", base: 8 },
  { id: "sun", name: "阳光", tag: "能量", base: 8 },
  { id: "humidity", name: "湿气", tag: "环境", base: 8 },
  { id: "static", name: "静电", tag: "噼啪", base: 8 },
];

export function createInitialStock() {
  return Object.fromEntries(MATERIALS.map((material) => [material.id, material.base]));
}

export function materialName(materialId) {
  const target = MATERIALS.find((material) => material.id === materialId);
  return target ? target.name : materialId;
}
