# Truth Desk Reset Point Manifest

**Created:** 20260608T210114Z  
**Purpose:** Safe reset point before any Truth Engine OS development.  
**Policy:** Existing production code was not edited. Repositories were cloned read-only, then archived locally.

## Source repositories

| Repository | Branch | Commit | Backup forms |
|---|---|---|---|
| Gudmundur76/ttruthdesk-platform | main | e610cfdfa598a7a6523401d5ac946290ef3cf028 | Git bundle + worktree tarball |
| Gudmundur76/manus-persistent-drive | main | 1cf08169f69c6f0aceea1a9e3378d5e1e6ee9ede | Git bundle + worktree tarball + focused memory files tarball |

## Backup artifacts

| Path | Purpose |
|---|---|
| `archives/ttruthdesk-platform_worktree_20260608T210114Z.tar.gz` | Current Truth Desk codebase without `.git` or generated dependency/build folders. |
| `archives/manus-persistent-drive_worktree_20260608T210114Z.tar.gz` | Current persistent project/memory repository without `.git`. |
| `archives/project_memory_files_20260608T210114Z.tar.gz` | Focused archive of project memory/configuration files from persistent drive. |
| `bundles/ttruthdesk-platform_20260608T210114Z.bundle` | Full Git history bundle for exact codebase restoration. |
| `bundles/manus-persistent-drive_20260608T210114Z.bundle` | Full Git history bundle for exact memory repository restoration. |
| `inventory/*.txt` | Remotes, branches, tracked file lists, status, and head commit metadata. |
| `restore/RESTORE_STEPS.md` | Step-by-step restoration guide. |
| `SHA256SUMS.txt` | Integrity hashes for all reset-point artifacts except the checksum file itself. |

## Safety statement

This reset point is designed to keep the current Truth Desk codebase safe while Truth Engine OS is explored. The production repository was not modified. Any future development should begin from a separate branch, feature flag, or read-only adapter layer.
