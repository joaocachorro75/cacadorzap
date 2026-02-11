import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  define: {
    // Garante que process.env.API_KEY esteja disponível sem quebrar o objeto process
    'process.env': {
      API_KEY: JSON.stringify(process.env.API_KEY || '')
    }
  }
});