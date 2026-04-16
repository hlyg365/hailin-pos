import { defineConfig } from '@tarojs/cli';

const config = {
  projectName: 'hailin-mini-store',
  date: '2024-01-15',
  designWidth: 750,
  deviceRatio: {
    640: 2.34 / 2,
    750: 1,
    828: 1.81 / 2,
  },
  sourceRoot: 'src',
  outputRoot: 'dist',
  plugins: [
    ['@tarojs/plugin-react'],
  ],
  defineConstants: {},
  h5: {
    publicPath: '/',
    staticDirectory: 'static',
    router: {
      mode: 'hash',
    },
  },
  weapp: {
    addGlobalClass: true,
  },
};

export default defineConfig(config);
