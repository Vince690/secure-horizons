import { Composition } from "remotion";
import { Promo, PROMO_FPS, PROMO_DURATION_FRAMES } from "./Promo";

export const RemotionRoot = () => (
  <Composition
    id="PayGuardPromo"
    component={Promo}
    durationInFrames={PROMO_DURATION_FRAMES}
    fps={PROMO_FPS}
    width={1920}
    height={1080}
    defaultProps={{ introFile: "intro.mp4", hasIntroClip: true, screenFile: "screen.mov", musicFile: "music.mp3", hasMusic: true }}
  />
);
