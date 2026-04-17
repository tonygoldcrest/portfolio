emcc -o ../../../public/wasm/particle-system/wasm.js index.cpp -s WASM=1 \
  -s NO_EXIT_RUNTIME=1 -O3 \
  -s INITIAL_MEMORY=2000mb -s DISABLE_EXCEPTION_CATCHING=1 \
  -s USE_PTHREADS=1 -s PTHREAD_POOL_SIZE=4 \
  -lembind \
  --emit-tsd ../../../src/pages/particle-system-webgl/wasm.d.ts
