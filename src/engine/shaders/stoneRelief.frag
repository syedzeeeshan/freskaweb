uniform sampler2D uNormalMap;
uniform vec3 uStoneColor;
uniform vec3 uLightPosition;
uniform float uNormalScale;
uniform float uAmbientIntensity;

varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vViewPosition;

void main() {
  vec2 uv = vUv * 6.0; // Subtle fine micro-texture
  vec3 normalMap = texture2D(uNormalMap, uv).rgb * 2.0 - 1.0;
  vec3 N = normalize(vNormal + vec3(normalMap.xy * uNormalScale * 0.1, 0.0));

  vec3 L = normalize(uLightPosition);
  vec3 V = normalize(vViewPosition);
  vec3 H = normalize(L + V);

  // Directional raking sunlight across fine Italian plaster
  float diff = max(dot(N, L), 0.0);
  float spec = pow(max(dot(N, H), 0.0), 32.0) * 0.12;

  // Luminous high-key off-white ambient base
  vec3 ambient = uStoneColor * uAmbientIntensity;
  vec3 diffuse = uStoneColor * diff * 0.35;
  vec3 finalColor = ambient + diffuse + vec3(spec);

  gl_FragColor = vec4(finalColor, 1.0);
}
