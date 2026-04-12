import { NextResponse } from "next/server";
import { readdir, readFile } from "fs/promises";
import path from "path";

const BACKGROUNDS_DIR = path.join(process.cwd(), "public/pdf-assets/images/backgrounds");
const IMAGE_EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".webp"]);

export async function GET() {
  const files = await readdir(BACKGROUNDS_DIR);
  const imageFiles = files.filter((f) =>
    IMAGE_EXTENSIONS.has(path.extname(f).toLowerCase())
  );

  const backgrounds = await Promise.all(
    imageFiles.map(async (filename) => {
      let attribution: string | undefined;
      try {
        const raw = await readFile(path.join(BACKGROUNDS_DIR, `${filename}.json`), "utf-8");
        const data = JSON.parse(raw);
        if (typeof data.attribution === "string") {
          attribution = data.attribution;
        }
      } catch {
        // No sidecar file — that's fine
      }
      return {
        value: `backgrounds/${filename}`,
        label: path.basename(filename, path.extname(filename))
          .replace(/[-_]/g, " ")
          .replace(/\b\w/g, (c) => c.toUpperCase()),
        ...(attribution ? { attribution } : {}),
      };
    })
  );

  return NextResponse.json({ data: backgrounds });
}
