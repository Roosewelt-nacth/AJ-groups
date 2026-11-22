# AJ GROUPS reels

Marketing reels and poster for AJ GROUPS, with everything needed to edit and re-render them.

## Finished files (`video/`)

| File | What it is |
| --- | --- |
| `AJ-Groups-Reel-Laptop.mp4` | 20 s, 1080×1920, laptop mockup opening onto ajgroups.co, with soundtrack |
| `AJ-Groups-Reel-iPad.mp4` | 20 s, 1080×1920, iPad on a folio stand showing ajgroups.co, with soundtrack |
| `AJ-Groups-Reel-Ventures.mp4` | 25 s, 1080×1920, all eight ventures, ending on the editorial poster, with soundtrack |
| `AJ-Groups-Signal-Poster.png` | Vertical poster |

Note: the reels were rendered on 20–21 Nov 2026, before Bun Bun was switched to "Coming soon" and before the
hero headline became "Diverse ventures, one vision". Re-render them if they need to match the current site.

## Sources

The folder keeps the same layout the pages expect, so serve **this `reels/` folder as the web root**.

| Page | Reel |
| --- | --- |
| `aj-groups-reel.html` | Laptop reel (uses `site/`, `shots/`, `brand/`) |
| `ipad/aj-groups-ipad-reel.html` | iPad reel (uses `ipad/site/`, `ipad/shots/`, `ipad/brand/`) |
| `ventures/aj-groups-ventures-reel.html` | Ventures reel (photos in `ventures/img/`, from Pexels/Unsplash) |
| `poster/aj-groups-poster.html` | Poster |

`site/` and `ipad/site/` are frozen copies of the website that play inside the device screens. Update them
(copy the repo's `index.html`, `main.js` and `assets/`) if the reel should show the newest site.

Open a reel in the browser to preview it:

```powershell
cd reels
python -m http.server 8744
```

Then visit http://localhost:8744/aj-groups-reel.html (or the iPad, ventures or poster page).

## Re-rendering a video

Needs Node.js, Google Chrome (the tools expect `C:/Program Files/Google/Chrome/Application/chrome.exe`;
edit the path at the top of each `rec/*.cjs` file on another machine) and Python with numpy and scipy.

```powershell
cd reels/rec
npm install
```

With the server above running (it must serve `reels/` as the root so `/rec/enc.html` resolves):

```powershell
node rec.cjs http://localhost:8744/aj-groups-reel.html laptop.mp4 20
node rec.cjs http://localhost:8744/ipad/aj-groups-ipad-reel.html ipad.mp4 20
node rec.cjs http://localhost:8744/ventures/aj-groups-ventures-reel.html ventures.mp4 25
```

`rec.cjs` renders frame by frame on a stepped clock, so the output is exact regardless of machine speed
(a 20 s reel takes a few minutes).

### Soundtrack

`audio/score.py` synthesises the three original soundtracks (no samples or licensed music), timed to each reel:

```powershell
pip install numpy scipy matplotlib imageio-ffmpeg
python audio/score.py
```

It writes `laptop.wav`, `ipad.wav`, `ventures.wav` (plus spectrogram PNGs) next to the script. Mux one onto a
silent render with the ffmpeg that imageio-ffmpeg ships (`python -c "import imageio_ffmpeg;print(imageio_ffmpeg.get_ffmpeg_exe())"`):

```powershell
ffmpeg -i laptop.mp4 -i audio/laptop.wav -map 0:v:0 -map 1:a:0 -c:v copy -c:a aac -b:a 192k -af volume=-3dB -shortest -movflags +faststart AJ-Groups-Reel-Laptop.mp4
```

## Site checking tools (`rec/`)

These test the website itself. Serve the **repo root** on port 8000 (`python -m http.server 8000` from the repo
root), or set `SITE` to another base URL.

| Command | What it does |
| --- | --- |
| `node audit.cjs 390x844,1440x900` | Runs the site's built-in `?audit` layout check at each size |
| `node intro.cjs 390x844 phone` | Captures the landing intro frame by frame (`in-phone-*.png`) |
| `node pin.cjs tag 390x844:5,1440x900:5` | Screenshots chapter 5 at each size (`?s=` pins a chapter) |
| `node links.cjs` | Loads every page and reports script errors, broken images and dead links |
| `node stills.cjs <url> out.jpg 1,4,8` | Contact sheet of a reel page at given times |
| `node frames.cjs <mp4-url> out.jpg 1,4,8` | Contact sheet of frames decoded from an MP4 |
