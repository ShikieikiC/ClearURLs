# ClearURLs Lite (MV3)

A Manifest V3 port of [ClearURLs](https://github.com/ClearURLs/Addon) — automatically removes tracking parameters from URLs before requests leave the browser.

The upstream project is Manifest V2 and stopped working on modern Chrome (127+). This fork ports its rule set to Chrome's `declarativeNetRequest` API, so it runs entirely on the browser's native rule engine: no blocking webRequest, no persistent background page.

## Features

- **414 DNR rules** compiled from the official [ClearURLs Rules](https://github.com/ClearURLs/Rules) database (206 providers, LGPL-3.0)
  - Literal tracking params (`utm_*`, `fbclid`, `gclid`, `spm_id_from`, `vd_source`, ...) → native `queryTransform.removeParams`
  - Regex params, path fragments (e.g. Amazon `/ref=`), and redirect-unwrapping (Google `/url?q=`, doubleclick) → `regexSubstitution`
- **Anti-repollution fallback**: some sites (e.g. bilibili) re-append tracking params to the address bar via JS after load; a `tabs.onUpdated` + `history.replaceState` handler wipes them again without reloading the page
- **Popup UI**: global on/off toggle, cleaned-request counter, reset
- Zero network permissions beyond URL cleaning; nothing is sent anywhere

## Install (unpacked)

1. Download/clone this branch
2. Open `chrome://extensions`, enable **Developer mode**
3. Click **Load unpacked** and select the repository root (the folder containing `manifest.json`)

Works on Chrome 88+ (tested on 125).

## Project layout

```
manifest.json      MV3 manifest, declarativeNetRequest rule resource
rules.json         414 generated DNR rules (do not edit by hand)
background.js      service worker: enable/disable, stats, address-bar fallback
popup.html / .js   toolbar popup
icons/             original ClearURLs icons
```

## Regenerating rules.json

`rules.json` is generated from upstream `data.min.json` with a converter script (kept out of this repo; see the local tooling). To refresh after an upstream rules update: replace `data.min.json` and re-run the converter, which handles:

- literal vs. regex param classification
- RE2 compile-size clamping (bounded repeats `{n≥32}`, e.g. `[0-9a-f]{64}` → `[0-9a-f]+`)
- provider `exceptions` → `excludedRequestDomains` (e.g. `api.bilibili.com` is never cleaned)

## Differences from upstream

- No rule auto-update (static rules bundled at build time)
- No log page / detailed per-request log (DNR matching is not observable in production builds; `onRuleMatchedDebug` counts only work for unpacked installs)
- No context-menu cleaning tool, no eTag filtering, no ping blocking
- Global blocklists (`completeProvider`) are not ported — this fork only strips tracking params, it does not block ad endpoints

## License

Rules data and icons: © Kevin Röbert, LGPL-3.0 (upstream [ClearURLs/Addon](https://github.com/ClearURLs/Addon) and [ClearURLs/Rules](https://github.com/ClearURLs/Rules)).
Code changes in this fork: LGPL-3.0.
