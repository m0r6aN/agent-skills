"""Verify a published live manifest against already-fetched Git objects.

Standard-library only; never changes Git refs, an index, or a worktree. Fetch
the named branches into an owned bare repository before invoking this script.
This checks the manifest's captured closure, not that its scope is sufficient.
"""

import argparse
import datetime
import hashlib
import json
import pathlib
import re
import subprocess
import sys


MANIFEST = "plugins/foreman-line/docs/goals/foreman-kernel/LIVE-PUBLICATION-MANIFEST.json"


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--git-dir", required=True)
    parser.add_argument("--coordinator", required=True, help="Full publication commit SHA")
    parser.add_argument("--output", required=True, help="New JSON result file; never overwritten")
    args = parser.parse_args()
    output = pathlib.Path(args.output)
    if output.exists():
        raise ValueError("Output already exists")
    if not re.fullmatch(r"[0-9a-f]{40}", args.coordinator):
        raise ValueError("Coordinator must be a full commit SHA")
    git = ["git", "--git-dir=" + str(pathlib.Path(args.git_dir).resolve())]

    def read_object(spec, kind="blob"):
        return subprocess.check_output(git + ["cat-file", kind, spec], stderr=subprocess.PIPE)

    read_object(args.coordinator, "commit")
    manifest_bytes = read_object(args.coordinator + ":" + MANIFEST)
    manifest = json.loads(manifest_bytes)
    implementation = manifest["implementationSource"]["fullHeadSha"]
    groups = {
        "capturedFiles": args.coordinator,
        "requiredGovernedSourcesOnImplementationBranch": implementation,
        "requiredImplementationArtifacts": implementation,
        "requiredVerificationEvidence": implementation,
    }
    if "successorSource" in manifest:
        successor = manifest["successorSource"]["fullHeadSha"]
        groups.update({
            "requiredSuccessorSources": successor,
            "requiredSuccessorPreparationArtifacts": successor,
        })
    # Additional explicitly described historical groups remain addressable when
    # a later publication promotes the successor to accepted implementation.
    for descriptor in manifest.get("additionalArtifactGroups", []):
        name = descriptor["group"]
        if name in groups:
            raise ValueError("Duplicate artifact group")
        groups[name] = descriptor["fullHeadSha"]
    for commit in set(groups.values()):
        if not re.fullmatch(r"[0-9a-f]{40}", commit):
            raise ValueError("Artifact source must be a full commit SHA")
        read_object(commit, "commit")

    expected = []
    for name, commit in groups.items():
        rows = manifest.get(name)
        if not isinstance(rows, list) or not rows:
            raise ValueError("Missing or empty artifact group: " + name)
        seen = set()
        for row in rows:
            path = row["path"]
            if path in seen or "\n" in path or "\r" in path or path.startswith("/") or ".." in pathlib.PurePosixPath(path).parts:
                raise ValueError("Duplicate or unsafe manifest path: " + path)
            seen.add(path)
            if not re.fullmatch(r"[0-9a-f]{64}", row["gitBlobSha256"]):
                raise ValueError("Invalid SHA256: " + path)
            expected.append((name, commit, row))

    request = "".join(commit + ":" + row["path"] + "\n" for _, commit, row in expected).encode("utf-8")
    batch = subprocess.run(git + ["cat-file", "--batch"], input=request, capture_output=True, check=True)
    cursor = 0
    checked = []
    failures = []
    for group, commit, row in expected:
        end = batch.stdout.index(b"\n", cursor)
        header = batch.stdout[cursor:end].decode("utf-8")
        parts = header.split()
        if len(parts) != 3 or parts[1] != "blob":
            raise ValueError("Expected blob: " + header)
        size = int(parts[2])
        start = end + 1
        data = batch.stdout[start:start + size]
        cursor = start + size + 1
        if len(data) != size or batch.stdout[cursor - 1:cursor] != b"\n":
            raise ValueError("Invalid cat-file batch framing")
        digest = hashlib.sha256(data).hexdigest()
        valid = digest == row["gitBlobSha256"] and ("bytes" not in row or row["bytes"] == size)
        result = {"group": group, "commit": commit, "path": row["path"], "gitBlob": parts[0], "bytes": size, "sha256": digest, "valid": valid}
        checked.append(result)
        if not valid:
            failures.append(result)
    if cursor != len(batch.stdout):
        raise ValueError("Unexpected trailing batch bytes")
    resume = manifest["resumeEntryPoint"]
    if resume not in {row["path"] for row in manifest["capturedFiles"]}:
        raise ValueError("Resume entry point is outside capturedFiles")
    read_object(args.coordinator + ":" + resume)
    report = {
        "verifiedUtc": datetime.datetime.now(datetime.timezone.utc).isoformat(),
        "coordinatorCommit": args.coordinator,
        "manifestPath": MANIFEST,
        "manifestSha256": hashlib.sha256(manifest_bytes).hexdigest(),
        "resumeEntryPoint": resume,
        "groups": {name: {"commit": commit, "count": len(manifest[name])} for name, commit in groups.items()},
        "checkedCount": len(checked), "valid": not failures,
        "files": checked, "failures": failures,
        "limits": "Verifies already-fetched object bytes for the manifest's declared closure; remote ref freshness and scope completeness require separate checks.",
    }
    with output.open("x", encoding="utf-8", newline="\n") as stream:
        json.dump(report, stream, indent=2)
        stream.write("\n")
    print(json.dumps({"valid": not failures, "checkedCount": len(checked), "output": str(output), "coordinatorCommit": args.coordinator}))
    return 0 if not failures else 1


if __name__ == "__main__":
    sys.exit(main())
