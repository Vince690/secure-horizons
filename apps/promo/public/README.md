Drop the clips here (not committed):
- screen.mov  the Claude Desktop screen recording in English (~30 s, 16:9)  [required]
- intro.mp4   a filmed or generated 8 s clip of the person at the Mac (optional: without it, a generated "noise" intro plays)
- music.mp3   a royalty-free track (optional)

Then set hasIntroClip / hasMusic to true in src/Root.tsx (or in the Studio props panel):
  npm run studio -w apps/promo   # preview, adjust CUES.screen in src/Promo.tsx to the recording
  npm run render -w apps/promo   # out/payguard-promo.mp4
