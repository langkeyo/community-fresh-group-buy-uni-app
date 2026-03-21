/** @type {import('tailwindcss').Config} */
module.exports = {
  // 指定Tailwind扫描的文件路径
  content: [
    './index.html',
    './src/**/*.{vue,js,ts,jsx,tsx}' // 覆盖src下的所有vue/ts文件
  ],
  // 禁用预加载（避免小程序样式体积过大）
  corePlugins: {
    preflight: false // 关闭默认的浏览器样式重置（UniApp已有默认样式）
  },
  // 适配小程序，自定义主题（声线团购暖橙/浅绿主色）
  theme: {
    extend: {
      // 匹配小程序主题色
      colors: {
        primary: '#F08800', // 暖橙（主色：导航栏/按钮）
        secondary: '#E8F5E9', // 浅绿（辅助色：商品卡片背景）
        fresh: '#2f5233' // 深绿（文字/强调色）
      },
      // 适配小程序rpx单位（UniApp适配方案）
      spacing: {
        1: '4rpx',
        2: '8rpx',
        3: '12rpx',
        4: '16rpx',
        5: '20rpx',
        6: '24rpx',
        7: '28rpx',
        8: '32rpx',
        9: '36rpx',
        10: '40rpx',
        12: '48rpx',
        14: '56rpx',
        16: '64rpx',
        20: '80rpx',
        24: '96rpx',
        32: '128rpx',
        40: '160rpx',
        48: '192rpx',
        64: '256rpx'
      },
      fontSize: {
        // 小程序常用字号（rpx）
        xs: '20rpx',
        sm: '24rpx',
        base: '28rpx',
        lg: '32rpx',
        xl: '36rpx',
        '2xl': '40rpx'
      }
    }
  },
  plugins: []
}
