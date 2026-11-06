import { NextRequest, NextResponse } from "next/server";
import { getAllPositions, savePosition, deletePosition } from "@/lib/db";
import { EventPosition } from "@/types";

export async function GET() {
  try {
    const positions = getAllPositions();
    return NextResponse.json({ success: true, positions });
  } catch (err: any) {
    console.error("Failed to get positions from SQLite:", err);
    return NextResponse.json(
      { success: false, error: err?.message || "Failed to query SQLite DB" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const position = body.position as EventPosition;
    if (!position || !position.id) {
      return NextResponse.json(
        { success: false, error: "Invalid position data" },
        { status: 400 }
      );
    }

    const saved = savePosition(position);
    return NextResponse.json({ success: true, position: saved });
  } catch (err: any) {
    console.error("Failed to save position to SQLite:", err);
    return NextResponse.json(
      { success: false, error: err?.message || "Failed to persist to SQLite DB" },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const position = body.position as EventPosition;
    if (!position || !position.id) {
      return NextResponse.json(
        { success: false, error: "Invalid position data for update" },
        { status: 400 }
      );
    }

    const updated = savePosition(position);
    return NextResponse.json({ success: true, position: updated });
  } catch (err: any) {
    console.error("Failed to update position in SQLite:", err);
    return NextResponse.json(
      { success: false, error: err?.message || "Failed to update SQLite DB" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json(
        { success: false, error: "Missing position id" },
        { status: 400 }
      );
    }

    const deleted = deletePosition(id);
    return NextResponse.json({ success: true, deleted });
  } catch (err: any) {
    console.error("Failed to delete position from SQLite:", err);
    return NextResponse.json(
      { success: false, error: err?.message || "Failed to delete from SQLite DB" },
      { status: 500 }
    );
  }
}

