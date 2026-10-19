"""Build the demo archive for the CoralDAC web app from real Pipeline-V2 survey photos.

Run from anywhere with the thesis venv:
    & $env:THESIS_PY webapp/CoralDAC/scripts/build_demo_assets.py

What is real and what is not:
- REAL: the CoralNet photos (downscaled), station / depth / date / transect / quadrat metadata, station GPS
  (metadata.csv, one point per station), and the detector boxes + confidences of the frozen detector
  (data/stage2-crops/batch1/crops.csv, run 1a74128a7c).
- MOCK: CORAL vs OTHERS filter output and the LC/PB/DC/DCA health classes. No biologist labels exist yet,
  so these are drawn from a seeded random generator and every record carries "mock": true.

Integrity: only quadrat images from the train/val splits are used; any image in the CoralNet test cohort
(../Phase_2/coralnet_test_cohort.csv) or in Detector-Boxing det_test/det_val is excluded (asserted).
"""
from __future__ import annotations

import csv
import json
import random
import statistics
from collections import defaultdict
from pathlib import Path

from PIL import Image

HERE = Path(__file__).resolve().parent
APP = HERE.parent                      # webapp/CoralDAC
V2 = APP.parent.parent                 # Pipeline-V2
THESIS = V2.parent
CORALNET = V2 / "data" / "Coralnet"
CROPS = V2 / "data" / "stage2-crops" / "batch1" / "crops.csv"
SELECTION = V2 / "data" / "Detector-Boxing" / "selection.csv"
COHORT = THESIS / "Phase_2" / "coralnet_test_cohort.csv"

OUT_IMG = APP / "public" / "demo"
OUT_JSON = APP / "lib" / "data" / "demo-archive.json"
FULL_PX, THUMB_PX = 1280, 360
SEED = 20261019

# Mock health mix per station (LC, PB, DC, DCA) so the map shows contrast. Not a finding.
MOCK_MIX = {
    "Coral Garden D": (0.55, 0.20, 0.10, 0.15),
    "Coral Garden S": (0.62, 0.18, 0.08, 0.12),
    "Giant Clam": (0.40, 0.30, 0.12, 0.18),
    "Harka Piloto D": (0.30, 0.22, 0.20, 0.28),
    "Harka Piloto S": (0.35, 0.33, 0.14, 0.18),
    "Sapangan": (0.25, 0.20, 0.25, 0.30),
}
CLASSES = ("LC", "PB", "DC", "DCA")


def read_csv(p: Path) -> list[dict]:
    with p.open(newline="", encoding="utf-8-sig") as f:
        return list(csv.DictReader(f))


def num(s: str) -> float | None:
    try:
        return float(str(s).replace(",", ".").replace("°", "").strip())
    except ValueError:
        return None


def station_coords() -> dict[str, tuple[float, float]]:
    pts = defaultdict(list)
    for r in read_csv(CORALNET / "metadata.csv"):
        lat, lng = num(r["Latitude"]), num(r["Longitude"])
        if lat is None or lng is None or not (-90 <= lat <= 90 and -180 <= lng <= 180) or lat > 30:
            continue  # e.g. Giant Clam rows with the longitude typed into the latitude column
        pts[r["Monitoring Station"].strip()].append((lat, lng))
    return {k: (statistics.median(a for a, _ in v), statistics.median(b for _, b in v)) for k, v in pts.items()}


