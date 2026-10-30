uniform sampler2D uNormalMap;
uniform sampler2D uDarkBrandBackdrop;
uniform vec3 uStoneColor;
uniform vec3 uLightPosition;
uniform float uNormalScale;
uniform float uAmbientIntensity;
uniform float uDarkProgress;

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

  // Luminous light-mode fine plaster color
  vec3 ambient = uStoneColor * uAmbientIntensity;
  vec3 diffuse = uStoneColor * diff * 0.35;
  vec3 lightColor = ambient + diffuse + vec3(spec);

  // Dark-mode embossed brand backdrop
  vec4 darkBrand = texture2D(uDarkBrandBackdrop, vUv);
  vec3 darkColor = darkBrand.rgb + vec3(spec * 0.3);

  // Smooth full-screen environmental transition
  vec3 finalColor = mix(lightColor, darkColor, smoothstep(0.0, 1.0, uDarkProgress));

  gl_FragColor = vec4(finalColor, 1.0);
}
