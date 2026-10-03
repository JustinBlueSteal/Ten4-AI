import { useCallback, useEffect, useRef, useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { setAudioModeAsync, useAudioPlayer, useAudioPlayerStatus } from "expo-audio";
import { colors, urgencyColor } from "../theme";
import { callsNewerThan, latestCalls, OpenMhzError, type OmhzCall, type OmhzSystem } from "../api/openmhz";
import { BackendError, captionCall, type Caption } from "../api/backend";
import type { Dictionary, Settings } from "../types";

interface Item {
  id: string;
  time: number;
  status: "pending" | "done" | "error" | "skipped";
  caption?: Caption;
  error?: string;
}

const POLL_MS = 10_000;
const MAX_CAPTION_BACKLOG = 4;

interface Props {
  system: OmhzSystem | null;
  settings: Settings;
  dictionary: Dictionary;
  onChooseFeed: () => void;
}

export default function ListenScreen({ system, settings, dictionary, onChooseFeed }: Props) {
  const [items, setItems] = useState<Item[]>([]);
  const [feedError, setFeedError] = useState<string | null>(null);
  const [audioOn, setAudioOn] = useState(true);

  // Latest props, readable from long-lived callbacks without re-subscribing.
  const live = useRef({ settings, dictionary, system, audioOn });
  live.current = { settings, dictionary, system, audioOn };

  const player = useAudioPlayer();
  const status = useAudioPlayerStatus(player);
  const nowPlaying = useRef<string | null>(null);
  const playQueue = useRef<OmhzCall[]>([]);
  const captionQueue = useRef<OmhzCall[]>([]);
  const captioning = useRef(false);

  const patch = useCallback((id: string, p: Partial<Item>) => {
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, ...p } : it)));
  }, []);

  useEffect(() => {
    setAudioModeAsync({ playsInSilentMode: true }).catch(() => undefined);
  }, []);

  // ---- audio: one call at a time, in order ----
  const playNext = useCallback(() => {
    if (!live.current.audioOn) {
      playQueue.current = [];
      return;
    }
    if (nowPlaying.current) return;
    const call = playQueue.current.shift();
    if (!call) return;
    nowPlaying.current = call.id;
    try {
      player.replace({ uri: call.url });
      player.play();
    } catch (e) {
      console.warn("[audio] failed to play", e);
      nowPlaying.current = null;
      return;
    }
    // Safety net in case the "finished" event never arrives.
    const guardMs = ((call.len ?? 30) + 8) * 1000;
    setTimeout(() => {
      if (nowPlaying.current === call.id) {
        nowPlaying.current = null;
        playNext();
      }
    }, guardMs);
  }, [player]);

  useEffect(() => {
    if (status.didJustFinish) {
      nowPlaying.current = null;
      playNext();
    }
  }, [status.didJustFinish, playNext]);

  useEffect(() => {
    const h = setInterval(playNext, 1000);
    return () => clearInterval(h);
  }, [playNext]);

  // ---- captions: one at a time so the free-tier LLM isn't flooded ----
  const pumpCaptions = useCallback(async () => {
    if (captioning.current) return;
    captioning.current = true;
    try {
      while (captionQueue.current.length) {
        while (captionQueue.current.length > MAX_CAPTION_BACKLOG) {
          const dropped = captionQueue.current.shift()!;
          patch(dropped.id, { status: "skipped" });
        }
        const call = captionQueue.current.shift()!;
        const { settings: s, dictionary: d, system: sys } = live.current;
        try {
          const caption = await captionCall(s.backendUrl.replace(/\/$/, ""), call.url, {
            language: s.language,
            context: sys?.name ?? "",
            dictionary: d,
          });
          patch(call.id, { status: "done", caption });
        } catch (e) {
          const msg = e instanceof Error ? e.message : String(e);
          patch(call.id, { status: "error", error: msg });
          if (e instanceof BackendError && e.status === 429) {
            await new Promise((r) => setTimeout(r, (e.retryAfterSec ?? 30) * 1000));
          }
        }
      }
    } finally {
      captioning.current = false;
    }
  }, [patch]);

  const enqueue = useCallback(
    (call: OmhzCall) => {
      setItems((prev) => [{ id: call.id, time: call.time, status: "pending" as const }, ...prev].slice(0, 60));
      playQueue.current.push(call);
      captionQueue.current.push(call);
      playNext();
      void pumpCaptions();
    },
    [playNext, pumpCaptions]
  );

  // ---- discovery: the phone polls OpenMHz directly ----
  const shortName = system?.shortName;
  useEffect(() => {
    if (!shortName) return;
    const seen = new Set<string>();
    let lastTime = 0;
    let cancelled = false;
    playQueue.current = [];
    captionQueue.current = [];
    setItems([]);
    setFeedError(null);

    const tick = async (first: boolean) => {
      try {
        let calls: OmhzCall[];
        if (first) {
          calls = (await latestCalls(shortName)).slice(-3);
          if (!calls.length) lastTime = Date.now() - 120_000;
        } else {
          calls = await callsNewerThan(shortName, lastTime);
        }
        if (cancelled) return;
        for (const c of calls) {
          if (seen.has(c.id)) continue;
          seen.add(c.id);
          lastTime = Math.max(lastTime, c.time);
          enqueue(c);
        }
        setFeedError(null);
      } catch (e) {
        if (cancelled) return;
        setFeedError(
          e instanceof OpenMhzError && e.status === 403
            ? "OpenMHz blocked this device (HTTP 403)."
            : `Feed polling problem: ${e instanceof Error ? e.message : String(e)}`
        );
      }
    };

    void tick(true);
    const h = setInterval(() => void tick(false), POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(h);
    };
  }, [shortName, enqueue]);

  if (!system) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>Pick a feed to start listening.</Text>
        <Pressable style={styles.btn} onPress={onChooseFeed}><Text style={styles.btnText}>Choose a feed</Text></Pressable>
      </View>
    );
  }

  return (
    <View style={styles.wrap}>
      <View style={styles.bar}>
        <View style={{ flex: 1 }}>
          <Text style={styles.feed} numberOfLines={1}>{system.name}</Text>
          <Text style={styles.sub}>Captions in {settings.language}</Text>
        </View>
        <Pressable style={styles.chip} onPress={() => { setAudioOn((v) => !v); if (audioOn) { try { player.pause(); } catch {} nowPlaying.current = null; } }}>
          <Text style={styles.chipText}>{audioOn ? "Audio on" : "Audio off"}</Text>
        </Pressable>
        <Pressable style={styles.chip} onPress={onChooseFeed}><Text style={styles.chipText}>Change</Text></Pressable>
      </View>
      {feedError ? <Text style={styles.err}>{feedError}</Text> : null}
      <FlatList
        data={items}
        keyExtractor={(i) => i.id}
        ListEmptyComponent={<Text style={styles.wait}>Waiting for the next transmission…</Text>}
        renderItem={({ item }) => {
          const color = item.caption ? urgencyColor[item.caption.urgency_level] : colors.border;
          return (
            <View style={[styles.card, { borderLeftColor: color }]}>
              {item.status === "pending" && <Text style={styles.muted}>Transcribing…</Text>}
              {item.status === "skipped" && <Text style={styles.muted}>Skipped (captions were behind)</Text>}
              {item.status === "error" && <Text style={styles.errSmall}>Caption failed: {item.error}</Text>}
              {item.caption && (
                <>
                  <Text style={styles.caption}>{item.caption.clean_translation}</Text>
                  <Text style={styles.original}>{item.caption.original_snippet}</Text>
                  <Text style={[styles.badge, { color }]}>{item.caption.urgency_level}</Text>
                </>
              )}
            </View>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, paddingHorizontal: 16 },
  empty: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  emptyText: { color: colors.muted },
  btn: { backgroundColor: colors.accent, borderRadius: 10, paddingVertical: 12, paddingHorizontal: 20 },
  btnText: { color: "#fff", fontWeight: "700" },
  bar: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 },
  feed: { color: colors.text, fontWeight: "800", fontSize: 16 },
  sub: { color: colors.muted, fontSize: 12 },
  chip: { backgroundColor: colors.panel, borderColor: colors.border, borderWidth: 1, borderRadius: 16, paddingVertical: 6, paddingHorizontal: 10 },
  chipText: { color: colors.text, fontSize: 12, fontWeight: "600" },
  err: { color: "#FFB4B8", backgroundColor: "#3A1620", borderRadius: 8, padding: 10, marginBottom: 8 },
  wait: { color: colors.muted, textAlign: "center", marginTop: 32 },
  card: { backgroundColor: colors.panel, borderRadius: 10, borderLeftWidth: 5, padding: 12, marginBottom: 8 },
  caption: { color: colors.text, fontSize: 16, fontWeight: "600" },
  original: { color: colors.muted, fontSize: 12, marginTop: 6 },
  badge: { fontSize: 11, fontWeight: "800", marginTop: 6, letterSpacing: 1 },
  muted: { color: colors.muted },
  errSmall: { color: "#FFB4B8", fontSize: 12 },
});
