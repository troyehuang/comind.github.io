/* HeroBg — flowing volumetric clouds.
   Two large soft color masses (Ego A deep blue / Ego B lavender) plus a merged
   cyan-teal cloud drift, orbit, and mix at the center. Grain + vignette for depth.
   Pure CSS — no JS required.
   Exported to window.HeroBg. */
function HeroBg() {
  return (
    <div className="hero__bg" aria-hidden>
      <div className="hbg-cloud hbg-cloud--a"/>
      <div className="hbg-cloud hbg-cloud--b"/>
      <div className="hbg-cloud hbg-cloud--c"/>
      <div className="hbg-cloud hbg-cloud--d"/>
      <div className="hbg-cloud hbg-cloud--e"/>
      <div className="hbg-grain"/>
      <div className="hbg-vignette"/>
    </div>
  );
}
window.HeroBg = HeroBg;
