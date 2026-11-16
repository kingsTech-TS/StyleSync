"use client";

import { Bookmark } from "lucide-react";
import Link from "next/link";
import { OutfitGrid, OutfitGridSkeleton } from "@/components/outfit/outfit-grid";
import { Button } from "@/components/ui/button";
import { EmptyState, ErrorNote, PageHeader } from "@/components/ui/misc";
import { errorMessage } from "@/lib/api/errors";
import { useSaved } from "@/lib/queries/feed";
import { plural } from "@/lib/utils";

export default function SavedPage() {
  const saved = useSaved();
  // Unsaving keeps the tile until the list refetches, so it can be undone with one more tap.
  const outfits = saved.data ?? [];

  return (
    <>
      <PageHeader
        title="Saved"
        description={saved.data ? plural(saved.data.filter((o) => o.saved_by_me).length, "outfit") : "Outfits you kept for later."}
      />
      {saved.isLoading ? (
        <OutfitGridSkeleton />
      ) : saved.isError ? (
        <ErrorNote>{errorMessage(saved.error)}</ErrorNote>
      ) : outfits.length === 0 ? (
        <EmptyState
          icon={<Bookmark />}
          title="Nothing saved yet"
          description="Tap the bookmark on any outfit in the feed to keep it here."
          action={
            <Button asChild variant="secondary">
              <Link href="/feed">Go to the feed</Link>
            </Button>
          }
        />
      ) : (
        <OutfitGrid outfits={outfits} />
      )}
    </>
  );
}
