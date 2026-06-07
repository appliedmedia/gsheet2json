/**
 * User settings via PropertiesService (UserProperties).
 * No import/export: Apps Script global scope.
 */

namespace gsheet2json {
  export class Settings {
    /** Cap on how many activity feed entries we keep server-side (circular). */
    private static readonly ACTIVITY_FEED_MAX = 100;

    private static readonly DEFAULTS: UserSettings = {
      ignoredDriveFileNames: [],
      ignoredDriveFileIds: [],
      ignoredDriveFolderNames: [],
      ignoredDriveFolderIds: [],
      activityFeed: [],
    };

    /**
     * Migrate older stored shapes forward. We previously stored
     * `ignoredDriveFolderIds` as `string[]`; now it's `IgnoredDriveRef[]`.
     */
    private static normalizeIgnoreList(raw: unknown): IgnoredDriveRef[] {
      if (!Array.isArray(raw)) return [];
      const out: IgnoredDriveRef[] = [];
      for (const v of raw) {
        if (typeof v === "string" && v.length > 0) {
          out.push({ id: v, name: v });
        } else if (v && typeof v === "object" && typeof (v as { id?: unknown }).id === "string") {
          const ref = v as { id: string; name?: string };
          out.push({ id: ref.id, name: typeof ref.name === "string" ? ref.name : ref.id });
        }
      }
      return out;
    }

    public static get(): UserSettings {
      try {
        const props = PropertiesService.getUserProperties();
        const raw = props.getProperty("gsheet2json_settings");
        if (raw) {
          const parsed = JSON.parse(raw) as Partial<UserSettings> & {
            ignoredDriveFolderIds?: unknown;
            ignoredDriveFileIds?: unknown;
            // Legacy field name; kept for migration.
            activityLog?: unknown;
          };
          // Read activityFeed if present, else fall back to legacy activityLog.
          const feedRaw = Array.isArray(parsed.activityFeed)
            ? parsed.activityFeed
            : (Array.isArray(parsed.activityLog) ? parsed.activityLog : []);
          return {
            ignoredDriveFileNames: Array.isArray(parsed.ignoredDriveFileNames) ? parsed.ignoredDriveFileNames : [],
            ignoredDriveFileIds: Settings.normalizeIgnoreList(parsed.ignoredDriveFileIds),
            ignoredDriveFolderNames: Array.isArray(parsed.ignoredDriveFolderNames) ? parsed.ignoredDriveFolderNames : [],
            ignoredDriveFolderIds: Settings.normalizeIgnoreList(parsed.ignoredDriveFolderIds),
            activityFeed: feedRaw as ActivityEntry[],
          };
        }
      } catch (_) {
        // UserProperties may not be accessible in all contexts
      }
      return { ...Settings.DEFAULTS, activityFeed: [] };
    }

    public static write(settings: UserSettings): void {
      try {
        PropertiesService.getUserProperties().setProperty("gsheet2json_settings", JSON.stringify(settings));
      } catch (_) {
        // UserProperties may not be accessible in all contexts
      }
    }

    public static set<K extends keyof UserSettings>(key: K, value: UserSettings[K]): void {
      const settings = Settings.get();
      settings[key] = value;
      Settings.write(settings);
    }

    public static ignoreDriveFileId(ref: IgnoredDriveRef): UserSettings {
      const s = Settings.get();
      if (ref.id && !s.ignoredDriveFileIds.some((r) => r.id === ref.id)) {
        s.ignoredDriveFileIds.push({ id: ref.id, name: ref.name || ref.id });
        Settings.write(s);
      }
      return s;
    }

    public static ignoreDriveFileName(name: string): UserSettings {
      const s = Settings.get();
      if (name && s.ignoredDriveFileNames.indexOf(name) === -1) {
        s.ignoredDriveFileNames.push(name);
        Settings.write(s);
      }
      return s;
    }

    public static ignoreDriveFolderId(ref: IgnoredDriveRef): UserSettings {
      const s = Settings.get();
      if (ref.id && !s.ignoredDriveFolderIds.some((r) => r.id === ref.id)) {
        s.ignoredDriveFolderIds.push({ id: ref.id, name: ref.name || ref.id });
        Settings.write(s);
      }
      return s;
    }

    public static ignoreDriveFolderName(name: string): UserSettings {
      const s = Settings.get();
      if (name && s.ignoredDriveFolderNames.indexOf(name) === -1) {
        s.ignoredDriveFolderNames.push(name);
        Settings.write(s);
      }
      return s;
    }

