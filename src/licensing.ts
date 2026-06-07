/**
 * Licensing & monetization (Swimlane 3).
 * Integrates with Marketplace Licensing API with trial fallback.
 * No import/export: Apps Script global scope.
 */

type LicenseStatus = "trial" | "paid" | "expired";

interface LicenseState {
  status: LicenseStatus;
  daysLeft?: number;
  plan?: "monthly" | "annual" | "lifetime";
}

/** Serialized form stored in UserProperties cache. */
interface LicenseCacheEntry {
  state: LicenseState;
  /** Epoch ms when the cache entry was written. */
  cachedAt: number;
}

namespace gsheet2json {
  export class Licensing {
    private static readonly CACHE_KEY = "gsheet2json_licenseCache";
    private static readonly FIRST_RUN_KEY = "gsheet2json_firstRunCompleted";
    private static readonly TRIAL_DURATION_DAYS = 7;
    private static readonly CACHE_TTL_MS = 300000; // 5 minutes — short enough that a paid upgrade or admin license change takes effect within one coffee break; cache can also be busted explicitly via clearLicenseCache().

    // Vanity that 301s to the right place: gsheet2json.com pre-approval, the
    // live Marketplace listing post-approval. Keeps this code stable across
    // the launch transition; only the DNS redirect target changes.
    private static readonly MARKETPLACE_LISTING_URL = "https://g2j.in";

    /**
     * Main licensing function.
     *
     * Resolution order:
     *   1. UserProperties cache (5-minute TTL)
     *   2. Marketplace Licensing API (LicenseManager)
     *   3. Trial / expired fallback based on install date
     */
    public static getLicenseState(): LicenseState {
      // --- 1. Check cache ---
      try {
        const props = PropertiesService.getUserProperties();
        const raw = props.getProperty(Licensing.CACHE_KEY);
        if (raw) {
          const cached: LicenseCacheEntry = JSON.parse(raw);
          if (Date.now() - cached.cachedAt < Licensing.CACHE_TTL_MS) {
            return cached.state;
          }
        }
      } catch (_) {
        // UserProperties unavailable — continue to live checks.
      }

      // --- 2. Marketplace Licensing API ---
      try {
        // LicenseManager is a global provided by the Marketplace runtime.
        // It may not exist during local development or in certain contexts.
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const global = Function("return this")() as any;
        const licenseManager = global.LicenseManager;
        if (licenseManager && typeof licenseManager.getLicenseStatus === "function") {
          const info = licenseManager.getLicenseStatus();
          if (info && info.isActive) {
            const plan = Licensing.parsePlan(info.planId);
            const state: LicenseState = { status: "paid", plan: plan };
            Licensing.cacheLicenseState(state);
            return state;
          }
        }
      } catch (_) {
        // Licensing API unavailable — fall through to trial logic.
      }

      // --- 3. Trial / expired fallback ---
      const state = Licensing.computeTrialState();
      Licensing.cacheLicenseState(state);
      return state;
    }

    /**
     * Compute trial or expired state from the first-install date stored in
     * UserProperties (written by setFirstInstallDate() in settings.ts).
     */
    private static computeTrialState(): LicenseState {
      const installDateStr = getFirstInstallDate();

      if (!installDateStr) {
        // No install date recorded yet — treat as first moment of trial.
        return { status: "trial", daysLeft: Licensing.TRIAL_DURATION_DAYS };
      }

      const installDate = new Date(installDateStr).getTime();
      const now = Date.now();
      const elapsedMs = now - installDate;
      const elapsedDays = elapsedMs / (1000 * 60 * 60 * 24);

      if (elapsedDays < Licensing.TRIAL_DURATION_DAYS) {
        const daysLeft = Math.ceil(Licensing.TRIAL_DURATION_DAYS - elapsedDays);
        return { status: "trial", daysLeft: daysLeft };
      }

      return { status: "expired" };
    }

    /**
     * Map a Marketplace plan identifier to our internal plan type.
     * Falls back to "monthly" for unrecognised identifiers.
     */
    private static parsePlan(planId: string | undefined): "monthly" | "annual" | "lifetime" {
      if (!planId) return "monthly";
      const lower = planId.toLowerCase();
      if (lower.indexOf("lifetime") !== -1 || lower.indexOf("onetime") !== -1) return "lifetime";
      if (lower.indexOf("annual") !== -1 || lower.indexOf("yearly") !== -1) return "annual";
      return "monthly";
    }

    /** Persist a LicenseState to the UserProperties cache. */
    private static cacheLicenseState(state: LicenseState): void {
      try {
        const entry: LicenseCacheEntry = { state: state, cachedAt: Date.now() };
        PropertiesService.getUserProperties().setProperty(
          Licensing.CACHE_KEY,
          JSON.stringify(entry),
        );
      } catch (_) {
        // Cache write failure is non-critical.
      }
    }

    /** Remove the cached license entry (useful for testing / debugging). */
    public static clearLicenseCache(): void {
      try {
        PropertiesService.getUserProperties().deleteProperty(Licensing.CACHE_KEY);
      } catch (_) {
        // UserProperties may not be accessible in all contexts.
      }
    }

    /** Return the Marketplace listing URL for upgrade prompts. */
    public static getUpgradeUrl(): string {
      return Licensing.MARKETPLACE_LISTING_URL;
    }

    /**
     * Feature gate: returns true when the user has an active trial or paid
     * license, false when expired.
     */
    public static isFeatureEnabled(): boolean {
      const state = Licensing.getLicenseState();
      return state.status === "trial" || state.status === "paid";
    }

    /**
     * Returns true if the user has never completed onboarding (no
     * `gsheet2json_firstRunCompleted` flag in UserProperties).
     */
    public static isFirstRun(): boolean {
      try {
        const value = PropertiesService.getUserProperties().getProperty(Licensing.FIRST_RUN_KEY);
        return value === null;
      } catch (_) {
        // If properties are unavailable, treat as first run so the user
        // still gets the onboarding experience.
        return true;
      }
    }

    /** Mark onboarding as completed so isFirstRun() returns false. */
    public static dismissOnboarding(): void {
      try {
        PropertiesService.getUserProperties().setProperty(Licensing.FIRST_RUN_KEY, "true");
      } catch (_) {
        // UserProperties may not be accessible in all contexts.
      }
    }
  }
}

function getLicenseState(): LicenseState { return gsheet2json.Licensing.getLicenseState(); }
function clearLicenseCache(): void { gsheet2json.Licensing.clearLicenseCache(); }
function getUpgradeUrl(): string { return gsheet2json.Licensing.getUpgradeUrl(); }
function isFeatureEnabled(): boolean { return gsheet2json.Licensing.isFeatureEnabled(); }
function isFirstRun(): boolean { return gsheet2json.Licensing.isFirstRun(); }
function dismissOnboarding(): void { gsheet2json.Licensing.dismissOnboarding(); }
