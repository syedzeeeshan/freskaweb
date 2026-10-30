uniform vec2 uFrom;          // Previous cursor position in CSS pixels
uniform vec2 uTo;            // Current cursor position in CSS pixels
uniform vec2 uVelocity;      // Velocity in CSS pixels / sec
uniform float uRadius;       // Main reveal radius in CSS pixels (desktop: ~105px, mobile: ~75px)
uniform float uBoundaryWidth;// Soft disturbance boundary width in CSS pixels (desktop: ~36px, mobile: ~26px)
uniform float uTrailMax;     // Maximum trail length in CSS pixels (1.4 * uRadius)
uniform float uPresence;     // Interaction presence: 0.0 = completely opaque, 1.0 = fully active
uniform float uTurbulence;   // Curl turbulence strength
uniform float uSwirl;        // Curl swirl frequency
uniform float uTime;
uniform vec2 uResolution;    // CSS width and height (window.innerWidth, window.innerHeight)
uniform float uDpr;          // Device pixel ratio
uniform vec3 uMistColor;     // Base color of the mist (#F5F4F0)
uniform float uDarkProgress; // Scroll progress into dark theme (fades out mist)

// Subtle smoke tracking wake uniforms (React Bits GhostCursor reference)
uniform vec2 uTrailNodes[8];  // Trailing catenary nodes in CSS pixels
uniform float uTrailWeights[8];// Trailing activity weights
uniform float uWakeStrength;  // Master wake strength (0.0 to 1.0)

varying vec2 vUv;

// Analytical gradient noise and 2D hash adapted from React Bits GhostCursor
vec2 hash2(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * vec3(0.1031, 0.103, 0.0973));
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.xx + p3.yz) * p3.zy) * 2.0 - 1.0;
}

vec3 gradientNoise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * f * (f * (f * 6.0 - 15.0) + 10.0);
  vec2 du = 30.0 * f * f * (f * (f - 2.0) + 1.0);
  vec2 ga = hash2(i);
  vec2 gb = hash2(i + vec2(1.0, 0.0));
  vec2 gc = hash2(i + vec2(0.0, 1.0));
  vec2 gd = hash2(i + vec2(1.0, 1.0));
  float va = dot(ga, f);
  float vb = dot(gb, f - vec2(1.0, 0.0));
  float vc = dot(gc, f - vec2(0.0, 1.0));
  float vd = dot(gd, f - vec2(1.0, 1.0));
  float k = va - vb - vc + vd;
  float value = va + u.x * (vb - va) + u.y * (vc - va) + u.x * u.y * k;
  vec2 slope = ga + u.x * (gb - ga) + u.y * (gc - ga) + u.x * u.y * (ga - gb - gc + gd) + du * (u.yx * k + vec2(vb, vc) - va);
  return vec3(value, slope);
}

// Fluid curl noise from React Bits GhostCursor
vec2 curl(vec2 p) {
  vec3 a = gradientNoise(p * uSwirl + vec2(uTime * 0.11, -uTime * 0.07));
  vec3 b = gradientNoise(p * uSwirl * 2.03 + vec2(-uTime * 0.13, uTime * 0.09) + 17.3);
  vec2 g = a.yz + b.yz * 0.5;
  return vec2(g.y, -g.x);
}

// Error function approximation for smooth fluid trail
float erf(float x) {
  float x2 = x * x;
  return sign(x) * sqrt(1.0 - exp(-x2 * (1.2732395 + 0.147 * x2) / (1.0 + 0.147 * x2)));
}

// Multi-octave FBM for organic smoke wisps
float hash(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x), f.y);
}

float fbm(vec2 p) {
  float v = 0.0;
  float a = 0.5;
  mat2 m = mat2(0.8776, 0.4794, -0.4794, 0.8776);
  for (int i = 0; i < 4; i++) {
    v += a * noise(p);
    p = m * p * 2.0;
    a *= 0.5;
  }
  return v;
}

float fbm5(vec2 p) {
  float v = 0.0;
  float a = 0.5;
  mat2 m = mat2(0.8776, 0.4794, -0.4794, 0.8776);
  for (int i = 0; i < 5; i++) {
    v += a * noise(p);
    p = m * p * 2.0;
    a *= 0.52;
  }
  return v;
}

