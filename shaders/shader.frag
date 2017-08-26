uniform float deltaTime;

varying vec3 vNormal;
varying vec3 p;

vec3 worm(float dProd){
  float energy = sin(deltaTime*7.0+(p.x*0.5));
  float energy2 = cos(deltaTime*7.0+(p.x*0.5));
  return vec3(
    dProd*energy, // R
    dProd*energy2, // G
    dProd*energy2*0.5 // B
  );
}

void main() {

  vec3 light = vec3(0.5, 0.2, 1.0);

  light = normalize(light);

  float dProd = max(0.0, dot(vNormal, light));

  dProd = 0.25 + (0.75*dProd);

  gl_FragColor = vec4(worm(dProd), 1.0);
}
