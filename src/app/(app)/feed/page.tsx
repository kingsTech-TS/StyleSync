"use client";

import { Compass, Users } from "lucide-react";
import { useState } from "react";
import { LoadMoreSentinel, OutfitGrid, OutfitGridSkeleton } from "@/components/outfit/outfit-grid";
import { Button } from "@/components/ui/button";
import { Chip, EmptyState, ErrorNote, PageHeader, Tabs, TabsList, TabsTrigger } from "@/components/ui/misc";
import { errorMessage } from "@/lib/api/errors";
import { type FeedTab, useFeed } from "@/lib/queries/feed";
import { useOptions } from "@/lib/queries/shared";

export default function FeedPage() {
  const [tab, setTab] = useState<FeedTab>("for-you");
  const [theme, setTheme] = useState<string | undefined>();
  const { data: options } = useOptions();
  const feed = useFeed({ tab, theme });
  const outfits = feed.data?.pages.flatMap((p) => p.items) ?? [];

  return (
    <>
      <PageHeader
        title="Feed"
        description="Outfits people built from their own wardrobes."
        actions={
          <Tabs value={tab} onValueChange={(v) => setTab(v as FeedTab)}>
            <TabsList>
              <TabsTrigger value="for-you">For you</TabsTrigger>
              <TabsTrigger value="following">Following</TabsTrigger>
            </TabsList>
          </Tabs>
        }
      />

      {tab === "for-you" && (
        <div className="scrollbar-none -mx-4 mb-8 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:px-0" role="group" aria-label="Filter by theme">
          <Chip selected={!theme} onClick={() => setTheme(undefined)}>
            All
          </Chip>
          {options?.themes.map((t) => (
            <Chip key={t.slug} selected={theme === t.slug} onClick={() => setTheme(theme === t.slug ? undefined : t.slug)}>
              {t.name}
            </Chip>
          ))}
        </div>
      )}

      {feed.isLoading ? (
        <OutfitGridSkeleton />
      ) : feed.isError ? (
        <ErrorNote>{errorMessage(feed.error)}</ErrorNote>
      ) : outfits.length === 0 ? (
        tab === "following" ? (
          <EmptyState
            icon={<Users />}
            title="Nothing from people you follow yet"
            description="Follow people whose style you like and their published outfits show up here."
            action={
              <Button variant="secondary" onClick={() => setTab("for-you")}>
                Browse For you
              </Button>
            }
          />
        ) : (
          <EmptyState
            icon={<Compass />}
            title={theme ? "No outfits with this theme yet" : "No published outfits yet"}
            description="Publish one of your outfits and it will be the first thing people see."
            action={
              theme ? (
                <Button variant="secondary" onClick={() => setTheme(undefined)}>
                  Show all themes
                </Button>
              ) : undefined
            }
          />
        )
      ) : (
        <>
          <OutfitGrid outfits={outfits} />
          <LoadMoreSentinel
            hasMore={!!feed.hasNextPage}
            loading={feed.isFetchingNextPage}
            onLoad={() => !feed.isFetchingNextPage && feed.fetchNextPage()}
          />
        </>
      )}
    </>
  );
}
