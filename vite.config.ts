import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: { sourcemap: true },
  // Оставляем исходные модули RxJS доступными для пошаговой отладки.
  optimizeDeps: { exclude: ['rxjs', 'rxjs/operators'] },
  test: { environment: 'node', include: ['src/tests/**/*.test.ts'], restoreMocks: true },
});
