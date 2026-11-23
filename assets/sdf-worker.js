/* Builds the 3D logo's signed-distance texture away from the page, so opening the site never freezes while it is made.
   In:  { id, mask (N x N bytes, 1 inside the logo), N, UNIT }
   Out: { id, out } where out is N x N half-float distances (negative inside), the same numbers the page used to compute itself. */
'use strict';
const f32 = new Float32Array(1), u32 = new Uint32Array(f32.buffer);
const toHalf = (v) => {
  f32[0] = v; const x = u32[0], sign = (x >> 16) & 0x8000; let e = ((x >> 23) & 0xff) - 112, m = x & 0x7fffff;
  if (e <= 0) { if (e < -10) return sign; m = (m | 0x800000) >> (1 - e); return sign | ((m + 0x1000) >> 13); }
  if (e >= 31) return sign | 0x7c00;
  return sign | ((e << 10) + ((m + 0x1000) >> 13));
};
const dt1 = (f, n, d, v, z) => {
  let k = 0; v[0] = 0; z[0] = -1e20; z[1] = 1e20;
  for (let q = 1; q < n; q++) { let s = ((f[q] + q * q) - (f[v[k]] + v[k] * v[k])) / (2 * q - 2 * v[k]); while (s <= z[k]) { k--; s = ((f[q] + q * q) - (f[v[k]] + v[k] * v[k])) / (2 * q - 2 * v[k]); } k++; v[k] = q; z[k] = s; z[k + 1] = 1e20; }
  k = 0; for (let q = 0; q < n; q++) { while (z[k + 1] < q) k++; d[q] = (q - v[k]) * (q - v[k]) + f[v[k]]; }
};
const edt = (g, N) => {
  const f = new Float64Array(N), d = new Float64Array(N), v = new Int32Array(N), z = new Float64Array(N + 1);
  for (let x = 0; x < N; x++) { for (let y = 0; y < N; y++) f[y] = g[y * N + x]; dt1(f, N, d, v, z); for (let y = 0; y < N; y++) g[y * N + x] = d[y]; }
  for (let y = 0; y < N; y++) { for (let x = 0; x < N; x++) f[x] = g[y * N + x]; dt1(f, N, d, v, z); for (let x = 0; x < N; x++) g[y * N + x] = d[x]; }
};
onmessage = (e) => {
  const { id, mask, N, UNIT } = e.data, A = new Float32Array(N * N), B = new Float32Array(N * N);
  for (let i = 0; i < N * N; i++) { const on = mask[i] === 1; A[i] = on ? 0 : 1e9; B[i] = on ? 1e9 : 0; }
  edt(A, N); edt(B, N);
  const sd = new Float32Array(N * N);
  for (let k = 0; k < N * N; k++) sd[k] = (mask[k] === 1 ? -(Math.sqrt(B[k]) - .5) : Math.sqrt(A[k]) - .5) * UNIT;
  const out = new Uint16Array(N * N);                                  /* one light blur keeps the gradient smooth, so the glass shows no facets */
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    let s = 0, n = 0; for (let j = -1; j <= 1; j++) for (let i = -1; i <= 1; i++) { const xx = x + i, yy = y + j; if (xx >= 0 && xx < N && yy >= 0 && yy < N) { s += sd[yy * N + xx]; n++; } }
    out[(N - 1 - y) * N + x] = toHalf(s / n);                          /* row 0 of a data texture is the bottom */
  }
  postMessage({ id, out }, [out.buffer]);
};
