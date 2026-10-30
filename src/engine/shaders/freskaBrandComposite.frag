uniform sampler2D uBrandBackdrop;
uniform sampler2D uSurfaceNormal;
uniform vec3 uBackgroundColor;
uniform float uDarkProgress;
uniform float uTime;
uniform vec2 uResolution;

varying vec2 vUv;

void main() {
  vec2 uv = vUv;

  // Normal offset for physical relief
  vec3 norm = texture2D(uSurfaceNormal, uv * 2.5).rgb * 2.0 - 1.0;
  vec2 normalOffset = norm.xy * 0.002;

  // 1. Sample Official Freska Branded Dark Environmental Backdrop
  vec4 brandBackdrop = texture2D(uBrandBackdrop, uv + normalOffset);

  // 2. Base deep obsidian color (#050507)
  vec3 comp = uBackgroundColor;

  // Blend in the embossed sculptural Freska backdrop as dark progress increases
  comp = mix(comp, brandBackdrop.rgb, uDarkProgress);

  // Subtle ambient brand emerald aura reflecting in the pool
  float distToCenter = length(uv - vec2(0.5, 0.45));
  float emeraldAura = smoothstep(0.65, 0.15, distToCenter) * 0.15 * uDarkProgress;
  vec3 auraColor = vec3(0.0, 0.816, 0.518); // Freska mint #00D084
  comp += auraColor * emeraldAura;

  gl_FragColor = vec4(comp, 1.0);
}
