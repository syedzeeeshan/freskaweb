uniform sampler2D uBotanicalBg;
uniform sampler2D uBotanicalFg;
uniform sampler2D uNumeralMask;
uniform sampler2D uSurfaceNormal;
uniform vec3 uBackgroundColor;
uniform vec3 uNumeralColor;
uniform float uDarkProgress;
uniform float uTime;
uniform vec2 uResolution;

varying vec2 vUv;

void main() {
  vec2 uv = vUv;

  // Sample normal map for subtle physical edge debossing
  vec3 norm = texture2D(uSurfaceNormal, uv * 2.0).rgb * 2.0 - 1.0;
  vec2 normalOffset = norm.xy * 0.003;

  // Sample independent botanical layers
  vec4 bgBotanical = texture2D(uBotanicalBg, uv);
  vec4 fgBotanical = texture2D(uBotanicalFg, uv);

  // Sample crisp numeral mask with slight edge offset for physical depth
  float numeral = texture2D(uNumeralMask, uv + normalOffset).r;

  // Depth compositing pipeline:
  // 1. Base dark or stone background canvas
  vec3 comp = uBackgroundColor;

  // 2. Composite background botanical elements (stems, deep foliage)
  // When dark progress increases, foliage dims into deep midnight emerald
  vec3 bgBotanicalColor = mix(bgBotanical.rgb, bgBotanical.rgb * 0.85, uDarkProgress);
  comp = mix(comp, bgBotanicalColor, bgBotanical.a);

  // 3. Composite illuminated Roman numeral
  // Apply subtle contact shadow under the numeral onto the background
  float numeralShadow = texture2D(uNumeralMask, uv + vec2(-0.005, 0.008)).r * 0.35;
  comp = mix(comp, comp * (1.0 - numeralShadow), (1.0 - numeral) * bgBotanical.a);

  // Blend in the illuminated numeral
  vec3 numeralRender = uNumeralColor;
  comp = mix(comp, numeralRender, numeral);

  // 4. Composite foreground petals and leaves OVER the numeral
  // Generate contact shadow cast by foreground petals ONTO the numeral
  float fgShadow = texture2D(uBotanicalFg, uv + vec2(0.006, -0.008)).a * 0.45;
  comp = mix(comp, comp * (1.0 - fgShadow), numeral * (1.0 - fgBotanical.a));

  // Blend foreground botanicals with luminous rim light
  vec3 fgColor = fgBotanical.rgb;
  // Subtle rim lighting on foreground petals
  float rim = pow(1.0 - clamp(abs(dot(norm, vec3(0.0, 0.0, 1.0))), 0.0, 1.0), 2.5) * 0.3;
  fgColor += vec3(rim) * mix(0.1, 0.4, uDarkProgress);

  comp = mix(comp, fgColor, fgBotanical.a);

  gl_FragColor = vec4(comp, 1.0);
}
