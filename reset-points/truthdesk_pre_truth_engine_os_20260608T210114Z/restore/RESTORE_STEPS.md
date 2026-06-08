# Restore Steps for Truth Desk Reset Point

This reset point was created before Truth Engine OS development. It contains both full Git bundles and worktree archives.

## 1. Verify backup integrity

From this reset-point directory, run:

```bash
sha256sum -c SHA256SUMS.txt
```

## 2. Restore the Truth Desk codebase from Git bundle

```bash
mkdir -p /tmp/truthdesk-restore
cd /tmp/truthdesk-restore
git clone /path/to/bundles/ttruthdesk-platform_20260608T210114Z.bundle ttruthdesk-platform
cd ttruthdesk-platform
git checkout main
git rev-parse HEAD
```

The expected Truth Desk commit is:

```text
e610cfdfa598a7a6523401d5ac946290ef3cf028
```

## 3. Restore the persistent memory repository from Git bundle

```bash
mkdir -p /tmp/memory-restore
cd /tmp/memory-restore
git clone /path/to/bundles/manus-persistent-drive_20260608T210114Z.bundle manus-persistent-drive
cd manus-persistent-drive
git checkout main
git rev-parse HEAD
```

The expected memory repository commit is:

```text
1cf08169f69c6f0aceea1a9e3378d5e1e6ee9ede
```

## 4. File-level restore option

If only a file-level restore is needed, unpack the relevant archive into a temporary directory first:

```bash
mkdir -p /tmp/restore-files /tmp/restore-memory
tar -xzf archives/ttruthdesk-platform_worktree_20260608T210114Z.tar.gz -C /tmp/restore-files
tar -xzf archives/project_memory_files_20260608T210114Z.tar.gz -C /tmp/restore-memory
```

## 5. Production safety rule

Do not overwrite the live production project directly from these files. Restore into a temporary directory first, compare diffs, run tests, and only then replace or cherry-pick changes deliberately.
