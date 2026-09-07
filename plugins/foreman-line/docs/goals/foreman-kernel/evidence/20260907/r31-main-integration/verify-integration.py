#!/usr/bin/env python3
"""Prepare-reviewed runner; execute ONLY after accepted R31 + two final reviews.

Python standard library. No install, ref update, real-index write, or cleanup.
--source-tree is the real source commit's tree, not a synthetic merge commit.
--source-manifest is the committed R31 integration JSON (18 sources).
--review is independently reviewed JSON:
  {"main": SHA, "r31": SHA, "source_commit": SHA,
   "protected_paths": [current decision/contract and extra runtime input paths],
   "exclusions": [{"path": P, "before": [MODE, BLOB] or null,
                   "after": [MODE, BLOB] or null, "reason": TEXT}],
   "dependencies": [{"destination": "plugins/foreman-line/authority-registry/node_modules",
                     "source": ABS, "tree_sha256": SHA256}],
   "node_sha256": SHA256}
Dependency tree hash: SHA256 of UTF-8 json.dumps(sorted relative-file -> SHA256
dictionary, sort_keys=True, separators=(',', ':')). Reparse points forbidden.
Exclusions are reviewer decisions, NOT automatically inferred irrelevance.
Unreviewed deltas emit needs-closure-review, not runtime-incompatible.
Raw blob extraction bypasses all checkout filters; the alternate index retains
Git modes. Windows physical executable bits are not independently certified.
All command output, direct exits and times persist. Retain all failure artifacts.
"""
import argparse
import hashlib
import json
import os
from pathlib import Path, PurePosixPath
import re
import shutil
import stat
import subprocess
import tempfile
import time
from datetime import datetime, timezone

PKG = 'plugins/foreman-line/authority-registry'
NODE = Path('D:/nodejs_symlinks/node.exe')
SHA = re.compile(r'^[0-9a-f]{40}$')


def digest(data):
    return hashlib.sha256(data).hexdigest()


def file_hash(path):
    h = hashlib.sha256()
    with open(path, 'rb') as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b''):
            h.update(chunk)
    return h.hexdigest()


def utc():
    return datetime.now(timezone.utc).isoformat()


def write_json(path, value):
    with open(path, 'w', encoding='utf-8', newline='\n') as stream:
        json.dump(value, stream, indent=2, sort_keys=True)
        stream.write('\n')
        stream.flush()
        os.fsync(stream.fileno())


def safe_path(value):
    p = PurePosixPath(value)
    if (not value or p.is_absolute() or '\\' in value or
            any(x in ('', '.', '..', '.git') or x.endswith((' ', '.')) or
                re.search(r'[<>:"|?*\x00-\x1f]', x) or
                re.match(r'(?i)^(CON|PRN|AUX|NUL|COM[1-9]|LPT[1-9])(?:\.|$)', x)
                for x in value.split('/'))):
        raise ValueError(f'Unsafe materialization path: {value!r}')
    return value


def no_reparse(path):
    s = path.lstat()
    if stat.S_ISLNK(s.st_mode) or getattr(s, 'st_file_attributes', 0) & 0x400:
        raise ValueError(f'Reparse point forbidden: {path}')
    return s


def no_reparse_ancestry(path):
    """Inspect lexical ancestors before resolve() could hide a junction."""
    absolute = path.absolute()
    for component in reversed((absolute, *absolute.parents)):
        no_reparse(component)


def files_snapshot(root):
    no_reparse(root)
    result = {}
    for parent, dirs, files in os.walk(root, followlinks=False):
        for name in dirs + files:
            p = Path(parent) / name
            s = no_reparse(p)
            if name in files:
                if not stat.S_ISREG(s.st_mode):
                    raise ValueError(f'Nonregular file: {p}')
                result[p.relative_to(root).as_posix()] = file_hash(p)
    return dict(sorted(result.items()))


