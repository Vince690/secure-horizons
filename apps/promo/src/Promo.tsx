import {
  AbsoluteFill,
  Easing,
  interpolate,
  OffthreadVideo,
  Sequence,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

/**
 * PayGuard promo, ~45 s, 1920x1080, 30 fps.
 *
 *  0.0 –  8.0 s  Intro: the annoyed neighbour (AI-generated clip, public/intro.mp4)
 *  8.0 – 10.5 s  Title card: "Just ask."
 * 10.5 – 19.0 s  Big typed prompt, key words in blue, filmed slightly off-axis (reference-ad style)
 * 19.0 – 40.0 s  Screen: Claude Desktop recording (public/screen.mov) on a tilted card over a
 *                blurred background, slow zoom + drift, three callouts timed to what happens
 *                on screen (checks, scam rejected, paid + proof).
 * 40.0 – 47.0 s  End card: PayGuard, tagline, three pillars.
 *
 * Timings are in CUES below so they can be adjusted to the recording.
 */
export const PROMO_FPS = 30;
const S = (seconds: number) => Math.round(seconds * PROMO_FPS);

export const CUES = {
  introEnd: 8,
  titleEnd: 10.5,
  /** Big typed prompt on dark, filmed at a slight angle (reference-ad style). */
  promptStart: 10.5,
  promptEnd: 19,
  screenStart: 19,
  /** seconds into the SCREEN RECORDING at which each thing happens (adjust after recording) */
  screen: {
    promptTyped: 0,      // the prompt is typed over the first ~5 s
    toolsCalled: 6,      // Claude calls search_products / find_best_offer
    scamRejected: 13,    // the ranking shows the fraudulent site rejected
    paid: 20,            // APPROVED + Snowtrace link
    end: 27.5,
  },
  endCardStart: 40,
  total: 47,
} as const;

export const PROMO_DURATION_FRAMES = S(CUES.total);

const PROMPT = "Find me a NordSound ANC Pro headset at the best price and buy it. Budget €60 max.";
/** Words highlighted in blue in the big typed prompt. */
const HIGHLIGHTS = ["best price", "buy it", "€60 max"];

const font = { fontFamily: "Inter, -apple-system, Helvetica, Arial, sans-serif" } as const;

// ---------------------------------------------------------------------------

const Intro = ({ file }: { file: string }) => {
  const frame = useCurrentFrame();
  const fadeIn = interpolate(frame, [0, 20], [0, 1], { extrapolateRight: "clamp" });
  const fadeOut = interpolate(frame, [S(CUES.introEnd) - 15, S(CUES.introEnd)], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <AbsoluteFill style={{ background: "#0b0f17", opacity: Math.min(fadeIn, fadeOut) }}>
      <OffthreadVideo src={staticFile(file)} style={{ width: "100%", height: "100%", objectFit: "cover" }} muted={false} />
      <AbsoluteFill style={{ justifyContent: "flex-end", padding: 80 }}>
        <div style={{ ...font, color: "white", fontSize: 44, fontWeight: 600, textShadow: "0 2px 24px rgba(0,0,0,.6)", opacity: interpolate(frame, [S(4), S(5)], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) }}>
          Noisy neighbours. Again.
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

const TitleCard = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const pop = spring({ frame, fps, config: { damping: 14, stiffness: 120 } });
  return (
    <AbsoluteFill style={{ background: "#0b0f17", alignItems: "center", justifyContent: "center" }}>
      <div style={{ ...font, color: "white", fontSize: 96, fontWeight: 800, letterSpacing: -2, transform: `scale(${0.9 + 0.1 * pop})`, opacity: pop }}>Just ask.</div>
    </AbsoluteFill>
  );
};

/** The reference-ad effect: the prompt typed huge on a dark screen, key words in blue, camera slightly off-axis and drifting. */
const BigPrompt = () => {
  const frame = useCurrentFrame();
  const sec = frame / PROMO_FPS;
  const dur = CUES.promptEnd - CUES.promptStart;
  const charsPerSecond = 16;
  const shown = Math.min(PROMPT.length, Math.floor(Math.max(0, sec - 0.4) * charsPerSecond));
  const text = PROMPT.slice(0, shown);
  // camera: starts close and tilted, slowly settles; a slow lateral drift like a handheld shot
  const tilt = interpolate(sec, [0, dur], [-14, -6], { easing: Easing.inOut(Easing.quad), extrapolateRight: "clamp" });
  const rotX = interpolate(sec, [0, dur], [8, 3], { easing: Easing.inOut(Easing.quad), extrapolateRight: "clamp" });
  const drift = interpolate(sec, [0, dur], [40, -40], { easing: Easing.inOut(Easing.quad), extrapolateRight: "clamp" });
  const scale = interpolate(sec, [0, dur], [1.12, 1.0], { easing: Easing.inOut(Easing.quad), extrapolateRight: "clamp" });
  const fadeOut = interpolate(sec, [dur - 0.5, dur], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  // render with highlights: split the shown text on the highlight phrases
  const parts: Array<{ t: string; hi: boolean }> = [];
  let rest = text;
  while (rest.length) {
    let next: { idx: number; word: string } | null = null;
    for (const w of HIGHLIGHTS) {
      const i = rest.indexOf(w);
      if (i >= 0 && (next === null || i < next.idx)) next = { idx: i, word: w };
    }
    // a highlight being typed (partial) also counts
    let partial: { idx: number; word: string } | null = null;
    for (const w of HIGHLIGHTS) {
      for (let k = w.length - 1; k > 0; k--) {
        if (rest.endsWith(w.slice(0, k)) && PROMPT.includes(w)) { partial = { idx: rest.length - k, word: w.slice(0, k) }; break; }
      }
      if (partial) break;
    }
    if (next === null && partial === null) { parts.push({ t: rest, hi: false }); break; }
    const m = next !== null && (partial === null || next.idx <= partial.idx) ? next : partial!;
    if (m.idx > 0) parts.push({ t: rest.slice(0, m.idx), hi: false });
    parts.push({ t: m.word, hi: true });
    rest = rest.slice(m.idx + m.word.length);
  }
  const caret = Math.floor(frame / 12) % 2 === 0;
  return (
    <AbsoluteFill style={{ background: "#0b0f17", opacity: fadeOut, perspective: 1400 }}>
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", transform: `translateX(${drift}px) scale(${scale}) rotateY(${tilt}deg) rotateX(${rotX}deg)`, transformOrigin: "50% 50%" }}>
        <div style={{ ...font, color: "white", fontSize: 92, fontWeight: 600, lineHeight: 1.15, letterSpacing: -1.5, maxWidth: 1500, padding: 40, textShadow: "0 0 40px rgba(91,140,255,.15)" }}>
          {parts.map((p, i) => (
            <span key={i} style={{ color: p.hi ? "#5b8cff" : "white" }}>{p.t}</span>
          ))}
          <span style={{ color: "#5b8cff", opacity: caret && shown < PROMPT.length ? 1 : 0 }}>▍</span>
        </div>
      </AbsoluteFill>
      <AbsoluteFill style={{ justifyContent: "flex-end", alignItems: "center", paddingBottom: 60 }}>
        <div style={{ ...font, color: "#8b97ad", fontSize: 24, letterSpacing: 4, textTransform: "uppercase", opacity: interpolate(sec, [0.5, 1.2], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) }}>Claude · with the PayGuard plugin</div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

const Typewriter = ({ text, startFrame, charsPerSecond = 22 }: { text: string; startFrame: number; charsPerSecond?: number }) => {
  const frame = useCurrentFrame();
  const shown = Math.max(0, Math.min(text.length, Math.floor(((frame - startFrame) / PROMO_FPS) * charsPerSecond)));
  const caret = Math.floor(frame / 15) % 2 === 0 ? "▍" : " ";
  return (
    <span>
      {text.slice(0, shown)}
      {shown < text.length ? caret : ""}
    </span>
  );
};

const Callout = ({ label, sub, tone }: { label: string; sub: string; tone: "ok" | "crit" | "accent" }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const enter = spring({ frame, fps, config: { damping: 16, stiffness: 140 } });
  const color = tone === "ok" ? "#2fbf71" : tone === "crit" ? "#ef5350" : "#5b8cff";
  return (
    <div style={{ ...font, transform: `translateY(${(1 - enter) * 24}px)`, opacity: enter, background: "rgba(11,15,23,.92)", border: `2px solid ${color}`, borderRadius: 18, padding: "22px 30px", maxWidth: 620, boxShadow: "0 20px 60px rgba(0,0,0,.45)" }}>
      <div style={{ color, fontSize: 20, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase" }}>{label}</div>
      <div style={{ color: "white", fontSize: 34, fontWeight: 600, marginTop: 6, lineHeight: 1.2 }}>{sub}</div>
    </div>
  );
};

const Screen = ({ file }: { file: string }) => {
  const frame = useCurrentFrame();
  const sec = frame / PROMO_FPS;
  const dur = CUES.endCardStart - CUES.screenStart;
  // Slow "handheld" drift: zoom 1.0 -> 1.22, pan from the prompt box to the answer.
  const zoom = interpolate(sec, [0, dur], [0.96, 1.12], { easing: Easing.inOut(Easing.quad), extrapolateRight: "clamp" });
  const panX = interpolate(sec, [0, dur], [0, -3], { easing: Easing.inOut(Easing.quad), extrapolateRight: "clamp" });
  const panY = interpolate(sec, [0, 6, dur], [4, 1, -3], { easing: Easing.inOut(Easing.quad), extrapolateRight: "clamp" });
  const c = CUES.screen;
  const enter = interpolate(sec, [0, 0.8], [0, 1], { extrapolateRight: "clamp" });
  const tilt = interpolate(sec, [0, dur], [-9, -3], { easing: Easing.inOut(Easing.quad), extrapolateRight: "clamp" });
  return (
    <AbsoluteFill style={{ background: "#0b0f17", perspective: 1600 }}>
      {/* blurred copy of the recording as ambient background */}
      <AbsoluteFill style={{ filter: "blur(40px) brightness(.35)", transform: "scale(1.3)" }}>
        <OffthreadVideo src={staticFile(file)} style={{ width: "100%", height: "100%", objectFit: "cover" }} muted />
      </AbsoluteFill>
      {/* the recording on a tilted card, slowly zooming and drifting like a handheld shot of the screen */}
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", opacity: enter }}>
        <div style={{ width: 1560, height: 878, borderRadius: 22, overflow: "hidden", boxShadow: "0 40px 120px rgba(0,0,0,.6), 0 0 0 2px rgba(255,255,255,.08)", transform: `rotateY(${tilt}deg) rotateX(2deg) scale(${zoom}) translate(${panX}%, ${panY}%)`, transformOrigin: "50% 50%" }}>
          <OffthreadVideo src={staticFile(file)} style={{ width: "100%", height: "100%", objectFit: "cover" }} muted />
        </div>
      </AbsoluteFill>
      {/* Reminder of the request, small, bottom left, while Claude works */}
      <Sequence from={S(c.promptTyped)} durationInFrames={S(c.toolsCalled + 2)} layout="none">
        <AbsoluteFill style={{ justifyContent: "flex-end", alignItems: "flex-start", padding: 60 }}>
          <div style={{ ...font, color: "white", fontSize: 28, fontWeight: 500, background: "rgba(11,15,23,.88)", padding: "16px 24px", borderRadius: 14, maxWidth: 900, lineHeight: 1.3 }}>
            <Typewriter text={PROMPT} startFrame={S(c.promptTyped)} charsPerSecond={40} />
          </div>
        </AbsoluteFill>
      </Sequence>
      <Sequence from={S(c.toolsCalled)} durationInFrames={S(c.scamRejected - c.toolsCalled)} layout="none">
        <AbsoluteFill style={{ justifyContent: "flex-start", alignItems: "flex-end", padding: 70 }}>
          <Callout tone="accent" label="PayGuard · 3 merchants checked" sub="Prices compared, sites verified." />
        </AbsoluteFill>
      </Sequence>
      <Sequence from={S(c.scamRejected)} durationInFrames={S(c.paid - c.scamRejected)} layout="none">
        <AbsoluteFill style={{ justifyContent: "flex-start", alignItems: "flex-end", padding: 70 }}>
          <Callout tone="crit" label="Scam rejected" sub="Hidden instructions for AI agents. Lookalike domain." />
        </AbsoluteFill>
      </Sequence>
      <Sequence from={S(c.paid)} durationInFrames={S(c.end - c.paid)} layout="none">
        <AbsoluteFill style={{ justifyContent: "flex-start", alignItems: "flex-end", padding: 70 }}>
          <Callout tone="ok" label="Paid · proof on Avalanche" sub="Within budget. Decision anchored on-chain." />
        </AbsoluteFill>
      </Sequence>
    </AbsoluteFill>
  );
};

const EndCard = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = spring({ frame, fps, config: { damping: 15, stiffness: 110 } });
  const pillars = ["Checks every merchant", "Enforces your mandate", "Proves it on-chain"];
  return (
    <AbsoluteFill style={{ background: "#0b0f17", alignItems: "center", justifyContent: "center", gap: 28 }}>
      <div style={{ ...font, color: "#5b8cff", fontSize: 26, fontWeight: 700, letterSpacing: 6, textTransform: "uppercase", opacity: t }}>PayGuard</div>
      <div style={{ ...font, color: "white", fontSize: 76, fontWeight: 800, letterSpacing: -2, textAlign: "center", transform: `scale(${0.92 + 0.08 * t})`, opacity: t }}>
        Your agent shops.<br />PayGuard decides.
      </div>
      <div style={{ display: "flex", gap: 18, marginTop: 20 }}>
        {pillars.map((p, i) => {
          const s = spring({ frame: frame - 12 * i - 10, fps, config: { damping: 14, stiffness: 120 } });
          return (
            <div key={p} style={{ ...font, color: "white", fontSize: 26, fontWeight: 500, border: "1px solid #243049", background: "#121826", borderRadius: 999, padding: "14px 26px", opacity: s, transform: `translateY(${(1 - s) * 16}px)` }}>
              {p}
            </div>
          );
        })}
      </div>
      <div style={{ ...font, color: "#8b97ad", fontSize: 22, marginTop: 24, opacity: interpolate(frame, [40, 60], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) }}>
        Built on Avalanche · Works with any MCP host
      </div>
    </AbsoluteFill>
  );
};

export const Promo = ({ introFile, screenFile }: { introFile: string; screenFile: string }) => (
  <AbsoluteFill style={{ background: "#0b0f17" }}>
    <Sequence from={0} durationInFrames={S(CUES.introEnd)}>
      <Intro file={introFile} />
    </Sequence>
    <Sequence from={S(CUES.introEnd)} durationInFrames={S(CUES.titleEnd - CUES.introEnd)}>
      <TitleCard />
    </Sequence>
    <Sequence from={S(CUES.promptStart)} durationInFrames={S(CUES.promptEnd - CUES.promptStart)}>
      <BigPrompt />
    </Sequence>
    <Sequence from={S(CUES.screenStart)} durationInFrames={S(CUES.endCardStart - CUES.screenStart)}>
      <Screen file={screenFile} />
    </Sequence>
    <Sequence from={S(CUES.endCardStart)} durationInFrames={S(CUES.total - CUES.endCardStart)}>
      <EndCard />
    </Sequence>
  </AbsoluteFill>
);