    /** Remove an entry from any ignore list. Returns updated settings. */
    public static unignoreDriveEntry(
      kind: "fileName" | "fileId" | "folderName" | "folderId",
      value: string
    ): UserSettings {
      const s = Settings.get();
      if (kind === "fileName") {
        s.ignoredDriveFileNames = s.ignoredDriveFileNames.filter((n) => n !== value);
      } else if (kind === "fileId") {
        s.ignoredDriveFileIds = s.ignoredDriveFileIds.filter((r) => r.id !== value);
      } else if (kind === "folderName") {
        s.ignoredDriveFolderNames = s.ignoredDriveFolderNames.filter((n) => n !== value);
      } else if (kind === "folderId") {
        s.ignoredDriveFolderIds = s.ignoredDriveFolderIds.filter((r) => r.id !== value);
      }
      Settings.write(s);
      return s;
    }

    private static newActivityEntryId(): string {
      return `${Date.now().toString(36)}_${Math.floor(Math.random() * 0xffffff).toString(36)}`;
    }

    public static appendActivityEntry(partial: Omit<ActivityEntry, "id" | "at"> & { id?: string; at?: string }): ActivityEntry[] {
      const s = Settings.get();
      const entry: ActivityEntry = {
        id: partial.id || Settings.newActivityEntryId(),
        at: partial.at || new Date().toISOString(),
        ok: !!partial.ok,
        title: partial.title || "",
        subtitle: partial.subtitle,
        openUrl: partial.openUrl,
        fileId: partial.fileId,
        error: partial.error,
      };
      s.activityFeed = [entry, ...s.activityFeed].slice(0, Settings.ACTIVITY_FEED_MAX);
      Settings.write(s);
      return s.activityFeed;
    }

    public static getActivityFeed(): ActivityEntry[] {
      return Settings.get().activityFeed;
    }

    public static clearActivityFeed(): ActivityEntry[] {
      const s = Settings.get();
      s.activityFeed = [];
      Settings.write(s);
      return s.activityFeed;
    }

    public static forgetActivityEntry(id: string): ActivityEntry[] {
      const s = Settings.get();
      s.activityFeed = s.activityFeed.filter((e) => e.id !== id);
      Settings.write(s);
      return s.activityFeed;
    }

    public static getFirstInstallDate(): string | null {
      try {
        return PropertiesService.getUserProperties().getProperty("gsheet2json_firstInstallDate");
      } catch (_) {
        return null;
      }
    }

    public static setFirstInstallDate(): void {
      try {
        const props = PropertiesService.getUserProperties();
        if (!props.getProperty("gsheet2json_firstInstallDate")) {
          props.setProperty("gsheet2json_firstInstallDate", new Date().toISOString());
        }
      } catch (_) {
        // UserProperties may not be accessible in all contexts
      }
    }
  }
}

function getSettings(): UserSettings { return gsheet2json.Settings.get(); }
function writeSettings(settings: UserSettings): void { gsheet2json.Settings.write(settings); }
function setSetting<K extends keyof UserSettings>(key: K, value: UserSettings[K]): void {
  gsheet2json.Settings.set(key, value);
}
function ignoreDriveFileId(ref: IgnoredDriveRef): UserSettings { return gsheet2json.Settings.ignoreDriveFileId(ref); }
function ignoreDriveFileName(name: string): UserSettings { return gsheet2json.Settings.ignoreDriveFileName(name); }
function ignoreDriveFolderId(ref: IgnoredDriveRef): UserSettings { return gsheet2json.Settings.ignoreDriveFolderId(ref); }
function ignoreDriveFolderName(name: string): UserSettings { return gsheet2json.Settings.ignoreDriveFolderName(name); }
function unignoreDriveEntry(
  kind: "fileName" | "fileId" | "folderName" | "folderId",
  value: string
): UserSettings {
  return gsheet2json.Settings.unignoreDriveEntry(kind, value);
}
function appendActivityEntry(partial: Omit<ActivityEntry, "id" | "at"> & { id?: string; at?: string }): ActivityEntry[] {
  return gsheet2json.Settings.appendActivityEntry(partial);
}
function getActivityFeed(): ActivityEntry[] { return gsheet2json.Settings.getActivityFeed(); }
function clearActivityFeed(): ActivityEntry[] { return gsheet2json.Settings.clearActivityFeed(); }
function forgetActivityEntry(id: string): ActivityEntry[] { return gsheet2json.Settings.forgetActivityEntry(id); }
function getFirstInstallDate(): string | null { return gsheet2json.Settings.getFirstInstallDate(); }
function setFirstInstallDate(): void { gsheet2json.Settings.setFirstInstallDate(); }