def tree_hash(files):
    return digest(json.dumps(files, sort_keys=True, separators=(',', ':')).encode())


class Runner:
    def __init__(self, args):
        self.a = args
        self.out = Path(args.output).absolute()
        self.out.mkdir(parents=True, exist_ok=False)
        self.env = {k: v for k, v in os.environ.items()
                    if not k.upper().startswith('GIT_') and
                    k.upper() not in ('NODE_OPTIONS', 'NODE_PATH')}
        self.env.update(GIT_CONFIG_NOSYSTEM='1', GIT_CONFIG_GLOBAL=os.devnull,
                        GIT_OPTIONAL_LOCKS='0', TSX_DISABLE_CACHE='1')
        self.bare = str(Path(args.bare).resolve(strict=True))
        self.git = shutil.which('git')
        if not self.git:
            raise ValueError('git executable unavailable')
        self.n = 0
        self.baseline_refs = None
        self.result = {'status': 'running', 'started_utc': utc(), 'inputs': vars(args)}
        write_json(self.out / 'result.json', self.result)

    def command(self, label, argv, *, data=None, cwd=None, allowed=(0,)):
        self.n += 1
        stem = f'{self.n:04d}-{label}'
        stdout = self.out / f'{stem}.stdout'
        stderr = self.out / f'{stem}.stderr'
        record = {'argv': [str(x) for x in argv], 'cwd': str(cwd) if cwd else None,
                  'started_utc': utc(), 'stdout': stdout.name, 'stderr': stderr.name}
        started = time.monotonic()
        with stdout.open('wb') as out, stderr.open('wb') as err:
            try:
                proc = subprocess.Popen(argv, stdin=subprocess.PIPE, cwd=cwd, env=self.env,
                                        stdout=out, stderr=err,
                                        creationflags=subprocess.CREATE_NEW_PROCESS_GROUP if os.name == 'nt' else 0,
                                        start_new_session=os.name != 'nt')
                record['pid'] = proc.pid
                proc.communicate(input=data, timeout=self.a.timeout)
                record['exit'] = proc.returncode
            except subprocess.TimeoutExpired:
                record['exit'] = None
                record['timeout'] = True
                if os.name == 'nt':
                    # Kill only this runner-owned process tree; preserve all files.
                    self.command('terminate-owned-process',
                                 ['taskkill', '/PID', str(proc.pid), '/T', '/F'], allowed=(0, 128))
                else:
                    import signal
                    os.killpg(proc.pid, signal.SIGKILL)
                proc.wait(timeout=15)
            finally:
                out.flush(); os.fsync(out.fileno())
                err.flush(); os.fsync(err.fileno())
                record.update(ended_utc=utc(), seconds=time.monotonic() - started)
                write_json(self.out / f'{stem}.json', record)
        if record.get('exit') not in allowed:
            raise RuntimeError(f'{label} failed; inspect {stem}.json')
        return stdout

    def git_cmd(self, label, *args, **kwargs):
        return self.command(label, [self.git, '--git-dir=' + self.bare, *args], **kwargs)

    def git_text(self, label, *args):
        return self.git_cmd(label, *args).read_text(encoding='utf-8').strip()

    def inventory(self, revision, label):
        data = self.git_cmd(label, 'ls-tree', '-rz', '--full-tree', revision).read_bytes()
        result = {}
        folded = set()
        for line in data.split(b'\0'):
            if not line:
                continue
            info, name = line.split(b'\t', 1)
            mode, kind, oid = info.decode('ascii').split()
            path = safe_path(name.decode('utf-8'))
            if path.lower() in folded or kind != 'blob' or mode not in ('100644', '100755'):
                raise ValueError(f'Unsupported mode/type/case collision: {path}')
            folded.add(path.lower())
            result[path] = [mode, oid]
        return result

    def refs(self, label):
        # An owned bare repository may legitimately have an unborn symbolic HEAD.
        # Preserve its exact bytes without requiring that target to resolve.
        snapshot = {'head_bytes_hex': (Path(self.bare) / 'HEAD').read_bytes().hex(),
                'symbolic_head': self.git_cmd(label + '-symbolic', 'symbolic-ref', '-q', 'HEAD',
                                              allowed=(0, 1)).read_text().strip(),
                'refs': self.git_text(label + '-refs', 'show-ref')}
        write_json(self.out / f'{label}-refs-snapshot.json', snapshot)
        return snapshot

    def run(self):
        a = self.a
        for name in ('main', 'r31', 'source_commit', 'source_tree'):
            if not SHA.fullmatch(getattr(a, name)):
                raise ValueError(f'{name} must be an exact SHA, not a ref')
        self.baseline_refs = self.refs('before')
        self.git_cmd('git-version', '--version')
        for name in ('main', 'r31', 'source_commit'):
            if self.git_text(name + '-type', 'cat-file', '-t', getattr(a, name)) != 'commit':
                raise ValueError(name + ' is not a commit')
        if self.git_text('source-tree', 'rev-parse', a.source_commit + '^{tree}') != a.source_tree:
            raise ValueError('Source commit/tree mismatch')
        self.git_cmd('source-ancestor', 'merge-base', '--is-ancestor', a.source_commit, a.r31)
        review = json.loads(Path(a.review).read_text(encoding='utf-8-sig'))
        manifest = json.loads(Path(a.source_manifest).read_text(encoding='utf-8-sig'))
        for name in ('main', 'r31', 'source_commit'):
            if review.get(name) != getattr(a, name):
                raise ValueError('Review not bound to ' + name)
        if manifest.get('sourceSnapshotCommit') != a.source_commit or len(manifest['sources']) != 18:
            raise ValueError('Source manifest must bind this snapshot and eighteen sources')
        write_json(self.out / 'review-input.json', review)
        write_json(self.out / 'source-input.json', manifest)
        base = self.inventory(a.r31, 'accepted-inventory')
        source = self.inventory(a.source_tree, 'source-inventory')
        merge_output = self.git_text('merge-tree', 'merge-tree', '--write-tree', a.main, a.r31)
        merged = merge_output.splitlines()[0]
        if not SHA.fullmatch(merged) or self.git_text('merge-type', 'cat-file', '-t', merged) != 'tree':
            raise ValueError('No valid conflict-free merge tree')
        self.result['merge_tree'] = merged
        current = self.inventory(merged, 'merge-inventory')
        changes = [{'path': p, 'before': base.get(p), 'after': current.get(p)}
                   for p in sorted(base.keys() | current.keys()) if base.get(p) != current.get(p)]
        write_json(self.out / 'all-tree-deltas.json', changes)
        self.result['all_tree_delta_count'] = len(changes)
        sources = {safe_path(x['path']): x for x in manifest['sources']}
        if len(sources) != 18:
            raise ValueError('Duplicate source path')
        registry_bytes = self.git_cmd('accepted-registry', 'cat-file', 'blob',
                                     a.r31 + ':' + PKG + '/authority-enforcement-registry.yaml').read_bytes()
        registry_text = registry_bytes.decode('utf-8')
        if re.search(r'^sourceSnapshotCommit:\s*[\'"]?' + a.source_commit + r'[\'"]?\s*$',
                     registry_text, re.M) is None:
            raise ValueError('Accepted registry is not bound to the requested source commit')
        # Conservative superset of source/retirement path scalars. Fail on complex YAML.
        referenced = set()
        for raw in re.findall(r'^\s+path:\s*(.+)$', registry_text, re.M):
            raw = raw.strip()
            if raw.startswith('"'):
                value = json.loads(raw)
            elif raw.startswith("'") and raw.endswith("'"):
                value = raw[1:-1].replace("''", "'")
            elif re.fullmatch(r'[A-Za-z0-9_./-]+', raw):
                value = raw
            else:
                raise ValueError('Path scalar needs reviewed YAML handling: ' + raw)
            referenced.add(safe_path(value))
        protected = set(sources) | referenced | {safe_path(p) for p in review['protected_paths']}
        if not review['protected_paths']:
            raise ValueError('Review must name current decision/contract and extra runtime inputs')
        protected |= {p for p in base.keys() | current.keys()
                      if p.startswith((PKG + '/', 'plugins/foreman-line/schema-scaffold/'))}
        # Preserve resolver ancestry and configuration for every protected input.
        for p in list(protected):
            parent = PurePosixPath(p).parent
            while True:
                for config in ('package.json', 'tsconfig.json', 'jsconfig.json', '.pnp.cjs', '.pnp.loader.mjs'):
                    name = (parent / config).as_posix()
                    if name in base or name in current:
                        protected.add(name)
                if parent == PurePosixPath('.'):
                    break
                parent = parent.parent
        exceptions = {safe_path(x['path']): x for x in review.get('exclusions', [])}
        if len(exceptions) != len(review.get('exclusions', [])):
            raise ValueError('Duplicate exclusion')
        unresolved = []
        for change in changes:
            entry = exceptions.get(change['path'])
            if (change['path'] in protected or not entry or
                    entry.get('before') != change['before'] or entry.get('after') != change['after'] or
                    not entry.get('reason', '').strip()):
                unresolved.append(change)
        stale = set(exceptions) - {x['path'] for x in changes}
        if unresolved or stale:
            write_json(self.out / 'needs-closure-review.json', {'unresolved': unresolved, 'stale': sorted(stale)})
            self.result['status'] = 'needs-closure-review'
            raise RuntimeError('Input equivalence unresolved, not a runtime incompatibility finding')
        for p in protected:
            if p not in current or current[p] != base.get(p):
                raise ValueError('Missing or changed protected input: ' + p)
        for p in sources:
            if source.get(p) != current.get(p):
                raise ValueError('Real source snapshot differs: ' + p)
        write_json(self.out / 'protected-inputs.json', {p: current[p] for p in sorted(protected)})
        intended_temp = Path(tempfile.gettempdir()).resolve(strict=True)
        parent = Path(tempfile.mkdtemp(prefix='fk-r31-integration-', dir=intended_temp))
        no_reparse(parent)
        resolved_parent = parent.resolve(strict=True)
        if resolved_parent == intended_temp or intended_temp not in resolved_parent.parents:
            raise ValueError('Owned fixture parent is not strictly beneath intended Temp directory')
        root = parent / 'tree'
        root.mkdir()
        no_reparse(parent); no_reparse(root)
        self.result['fixture_parent'] = str(parent)
        write_json(self.out / 'result.json', self.result)
        self.env.update(GIT_DIR=self.bare, GIT_WORK_TREE=str(root), GIT_INDEX_FILE=str(parent / 'index'))
        self.git_cmd('read-alternate-index', 'read-tree', merged)
        top = self.git_text('fixture-root', '-C', str(root), 'rev-parse', '--show-toplevel')
        if Path(top).resolve() != root.resolve():
            raise ValueError('Wrong Git root')
        # git cat-file streams raw object bytes: no autocrlf, attributes or smudge execution.
        ids = sorted({entry[1] for entry in current.values()})
        batch = self.git_cmd('raw-blobs', 'cat-file', '--batch', data=('\n'.join(ids) + '\n').encode())
        by_id = {}
        for p, (_, oid) in current.items():
            by_id.setdefault(oid, []).append(p)
        byte_hashes = {}
        with batch.open('rb') as stream:
            for oid in ids:
                header = stream.readline().decode('ascii').strip().split()
                if len(header) != 3 or header[:2] != [oid, 'blob']:
                    raise ValueError('Malformed blob stream')
                size = int(header[2])
                content = stream.read(size)
                if len(content) != size or stream.read(1) != b'\n':
                    raise ValueError('Truncated blob stream')
                if hashlib.sha1(b'blob ' + str(size).encode() + b'\0' + content).hexdigest() != oid:
                    raise ValueError('Blob identity mismatch')
                for p in by_id[oid]:
                    target = root / p
                    target.parent.mkdir(parents=True, exist_ok=True)
                    with target.open('xb') as out:
                        out.write(content)
                    byte_hashes[p] = digest(content)
            if stream.read(1):
                raise ValueError('Unexpected trailing blob output')
        for p, entry in sources.items():
            if byte_hashes[p] != entry['sourceGitBlobSha256']:
                raise ValueError('Manifest source SHA256 mismatch: ' + p)
        if files_snapshot(root) != dict(sorted(byte_hashes.items())):
            raise ValueError('Materialized bytes differ from tree')
        write_json(self.out / 'materialized-sha256.json', byte_hashes)
        # Inspect literal import closure before Node. Dynamic filesystem inputs still
        # require the explicit independent protected_paths review above.
        entry_roots = [PKG + '/src/cli.ts', PKG + '/src/generate.ts']
        queue = list(entry_roots)
        seen = set()
        edges = []
        external = set()
        while queue:
            p = queue.pop()
            if p in seen or PurePosixPath(p).suffix not in ('.ts', '.js', '.mts', '.mjs', '.cts', '.cjs'):
                continue
            seen.add(p)
            text = (root / p).read_text(encoding='utf-8')
            for target in re.findall(r'(?:\bfrom\s*|\bimport\s*\(\s*|\brequire\s*\(\s*|\bimport\s*)[\'"]([^\'"]+)[\'"]', text):
                if not target.startswith('.'):
                    external.add(target)
                    continue
                absolute = (root / p).parent.joinpath(target).resolve()
                try:
                    relative = absolute.relative_to(root).as_posix()
                except ValueError:
                    raise ValueError('Relative import escapes fixture: ' + target)
                if '/node_modules/' in relative:
                    # Supplied later by exact private dependency copies.
                    external.add(relative)
                    continue
                candidates = [relative]
                if relative.endswith('.js'):
                    candidates.append(relative[:-3] + '.ts')
                if not PurePosixPath(relative).suffix:
                    candidates += [relative + x for x in ('.ts', '.js', '/index.ts', '/index.js')]
                resolved = next((x for x in candidates if x in current), None)
                if resolved is None or current[resolved] != base.get(resolved):
                    self.result['status'] = 'needs-closure-review'
                    write_json(self.out / 'import-closure-unresolved.json',
                               {'importer': p, 'specifier': target, 'candidates': candidates})
                    raise ValueError('Relative import missing/changed; closure review needed before Node')
                edges.append([p, target, resolved])
                queue.append(resolved)
                ancestor = PurePosixPath(resolved).parent
                while True:
                    for name in ('package.json', 'tsconfig.json', 'jsconfig.json', '.pnp.cjs', '.pnp.loader.mjs'):
                        config = (ancestor / name).as_posix()
                        if current.get(config) != base.get(config):
                            self.result['status'] = 'needs-closure-review'
                            raise ValueError('Changed import resolver ancestry: ' + config)
                    if ancestor == PurePosixPath('.'):
                        break
                    ancestor = ancestor.parent
        write_json(self.out / 'literal-import-closure.json', {'entry_roots': entry_roots,
                   'edges': edges, 'external': sorted(external),
                   'limit': 'Literal imports reachable from CLI and generator entries only. Source-corpus TS and test snippets are not executable roots. Full protected input equality is checked separately. Computed imports and dynamic filesystem inputs require independent review and explicit protected_paths; this scanner does not prove their absence.'})
        deps = review['dependencies']
        destinations = [safe_path(d['destination']) for d in deps]
        if len(set(destinations)) != len(destinations) or PKG + '/node_modules' not in destinations:
            raise ValueError('Missing or duplicate dependency mapping')
        dep_sources = []
        for d, relative in zip(deps, destinations):
            if PurePosixPath(relative).name != 'node_modules':
                raise ValueError('Dependency destination must be node_modules')
            src = Path(d['source']).absolute()
            no_reparse_ancestry(src)
            dst = root / relative
            if dst.exists() or src == dst or root in src.parents:
                raise ValueError('Unsafe dependency mapping')
            before = files_snapshot(src)
            if tree_hash(before) != d['tree_sha256']:
                raise ValueError('Dependency source differs from reviewed/tested hash')
            shutil.copytree(src, dst, symlinks=True)
            if files_snapshot(dst) != before or files_snapshot(src) != before:
                raise ValueError('Dependency copy changed or source raced')
            dep_sources.append((src, before))
        if not NODE.is_file() or file_hash(NODE) != review['node_sha256']:
            raise ValueError('Exact tested Node hash mismatch')
        self.result['node_sha256'] = file_hash(NODE)
        full_before = files_snapshot(root)
        package = root / PKG
        loader = package / 'node_modules/tsx/dist/cli.mjs'
        cli = package / 'src/cli.ts'
        registry = package / 'authority-enforcement-registry.yaml'
        self.command('node-version', [str(NODE), '--version'], cwd=package)
        for verb in ('validate', 'sweep'):
            output = self.command(verb, [str(NODE), str(loader), str(cli), verb,
                                        str(registry), '--repo-root', str(root)], cwd=package)
            parsed = json.loads(output.read_text(encoding='utf-8'))
            if parsed.get('valid') is not True or parsed.get('violations') != []:
                raise ValueError(verb + ' did not report valid/no violations')
        self.command('generate-idempotence', [str(NODE), str(loader), str(package / 'src/generate.ts')], cwd=package)
        full_after = files_snapshot(root)
        changes_after = {p: [full_before.get(p), full_after.get(p)]
                         for p in full_before.keys() | full_after.keys()
                         if full_before.get(p) != full_after.get(p)}
        write_json(self.out / 'post-command-file-deltas.json', changes_after)
        if changes_after:
            raise ValueError('CLI/generation changed fixture bytes, including dependency cache or added files')
        for src, before in dep_sources:
            if files_snapshot(src) != before:
                raise ValueError('Original dependency source changed during verification')
        self.result['status'] = 'pass'
        self.result['meaning'] = 'Pinned hypothetical tree input equivalence + CLI validate/sweep + byte idempotence; no merge, CI, Gate3 or unrelated runtime verification.'


