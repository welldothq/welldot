import vue from '@vitejs/plugin-vue';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  // Compiles the .vue components under test (app/components/content)
  plugins: [vue()],
  resolve: {
    alias: {
      '~': fileURLToPath(new URL('./app', import.meta.url)),
      '#shared': fileURLToPath(new URL('./shared', import.meta.url)),
    },
  },
  test: {
    environment: 'happy-dom',
    // Only scan source folders: discovery hangs on the build output (.output, .nuxt, .data)
    include: [
      '{app,shared,remark,rehype,content-hooks,server,scripts}/**/*.test.ts',
    ],
  },
});
