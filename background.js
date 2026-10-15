// ClearURLs Lite — MV3 background service worker
// Rules are static DNR; this worker handles enable/disable, stats,
// and a history fallback that cleans tab URLs rewritten back by page JS
// (e.g. bilibili re-appends spm_id_from / vd_source after load).

const DEFAULTS = { enabled: true, blockedCount: 0 };

const PARAM_RE = /([?&])(callback|spm_id_from|from_source|from|seid|mid|share_source|msource|refer_from|share_from|share_medium|share_plat|share_tag|share_session_id|timestamp|unique_k|vd_source|plat_id|buvid|is_story_h5|up_id|bbid|ts|visit_id|session_id|broadcast_type|is_room_feed|trackid|track_id|from_spmid|spmid|csource|share_times|share_medium_id|utm_source|utm_medium|utm_campaign|utm_term|utm_content|fbclid|gclid|feature)=[^&]*/g;

function cleanUrl(u) {
  if (!/^https?:/i.test(u)) return null;
  let out = u.replace(PARAM_RE, "$1");
  // collapse '?&' or dangling '?'/'&' and duplicate separators
  out = out.replace(/\?&+/, "?").replace(/&&+/g, "&").replace(/[?&]+$/, "");
  return out !== u ? out : null;
}

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.url) {
    const cleaned = cleanUrl(changeInfo.url);
    if (cleaned) {
      // Clean the address bar WITHOUT reloading: run history.replaceState in the page.
      chrome.scripting.executeScript({
        target: { tabId },
        func: (newUrl) => {
          try { history.replaceState(history.state, "", newUrl); } catch (e) {}
        },
        args: [cleaned]
      }).catch(() => {});
    }
  }
});

chrome.runtime.onInstalled.addListener(async () => {
  const { enabled } = await chrome.storage.local.get(DEFAULTS);
  await applyEnabled(enabled);
});

chrome.runtime.onStartup.addListener(async () => {
  const { enabled } = await chrome.storage.local.get(DEFAULTS);
  await applyEnabled(enabled);
});

async function applyEnabled(enabled) {
  await chrome.declarativeNetRequest.updateEnabledRulesets({
    [enabled ? "enableRulesetIds" : "disableRulesetIds"]: ["clearurls"]
  });
}

// Count blocked/cleaned requests for the badge & popup.
chrome.declarativeNetRequest.onRuleMatchedDebug.addListener((info) => {
  // Only fires when extension is unpacked with dev flag; harmless otherwise.
  chrome.storage.local.get(DEFAULTS, ({ blockedCount }) => {
    const n = (blockedCount || 0) + 1;
    chrome.storage.local.set({ blockedCount: n });
    chrome.action.setBadgeText({ text: n > 999 ? "999+" : String(n) });
    chrome.action.setBadgeBackgroundColor({ color: "#c0392b" });
  });
});

chrome.storage.onChanged.addListener((changes) => {
  if (changes.enabled) applyEnabled(changes.enabled.newValue);
  if (changes.blockedCount && changes.blockedCount.newValue === 0) {
    chrome.action.setBadgeText({ text: "" });
  }
});

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg === "getState") {
    chrome.storage.local.get(DEFAULTS).then(sendResponse);
    return true;
  }
  if (msg === "toggle") {
    chrome.storage.local.get(DEFAULTS, async ({ enabled }) => {
      await chrome.storage.local.set({ enabled: !enabled });
      sendResponse({ enabled: !enabled });
    });
    return true;
  }
  if (msg === "resetCount") {
    chrome.storage.local.set({ blockedCount: 0 });
    sendResponse({ ok: true });
  }
});
