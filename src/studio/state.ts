"use client";

import { useMemo, useSyncExternalStore } from "react";
import { diffDeep } from "@/lib/diff";
import { getIn, type Path } from "@/lib/path";
import * as store from "@/lib/store";

/** The whole store, reactive: any component using this (directly or via a hook below) re-renders on every save. */
export function useStoreState() {
  return useSyncExternalStore(store.subscribe, store.getState, store.getServerSnapshot);
}

export const useDraft = () => useStoreState().draft;
export const usePublished = () => useStoreState().published;
export const useSession = () => useStoreState().session;
export const useEnquiries = () => useStoreState().enquiries;
export const useBookRequests = () => useStoreState().bookRequests;
export const useQuizResults = () => useStoreState().quizResults;
export const useOutbox = () => useStoreState().outbox;
export const useAdmins = () => useStoreState().admins;
export const useVersions = () => useStoreState().versions;

/** How many leaf values differ between what's live and what's drafted. 0 = nothing to publish. */
export function usePendingChanges(): number {
  const { draft, published } = useStoreState();
  return useMemo(() => diffDeep(published, draft).length, [draft, published]);
}

/** Read/write one field of the draft by its path (`["site","hero","headline"]`). */
export function useField<T>(path: Path): [T, (v: T) => void] {
  const draft = useDraft();
  const value = getIn(draft, path) as T;
  return [value, (v: T) => store.setDraft(path, v)];
}

/** A draggable, addable, removable list at a path in the draft. */
export function useFieldArray<T>(path: Path) {
  const [items, setItems] = useField<T[]>(path);
  return {
    items: items ?? [],
    set: setItems,
    move: (from: number, to: number) => store.moveDraftItem(path, from, to),
    add: (item: T, at?: number) => store.addDraftItem(path, item, at),
    remove: (index: number) => store.removeDraftItem(path, index),
  };
}

export type { Workspace } from "@/content/types";
