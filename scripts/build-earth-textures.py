"""
Builds the screen 1 globe images in public/earth/ from NASA Blue Marble (public domain,
https://visibleearth.nasa.gov/collection/1484/blue-marble).

Download into one folder first:
  world.topo.bathy.200412.3x5400x2700.jpg      (whole Earth)
  world.topo.bathy.200412.3x21600x21600.C1.jpg (tile C1: lon 0..90 E, lat 90..0 N)
  cloud_combined_2048.jpg                      (clouds)
from https://eoimages.gsfc.nasa.gov/images/imagerecords/73000/73909/ and .../57000/57747/

Usage: python3 scripts/build-earth-textures.py <download folder>
Needs Pillow.
"""
import sys
from pathlib import Path
from PIL import Image

Image.MAX_IMAGE_PIXELS = None
src = Path(sys.argv[1])
out = Path(__file__).resolve().parent.parent / 'public' / 'earth'
out.mkdir(parents=True, exist_ok=True)

# South India detail: lon 68..90 E, lat 24..4 N at 90 px per degree. Keep in step with SOUTH_BOX in EarthIntro.tsx.
LON0, LON1, LAT0, LAT1 = 68, 90, 24, 4
tile = Image.open(src / 'world.topo.bathy.200412.3x21600x21600.C1.jpg')
tile.draft('RGB', (10800, 10800))  # decode at half size to save memory
ppd = tile.size[0] / 90
box = (int(LON0 * ppd), int((90 - LAT0) * ppd), int(LON1 * ppd), int((90 - LAT1) * ppd))
south = tile.crop(box).resize(((LON1 - LON0) * 90, (LAT0 - LAT1) * 90), Image.LANCZOS)
south.save(out / 'south.jpg', quality=86, optimize=True, progressive=True)

earth = Image.open(src / 'world.topo.bathy.200412.3x5400x2700.jpg').convert('RGB').resize((4096, 2048), Image.LANCZOS)
earth.save(out / 'earth.jpg', quality=84, optimize=True, progressive=True)

clouds = Image.open(src / 'cloud_combined_2048.jpg').convert('L')
clouds.save(out / 'clouds.jpg', quality=82, optimize=True)
print('wrote', out)
