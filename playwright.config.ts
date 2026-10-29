import {defineConfig} from '@playwright/test';
export default defineConfig({
 testDir:'apps/web/tests/e2e',
 timeout:60000,
 use:{baseURL:'http://127.0.0.1:5173',headless:true},
 webServer:{command:'npm run dev --workspace @local-tools/web -- --host 127.0.0.1',url:'http://127.0.0.1:5173',timeout:120000,reuseExistingServer:false},
 reporter:'list',
});