"""Prepare menu photographs for the Bun Bun site.
Usage:  python tools/prep_photos.py <folder of photos> [output folder]
Each photo (JPG or PNG on a plain white background) becomes a square transparent WebP, ready to drop in assets/bunbun/menu/.
Name the input files after the menu ids (for example cc-ny.jpg) so the output names already match."""
import sys, os
import numpy as np, cv2
from PIL import Image

src = sys.argv[1]; dst = sys.argv[2] if len(sys.argv) > 2 else os.path.join('assets', 'bunbun', 'menu')
os.makedirs(dst, exist_ok=True)
for name in sorted(os.listdir(src)):
    if not name.lower().endswith(('.jpg', '.jpeg', '.png', '.webp')): continue
    img = cv2.cvtColor(np.array(Image.open(os.path.join(src, name)).convert('RGB')), cv2.COLOR_RGB2BGR)
    h, w = img.shape[:2]
    near_white = (img.min(axis=2) > 236).astype(np.uint8)            # candidate background
    ff = near_white.copy(); mask = np.zeros((h + 2, w + 2), np.uint8)
    bg = np.zeros((h, w), np.uint8)
    for seed in [(0, 0), (w - 1, 0), (0, h - 1), (w - 1, h - 1)]:      # only background that touches the border
        if near_white[seed[1], seed[0]]:
            m2 = np.zeros((h + 2, w + 2), np.uint8); cv2.floodFill(ff.copy(), m2, seed, 2, flags=4 | (255 << 8)); bg |= m2[1:-1, 1:-1]
    alpha = (1 - bg).astype(np.float32); alpha = cv2.GaussianBlur(alpha, (0, 0), 1.2)
    rgba = np.dstack([cv2.cvtColor(img, cv2.COLOR_BGR2RGB), (alpha * 255).astype(np.uint8)])
    ys, xs = np.where(alpha > .05)
    if len(ys) == 0: print('skipped (nothing found):', name); continue
    crop = rgba[ys.min():ys.max() + 1, xs.min():xs.max() + 1]; side = int(max(crop.shape[:2]) * 1.12)
    canvas = np.zeros((side, side, 4), np.uint8); y0 = (side - crop.shape[0]) // 2; x0 = (side - crop.shape[1]) // 2; canvas[y0:y0 + crop.shape[0], x0:x0 + crop.shape[1]] = crop
    out = Image.fromarray(canvas, 'RGBA').resize((1200, 1200), Image.LANCZOS)
    out.save(os.path.join(dst, os.path.splitext(name)[0] + '.webp'), quality=88, method=6); print('ok', name)
