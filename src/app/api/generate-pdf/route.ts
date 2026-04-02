import { NextRequest, NextResponse } from "next/server";
import { renderToHtml } from "@/lib/pdf/renderer";
import { generatePdf } from "@/lib/pdf/browser";
import { DEFAULT_PDF_OPTIONS } from "@/lib/botc/types";
import type { PdfOptions } from "@/lib/botc/types";
import { createServiceClient } from "@/lib/supabase/service";
import { getRealIp, hashIp } from "@/lib/tracking";

export const maxDuration = 60;

const MAX_PAYLOAD_SIZE = 500 * 1024; // 500KB

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { rawJson, options: userOptions, scriptId } = body;

    if (!rawJson || !Array.isArray(rawJson)) {
      return NextResponse.json({ error: "Invalid script format" }, { status: 400 });
    }

    // Validate payload size
    const payloadSize = JSON.stringify(body).length;
    if (payloadSize > MAX_PAYLOAD_SIZE) {
      return NextResponse.json(
        { error: `Payload too large. Maximum is ${MAX_PAYLOAD_SIZE / 1024}KB` },
        { status: 413 },
      );
    }

    const options: PdfOptions = { ...DEFAULT_PDF_OPTIONS, ...userOptions };

    // Determine URLs
    const protocol = request.headers.get("x-forwarded-proto") || "http";
    const host = request.headers.get("host") || "localhost:3000";
    const appUrl = `${protocol}://${host}`;
    const assetsUrl = process.env.NEXT_PUBLIC_PDF_ASSETS_URL || `${appUrl}/pdf-assets/images`;

    // Render HTML
    const html = await renderToHtml(rawJson, options, appUrl, assetsUrl);

    // Generate PDF
    const pdfBuffer = await generatePdf(html, options);

    const filename = `${body.filename || "script"}.pdf`;

    if (scriptId) {
      void createServiceClient().rpc('track_download', {
        p_script_id: scriptId,
        p_ip_hash: hashIp(getRealIp(request)),
      }).then(undefined, () => {})
    }

    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Length": pdfBuffer.byteLength.toString(),
      },
    });
  } catch (error) {
    console.error("PDF generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate PDF", message: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    );
  }
}
