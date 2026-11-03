"""
Builds public/personas/<slug>.jpg, the screen 3 banner for each persona: the persona's own
place, cut from the screen 2 road (public/personas/road.jpg), with the road on the left where
the character stands.

Usage: python3 scripts/build-persona-banners.py
Needs Pillow. Band rows match ROAD_ROWS in src/components/Views.tsx.
"""
from pathlib import Path
from PIL import Image

root = Path(__file__).resolve().parent.parent
road = Image.open(root / 'public' / 'personas' / 'road.jpg').convert('RGB')
SLUGS = ['msme', 'farmer', 'home', 'student', 'woman']
ROWS = [0, 695, 1295, 1895, 2495, 3210]
HEIGHT = 640  # banner height in image pixels

for i, slug in enumerate(SLUGS):
    mid = (ROWS[i] + ROWS[i + 1]) // 2
    top = max(0, min(road.height - HEIGHT, mid - HEIGHT // 2))
    road.crop((0, top, road.width, top + HEIGHT)).save(root / 'public' / 'personas' / f'{slug}.jpg', quality=82, optimize=True, progressive=True)
    print(slug, top)
