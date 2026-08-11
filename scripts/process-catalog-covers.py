"""Normalize verified catalogue covers into the storefront's 200:304 ratio.

The source product photos live in a temporary folder and are intentionally not
committed.  For mock-up photographs, ``quad`` isolates and straightens only the
edition's front-cover artwork; no text or artwork is generated.
"""

from pathlib import Path
import os
import tempfile

from PIL import Image, ImageOps


SOURCE_DIR = Path(os.environ.get(
    "KITOBMARKAZI_COVER_SOURCES",
    Path(tempfile.gettempdir()) / "kitobmarkazi-covers",
))
OUTPUT_DIR = Path(__file__).resolve().parents[1] / "images" / "covers"
OUTPUT_SIZE = (800, 1216)

# Pillow QUAD order: upper-left, lower-left, lower-right, upper-right.
COVERS = {
    "jannat": {"crop": (117, 33, 523, 607)},
    "graf-monte-kristo": {"quad": (350, 137, 350, 469, 533, 477, 533, 143)},
    "jinoyat-yangiasr": {"quad": (276, 59, 276, 1061, 845, 1018, 845, 29)},
    "ichindagi-ichindadur": {"crop": (274, 112, 806, 864)},
    "adabiyot-muallimi": {"quad": (84, 113, 84, 559, 386, 518, 386, 103)},
    "shahzoda-va-gado": {"crop": (289, 132, 789, 895)},
    "oy-va-chaqa": {"quad": (131, 42, 87, 604, 465, 630, 478, 10)},
    "gulqaychi": {"quad": (368, 250, 531, 978, 1040, 939, 805, 140)},
    "biz-kutgan-fasl": {"crop": (514, 159, 1030, 949)},
    "isrof": {"crop": (0, 0, 500, 750)},
    "quron-ilmlari": {"crop": (0, 0, 500, 750)},
    "ijtimoiy-odoblar": {"crop": (0, 0, 400, 600)},
    "yulduzli-tunlar": {"crop": (143, 64, 484, 575)},
    "jinoyat-bukhara": {"crop": (415, 123, 1031, 1047)},
    "buxoro-tarixi": {"crop": (200, 56, 807, 986)},
}


def extract_front(image: Image.Image, recipe: dict) -> Image.Image:
    if "quad" in recipe:
        image = image.transform(
            OUTPUT_SIZE,
            Image.Transform.QUAD,
            recipe["quad"],
            resample=Image.Resampling.BICUBIC,
        )
        return image

    cropped = image.crop(recipe["crop"])
    return ImageOps.fit(
        cropped,
        OUTPUT_SIZE,
        method=Image.Resampling.LANCZOS,
        centering=(0.5, 0.5),
    )


def main() -> None:
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    for slug, recipe in COVERS.items():
        source = SOURCE_DIR / f"{slug}.source"
        if not source.exists():
            raise FileNotFoundError(f"Missing cover source: {source}")

        with Image.open(source) as opened:
            frame = opened.seek(0) or opened.convert("RGB")
            cover = extract_front(frame, recipe)
            destination = OUTPUT_DIR / f"{slug}-catalog.webp"
            cover.save(destination, "WEBP", quality=88, method=6)
            print(f"{destination.name}: {cover.width}x{cover.height}")


if __name__ == "__main__":
    main()
