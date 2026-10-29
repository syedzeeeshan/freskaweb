uniform sampler2D uSceneTexture;
uniform sampler2D uWaterNormalMap;
uniform float uTime;
uniform vec3 uWaterAbyssColor;
uniform vec4 uSpecularColor;
uniform float uHorizonY;
uniform vec2 uResolution;

varying vec2 vUv;
varying vec3 vWorldPosition;
varying vec3 vNormal;

void main() {
  vec2 uv = vUv;

  // Distance from horizon (0.0 at horizon, 1.0 at screen bottom)
  float distFromHorizon = clamp(uv.y, 0.0, 1.0);

  // Perspective compression: tighter ripples near horizon, wider distortions in foreground
  float frequencyScale = mix(8.0, 3.0, distFromHorizon);
  vec2 flow1 = vec2(uv.x * frequencyScale + uTime * 0.05, uv.y * frequencyScale + uTime * 0.03);
  vec2 flow2 = vec2(uv.x * frequencyScale * 1.5 - uTime * 0.04, uv.y * frequencyScale * 1.5 - uTime * 0.06);

  vec3 n1 = texture2D(uWaterNormalMap, flow1).rgb * 2.0 - 1.0;
  vec3 n2 = texture2D(uWaterNormalMap, flow2).rgb * 2.0 - 1.0;
  vec3 waveNormal = normalize(vNormal + (n1 + n2) * 0.25);

  // Inverted vertical reflection coordinate
  vec2 reflectUv = vec2(uv.x, 1.0 - uv.y);

  // Distortion amplitude scales with distance from horizon
  vec2 distortion = waveNormal.xz * (0.02 + 0.06 * distFromHorizon);

  // Chromatic dispersion in water reflection
  float r = texture2D(uSceneTexture, reflectUv + distortion * 1.03).r;
  float g = texture2D(uSceneTexture, reflectUv + distortion * 1.00).g;
  float b = texture2D(uSceneTexture, reflectUv + distortion * 0.97).b;
  vec3 reflectionColor = vec3(r, g, b);

  // Fresnel calculation: grazing angles near horizon reflect more; downward angles look into abyss
  vec3 viewDir = normalize(-vWorldPosition);
  float fresnel = pow(1.0 - max(dot(viewDir, waveNormal), 0.0), 3.0);
  fresnel = clamp(fresnel, 0.15, 0.95);

  // Specular glint from overhead light
  vec3 lightDir = normalize(vec3(0.1, 0.8, 0.4));
  vec3 halfDir = normalize(lightDir + viewDir);
  float spec = pow(max(dot(waveNormal, halfDir), 0.0), 64.0) * 0.45;

  // Composite: Reflection fades gracefully into deep obsidian abyss
  vec3 finalWater = mix(uWaterAbyssColor, reflectionColor, fresnel);
  finalWater += uSpecularColor.rgb * spec;

  gl_FragColor = vec4(finalWater, 1.0);
}
