# Builds public/personas/road.jpg, the screen 2 background.
# Usage: python3 scripts/build-persona-road.py <folder with 1-msme.png ... 5-woman.png>
# (writes persona-road.jpg and persona-road.json into that folder; copy the .jpg to public/personas/road.jpg
# and the band rows into ROAD_ROWS in src/components/Views.tsx)
#
# Stacks the five persona panels top to bottom into one tall background.
# Each panel keeps its middle band (the scene); neighbours overlap inside their plain
# road-and-paddy strips. The lower panel is shifted sideways so the road lines up, then the
# join follows the left-to-right path where the two images differ least, with a soft edge.
import json
import sys
import numpy as np
from PIL import Image, ImageFilter

d = sys.argv[1]
names = ['1-msme', '2-farmer', '3-home', '4-student', '5-woman']
KEEP = [(120, 880), (150, 880), (150, 880), (150, 880), (150, 930)]  # rows kept from each panel
OVERLAP = 130
P = [np.asarray(Image.open(f'{d}/{n}.png').convert('RGB')).astype(np.float32) for n in names]


def road_x(im, y):
    row = im[int(y)]
    r, g, b = row[:, 0], row[:, 1], row[:, 2]
    m = (r > 190) & (g > 110) & (g < 200) & (b < 150) & (r - g > 40)
    xs = np.nonzero(m[:800])[0]
    return float(np.median(xs))


def shift(im, dx):
    dx = int(round(dx))
    if dx == 0:
        return im
    out = np.empty_like(im)
    if dx > 0:
        out[:, dx:] = im[:, :-dx]
        out[:, :dx] = im[:, :1]
    else:
        out[:, :dx] = im[:, -dx:]
        out[:, dx:] = im[:, -1:]
    return out


def seam_rows(a, b):
    """Row index (one per column) of the cheapest left-to-right cut through the overlap a over b."""
    cost = np.abs(a - b).sum(axis=2).T  # columns become rows
    cost = np.asarray(Image.fromarray(np.clip(cost / 3, 0, 255).astype(np.uint8)).filter(ImageFilter.BoxBlur(3)), dtype=np.float32)
    h, w = cost.shape
    edge = np.minimum(np.arange(w), np.arange(w)[::-1])
    cost += np.where(edge < 16, 1e4, 0)
    acc = cost.copy()
    for y in range(1, h):
        prev = acc[y - 1]
        acc[y] += np.minimum(np.minimum(np.r_[np.inf, prev[:-1]], prev), np.r_[prev[1:], np.inf])
    path = np.zeros(h, dtype=int)
    path[-1] = int(np.argmin(acc[-1]))
    for y in range(h - 2, -1, -1):
        x = path[y + 1]
        lo, hi = max(0, x - 1), min(w, x + 2)
        path[y] = lo + int(np.argmin(acc[y, lo:hi]))
    return path


TARGET = 405.0  # every panel's road is straightened onto this column
TRIM = 40       # sideways shifts fill the edges; trim them off afterwards


def straighten(im):
    """Shift each row a little so the road runs straight down at TARGET (a gentle shear)."""
    ys, xs = [], []
    for y in range(0, im.shape[0], 8):
        try:
            x = road_x(im, y)
        except ValueError:
            continue
        if not np.isnan(x):
            ys.append(y)
            xs.append(x)
    k, c = np.polyfit(ys, xs, 1)  # the road drifts roughly linearly down each panel
    out = np.empty_like(im)
    for y in range(im.shape[0]):
        out[y] = shift(im[y:y + 1], TARGET - (k * y + c))[0]
    return out


out = None
bands = []  # where each panel's scene sits in the final image, for laying out the rows
for i, (im, (y0, y1)) in enumerate(zip(P, KEEP)):
    im = straighten(im)
    crop = im[y0:y1]
    if out is None:
        out = crop
        bands.append([0, crop.shape[0]])
        continue
    a, b = out[-OVERLAP:], crop[:OVERLAP]
    path = seam_rows(a, b)
    mask = (np.arange(OVERLAP)[:, None] >= path[None, :]).astype(np.float32) * 255
    mask = np.asarray(Image.fromarray(mask.astype(np.uint8)).filter(ImageFilter.GaussianBlur(8)), dtype=np.float32) / 255
    mid = a * (1 - mask[..., None]) + b * mask[..., None]
    start = out.shape[0] - OVERLAP
    out = np.concatenate([out[:-OVERLAP], mid, crop[OVERLAP:]], axis=0)
    bands.append([start, out.shape[0]])

img = Image.fromarray(np.clip(out[:, TRIM:-TRIM], 0, 255).astype(np.uint8))
img.save(f'{d}/persona-road.jpg', quality=86, optimize=True, progressive=True)
img.resize((img.width // 4, img.height // 4)).save(f'{d}/persona-road-preview.jpg', quality=80)
json.dump({'size': img.size, 'bands': bands}, open(f'{d}/persona-road.json', 'w'))
print(img.size, bands)
