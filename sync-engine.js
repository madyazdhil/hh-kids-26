/**
 * Universal Cross-Device Real-Time Sync Engine for Regroup Happy Hour
 * Works across:
 * 1. Cloud SSE Relay (ntfy.sh) -> Works over internet/cellular (GitHub Pages)
 * 2. Local Server Polling (/api/sync) -> Works offline on local Wi-Fi Da Vinci
 * 3. BroadcastChannel -> Instant 0ms latency for tabs on the same computer
 * 4. localStorage Storage Events -> Secondary cross-tab fallback
 */

(function(window) {
  const SYNC_TOPIC = 'hh_kids_26_regroup_sync_hub_v1';
  const SSE_URL = `https://ntfy.sh/${SYNC_TOPIC}/sse`;
  const PUB_URL = `https://ntfy.sh/${SYNC_TOPIC}`;
  const CHANNEL_NAME = 'regroup_happy_hour_sync';

  // Unique client identifier to avoid echo loops
  const clientId = 'client_' + Math.random().toString(36).substring(2, 9) + '_' + Date.now();
  
  const listeners = [];
  const seenMessageIds = new Set();
  let broadcastChannel = null;
  let eventSource = null;
  let localPollInterval = null;
  let cloudPollInterval = null;
  let cloudPollCursor = null;

  // Initialize BroadcastChannel if supported
  try {
    broadcastChannel = new BroadcastChannel(CHANNEL_NAME);
  } catch (e) {
    console.warn('BroadcastChannel not supported:', e);
  }

  function dispatchMessage(msg) {
    if (!msg || !msg.type) return;

    // Ignore self-echo
    if (msg.senderId === clientId) return;

    // Deduplicate by unique message ID
    if (msg.msgId) {
      if (seenMessageIds.has(msg.msgId)) return;
      seenMessageIds.add(msg.msgId);
      if (seenMessageIds.size > 300) {
        const first = seenMessageIds.values().next().value;
        seenMessageIds.delete(first);
      }
    }

    // Call all registered listeners
    listeners.forEach(fn => {
      try {
        fn(msg);
      } catch (err) {
        console.error('Error in sync listener:', err);
      }
    });
  }

  // 1. Setup BroadcastChannel listener (Same browser / machine)
  if (broadcastChannel) {
    broadcastChannel.onmessage = (event) => {
      dispatchMessage(event.data);
    };
  }

  // 2. Setup localStorage listener (Fallback for same browser)
  window.addEventListener('storage', (e) => {
    if (e.key === 'hh_last_broadcast' && e.newValue) {
      try {
        const msg = JSON.parse(e.newValue);
        dispatchMessage(msg);
      } catch (err) {}
    }
  });

  function dispatchCloudEvent(raw) {
    if (!raw || raw.event !== 'message' || !raw.message) return;
    try {
      dispatchMessage(JSON.parse(raw.message));
    } catch (e) {
      // Ignore keepalives and malformed relay messages.
    }
  }

  // 3. Setup Cloud SSE via ntfy.sh (Cross-device, Phone to Laptop, Laptop to Laptop)
  function connectCloudSSE() {
    try {
      if (eventSource) {
        eventSource.close();
      }
      eventSource = new EventSource(SSE_URL);

      eventSource.onmessage = (event) => {
        try {
          dispatchCloudEvent(JSON.parse(event.data));
        } catch (e) {
          // Ignore non-JSON system ping messages
        }
      };

      eventSource.onerror = () => {
        // Reconnect after 3 seconds on error
        setTimeout(connectCloudSSE, 3000);
      };
    } catch (e) {
      console.warn('Cloud SSE connection failed:', e);
    }
  }
  connectCloudSSE();

  // SSE is the primary cloud transport. Some managed networks keep an
  // EventSource open but never deliver its events, so add a lightweight
  // polling fallback using the same ntfy topic.
  async function pollCloud() {
    try {
      const since = cloudPollCursor || '30s';
      const res = await fetch(`${PUB_URL}/json?poll=1&since=${encodeURIComponent(since)}`, {
        cache: 'no-store'
      });
      if (!res.ok) return;
      const lines = (await res.text()).split('\n');
      lines.forEach((line) => {
        if (!line.trim()) return;
        try {
          const raw = JSON.parse(line);
          if (raw.id) cloudPollCursor = raw.id;
          dispatchCloudEvent(raw);
        } catch (e) {}
      });
    } catch (e) {
      // SSE remains available if polling is blocked.
    }
  }
  pollCloud();
  cloudPollInterval = setInterval(pollCloud, 1500);

  // 4. Setup Local Server Polling (/api/sync) for offline Da Vinci Wi-Fi
  let isInitialPoll = true;

  function startLocalPolling() {
    // GitHub Pages is also http(s), but it has no /api/sync endpoint. Only
    // use this transport on the operator's local server or a LAN IP.
    const host = window.location.hostname;
    const isLocalHost = host === 'localhost'
      || host === '127.0.0.1'
      || /^10\./.test(host)
      || /^192\.168\./.test(host)
      || /^172\.(1[6-9]|2\d|3[0-1])\./.test(host);
    if (!isLocalHost) return;

    localPollInterval = setInterval(async () => {
      try {
        const res = await fetch('/api/sync', { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          if (data) {
            if (isInitialPoll) {
              isInitialPoll = false;
              // Rehydrate the current phase for a laptop that joins late.
              // Previously every historical signal was marked as seen and
              // only a slide status was replayed. If the last signal was
              // BATTLE_UNLOCKED or a timer tick, the new Pos laptop missed
              // the active state entirely.
              const signals = Array.isArray(data.signals) ? data.signals : [];
              const latestSlideIndex = signals.reduce((found, sig, index) => (
                sig && (sig.type === 'SLIDE_CHANGED' || sig.type === 'CURRENT_SLIDE_STATUS')
                  ? index
                  : found
              ), -1);
              const replayStart = latestSlideIndex >= 0 ? latestSlideIndex : Math.max(0, signals.length - 1);

              signals.forEach((sig, index) => {
                if (index < replayStart && sig && sig.msgId) {
                  seenMessageIds.add(sig.msgId);
                }
              });
              signals.slice(replayStart).forEach(sig => dispatchMessage(sig));

              // Covers a relay response where lastSignal is not present in
              // the bounded signals array.
              if (data.lastSignal && !signals.some(sig => sig && sig.msgId === data.lastSignal.msgId)) {
                dispatchMessage(data.lastSignal);
              }
              return;
            }

            if (Array.isArray(data.signals) && data.signals.length > 0) {
              data.signals.forEach(sig => dispatchMessage(sig));
            } else if (data.lastSignal) {
              dispatchMessage(data.lastSignal);
            }
          }
        }
      } catch (e) {
        // Local server not available (e.g. running on GitHub Pages), safely ignore
      }
    }, 300);
  }
  startLocalPolling();

  // Public API
  const HHSync = {
    clientId,

    /**
     * Send a message to all connected screens and devices
     * @param {string} type - Message type (e.g. 'REMOTE_NEXT', 'SLIDE_CHANGED')
     * @param {object} payload - Optional data payload
     */
    send(type, payload = {}) {
      const now = Date.now();
      const msg = {
        msgId: `${clientId}_${now}_${Math.random().toString(36).substring(2, 6)}`,
        senderId: clientId,
        type,
        payload,
        timestamp: now
      };

      // 1. BroadcastChannel (Same Machine)
      if (broadcastChannel) {
        try {
          broadcastChannel.postMessage(msg);
        } catch (e) {}
      }

      // 2. localStorage (Same Machine fallback)
      try {
        localStorage.setItem('hh_last_broadcast', JSON.stringify(msg));
      } catch (e) {}

      // 3. Local Server POST (/api/sync)
      const host = window.location.hostname;
      const isLocalHost = host === 'localhost'
        || host === '127.0.0.1'
        || /^10\./.test(host)
        || /^192\.168\./.test(host)
        || /^172\.(1[6-9]|2\d|3[0-1])\./.test(host);
      if (window.location.protocol.startsWith('http') && isLocalHost) {
        try {
          fetch('/api/sync', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(msg)
          }).catch(() => {});
        } catch (e) {}
      }

      // 4. Cloud Pub (ntfy.sh) -> Delivers to all laptops and phones in <50ms
      try {
        fetch(PUB_URL, {
          method: 'POST',
          // Do not set application/json here: that triggers a CORS
          // preflight from GitHub Pages and can silently block the publish
          // on managed browsers. ntfy accepts the JSON string as the message
          // body, and subscribers parse raw.message below.
          body: JSON.stringify(msg)
        }).catch(() => {});
      } catch (e) {}
    },

    /**
     * Listen for a specific message type
     * @param {string} type
     * @param {function} callback
     */
    on(type, callback) {
      if (typeof callback === 'function') {
        listeners.push((msg) => {
          if (msg && msg.type === type) {
            callback(msg);
          }
        });
      }
    },

    /**
     * Listen for incoming messages from any device
     * @param {function} callback
     */
    onMessage(callback) {
      if (typeof callback === 'function') {
        listeners.push(callback);
      }
    }
  };

  window.HHSync = HHSync;
})(window);
