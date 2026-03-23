import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    open: true,
    proxy: {
      '/nio-api': {
        target: 'https://app.nio.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/nio-api/, ''),
        configure: (proxy, _options) => {
          proxy.on('error', (err, _req, _res) => {
            console.log('proxy error', err);
          });
          proxy.on('proxyReq', (proxyReq, req, _res) => {
            // Set all headers exactly matching the provided request
            proxyReq.setHeader('Host', 'app.nio.com');
            proxyReq.setHeader('Connection', 'keep-alive');
            proxyReq.setHeader('Accept', 'application/json,text/json,text/plain');
            proxyReq.setHeader('User-Agent', 'VehicleWidgetExtension/6.3.0 (com.do1.WeiLaiApp.NIOVehicleWidget; build:2586; iOS 26.3.1) Alamofire/5.9.1');
            proxyReq.setHeader('Authorization', 'Bearer 2.0IkLw1IayXSA5CD32/1MdpTe9sF9zhR5BPmTEA3a2JX0=');
            proxyReq.setHeader('Accept-Language', 'zh-CN,zh-Hans;q=0.9');
            proxyReq.setHeader('Accept-Encoding', 'br;q=1.0, gzip;q=0.9, deflate;q=0.8');
            proxyReq.setHeader('Cookie', 'tgw_l7_route=a04be5dbb97cb60b12f67e9e82427cf4');
          });
        },
      },
    },
  },
})
