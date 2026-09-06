from pathlib import Path
from PIL import Image

ASSETS = Path(__file__).resolve().parents[1] / 'assets'
for source in sorted(ASSETS.glob('*.png')):
    target = source.with_suffix('.webp')
    with Image.open(source) as image:
        image.save(target, 'WEBP', quality=82, method=6)
    print(f'{source.name} -> {target.name}: {source.stat().st_size} -> {target.stat().st_size}')
