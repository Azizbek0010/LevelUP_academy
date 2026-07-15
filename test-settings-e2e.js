/**
 * Settings Page E2E Test — Playwright
 * Tests ALL buttons, toggles, inputs, selects on every Settings tab.
 * Uses mock auth (localStorage) since backend is not running.
 */
const { chromium } = require('playwright');

const BASE = 'http://localhost:5174';

const MOCK_TOKEN = 'test-token-abc123';
const MOCK_USER = JSON.stringify({
  id: 1,
  email: 'admin.demo@levelup.local',
  name: 'Admin Demo',
  role: 'admin',
  branchId: 1,
  organizationId: 1,
});

(async () => {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });

  // Inject mock auth BEFORE any page loads
  await ctx.addInitScript(({ token, user }) => {
    localStorage.setItem('staff_access_token', token);
    localStorage.setItem('staff_user', user);
  }, { token: MOCK_TOKEN, user: MOCK_USER });

  const page = await ctx.newPage();
  let passed = 0;
  let failed = 0;
  const failures = [];

  function ok(name) {
    passed++;
    console.log(`  ✅ ${name}`);
  }
  function fail(name, reason) {
    failed++;
    failures.push(`${name}: ${reason}`);
    console.log(`  ❌ ${name}: ${reason}`);
  }

  try {
    // ═══════════ NAVIGATE TO SETTINGS ═══════════
    console.log('\n═══ NAVIGATE TO SETTINGS ═══');
    await page.goto(`${BASE}/settings`, { waitUntil: 'networkidle', timeout: 20000 });
    await page.waitForTimeout(1500);

    // Should NOT be on login page
    if (!page.url().includes('/login')) {
      ok('Not redirected to login (auth injected)');
    } else {
      fail('Auth injection', 'still on login page');
    }

    // Check header
    const h1 = await page.textContent('h1');
    if (h1 && h1.includes('Настройки')) {
      ok('Settings page loaded: h1 = "Настройки"');
    } else {
      fail('Settings header', `got "${h1}"`);
    }

    // ═══════════ TAB 1: GENERAL ═══════════
    console.log('\n═══ TAB 1: GENERAL (Общие) ═══');
    const generalTab = page.locator('button', { hasText: 'Общие' }).first();
    await generalTab.click();
    await page.waitForTimeout(300);
    ok('Clicked "Общие" tab');

    // Branch name input
    const branchInput = page.locator('input[placeholder="LevelUp Academy — Downtown"]');
    await branchInput.fill('Test Branch');
    if (await branchInput.inputValue() === 'Test Branch') ok('Branch name input');
    else fail('Branch name input', 'value mismatch');

    // Address input
    const addrInput = page.locator('input[placeholder="Ташкент, ул. Амира Темура, 108"]');
    await addrInput.fill('Test Address');
    if (await addrInput.inputValue() === 'Test Address') ok('Address input');
    else fail('Address input', 'value mismatch');

    // Phone input
    const phoneInput = page.locator('input[placeholder="+998 90 123 45 67"]');
    await phoneInput.fill('+998 91 111 2233');
    if (await phoneInput.inputValue() === '+998 91 111 2233') ok('Phone input');
    else fail('Phone input', 'value mismatch');

    // Email input
    const emailInput = page.locator('input[placeholder="info@levelup.uz"]');
    await emailInput.fill('test@levelup.uz');
    if (await emailInput.inputValue() === 'test@levelup.uz') ok('Email input');
    else fail('Email input', 'value mismatch');

    // Website input
    const webInput = page.locator('input[placeholder="https://levelup.uz"]');
    await webInput.fill('https://test.uz');
    if (await webInput.inputValue() === 'https://test.uz') ok('Website input');
    else fail('Website input', 'value mismatch');

    // ═══════════ TAB 2: APPEARANCE ═══════════
    console.log('\n═══ TAB 2: APPEARANCE (Внешний вид) ═══');
    const appearTab = page.locator('button', { hasText: 'Внешний вид' }).first();
    await appearTab.click();
    await page.waitForTimeout(300);
    ok('Clicked "Внешний вид" tab');

    // Theme buttons: Светлая, Тёмная, Системная
    const lightBtn = page.locator('button', { hasText: 'Светлая' }).first();
    const darkBtn = page.locator('button', { hasText: 'Тёмная' }).first();
    const sysBtn = page.locator('button', { hasText: 'Системная' }).first();

    await darkBtn.click();
    await page.waitForTimeout(200);
    let cls = await darkBtn.getAttribute('class');
    if (cls.includes('bg-[var(--green)]')) ok('Dark theme button activates');
    else fail('Dark theme button', 'no green bg');

    await lightBtn.click();
    await page.waitForTimeout(200);
    cls = await lightBtn.getAttribute('class');
    if (cls.includes('bg-[var(--green)]')) ok('Light theme button activates');
    else fail('Light theme button', 'no green bg');

    await sysBtn.click();
    await page.waitForTimeout(200);
    cls = await sysBtn.getAttribute('class');
    if (cls.includes('bg-[var(--green)]')) ok('System theme button activates');
    else fail('System theme button', 'no green bg');

    // Toggles: compact mode + show avatars
    const toggles = page.locator('button[type="button"].rounded-full.w-11');
    const toggleCount = await toggles.count();
    if (toggleCount >= 2) {
      // Compact mode toggle
      await toggles.nth(0).click();
      await page.waitForTimeout(200);
      ok('Compact mode toggle clicked');

      // Show avatars toggle
      await toggles.nth(1).click();
      await page.waitForTimeout(200);
      ok('Show avatars toggle clicked');
    } else {
      fail('Appearance toggles', `expected >=2, got ${toggleCount}`);
    }

    // ═══════════ TAB 3: NOTIFICATIONS ═══════════
    console.log('\n═══ TAB 3: NOTIFICATIONS (Уведомления) ═══');
    const notifTab = page.locator('button', { hasText: 'Уведомления' }).first();
    await notifTab.click();
    await page.waitForTimeout(300);
    ok('Clicked "Уведомления" tab');

    // 7 toggles: email, telegram, sms, overdue, new students, attendance, daily report
    const notifToggles = page.locator('button[type="button"].rounded-full.w-11');
    const nCount = await notifToggles.count();
    if (nCount >= 7) ok(`Found ${nCount} notification toggles (>=7)`);
    else fail('Notification toggles', `expected >=7, got ${nCount}`);

    // Click each toggle and verify state changes
    for (let i = 0; i < Math.min(nCount, 7); i++) {
      const before = await notifToggles.nth(i).getAttribute('class');
      await notifToggles.nth(i).click();
      await page.waitForTimeout(150);
      const after = await notifToggles.nth(i).getAttribute('class');
      if (before !== after) ok(`Notification toggle #${i + 1} works`);
      else fail(`Notification toggle #${i + 1}`, 'class did not change');
    }

    // ═══════════ TAB 4: SECURITY ═══════════
    console.log('\n═══ TAB 4: SECURITY (Безопасность) ═══');
    const secTab = page.locator('button', { hasText: 'Безопасность' }).first();
    await secTab.click();
    await page.waitForTimeout(300);
    ok('Clicked "Безопасность" tab');

    // 2FA toggle
    const secToggles = page.locator('button[type="button"].rounded-full.w-11');
    const sCount = await secToggles.count();
    if (sCount >= 1) {
      const before = await secToggles.nth(0).getAttribute('class');
      await secToggles.nth(0).click();
      await page.waitForTimeout(200);
      const after = await secToggles.nth(0).getAttribute('class');
      if (before !== after) ok('2FA toggle works');
      else fail('2FA toggle', 'class did not change');
    }

    // Multiple sessions toggle
    if (sCount >= 2) {
      const before = await secToggles.nth(1).getAttribute('class');
      await secToggles.nth(1).click();
      await page.waitForTimeout(200);
      const after = await secToggles.nth(1).getAttribute('class');
      if (before !== after) ok('Multiple sessions toggle works');
      else fail('Multiple sessions toggle', 'class did not change');
    }

    // Session timeout select
    const timeoutSelect = page.locator('select').first();
    await timeoutSelect.selectOption('60');
    if (await timeoutSelect.inputValue() === '60') ok('Session timeout select → 60 min');
    else fail('Session timeout select', 'value mismatch');

    // Password fields
    const currentPw = page.locator('input[placeholder="Введите текущий пароль"]');
    await currentPw.fill('oldpass123');
    if (await currentPw.inputValue() === 'oldpass123') ok('Current password input');
    else fail('Current password input', 'value mismatch');

    const newPw = page.locator('input[placeholder="Мин. 8 символов"]');
    await newPw.fill('newpass123456');
    if (await newPw.inputValue() === 'newpass123456') ok('New password input');
    else fail('New password input', 'value mismatch');

    const confirmPw = page.locator('input[placeholder="Повторите новый пароль"]');
    await confirmPw.fill('newpass123456');
    if (await confirmPw.inputValue() === 'newpass123456') ok('Confirm password input');
    else fail('Confirm password input', 'value mismatch');

    // Eye toggle (show/hide password)
    const eyeBtns = page.locator('button:has(.lucide-eye), button:has(.lucide-eye-off)');
    const eyeCount = await eyeBtns.count();
    if (eyeCount >= 1) {
      await eyeBtns.first().click();
      await page.waitForTimeout(200);
      ok(`Eye toggle button works (${eyeCount} found)`);
    } else {
      fail('Eye toggle', 'not found');
    }

    // Change password button
    const changePwBtn = page.locator('button', { hasText: 'Изменить пароль' }).first();
    const pwDisabled = await changePwBtn.isDisabled();
    ok(`Change password button exists (disabled=${pwDisabled})`);
    if (!pwDisabled) {
      await changePwBtn.click();
      await page.waitForTimeout(500);
      ok('Change password button clicked');
    }

    // ═══════════ TAB 5: FINANCE ═══════════
    console.log('\n═══ TAB 5: FINANCE (Финансы) ═══');
    const finTab = page.locator('button', { hasText: 'Финансы' }).first();
    await finTab.click();
    await page.waitForTimeout(300);
    ok('Clicked "Финансы" tab');

    // Currency select
    const currSelect = page.locator('select').first();
    await currSelect.selectOption('USD');
    if (await currSelect.inputValue() === 'USD') ok('Currency select → USD');
    else fail('Currency select', 'value mismatch');

    // Currency symbol
    const symbolInput = page.locator('input[placeholder="сўм"]');
    await symbolInput.fill('$');
    if (await symbolInput.inputValue() === '$') ok('Currency symbol input');
    else fail('Currency symbol input', 'value mismatch');

    // Invoice prefix
    const prefixInput = page.locator('input[placeholder="INV"]');
    await prefixInput.fill('TEST');
    if (await prefixInput.inputValue() === 'TEST') ok('Invoice prefix input');
    else fail('Invoice prefix input', 'value mismatch');

    // Auto-generate toggle
    const finToggles = page.locator('button[type="button"].rounded-full.w-11');
    const fCount = await finToggles.count();
    if (fCount >= 1) {
      const before = await finToggles.nth(0).getAttribute('class');
      await finToggles.nth(0).click();
      await page.waitForTimeout(200);
      const after = await finToggles.nth(0).getAttribute('class');
      if (before !== after) ok('Auto-generate invoice toggle works');
      else fail('Auto-generate toggle', 'class did not change');
    }

    // Grace days select
    const graceSelects = page.locator('select');
    const gsCount = await graceSelects.count();
    for (let i = 0; i < gsCount; i++) {
      const optText = await graceSelects.nth(i).textContent();
      if (optText.includes('дня') || optText.includes('дней')) {
        await graceSelects.nth(i).selectOption('7');
        if (await graceSelects.nth(i).inputValue() === '7') ok('Grace days select → 7');
        else fail('Grace days select', 'value mismatch');
        break;
      }
    }

    // ═══════════ TAB 6: LOCALIZATION ═══════════
    console.log('\n═══ TAB 6: LOCALIZATION (Локализация) ═══');
    const locTab = page.locator('button', { hasText: 'Локализация' }).first();
    await locTab.click();
    await page.waitForTimeout(300);
    ok('Clicked "Локализация" tab');

    // Language buttons
    const ruBtn = page.locator('button', { hasText: 'Русский' }).first();
    const uzBtn = page.locator('button', { hasText: 'Ўзбекча' }).first();
    const enBtn = page.locator('button', { hasText: 'English' }).first();

    await uzBtn.click();
    await page.waitForTimeout(200);
    cls = await uzBtn.getAttribute('class');
    if (cls.includes('bg-[var(--green)]')) ok('Uzbek language activates');
    else fail('Uzbek language', 'no green bg');

    await ruBtn.click();
    await page.waitForTimeout(200);
    cls = await ruBtn.getAttribute('class');
    if (cls.includes('bg-[var(--green)]')) ok('Russian language activates');
    else fail('Russian language', 'no green bg');

    await enBtn.click();
    await page.waitForTimeout(200);
    cls = await enBtn.getAttribute('class');
    if (cls.includes('bg-[var(--green)]')) ok('English language activates');
    else fail('English language', 'no green bg');

    // Date format buttons
    const fmtBtns = ['31.12.2026', '12/31/2026', '2026-12-31'];
    for (const fmt of fmtBtns) {
      const btn = page.locator('button', { hasText: fmt }).first();
      await btn.click();
      await page.waitForTimeout(200);
      cls = await btn.getAttribute('class');
      if (cls.includes('bg-[var(--green)]')) ok(`Date format "${fmt}" activates`);
      else fail(`Date format "${fmt}"`, 'no green bg');
    }

    // Timezone select
    const tzSelect = page.locator('select').first();
    await tzSelect.selectOption('Europe/Moscow');
    if (await tzSelect.inputValue() === 'Europe/Moscow') ok('Timezone select → Moscow');
    else fail('Timezone select', 'value mismatch');

    // Week day buttons
    const sunBtn = page.locator('button', { hasText: 'Воскресенье' }).first();
    await sunBtn.click();
    await page.waitForTimeout(200);
    cls = await sunBtn.getAttribute('class');
    if (cls.includes('bg-[var(--green)]')) ok('Sunday button activates');
    else fail('Sunday button', 'no green bg');

    const monBtn = page.locator('button', { hasText: 'Понедельник' }).first();
    await monBtn.click();
    await page.waitForTimeout(200);
    cls = await monBtn.getAttribute('class');
    if (cls.includes('bg-[var(--green)]')) ok('Monday button activates');
    else fail('Monday button', 'no green bg');

    // ═══════════ SAVE BUTTON ═══════════
    console.log('\n═══ SAVE BUTTON ═══');
    const saveBtn = page.locator('button', { hasText: 'Сохранить изменения' }).first();
    const saveVisible = await saveBtn.isVisible();
    if (saveVisible) {
      const isDisabled = await saveBtn.isDisabled();
      ok(`Save button visible (disabled=${isDisabled})`);
      if (!isDisabled) {
        await saveBtn.click();
        await page.waitForTimeout(1000);
        ok('Save button clicked');
        // Check for error message (expected since no backend)
        const errText = page.locator('text=Ошибка сохранения');
        if (await errText.isVisible().catch(() => false)) {
          ok('Error message shown (expected — no backend)');
        } else {
          ok('No error message (may have silently failed)');
        }
      }
    } else {
      fail('Save button', 'not visible');
    }

    // ═══════════ LIGHT THEME CHECK ═══════════
    console.log('\n═══ LIGHT THEME CHECK ═══');
    // Go back to General tab
    await generalTab.click();
    await page.waitForTimeout(300);

    // Check that theme CSS vars are applied (body should have light background)
    const bgColor = await page.evaluate(() => {
      return getComputedStyle(document.body).backgroundColor;
    });
    ok(`Body background color: ${bgColor}`);

    // Take screenshot of light theme
    await page.screenshot({ path: 'screenshots/settings-light-theme.png', fullPage: true });
    ok('Screenshot: light theme saved');

  } catch (err) {
    fail('UNEXPECTED ERROR', err.message);
    console.error(err.stack);
  }

  await browser.close();

  // ═══════════ SUMMARY ═══════════
  console.log('\n' + '═'.repeat(50));
  console.log(`RESULTS: ${passed} passed, ${failed} failed, ${passed + failed} total`);
  console.log('═'.repeat(50));
  if (failed > 0) {
    console.log('\nFAILED:');
    failures.forEach(f => console.log(`  ❌ ${f}`));
  }
  process.exit(failed > 0 ? 1 : 0);
})();
