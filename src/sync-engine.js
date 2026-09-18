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

  // 3. Setup Cloud SSE via ntfy.sh (Cross-device, Phone to Laptop, Laptop to Laptop)
  function connectCloudSSE() {
    try {
      if (eventSource) {
        eventSource.close();
      }
      eventSource = new EventSource(SSE_URL);

      eventSource.onmessage = (event) => {
        try {
          const raw = JSON.parse(event.data);
          if (raw.message) {
            const msg = JSON.parse(raw.message);
            dispatchMessage(msg);
          }
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

  // 4. Setup Local Server Polling (/api/sync) for offline Da Vinci Wi-Fi
  let isInitialPoll = true;

  function startLocalPolling() {
    // Only poll if running on http:// (localhost or local IP), not file://
    if (!window.location.protocol.startsWith('http')) return;

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
      if (window.location.protocol.startsWith('http')) {
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
          headers: { 'Content-Type': 'application/json' },
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
