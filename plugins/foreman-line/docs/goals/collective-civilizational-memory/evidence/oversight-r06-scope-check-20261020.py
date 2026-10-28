"""Offline insertion-only scope check; not implementation or independent review."""
import datetime
import difflib
import hashlib
import json
from pathlib import Path

here = Path(__file__).resolve().parent
specs = here.parents[2] / "specs" / "active"
before = json.loads((here / "oversight-before-r06-20261020.json").read_text(encoding="utf-8-sig"))
report = {"observedAt": datetime.datetime.now(datetime.timezone.utc).isoformat(),
          "scope": "Draft amendment scope only; no gate or implementation acceptance",
          "results": []}
patch = []

def section(text, title):
    return text.split(f"## {title}\n", 1)[1].split("\n## ", 1)[0]

for name, original in before.items():
    current = (specs / name).read_text(encoding="utf-8")
    assert original.split("---", 2)[1] == current.split("---", 2)[1], name
    assert section(original, "Allowed Files") == section(current, "Allowed Files"), name
    assert section(original, "Out of Scope") == section(current, "Out of Scope"), name
    old_lines, new_lines = original.splitlines(keepends=True), current.splitlines(keepends=True)
    matcher = difflib.SequenceMatcher(a=old_lines, b=new_lines, autojunk=False)
    assert all(op in ("equal", "insert") for op, *_ in matcher.get_opcodes()), name
    if name.startswith("CCM-P1D"):
        assert original == current
    patch.extend(difflib.unified_diff(old_lines, new_lines, fromfile=f"before/{name}", tofile=f"after/{name}"))
    report["results"].append({
        "file": name,
        "beforeSha256": hashlib.sha256(original.encode()).hexdigest(),
        "afterSha256": hashlib.sha256(current.encode()).hexdigest(),
        "frontmatterUnchanged": True, "allowedFilesUnchanged": True,
        "outOfScopeUnchanged": True, "onlyInsertions": True,
        "changed": original != current,
    })

packet = here.parent / "review-launch-packet-c02-d1.txt"
assert hashlib.sha256(packet.read_bytes()).hexdigest() == "a69a31d84ab47ab235551a62a2de3214bfdcc96e5eada0db431c191d224bffb1"
report["consumedReviewPacketUnchanged"] = True
for filename, text in (
    ("oversight-r06-scope-check-20261020.json", json.dumps(report, indent=2) + "\n"),
    ("oversight-r06-amendment-20261020.patch", "".join(patch)),
):
    with (here / filename).open("x", encoding="utf-8", newline="\n") as output:
        output.write(text)
print(json.dumps(report, indent=2))
