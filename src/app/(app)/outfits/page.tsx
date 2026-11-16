"use client";

import { LayoutGrid, SwatchBook, WandSparkles } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { OutfitGrid, OutfitGridSkeleton } from "@/components/outfit/outfit-grid";
import { Button } from "@/components/ui/button";
import { EmptyState, ErrorNote, PageHeader, Tabs, TabsList, TabsTrigger } from "@/components/ui/misc";
import { errorMessage } from "@/lib/api/errors";
import type { OutfitSource } from "@/lib/api/types";
import { useMyOutfits } from "@/lib/queries/outfits";

type Tab = "all" | OutfitSource;

const EMPTY: Record<Tab, string> = {
  all: "You haven't made any outfits yet",
  ai_generated: "No AI-styled outfits yet",
  creation_room: "Nothing saved from the Creation Room yet",
  chat: "No outfits from the stylist chat yet",
};

export default function MyOutfitsPage() {
  const [tab, setTab] = useState<Tab>("all");
  const outfits = useMyOutfits(tab === "all" ? undefined : tab);
  const list = outfits.data?.pages.flat() ?? [];

  return (
    <>
      <PageHeader
        title="My outfits"
        description="Everything you've styled, on your doll."
        actions={
          <>
            <Button asChild variant="secondary">
              <Link href="/generate">
                <WandSparkles />
                Style me
              </Link>
            </Button>
            <Button asChild>
              <Link href="/creation-room">
                <SwatchBook />
                Creation Room
              </Link>
            </Button>
          </>
        }
      />

      <Tabs value={tab} onValueChange={(v) => setTab(v as Tab)} className="mb-8">
        <div className="scrollbar-none -mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="ai_generated">AI</TabsTrigger>
            <TabsTrigger value="creation_room">Creation Room</TabsTrigger>
            <TabsTrigger value="chat">Chat</TabsTrigger>
          </TabsList>
        </div>
      </Tabs>

      {outfits.isLoading ? (
        <OutfitGridSkeleton />
      ) : outfits.isError ? (
        <ErrorNote>{errorMessage(outfits.error)}</ErrorNote>
      ) : list.length === 0 ? (
        <EmptyState
          icon={<LayoutGrid />}
          title={EMPTY[tab]}
          description="Let the stylist put something together, or pick pieces yourself in the Creation Room."
          action={
            <Button asChild>
              <Link href={tab === "creation_room" ? "/creation-room" : tab === "chat" ? "/chat" : "/generate"}>
                {tab === "creation_room" ? "Open Creation Room" : tab === "chat" ? "Open chat" : "Style me"}
              </Link>
            </Button>
          }
        />
      ) : (
        <>
          <OutfitGrid outfits={list} variant="mine" />
          {outfits.hasNextPage && (
            <div className="mt-10 flex justify-center">
              <Button variant="secondary" loading={outfits.isFetchingNextPage} onClick={() => outfits.fetchNextPage()}>
                Load more
              </Button>
            </div>
          )}
        </>
      )}
    </>
  );
}
