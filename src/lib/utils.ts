import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type WithoutChild<T> = T extends { child?: any } ? Omit<T, "child"> : T;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type WithoutChildren<T> = T extends { children?: any } ? Omit<T, "children"> : T;
export type WithoutChildrenOrChild<T> = WithoutChildren<WithoutChild<T>>;
export type WithElementRef<T, U extends HTMLElement = HTMLElement> = T & { ref?: U | null };

export interface Point {
    x: number;
    y: number;
}
export type PointWithID = Point & { id: string };

export interface Circle extends Point {
    r: number;
}

export interface CircleData { radius: number; centers: { x: number; y: number }[]; }

export interface DetectionParams {
    minThreshold: number;
    maxThreshold: number;
    step: number;
    radius: number;
    overlapLimit: number; // 0.0 to 1.0
}

/**
 * Converts ImageData to a single-channel grayscale array using Luminance formula
 */
export function getGrayscale(imgData: ImageData): Uint8ClampedArray {
    const gray = new Uint8ClampedArray(imgData.width * imgData.height);
    for (let i = 0; i < imgData.data.length; i += 4) {
        gray[i / 4] = 0.299 * imgData.data[i] + 0.587 * imgData.data[i + 1] + 0.114 * imgData.data[i + 2];
    }
    return gray;
}

/**
 * Performs the "Brightness Threshold Descent" algorithm
 */
export function runThresholdDescent(
    grayscale: Uint8ClampedArray,
    width: number,
    height: number,
    params: DetectionParams
): PointWithID[] {
    const { minThreshold, maxThreshold, step, radius, overlapLimit } = params;
    const detectedBalls: PointWithID[] = [];

    for (let t = maxThreshold; t >= minThreshold; t -= step) {
        // Create binary mask for this specific threshold
        const mask = new Uint8Array(grayscale.length);
        for (let i = 0; i < grayscale.length; i++) {
            mask[i] = grayscale[i] >= t ? 1 : 0;
        }

        // Find centroids of connected components in this mask
        const centroids = findCentroids(mask, width, height, radius);

        for (const p of centroids) {
            const candidate: PointWithID = { x: Math.round(p.x), y: Math.round(p.y), id: crypto.randomUUID() };
            if (!isOverlapping(candidate, detectedBalls, radius, overlapLimit)) {
                detectedBalls.push(candidate);
            }
        }
    }

    return detectedBalls;
}

/**
 * Connected Component Labeling (Flood Fill) to find centers of blobs
 */
function findCentroids(mask: Uint8Array, w: number, h: number, rad: number): Point[] {
    const centroids: Point[] = [];
    const visited = new Uint8Array(mask.length);
    const minArea = Math.PI * (rad * 0.4) * (rad * 0.4);

    for (let i = 0; i < mask.length; i++) {
        if (mask[i] === 1 && !visited[i]) {
            let sumX = 0, sumY = 0, count = 0;
            const q = [i];
            visited[i] = 1;

            while (q.length > 0) {
                const idx = q.shift()!;
                const x = idx % w;
                const y = Math.floor(idx / w);
                sumX += x;
                sumY += y;
                count++;

                const neighbors = [idx - 1, idx + 1, idx - w, idx + w];
                for (const nIdx of neighbors) {
                    if (nIdx >= 0 && nIdx < mask.length && mask[nIdx] === 1 && !visited[nIdx]) {
                        if (Math.abs((nIdx % w) - x) <= 1) {
                            visited[nIdx] = 1;
                            q.push(nIdx);
                        }
                    }
                }
            }

            if (count > minArea) {
                centroids.push({ x: sumX / count, y: sumY / count });
            }
        }
    }
    return centroids;
}

/**
 * Check if a candidate circle overlaps with existing ones based on a ratio
 */
function isOverlapping(c1: PointWithID, list: PointWithID[], radius: number, limit: number): boolean {
    for (const c2 of list) {
        const dx = c1.x - c2.x;
        const dy = c1.y - c2.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const sumR = radius + radius;

        if (dist < sumR) {
            const overlapRatio = Math.max(0, 1 - dist / (sumR));
            if (overlapRatio > limit) return true;
        }
    }
    return false;
}