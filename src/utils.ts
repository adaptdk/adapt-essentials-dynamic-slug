import { EntrySys } from "@contentful/app-sdk";

export const EntryStatus = {
  ARCHIVED: "archived",
  PUBLISHED: "published",
  CHANGED: "changed",
  DRAFT: "draft",
} as const;

export type EntryStatusKeys = keyof typeof EntryStatus;
export type EntryStatusValues = (typeof EntryStatus)[EntryStatusKeys];

export const getEntryStatus = (entrySys: EntrySys): EntryStatusValues => {
  if (entrySys.archivedVersion) {
    return EntryStatus.ARCHIVED;
  } else if (
    !!entrySys.publishedVersion &&
    entrySys.version == entrySys.publishedVersion + 1
  ) {
    return EntryStatus.PUBLISHED;
  } else if (
    !!entrySys.publishedVersion &&
    entrySys.version >= entrySys.publishedVersion + 2
  ) {
    return EntryStatus.CHANGED;
  }
  return EntryStatus.DRAFT;
};
