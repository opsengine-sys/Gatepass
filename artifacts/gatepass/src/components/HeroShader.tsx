import { useEffect, useRef } from "react";

const VERT = `attribute vec2 a_pos; void main(){gl_Position=vec4(a_pos,0.,1.);}`;

// Flowing organic blobs — alpha output so it composites over CSS bg
const FRAG = `
precision highp float;
uniform vec2  u_res;
uniform float u_time;

vec2 hash2(vec2 p){
  p=vec2(dot(p,vec2(127.1,311.7)),dot(p,vec2(269.5,183.3)));
  return -1.+2.*fract(sin(p)*43758.5453);
}
float noise(vec2 p){
  vec2 i=floor(p),f=fract(p),u=f*f*(3.-2.*f);
  return mix(mix(dot(hash2(i),f),dot(hash2(i+vec2(1,0)),f-vec2(1,0)),u.x),
             mix(dot(hash2(i+vec2(0,1)),f-vec2(0,1)),dot(hash2(i+vec2(1,1)),f-vec2(1,1)),u.x),u.y);
}
float fbm(vec2 p){
  float v=0.,a=.5;
  for(int i=0;i<5;i++){v+=a*noise(p);p*=2.1;a*=.48;}
  return v*.5+.5;
}

void main(){
  vec2 uv=gl_FragCoord.xy/u_res; uv.y=1.-uv.y;
  float t=u_time*.12;

  // FBM domain warp
  vec2 wu=uv+vec2(fbm(uv*2.+vec2(t*.5,0.))-.5,
                  fbm(uv*2.+vec2(0.,t*.4))-.5)*.30;

  // Blob centres
  vec2 b0=vec2(.18+.20*sin(t*.80),       .22+.16*cos(t*.65));
  vec2 b1=vec2(.80+.16*cos(t*.55),       .28+.22*sin(t*.75));
  vec2 b2=vec2(.50+.22*sin(t*.42+1.2),   .56+.14*cos(t*.90));
  vec2 b3=vec2(.08+.10*cos(t*.70+2.1),   .70+.16*sin(t*.55));
  vec2 b4=vec2(.90+.08*sin(t*.62+3.0),   .65+.12*cos(t*.80));

  float g0=exp(-dot(wu-b0,wu-b0)*5.5);
  float g1=exp(-dot(wu-b1,wu-b1)*5.0);
  float g2=exp(-dot(wu-b2,wu-b2)*4.5);
  float g3=exp(-dot(wu-b3,wu-b3)*7.5);
  float g4=exp(-dot(wu-b4,wu-b4)*7.0);

  // Total blob intensity → alpha
  float alpha=(g0*.8+g1*.75+g2*.70+g3*.60+g4*.55);
  alpha=clamp(alpha,0.,1.);

  // Tinted blend: peach-amber colour per blob
  vec3 c0=vec3(.99,.80,.60);
  vec3 c1=vec3(.99,.84,.68);
  vec3 c2=vec3(.98,.78,.56);
  vec3 c3=vec3(1.,.87,.70);
  vec3 c4=vec3(.97,.81,.63);

  vec3 col=c0*g0+c1*g1+c2*g2+c3*g3+c4*g4;
  float w=g0+g1+g2+g3+g4;
  col=w>0.001?col/w:c0;

  // Fade out at bottom
  float fade=smoothstep(.55,1.,uv.y);
  alpha*=(1.-fade);

  gl_FragColor=vec4(col,alpha*.70);
}
`;

function compileShader(gl: WebGLRenderingContext, type: number, src: string) {
  const s = gl.createShader(type)!;
  gl.shaderSource(s, src); gl.compileShader(s);
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS))
    console.warn("Shader:", gl.getShaderInfoLog(s));
  return s;
}

export function HeroShader({ className }: { className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const raf = useRef(0);

  useEffect(() => {
    const cv = ref.current; if (!cv) return;
    const gl = cv.getContext("webgl", { alpha: true, premultipliedAlpha: false, antialias: false, powerPreference: "low-power" });
    if (!gl) return;

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    const prog = gl.createProgram()!;
    gl.attachShader(prog, compileShader(gl, gl.VERTEX_SHADER, VERT));
    gl.attachShader(prog, compileShader(gl, gl.FRAGMENT_SHADER, FRAG));
    gl.linkProgram(prog); gl.useProgram(prog);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1,1,-1,-1,1,1,1]), gl.STATIC_DRAW);
    const ap = gl.getAttribLocation(prog, "a_pos");
    gl.enableVertexAttribArray(ap);
    gl.vertexAttribPointer(ap, 2, gl.FLOAT, false, 0, 0);

    const uRes = gl.getUniformLocation(prog, "u_res");
    const uTime = gl.getUniformLocation(prog, "u_time");

    let w = 0, h = 0;
    const resize = () => {
      const dpr = Math.min(devicePixelRatio || 1, 1.5);
      const r = cv.getBoundingClientRect();
      const nw = Math.round(r.width * dpr), nh = Math.round(r.height * dpr);
      if (nw === w && nh === h) return;
      w = nw; h = nh; cv.width = w; cv.height = h; gl!.viewport(0, 0, w, h);
    };
    const ro = new ResizeObserver(resize); ro.observe(cv); resize();

    const t0 = performance.now();
    const frame = () => {
      resize();
      gl!.clearColor(0, 0, 0, 0); gl!.clear(gl!.COLOR_BUFFER_BIT);
      gl!.uniform2f(uRes, w, h);
      gl!.uniform1f(uTime, (performance.now() - t0) / 1000);
      gl!.drawArrays(gl!.TRIANGLE_STRIP, 0, 4);
      raf.current = requestAnimationFrame(frame);
    };
    raf.current = requestAnimationFrame(frame);
    return () => { cancelAnimationFrame(raf.current); ro.disconnect(); };
  }, []);

  return <canvas ref={ref} className={className} style={{ display: "block", width: "100%", height: "100%" }} />;
}
