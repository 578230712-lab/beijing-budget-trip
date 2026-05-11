"""
Compress images in ../images larger than 1MB to <= 500KB, same dimensions, overwrite in place.
"""
from __future__ import annotations

import io
import sys
from pathlib import Path

from PIL import Image, ImageOps

IMAGES_DIR = Path(__file__).resolve().parent.parent / "images"
MIN_BYTES = 1024 * 1024  # 1 MB
TARGET_MAX = 500 * 1024  # 500 KB
JPEG_EXT = {".jpg", ".jpeg"}


def load_rgb(path: Path) -> Image.Image:
    img = Image.open(path)
    img = ImageOps.exif_transpose(img)
    if img.mode in ("RGBA", "LA"):
        bg = Image.new("RGB", img.size, (255, 255, 255))
        bg.paste(img, mask=img.split()[-1])
        img = bg
    elif img.mode == "P":
        img = img.convert("RGBA")
        bg = Image.new("RGB", img.size, (255, 255, 255))
        bg.paste(img, mask=img.split()[-1])
        img = bg
    elif img.mode != "RGB":
        img = img.convert("RGB")
    return img


def jpeg_encode(img: Image.Image, quality: int, subsampling: int | None = None) -> bytes:
    buf = io.BytesIO()
    kw: dict = {
        "format": "JPEG",
        "quality": quality,
        "optimize": True,
        "progressive": True,
    }
    if subsampling is not None:
        kw["subsampling"] = subsampling
    img.save(buf, **kw)
    return buf.getvalue()


def best_jpeg_under_budget(img: Image.Image, target: int) -> bytes:
    """Maximize JPEG quality subject to size <= target (same pixel dimensions)."""
    subsampling_order: list[int | None] = [None, 2, 1, 0]
    best: bytes | None = None

    for sub in subsampling_order:
        lo, hi = 1, 95
        candidate: bytes | None = None
        while lo <= hi:
            mid = (lo + hi) // 2
            data = jpeg_encode(img, mid, subsampling=sub)
            if len(data) <= target:
                candidate = data
                lo = mid + 1
            else:
                hi = mid - 1
        if candidate is not None and (best is None or len(candidate) > len(best)):
            best = candidate

    if best is not None:
        return best

    return jpeg_encode(img, 1, subsampling=2)


def compress_file(path: Path) -> tuple[int, int, bool]:
    old = path.stat().st_size
    img = load_rgb(path)
    data = best_jpeg_under_budget(img, TARGET_MAX)
    path.write_bytes(data)
    new = path.stat().st_size
    ok = new <= TARGET_MAX
    return old, new, ok


def main() -> int:
    if not IMAGES_DIR.is_dir():
        print(f"Missing folder: {IMAGES_DIR}", file=sys.stderr)
        return 1

    targets = sorted(
        p
        for p in IMAGES_DIR.iterdir()
        if p.is_file()
        and p.suffix.lower() in JPEG_EXT
        and p.stat().st_size > MIN_BYTES
    )

    if not targets:
        print("No JPEG files over 1MB found.")
        return 0

    for path in targets:
        old, new, ok = compress_file(path)
        status = "OK" if ok else "WARN (still > 500KB)"
        print(f"{path.name}: {old / 1024 / 1024:.2f} MB -> {new / 1024:.1f} KB [{status}]")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
