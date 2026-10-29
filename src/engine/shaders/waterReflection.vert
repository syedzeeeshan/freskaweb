uniform float uTime;
uniform float uWaveHeight;

varying vec2 vUv;
varying vec3 vWorldPosition;
varying vec3 vNormal;

// Gerstner Wave Calculation
vec3 getGerstnerDisplacement(vec2 pos, float time) {
  float wave1 = sin(pos.x * 4.0 + time * 1.5) * 0.03;
  float wave2 = cos(pos.y * 3.0 + pos.x * 2.0 - time * 1.2) * 0.02;
  float wave3 = sin(pos.x * 8.0 - pos.y * 6.0 + time * 2.2) * 0.01;
  return vec3(0.0, (wave1 + wave2 + wave3) * uWaveHeight, 0.0);
}

void main() {
  vUv = uv;
  vec3 pos = position;
  vec3 disp = getGerstnerDisplacement(pos.xz, uTime);
  pos += disp;

  vec4 worldPos = modelMatrix * vec4(pos, 1.0);
  vWorldPosition = worldPos.xyz;
  
  // Approximate surface normal from wave derivative
  float dx = cos(pos.x * 4.0 + uTime * 1.5) * 0.12 + cos(pos.x * 8.0 + uTime * 2.2) * 0.08;
  float dz = sin(pos.z * 3.0 - uTime * 1.2) * 0.06;
  vNormal = normalize(vec3(-dx, 1.0, -dz));

  gl_Position = projectionMatrix * viewMatrix * worldPos;
}