def main() -> None:
    cohort = {r["basename"].strip().upper() for r in read_csv(COHORT)}
    boxing = {r["basename"].strip().upper() for r in read_csv(SELECTION)}
    pmap = {r["new_relpath"]: r for r in read_csv(CORALNET / "path_map.csv")}
    coords = station_coords()

    boxes = defaultdict(list)
    for r in read_csv(CROPS):
        if r["split"] not in ("train", "val"):
            continue
        boxes[r["image"]].append(r)

    # one image per station x month x transect (+1 pending upload per station), median box count, deterministic
    groups = defaultdict(list)
    for rel, bs in boxes.items():
        name = Path(rel).name.upper()
        if name in cohort or name in boxing:
            continue
        m = pmap[rel]
        groups[(m["station"], m["month"], m["transect"])].append((len(bs), rel))
    chosen, pending = [], {}
    for key in sorted(groups):
        cand = sorted(groups[key])
        pick = cand[len(cand) // 2]
        chosen.append(pick[1])
        rest = [c for c in cand if c[1] != pick[1] and 8 <= c[0] <= 40]
        if key[0] not in pending and rest:
            pending[key[0]] = rest[len(rest) // 2][1]

    rng = random.Random(SEED)
    (OUT_IMG / "full").mkdir(parents=True, exist_ok=True)
    (OUT_IMG / "thumb").mkdir(parents=True, exist_ok=True)
    images, stations = [], {}
    for rel in chosen + sorted(pending.values()):
        name = Path(rel).name
        assert name.upper() not in cohort and name.upper() not in boxing, name
        m = pmap[rel]
        st = m["station"]
        lat, lng = coords[st]
        stations[st] = {"name": st, "site": m["site"], "depth": m["depth"], "depthM": num(m["depth_m"]), "lat": lat, "lng": lng}
        stem = Path(name).stem
        with Image.open(CORALNET / rel) as im:
            im = im.convert("RGB")
            W, H = im.size
            for px, sub, q in ((FULL_PX, "full", 80), (THUMB_PX, "thumb", 72)):
                c = im.copy()
                c.thumbnail((px, px), Image.LANCZOS)
                c.save(OUT_IMG / sub / f"{stem}.webp", "WEBP", quality=q, method=6)
        mix = MOCK_MIX[st]
        dets = []
        for i, b in enumerate(sorted(boxes[rel], key=lambda r: -float(r["conf"]))):
            x1, y1, x2, y2 = (float(b[k]) for k in ("x1", "y1", "x2", "y2"))
            assert 0 <= x1 < x2 <= W + 1 and 0 <= y1 < y2 <= H + 1, (rel, b["crop_id"])
            det_conf = float(b["conf"])
            is_other = rng.random() < (0.22 if det_conf < 0.6 else 0.06)
            d = {
                "id": f"D{i + 1:02d}",
                "box": [round(x1 / W, 5), round(y1 / H, 5), round((x2 - x1) / W, 5), round((y2 - y1) / H, 5)],
                "detConf": round(det_conf, 3),
                "filter": "OTHERS" if is_other else "CORAL",
                "filterConf": round(rng.uniform(0.62, 0.99), 2),
            }
            if not is_other:
                d["health"] = rng.choices(CLASSES, weights=mix)[0]
                d["healthConf"] = round(rng.uniform(0.55, 0.98), 2)
            dets.append(d)
        is_pending = rel in pending.values()
        images.append({
            "id": stem,
            "file": name,
            "relpath": rel,
            "station": st,
            "date": m["date"],
            "month": m["month"],
            "transect": m["transect"],
            "quadrat": int(m["quadrat"]),
            "width": W,
            "height": H,
            "camera": "GoPro 9",
            "status": "pending" if is_pending else "approved",
            "detections": dets,
        })

    out = {
        "source": "Pipeline-V2 data/Coralnet + stage2-crops/batch1/crops.csv (detector run 1a74128a7c)",
        "mock": True,
        "mockNote": "CORAL/OTHERS filter and LC/PB/DC/DCA classes are simulated (seed %d); boxes are real detector output." % SEED,
        "stations": sorted(stations.values(), key=lambda s: s["name"]),
        "images": images,
    }
    OUT_JSON.parent.mkdir(parents=True, exist_ok=True)
    OUT_JSON.write_text(json.dumps(out, indent=1), encoding="utf-8")
    size = sum(p.stat().st_size for p in OUT_IMG.rglob("*.webp")) / 1e6
    print(f"{len(images)} images ({len(pending)} pending), {sum(len(i['detections']) for i in images)} boxes, "
          f"{len(stations)} stations, {size:.1f} MB webp -> {OUT_JSON}")


if __name__ == "__main__":
    main()
