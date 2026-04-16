// TypeScript bindings for emscripten-generated code.  Automatically generated at compile time.
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
interface WasmModule {}

interface EmbindModule {
  stop(): void;
  deleteHeavyParticles(): void;
  createParticles(
    _0: number,
    _1: number,
    _2: number,
    _3: number,
    _4: number,
  ): void;
  respawn(_0: number, _1: number, _2: number, _3: number): void;
  spawnEmpty(_0: number, _1: number, _2: number, _3: number, _4: number): void;
  explosion(_0: number, _1: number, _2: number): void;
  createHeavyParticles(_0: number, _1: number, _2: number): void;
  calcCoordinates(
    _0: number,
    _1: number,
    _2: number,
    _3: boolean,
    _4: number,
    _5: number,
    _6: number,
    _7: boolean,
    _8: boolean,
    _9: boolean,
  ): Float32Array;
}

export type MainModule = WasmModule & EmbindModule;
