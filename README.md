***

<div align="center">
<b>Skimming</b><br>
Tag, Customize and Search with Skimming for Deno
</div>

<div align="center">

[![Master CI](https://github.com/petruki/skimming/actions/workflows/master.yml/badge.svg)](https://github.com/petruki/skimming/actions/workflows/master.yml)
[![deno.land/x/skimming](https://shield.deno.dev/x/skimming)](https://deno.land/x/skimming)
[![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=petruki_skimming&metric=alert_status)](https://sonarcloud.io/summary/new_code?id=petruki_skimming)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

</div>

***

# `skimming` - Deno Module

Skimming is a content fetcher for Deno. The idea is to provide a simple and
efficient and customizable way to fetch content from the web.

- Fetch documents online `skim()` or local with `skimContent()`
- Customizable cache
- Customizable content preview
- Ignore case option
- Trim content option to display only complete information
- Regex support

# Usage

### No cache

```js
import { Skimming } from "https://deno.land/x/skimming/mod.ts";

const files = ["README.md"];
const context = {
  url: "https://raw.githubusercontent.com/petruki/skimming/master/",
  files,
};
const query = "Usage";

const skimmer = new Skimming();
skimmer.setContext(context);
const results = await skimmer.skim(query, { previewLength: 200 });
```

- Where `previewLength` is the number of characters after the found occurrence
  which will be displayed (default: 200)
- Add `ignoreCase` option for whether ignore case or not (default: false)

### Using cache

```js
const files = ["README.md"];
const context = {
  url: "https://raw.githubusercontent.com/petruki/skimming/master/",
  files,
};
const query = "Usage";

const skimmer = new Skimming({ expireDuration: 10, size: 10 });
skimmer.setContext(context);
const results = await skimmer.skim(query, { previewLength: 200 });
```

- Where `expireDuration` the time in seconds that the cached value will expire
  (default: 1min)
- Where `size` is the number of stored queries and its results in cache
  (default: 60)

### Testing

Use `deno test -A --unstable` to run tests.

## Contributing

Please do open an issue if you have some cool ideas to contribute.
