from pathlib import Path
import shutil


ROOT = Path(__file__).resolve().parents[1]
DIST = ROOT / "dist"
INCLUDE = [
    "index.html",
    "sw.js",
    "src",
    "public",
    "README.md",
    "docs",
    "start-zapcrew.bat",
    "scripts",
]


def copy_entry(name):
    source = ROOT / name
    target = DIST / name
    if source.is_dir():
        shutil.copytree(source, target, ignore=shutil.ignore_patterns("__pycache__", "*.pyc"))
    else:
        shutil.copy2(source, target)


def main():
    if DIST.exists():
        shutil.rmtree(DIST)
    DIST.mkdir(parents=True)

    for name in INCLUDE:
        copy_entry(name)

    print(f"Build complete: {DIST}")


if __name__ == "__main__":
    main()
