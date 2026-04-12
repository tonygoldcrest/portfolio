declare module '*.yaml' {
  const data: import('./cv').Cv;
  export default data;
}
