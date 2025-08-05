import { useRecord } from "@latticexyz/stash/react";
import { SyncStep } from "@latticexyz/store-sync";
import { SyncProgress, initialProgress } from "@latticexyz/store-sync/internal";
import { useMemo } from "react";
import { stash } from "./stash";

export function useSyncStatus() {
  const progress = useRecord({
    stash,
    table: SyncProgress,
    key: {},
    defaultValue: initialProgress,
  });
  return useMemo(
    () => ({
      ...progress,
      isLive: progress.step === SyncStep.LIVE,
    }),
    [progress],
  );
}
