import type { PointWithID } from "@/utils";

export type Store = {
  image: HTMLImageElement | null;
  circles: PointWithID[];
  threshold: [number, number];
  step: number;
  radius: number;
  overlap: number;
};

export const store: Store = $state({
  image: null,
  circles: [],
  threshold: [120, 240],
  step: 5,
  radius: 20,
  overlap: 0.3,
});
