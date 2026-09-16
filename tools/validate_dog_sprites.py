#!/usr/bin/env python3
"""Validate dimensions, transparency, margins, and baselines of dog sheets."""

from pathlib import Path

import numpy as np
from PIL import Image


FRAME = 192
EXPECTED_FILES = 7 * 6


def main() -> None:
    root = Path(__file__).resolve().parents[1] / "assets" / "sprites-v2"
    files = sorted(root.glob("dog-*-v2.webp"))
    if len(files) != EXPECTED_FILES:
        raise SystemExit(f"expected {EXPECTED_FILES} sheets, found {len(files)}")

    for path in files:
        image = Image.open(path).convert("RGBA")
        if image.height != FRAME or image.width % FRAME:
            raise SystemExit(f"{path.name}: invalid sheet size {image.size}")
        for index in range(image.width // FRAME):
            frame = image.crop((index * FRAME, 0, (index + 1) * FRAME, FRAME))
            alpha = np.asarray(frame.getchannel("A"))
            ys, xs = np.where(alpha > 24)
            if not len(xs):
                raise SystemExit(f"{path.name} frame {index}: empty")
            if xs.min() < 6 or xs.max() > FRAME - 7 or ys.min() < 6:
                raise SystemExit(f"{path.name} frame {index}: unsafe edge margin")
            if not 172 <= ys.max() <= 177:
                raise SystemExit(f"{path.name} frame {index}: baseline {ys.max()} is inconsistent")

    print(f"dog sprite validation: ok ({len(files)} sheets)")


if __name__ == "__main__":
    main()