void main() {
  // Global opacity fade for dark chapters transition
  float globalAlpha = 1.0 - smoothstep(0.0, 0.65, uDarkProgress);
  if (globalAlpha <= 0.001) {
    discard;
  }

  // 1. Initial State Check: When uPresence is strictly 0, OPACITY IS EXACTLY 1.0
  // Absolutely no noise holes, no transparency, no silhouettes!
  if (uPresence <= 0.0001) {
    gl_FragColor = vec4(uMistColor, globalAlpha);
    return;
  }

  // 2. Pixel-Space fragment coordinates in CSS pixels (matching pointer)
  vec2 p = gl_FragCoord.xy / uDpr;

  // 3. Fluid Gaussian wake & trail along cursor velocity vector
  vec2 ab = uTo - uFrom;
  float rawLen = length(ab);
  // Velocity decoupling: strictly clamp trail length to uTrailMax
  float len = min(rawLen, uTrailMax);

  // 4. Organic boundary distortion using curl noise and multi-octave FBM
  vec2 curlOffset = curl(p * (uSwirl * 0.0035) + vec2(uTime * 0.12, -uTime * 0.08));
  float velNorm = clamp(length(uVelocity) / 500.0, 0.0, 1.0);
  vec2 flow = curlOffset * (uTurbulence * (14.0 + velNorm * 10.0));

  // Domain-warped FBM wisps around the boundary
  vec2 np = (p + flow) * 0.0055;
  float t = uTime * 0.12;
  vec2 q = vec2(fbm(np + t * 0.35), fbm(np + vec2(5.2, 1.3) + t * 0.35));
  vec2 r = vec2(fbm(np + q * 1.8 + vec2(1.7, 9.2) + t * 0.5), fbm(np + q * 1.8 + vec2(8.3, 2.8) + t * 0.5));
  float smokeNoise = fbm5(np + r * 1.15);
  float wisp = pow(smoothstep(0.22, 0.78, smokeNoise), 2.0);

  // 5. COMPACT REVEAL CALCULATION (Strictly preserved reveal coverage)
  vec2 dh = p - uTo;
  float distToHead = length(dh);
  float perturbedDist = distToHead - (wisp - 0.5) * uBoundaryWidth * 1.15;

  if (rawLen > 1.0) {
    vec2 dir = ab / rawLen;
    vec2 ap = p - uTo;
    float proj = clamp(dot(-ap, dir), 0.0, len);
    vec2 closest = uTo - dir * proj;
    float distToSegment = length(p - closest);
    perturbedDist = min(perturbedDist, distToSegment - (wisp - 0.5) * uBoundaryWidth * 1.15);
  }

  // Inner: clearAmount = 1.0 (clear 3D model view)
  // Outer: clearAmount = 0.0 (100% opaque smoke)
  float innerR = max(10.0, uRadius - uBoundaryWidth * 0.5);
  float outerR = uRadius + uBoundaryWidth * 0.5;
  float clearAmount = (1.0 - smoothstep(innerR, outerR, perturbedDist)) * uPresence;

  // 6. SUBTLE SMOKE TRACKING WAKE (React Bits GhostCursor stream)
  // Soft, organic atmospheric trail that travels behind the moving cursor
  float wakeStream = 0.0;
  for (int i = 0; i < 7; i++) {
    float w = uTrailWeights[i + 1];
    if (w > 0.015) {
      vec2 pA = uTrailNodes[i];
      vec2 pB = uTrailNodes[i + 1];
      vec2 seg = pB - pA;
      float l2 = dot(seg, seg);
      if (l2 > 4.0) {
        float segLen = sqrt(l2);
        vec2 dir = seg / segLen;
        vec2 ap = p - pA;
        float proj = clamp(dot(ap, dir), 0.0, segLen);
        vec2 closest = pA + dir * proj;
        float d = length(p - closest);

        // Controlled thickness: slender wake tapering along the tail
        float decay = 1.0 - float(i) / 7.0;
        float wakeRadius = uRadius * (0.35 + 0.25 * decay);
        float sigma = wakeRadius * 0.52;
        float g = exp(- (d * d) / (2.0 * sigma * sigma));

        wakeStream += g * w * pow(decay, 0.9);
      }
    }
  }
  wakeStream = clamp(wakeStream * uWakeStrength, 0.0, 1.0);

  // Smoke wake curling and soft volumetric shading
  vec2 wakeDisplace = curl(p * (uSwirl * 0.0035) + vec2(uTime * 0.14, -uTime * 0.09)) * (uTurbulence * 16.0 * wakeStream);
  vec2 wakeP = (p + wakeDisplace) * 0.0075;
  float wakeFbm = fbm5(wakeP + vec2(uTime * 0.08, -uTime * 0.06));
  float wakeWisp = pow(smoothstep(0.20, 0.78, wakeFbm), 1.8);

  // Soft dimensional chiaroscuro folds on disturbed smoke
  vec3 wakeSmokeColor = uMistColor * (0.88 + 0.22 * wakeWisp);

  // Combine mist color: undisturbed mist + organic smoke wake stream
  vec3 mistColor = mix(uMistColor * (0.97 + 0.03 * wisp), wakeSmokeColor, wakeStream * 0.70);

  // Volumetric edge rim glow at compact reveal boundary
  float rim = smoothstep(0.08, 0.45, clearAmount) * (1.0 - smoothstep(0.45, 0.95, clearAmount)) * uPresence;
  mistColor += vec3(rim * 0.12);

  // Smoke opacity:
  // Compact reveal head clears 3D model view (clearAmount)
  // Trailing wake softly thins the mist by 10-16% along its centerline to show travel path
  float wakeThinning = wakeStream * (0.10 + 0.06 * wakeWisp);
  float totalClear = clamp(clearAmount + wakeThinning * (1.0 - clearAmount), 0.0, 1.0);
  float smokeAlpha = 1.0 - totalClear;
  float finalAlpha = smokeAlpha * globalAlpha;

  gl_FragColor = vec4(mistColor, clamp(finalAlpha, 0.0, 1.0));
}

