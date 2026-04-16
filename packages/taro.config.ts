/**
 * Taro 配置文件
 * 用于多端编译配置
 */
export default {
  // 项目名称
  projectName: 'hailin-pos',
  
  // 源码目录
  sourceRoot: 'src',
  
  // 输出目录
  outputRoot: 'dist',
  
  // 设计稿尺寸
  designWidth: 750,
  deviceRatio: {
    640: 2.34 / 2,
    750: 1,
    828: 1.81 / 2,
  },
  
  // 需要编译的源码文件类型
  sourceType: ['ts', 'tsx', 'js', 'jsx', 'json'],
  
  // 编译目标平台
  targets: ['weapp', 'h5', 'rn'],
  
  // 插件
  plugins: [],
  
  // 微信小程序配置
  weapp: {
    compile: {
      exclude: ['src/**/*.wx.ts'],
    },
  },
  
  // H5配置
  h5: {
    publicPath: '/',
    staticDirectory: 'static',
    postcss: {
      autoprefixer: {
        enable: true,
        config: {},
      },
    },
  },
  
  // React Native配置
  rn: {
    appName: 'HaiLinPOS',
    bundleFile: 'index.android.bundle',
  },
  
  // 别名
  alias: {
    '@': './src',
    '@hailin/core': '../../packages/core/src',
    '@hailin/product': '../../packages/product/src',
    '@hailin/cart': '../../packages/cart/src',
    '@hailin/order': '../../packages/order/src',
    '@hailin/member': '../../packages/member/src',
    '@hailin/payment': '../../packages/payment/src',
    '@hailin/promotion': '../../packages/promotion/src',
    '@hailin/hardware': '../../packages/hardware/src',
  },
};
