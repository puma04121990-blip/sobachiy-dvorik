#!/usr/bin/env python3
"""Build normalized transparent dog sprite sheets from 8x6 chroma atlases."""

from __future__ import annotations

import argparse
import subprocess
import tempfile
from pathlib import Path

import numpy as np
from PIL import Image
from scipy import ndimage


ROWS = (
    ("idle", 8),
    ("walk", 8),
    ("sitdown", 6),
    ("sit", 8),
    ("standup", 6),
    ("reaction", 8),
)
FRAME_SIZE = 192
GROUND_Y = 176
MAX_CONTENT_W = 170
MAX_CONTENT_H = 154


def remove_chroma(cell: Image.Image, background: np.ndarray, keep_largest: bool = True) -> Image.Image:
    rgb = np.asarray(cell.convert("RGB"), dtype=np.float32)
    distance = np.linalg.norm(rgb - background, axis=2)
    alpha = np.clip((distance - 12.0) / 58.0, 0.0, 1.0)

    if keep_largest:
        mask = alpha > 0.12
        labels, count = ndimage.label(mask)
        if count:
            sizes = np.bincount(labels.ravel())
            sizes[0] = 0
            keep = labels == sizes.argmax()
            keep = ndimage.binary_dilation(keep, iterations=2)
            alpha *= keep

    # Recover edge colors from the chroma composite to prevent blue fringes.
    safe_alpha = np.maximum(alpha[..., None], 0.08)
    foreground = (rgb - (1.0 - alpha[..., None]) * background) / safe_alpha
    foreground = np.clip(foreground, 0, 255).astype(np.uint8)
    rgba = np.dstack((foreground, np.rint(alpha * 255).astype(np.uint8)))
    return Image.fromarray(rgba, "RGBA")


def content_box(frame: Image.Image) -> tuple[int, int, int, int]:
    alpha = np.asarray(frame.getchannel("A"))
    ys, xs = np.where(alpha > 48)
    if not len(xs):
        raise ValueError("empty sprite cell")
    return int(xs.min()), int(ys.min()), int(xs.max() + 1), int(ys.max() + 1)


def normalize_frames(frames: list[Image.Image]) -> list[Image.Image]:
    boxes = [content_box(frame) for frame in frames]
    max_w = max(right - left for left, _, right, _ in boxes)
    max_h = max(bottom - top for _, top, _, bottom in boxes)
    scale = min(MAX_CONTENT_W / max_w, MAX_CONTENT_H / max_h)

    normalized = []
    for frame, box in zip(frames, boxes):
        left, top, right, bottom = box
        sprite = frame.crop(box)
        width = max(1, round(sprite.width * scale))
        height = max(1, round(sprite.height * scale))
        sprite = sprite.resize((width, height), Image.Resampling.LANCZOS)
        canvas = Image.new("RGBA", (FRAME_SIZE, FRAME_SIZE))
        x = round((FRAME_SIZE - width) / 2)
        y = GROUND_Y - height
        canvas.alpha_composite(sprite, (x, y))
        normalized.append(canvas)
    return normalized


def save_sheet(frames: list[Image.Image], path: Path) -> None:
    sheet = Image.new("RGBA", (FRAME_SIZE * len(frames), FRAME_SIZE))
    for index, frame in enumerate(frames):
        sheet.alpha_composite(frame, (FRAME_SIZE * index, 0))
    path.parent.mkdir(parents=True, exist_ok=True)
    # ImageMagick's WebP encoder is more reliable than Pillow's for very wide
    # RGBA sprite sheets in the build environment.
    with tempfile.NamedTemporaryFile(suffix=".png") as temp:
        sheet.save(temp.name, "PNG", optimize=True)
        subprocess.run(
            ["convert", temp.name, "-quality", "94", str(path)],
            check=True,
        )
    if not path.exists() or path.stat().st_size == 0:
        raise RuntimeError(f"failed to encode {path}")


def build(atlas_path: Path, dog_id: str, output_dir: Path) -> None:
    atlas = Image.open(atlas_path).convert("RGB")
    if atlas.width % 8 or atlas.height % 6:
        raise ValueError(f"{atlas_path}: atlas must be an exact 8x6 grid")
    cell_w, cell_h = atlas.width // 8, atlas.height // 6

    samples = np.array([
        atlas.getpixel((1, 1)),
        atlas.getpixel((cell_w - 2, 1)),
        atlas.getpixel((1, cell_h - 2)),
    ], dtype=np.float32)
    background = np.median(samples, axis=0)

    transparent_atlas = remove_chroma(atlas, background, keep_largest=False)
    row_frames: list[list[Image.Image]] = []
    for row in range(6):
        band = transparent_atlas.crop((0, row * cell_h, atlas.width, (row + 1) * cell_h))
        alpha = np.asarray(band.getchannel("A"))
        labels, count = ndimage.label(alpha > 32)
        sizes = np.bincount(labels.ravel())
        components = []
        for index in range(1, count + 1):
            if sizes[index] <= 1000:
                continue
            ys, xs = np.where(labels == index)
            components.append((int(xs.min()), int(ys.min()), int(xs.max() + 1), int(ys.max() + 1), index))
        components = sorted(
            components,
            key=lambda item: sizes[item[4]],
            reverse=True,
        )[:7]
        components.sort(key=lambda item: item[0])
        if len(components) < 4 or len(components) > 8:
            raise ValueError(f"{atlas_path}: row {row + 1} has {len(components)} sprites")

        frames = []
        for left, top, right, bottom, index in components:
            padding = 3
            box = (max(0, left - padding), max(0, top - padding), min(band.width, right + padding), min(band.height, bottom + padding))
            rgba = np.asarray(band.crop(box)).copy()
            keep = ndimage.binary_dilation(labels == index, iterations=2)[box[1]:box[3], box[0]:box[2]]
            rgba[..., 3] = np.where(keep, rgba[..., 3], 0)
            frames.append(Image.fromarray(rgba, "RGBA"))
        row_frames.append(frames)

    row_lengths = [len(frames) for frames in row_frames]
    normalized = normalize_frames([frame for frames in row_frames for frame in frames])
    offset = 0
    for row, (state, count) in enumerate(ROWS):
        available = row_lengths[row]
        frames = normalized[offset:offset + available][:count]
        offset += available
        save_sheet(frames, output_dir / f"dog-{dog_id}-{state}-v2.webp")


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--dog", required=True)
    parser.add_argument("--atlas", type=Path, required=True)
    parser.add_argument("--output-dir", type=Path, required=True)
    args = parser.parse_args()
    build(args.atlas, args.dog, args.output_dir)


if __name__ == "__main__":
    main()
