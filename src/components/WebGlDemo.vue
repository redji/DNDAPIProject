<template>
  <div class="webgl-demo">
    <canvas ref="canvasRef" :width="width" :height="height" class="q-mt-md" />
  </div>
</template>

<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref } from 'vue';

const width = 400;
const height = 300;
const canvasRef = ref<HTMLCanvasElement | null>(null);
let gl: WebGLRenderingContext | null = null;
let program: WebGLProgram | null = null;
let buffer: WebGLBuffer | null = null;

function createShader(gl: WebGLRenderingContext, type: number, source: string): WebGLShader {
  const shader = gl.createShader(type);
  if (!shader) throw new Error('Failed to create shader');
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const info = gl.getShaderInfoLog(shader) || 'Unknown error';
    gl.deleteShader(shader);
    throw new Error('Could not compile shader: ' + info);
  }
  return shader;
}

function createProgram(gl: WebGLRenderingContext, vsSource: string, fsSource: string): WebGLProgram {
  const vs = createShader(gl, gl.VERTEX_SHADER, vsSource);
  const fs = createShader(gl, gl.FRAGMENT_SHADER, fsSource);
  const prog = gl.createProgram();
  if (!prog) throw new Error('Failed to create program');
  gl.attachShader(prog, vs);
  gl.attachShader(prog, fs);
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
    const info = gl.getProgramInfoLog(prog) || 'Unknown error';
    gl.deleteProgram(prog);
    throw new Error('Could not link program: ' + info);
  }
  gl.deleteShader(vs);
  gl.deleteShader(fs);
  return prog;
}

function init() {
  if (!canvasRef.value) return;
  gl = canvasRef.value.getContext('webgl');
  if (!gl) return;

  const vsSource = `
    attribute vec2 a_position;
    uniform vec2 u_resolution;
    void main() {
      vec2 zeroToOne = a_position / u_resolution;
      vec2 zeroToTwo = zeroToOne * 2.0;
      vec2 clipSpace = zeroToTwo - 1.0;
      gl_Position = vec4(clipSpace * vec2(1, -1), 0, 1);
    }
  `;

  const fsSource = `
    precision mediump float;
    uniform vec4 u_color;
    void main() {
      gl_FragColor = u_color;
    }
  `;

  program = createProgram(gl, vsSource, fsSource);
  gl.useProgram(program);

  buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);

  // Define a diamond (rotated square) to give a sense of a cube's face
  const cx = width / 2;
  const cy = height / 2;
  const r = 90; // radius from center to a vertex
  const vertices = new Float32Array([
    // first triangle
    cx, cy - r,
    cx + r, cy,
    cx, cy + r,
    // second triangle
    cx, cy + r,
    cx - r, cy,
    cx, cy - r,
  ]);
  gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

  const aPosition = gl.getAttribLocation(program, 'a_position');
  const uResolution = gl.getUniformLocation(program, 'u_resolution');
  const uColor = gl.getUniformLocation(program, 'u_color');

  gl.enableVertexAttribArray(aPosition);
  gl.vertexAttribPointer(aPosition, 2, gl.FLOAT, false, 0, 0);

  gl.uniform2f(uResolution, width, height);
  // subtle gradient-like effect via two draws with different colors
  gl.uniform4f(uColor, 0.12, 0.62, 0.95, 1.0);

  gl.viewport(0, 0, width, height);
  gl.clearColor(0.95, 0.95, 0.97, 1.0);
  gl.clear(gl.COLOR_BUFFER_BIT);
  gl.drawArrays(gl.TRIANGLES, 0, 6);
}

onMounted(() => {
  init();
});

onBeforeUnmount(() => {
  if (gl && buffer) gl.deleteBuffer(buffer);
  // program shaders were deleted after link
});
</script>

<style scoped>
.webgl-demo {
  display: flex;
  justify-content: center;
}
canvas {
  border: 1px solid #e0e0e0;
  border-radius: 6px;
}
</style>


