function createShader(
  gl: WebGL2RenderingContext,
  type: GLenum,
  source: string,
): WebGLShader | null {
  const shader = gl.createShader(type);
  if (!shader) {
    return null;
  }
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    return shader;
  }
  console.log(gl.getShaderInfoLog(shader));
  gl.deleteShader(shader);
  return null;
}

function createProgram(
  gl: WebGL2RenderingContext,
  vertexShader: WebGLShader,
  fragmentShader: WebGLShader,
): WebGLProgram | null {
  const program = gl.createProgram();
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);
  if (gl.getProgramParameter(program, gl.LINK_STATUS)) {
    return program;
  }
  console.log(gl.getProgramInfoLog(program));
  gl.deleteProgram(program);
  return null;
}

export class GlProgram<U extends string> {
  readonly program: WebGLProgram;
  readonly vao: WebGLVertexArrayObject;
  readonly uniforms: Record<U, WebGLUniformLocation | null>;
  private readonly gl: WebGL2RenderingContext;

  constructor(
    gl: WebGL2RenderingContext,
    vertSrc: string,
    fragSrc: string,
    uniformNames: readonly U[],
  ) {
    const vert = createShader(gl, gl.VERTEX_SHADER, vertSrc);
    const frag = createShader(gl, gl.FRAGMENT_SHADER, fragSrc);
    if (!vert || !frag) {
      throw new Error('Failed to compile shaders');
    }

    const program = createProgram(gl, vert, frag);
    if (!program) {
      throw new Error('Failed to link program');
    }

    const vao = gl.createVertexArray();
    if (!vao) {
      throw new Error('Failed to create VAO');
    }

    this.gl = gl;
    this.program = program;
    this.vao = vao;
    this.uniforms = Object.fromEntries(
      uniformNames.map((name) => [name, gl.getUniformLocation(program, name)]),
    ) as Record<U, WebGLUniformLocation | null>;
  }

  use() {
    this.gl.useProgram(this.program);
    this.gl.bindVertexArray(this.vao);
  }

  destroy() {
    this.gl.deleteProgram(this.program);
    this.gl.deleteVertexArray(this.vao);
  }
}
