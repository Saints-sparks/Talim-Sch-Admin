import { PageSkeleton } from "@/components/tl/states";

/**
 * Route-level loading state: grey blocks in the shape of a page (heading,
 * four tiles, a card) so navigation never shows a blank frame; pages render
 * their own skeletons on top.
 *
 * @returns The skeleton.
 */
export default function Loading() {
  return <PageSkeleton label="Loading" tiles={4} blocks={[288]} />;
}
