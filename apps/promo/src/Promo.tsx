import {
  AbsoluteFill,
  Audio,
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
 * 38.5 – 44.0 s  Outro: the headphones arrive, "Silence." (Remotion + product photo)
 * 44.0 – 51.0 s  End card: PayGuard, tagline, three pillars.
 *
 * Timings are in CUES below so they can be adjusted to the recording.
 */
export const PROMO_FPS = 30;
const S = (seconds: number) => Math.round(seconds * PROMO_FPS);

export const CUES = {
  introEnd: 6.5,
  titleEnd: 9,
  /** Big typed prompt on dark, filmed at a slight angle (reference-ad style). */
  promptStart: 9,
  promptEnd: 17.5,
  screenStart: 17.5,
  /** seconds into the SCREEN RECORDING at which each thing happens (adjust after recording) */
  screen: {
    promptTyped: 0,      // the prompt is typed over the first ~5 s
    toolsCalled: 6,      // Claude calls search_products / find_best_offer
    scamRejected: 13,    // the ranking shows the fraudulent site rejected
    paid: 20,            // APPROVED + Snowtrace link
    end: 27.5,
  },
  /** Payoff: the headphones arrive, silence. */
  outroStart: 38.5,
  endCardStart: 44,
  total: 51,
} as const;

export const PROMO_DURATION_FRAMES = S(CUES.total);

const PROMPT = "Find me a NordSound ANC Pro headset at the best price and buy it. Budget €60 max.";
/** Words highlighted in blue in the big typed prompt. */
const HIGHLIGHTS = ["best price", "buy it", "€60 max"];

const font = { fontFamily: "Inter, -apple-system, Helvetica, Arial, sans-serif" } as const;

// ---------------------------------------------------------------------------

/** Fallback intro when no filmed clip is provided: the noise, as sound bars, then the line. */
const GeneratedIntro = () => {
  const frame = useCurrentFrame();
  const sec = frame / PROMO_FPS;
  const bars = 28;
  return (
    <AbsoluteFill style={{ background: "#0b0f17", alignItems: "center", justifyContent: "center" }}>
      <div style={{ display: "flex", gap: 10, alignItems: "flex-end", height: 260 }}>
        {Array.from({ length: bars }, (_, i) => {
          const h = 40 + 180 * Math.abs(Math.sin(sec * (7 + (i % 5)) + i)) * (sec < 5 ? 1 : Math.max(0, 1 - (sec - 5) * 1.5));
          return <div key={i} style={{ width: 22, height: h, borderRadius: 11, background: i % 3 === 0 ? "#ef5350" : "#30343c" }} />;
        })}
      </div>
      <div style={{ ...font, color: "white", fontSize: 54, fontWeight: 700, marginTop: 60, opacity: interpolate(sec, [1, 2], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) }}>
        Drilling upstairs. Again.
      </div>
      <div style={{ ...font, color: "#8b97ad", fontSize: 30, marginTop: 16, opacity: interpolate(sec, [4.5, 5.5], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) }}>
        Time for noise-cancelling headphones.
      </div>
    </AbsoluteFill>
  );
};

const Intro = ({ file, hasClip }: { file: string; hasClip: boolean }) => {
  const frame = useCurrentFrame();
  const fadeIn = interpolate(frame, [0, 20], [0, 1], { extrapolateRight: "clamp" });
  const fadeOut = interpolate(frame, [S(CUES.introEnd) - 15, S(CUES.introEnd)], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  if (!hasClip) return <AbsoluteFill style={{ opacity: Math.min(fadeIn, fadeOut) }}><GeneratedIntro /></AbsoluteFill>;
  return (
    <AbsoluteFill style={{ background: "#0b0f17", opacity: Math.min(fadeIn, fadeOut) }}>
      <OffthreadVideo src={staticFile(file)} style={{ width: "100%", height: "100%", objectFit: "cover" }} muted={false} />
      <AbsoluteFill style={{ justifyContent: "flex-end", padding: 80 }}>
        <div style={{ ...font, color: "white", fontSize: 44, fontWeight: 600, textShadow: "0 2px 24px rgba(0,0,0,.6)", opacity: interpolate(frame, [S(2.5), S(3.5)], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) }}>
          Drilling upstairs. Again.
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

/** Quick white flash on a cut, like the reference edit. */
const Flash = () => {
  const frame = useCurrentFrame();
  const o = interpolate(frame, [0, 3, 12], [0.9, 0.5, 0], { extrapolateRight: "clamp" });
  return <AbsoluteFill style={{ background: "white", opacity: o, pointerEvents: "none" }} />;
};

const Callout = ({ label, sub, tone }: { label: string; sub: string; tone: "ok" | "crit" | "accent" }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const enter = spring({ frame, fps, config: { damping: 12, stiffness: 180 } });
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
  const dur = CUES.outroStart - CUES.screenStart;
  // Slow "handheld" drift: zoom 1.0 -> 1.22, pan from the prompt box to the answer.
  const zoom = interpolate(sec, [0, dur], [0.96, 1.12], { easing: Easing.inOut(Easing.quad), extrapolateRight: "clamp" });
  const panX = interpolate(sec, [0, dur], [0, -3], { easing: Easing.inOut(Easing.quad), extrapolateRight: "clamp" });
  const panY = interpolate(sec, [0, 6, dur], [4, 1, -3], { easing: Easing.inOut(Easing.quad), extrapolateRight: "clamp" });
  const c = CUES.screen;
  const enter = interpolate(sec, [0, 0.8], [0, 1], { extrapolateRight: "clamp" });
  const tilt = interpolate(sec, [0, dur], [-9, -3], { easing: Easing.inOut(Easing.quad), extrapolateRight: "clamp" });
  // punch-in: a short zoom kick when each callout lands, then settle
  const kicks = [c.toolsCalled, c.scamRejected, c.paid];
  const punch = kicks.reduce((acc, k) => acc + (sec >= k ? interpolate(sec - k, [0, 0.12, 0.7], [0, 0.06, 0], { extrapolateRight: "clamp" }) : 0), 0);
  return (
    <AbsoluteFill style={{ background: "#0b0f17", perspective: 1600 }}>
      {/* blurred copy of the recording as ambient background */}
      <AbsoluteFill style={{ filter: "blur(40px) brightness(.35)", transform: "scale(1.3)" }}>
        <OffthreadVideo src={staticFile(file)} style={{ width: "100%", height: "100%", objectFit: "cover" }} muted />
      </AbsoluteFill>
      {/* the recording on a tilted card, slowly zooming and drifting like a handheld shot of the screen */}
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", opacity: enter }}>
        <div style={{ width: 1560, height: 878, borderRadius: 22, overflow: "hidden", boxShadow: "0 40px 120px rgba(0,0,0,.6), 0 0 0 2px rgba(255,255,255,.08)", transform: `rotateY(${tilt}deg) rotateX(2deg) scale(${zoom + punch}) translate(${panX}%, ${panY}%)`, transformOrigin: "50% 50%" }}>
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
      {[c.toolsCalled, c.scamRejected, c.paid].map((k) => (
        <Sequence key={k} from={S(k)} durationInFrames={14} layout="none">
          <Flash />
        </Sequence>
      ))}
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

/** Payoff scene, made in Remotion with the product photo (Higgsfield daily quota was reached). */
const Outro = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const sec = frame / PROMO_FPS;
  const dur = CUES.endCardStart - CUES.outroStart;
  const pop = spring({ frame, fps, config: { damping: 14, stiffness: 100 } });
  const drift = interpolate(sec, [0, dur], [1.0, 1.08], { easing: Easing.inOut(Easing.quad), extrapolateRight: "clamp" });
  const line1 = interpolate(sec, [0.6, 1.3], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const line2 = interpolate(sec, [2.2, 2.9], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const fadeOut = interpolate(sec, [dur - 0.4, dur], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <AbsoluteFill style={{ background: "#f6f4ef", opacity: fadeOut }}>
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 90, padding: 120 }}>
        <div style={{ width: 620, height: 620, borderRadius: 32, overflow: "hidden", background: "white", boxShadow: "0 40px 100px rgba(0,0,0,.18)", transform: `scale(${(0.9 + 0.1 * pop) * drift})` }}>
          <img src={staticFile("headset.jpg")} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        </div>
        <div style={{ ...font, color: "#1b1f26", maxWidth: 760 }}>
          <div style={{ fontSize: 24, letterSpacing: 5, textTransform: "uppercase", color: "#2fbf71", fontWeight: 700, opacity: line1 }}>Delivered · 48 h</div>
          <div style={{ fontSize: 86, fontWeight: 800, lineHeight: 1.05, letterSpacing: -2, marginTop: 14, opacity: line1, transform: `translateY(${(1 - line1) * 20}px)` }}>Silence.</div>
          <div style={{ fontSize: 34, color: "#5f6b7a", marginTop: 26, lineHeight: 1.3, opacity: line2, transform: `translateY(${(1 - line2) * 20}px)` }}>
            Best price found. Scam avoided.<br />Paid within the mandate. Proof on-chain.
          </div>
        </div>
      </AbsoluteFill>
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

// A type alias (not an interface) so it stays assignable to Remotion's Record<string, unknown> props.
/** Shown while public/screen.mov is not there yet. */
const MissingScreen = () => (
  <AbsoluteFill style={{ background: "#0b0f17", alignItems: "center", justifyContent: "center" }}>
    <div style={{ ...font, color: "#8b97ad", fontSize: 40, textAlign: "center", lineHeight: 1.4 }}>
      Screen recording missing<br /><span style={{ fontSize: 24 }}>drop it at apps/promo/public/screen.mov and set hasScreen: true</span>
    </div>
  </AbsoluteFill>
);

export type PromoProps = {
  introFile: string;
  /** true once public/screen.mov exists */
  hasScreen: boolean;
  /** true once public/intro.mp4 exists (filmed or generated clip) */
  hasIntroClip: boolean;
  screenFile: string;
  musicFile: string;
  /** true once public/music.mp3 exists (royalty-free track) */
  hasMusic: boolean;
};

export const Promo = ({ introFile, hasIntroClip, hasScreen, screenFile, musicFile, hasMusic }: PromoProps) => (
  <AbsoluteFill style={{ background: "#0b0f17" }}>
    {hasMusic && <Audio src={staticFile(musicFile)} volume={(f) => interpolate(f, [0, 30, PROMO_DURATION_FRAMES - 60, PROMO_DURATION_FRAMES], [0, 0.8, 0.8, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })} />}
    <Sequence from={0} durationInFrames={S(CUES.introEnd)}>
      <Intro file={introFile} hasClip={hasIntroClip} />
    </Sequence>
    <Sequence from={S(CUES.introEnd)} durationInFrames={S(CUES.titleEnd - CUES.introEnd)}>
      <TitleCard />
    </Sequence>
    <Sequence from={S(CUES.promptStart)} durationInFrames={S(CUES.promptEnd - CUES.promptStart)}>
      <BigPrompt />
    </Sequence>
    <Sequence from={S(CUES.screenStart)} durationInFrames={S(CUES.outroStart - CUES.screenStart)}>
      {hasScreen ? <Screen file={screenFile} /> : <MissingScreen />}
    </Sequence>
    <Sequence from={S(CUES.outroStart)} durationInFrames={S(CUES.endCardStart - CUES.outroStart)}>
      <Outro />
    </Sequence>
    <Sequence from={S(CUES.endCardStart)} durationInFrames={S(CUES.total - CUES.endCardStart)}>
      <EndCard />
    </Sequence>
  </AbsoluteFill>
);
