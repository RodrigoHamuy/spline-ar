varying vec3 vNormal;
varying vec3 p;
uniform float deltaTime;

vec3 snake(vec3 p){
	p.y += sin(deltaTime*7.0+(p.x*0.05))*50.0;
  p.z += cos(deltaTime*5.0+(p.x*0.05))*50.0;
  // p.x += cos(deltaTime)*200.0;
  return p;
}

void main() {

  vNormal = normal;

  p = snake(position);

  gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
}
