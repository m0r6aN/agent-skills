# JEV container launcher prototype

This is a bounded, dry-run-only container prototype for the existing
`@foreman-line/jev-decisions` runtime. It accepts exactly one JSON request on
standard input, injects an in-memory lease port and synthetic transport port,
and prints the runtime result as one JSON object on standard output.

The launcher does not make a network request, read a real API key, or include a
credential in the image. The runtime's credential guard is satisfied only by an
internal non-secret dry-run marker. A live transport, persistent lease store,
and production secret policy remain release work.

## Local verification

From the repository root, run:

```powershell
Get-Content .\plugins\foreman-line\jev-decisions\container\fixtures\dry-run.json -Raw |
  node .\plugins\foreman-line\jev-decisions\container\jev-run.mjs
```

The result should be a single `ok: true` object containing a redacted live
observation. The output must not contain the input state, the synthetic
provider body, or an API key.

## Container verification

Build with the repository root as context:

```powershell
docker build -f plugins/foreman-line/jev-decisions/container/Dockerfile -t jev-decisions-container:prototype .
Get-Content .\plugins\foreman-line\jev-decisions\container\fixtures\dry-run.json -Raw |
  docker run --rm -i --network none jev-decisions-container:prototype
```

The `--network none` check is intentional: the synthetic launcher should pass
without network access. The input is one request per process; repeat the
container invocation for another request.