def main():
    p = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    for name in ('main', 'r31', 'source-commit', 'source-tree', 'bare', 'output', 'source-manifest', 'review'):
        p.add_argument('--' + name, required=True)
    p.add_argument('--timeout', type=int, default=900, help='per-command seconds; timed-out evidence retained')
    a = p.parse_args()
    if a.timeout < 1:
        p.error('timeout must be positive')
    runner = Runner(a)
    try:
        runner.run()
    except BaseException as exc:
        if runner.result['status'] == 'running':
            runner.result['status'] = 'failed'
        runner.result['error'] = f'{type(exc).__name__}: {exc}'
    finally:
        if runner.baseline_refs is not None:
            try:
                final_refs = runner.refs('after')
                runner.result['bare_refs_unchanged'] = final_refs == runner.baseline_refs
                if not runner.result['bare_refs_unchanged']:
                    runner.result['status'] = 'failed'
                    runner.result['ref_error'] = 'Bare HEAD or refs changed; no repair attempted'
            except BaseException as exc:
                runner.result.update(status='failed', ref_error=str(exc))
        runner.result['ended_utc'] = utc()
        write_json(runner.out / 'result.json', runner.result)
    print(json.dumps(runner.result, sort_keys=True))
    return 0 if runner.result['status'] == 'pass' else 1


if __name__ == '__main__':
    raise SystemExit(main())
