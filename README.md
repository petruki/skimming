***

<div align="center">
<b>Skimming</b><br>
Tag, Customize and Search with Skimming for Deno
</div>

<div align="center">

[![Master CI](https://github.com/petruki/skimming/actions/workflows/master.yml/badge.svg)](https://github.com/petruki/skimming/actions/workflows/master.yml)
[![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=petruki_skimming&metric=alert_status)](https://sonarcloud.io/summary/new_code?id=petruki_skimming)
[![deno.land/x/skimming](https://shield.deno.dev/x/skimming)](https://deno.land/x/skimming)
[![JSR](https://jsr.io/badges/@trackerforce/skimming)](https://jsr.io/@trackerforce/skimming)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

</div>

***

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
import { Skimming } from "@trackerforce/skimming@[VERSION]"; // or
import { Skimming } from 'https://deno.land/x/skimming@v[VERSION]/mod.ts';

const skimmer = Skimming.create({
  url: "https://raw.githubusercontent.com/petruki/skimming/master/",
  files: ["README.md"],
});

const results = await skimmer.skim("my query");
```

- Where `previewLength` is the number of characters after the found occurrence
  which will be displayed (default: 200)
- Add `ignoreCase` option for whether ignore case or not (default: false)

### Using cache

```js
const skimmer = Skimming.create({
  url: "https://raw.githubusercontent.com/petruki/skimming/master/",
  files: ["README.md"],
  cacheOptions: { expireDuration: 10, size: 10 },
});

const results = await skimmer.skim("my query");
```

- Where `expireDuration` the time in seconds that the cached value will expire
  (default: 1min)
- Where `size` is the number of stored queries and its results in cache
  (default: 60)

### Testing

Use `deno task test` to run tests.

## Contributing

Please do open an issue if you have some cool ideas to contribute.
