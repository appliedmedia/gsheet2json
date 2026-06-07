/**
 * Progress reporting via CacheService.
 *
 * Apps Script has no streaming callback back to the client mid-call, but
 * clients can poll a side channel while a long-running op is in flight.
 * Long ops (export/import) write `{ pct, msg, at }` to a per-session cache
 * key; the client polls `getProgress(sessionId)` in parallel with the main
 * `google.script.run` invocation and drives the status strip from the result.
 *
 * No import/export: Apps Script global scope.
 */

namespace gsheet2json {
  export class Progress {
    public static readonly CACHE_TTL_SEC = 600; // 10 minutes — long enough for any op

    public static cacheKey(sessionId: string): string {
      return `gs_progress_${sessionId}`;
    }

    /** Write a progress checkpoint. Safe to call frequently; no-op if sessionId is falsy. */
    public static report(sessionId: string | undefined, pct: number, msg: string): void {
      if (!sessionId) return;
      try {
        CacheService.getUserCache().put(
          Progress.cacheKey(sessionId),
          JSON.stringify({ pct: Math.max(0, Math.min(100, Math.round(pct))), msg, at: Date.now() }),
          Progress.CACHE_TTL_SEC
        );
      } catch (_) {
        // Cache not available — progress just won't show; operation proceeds normally.
      }
    }

    /** Read the most recent progress checkpoint for this session, or null. */
    public static get(payload: { sessionId: string }): { pct: number; msg: string; at: number } | null {
      if (!payload || !payload.sessionId) return null;
      try {
        const raw = CacheService.getUserCache().get(Progress.cacheKey(payload.sessionId));
        return raw ? JSON.parse(raw) : null;
      } catch (_) {
        return null;
      }
    }

    /** Clean up once the operation is done (success or failure). */
    public static clear(sessionId: string | undefined): void {
      if (!sessionId) return;
      try {
        CacheService.getUserCache().remove(Progress.cacheKey(sessionId));
      } catch (_) {
        // Ignore
      }
    }
  }
}

function reportProgress(sessionId: string | undefined, pct: number, msg: string): void {
  gsheet2json.Progress.report(sessionId, pct, msg);
}

function getProgress(payload: { sessionId: string }): { pct: number; msg: string; at: number } | null {
  return gsheet2json.Progress.get(payload);
}

function clearProgress(sessionId: string | undefined): void {
  gsheet2json.Progress.clear(sessionId);
}
