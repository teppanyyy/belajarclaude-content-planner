import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Serves a single post's image out of the DB as an actual image response
// (not a giant inline base64 string in the page HTML). This lets the
// timeline load fast — the list query never touches imageDataUrl — and
// lets the browser cache/lazy-load each thumbnail independently.
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const id = Number(params.id);
  if (!Number.isFinite(id)) {
    return new NextResponse("Not found", { status: 404 });
  }

  const post = await prisma.post.findUnique({
    where: { id },
    select: { imageDataUrl: true },
  });

  if (!post?.imageDataUrl) {
    return new NextResponse("Not found", { status: 404 });
  }

  const match = post.imageDataUrl.match(/^data:(image\/[a-zA-Z+]+);base64,(.*)$/);
  if (!match) {
    return new NextResponse("Not found", { status: 404 });
  }

  const [, mediaType, base64] = match;
  const buffer = Buffer.from(base64, "base64");

  const headers: Record<string, string> = {
    "Content-Type": mediaType,
    // Images are content-addressed by post id and only change when
    // explicitly replaced, so cache aggressively.
    "Cache-Control": "public, max-age=31536000, immutable",
  };

  if (req.nextUrl.searchParams.get("download") !== null) {
    const ext = mediaType === "image/jpeg" ? "jpg" : mediaType.split("/")[1];
    headers["Content-Disposition"] = `attachment; filename="post-${id}.${ext}"`;
  }

  return new NextResponse(buffer, { headers });
}
