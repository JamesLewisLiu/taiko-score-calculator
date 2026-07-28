import { defineConfig } from 'vite';

// Relative asset URLs let the same build work at both a user/organization Pages
// root and a repository Pages path such as /taiko-score-calculator/.
export default defineConfig({
  base: './',
});
