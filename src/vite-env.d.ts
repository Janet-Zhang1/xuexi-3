/// <reference types="vite/client" />

// 允许导入JSON文件
declare module '*.json' {
  const value: any;
  export default value;
}
