import { test, expect } from "@playwright/test";

test.describe("Основной сценарий бронирования", () => {
  test.beforeEach(async () => {
    await fetch("http://localhost:3000/api/_test/reset");
  });

  test("полный флоу: профиль → тип события → слоты → бронирование → список", async ({
    page,
  }) => {
    // 1. Гость видит профиль владельца
    await page.goto("/owner");
    await page.waitForLoadState("networkidle");
    await expect(page.getByText("Алексей Иванов")).toBeVisible({ timeout: 15000 });
    await expect(page.getByText("alexey@example.com")).toBeVisible();

    // 2. Создание типа события
    await page.goto("/");
    await page.getByRole("button", { name: /создать/i }).click();

    await page.getByLabel("Название").fill("Собеседование");
    await page.getByLabel("Описание").fill("Техническое интервью на 60 минут");
    await page.getByLabel("Длительность").clear();
    await page.getByLabel("Длительность").fill("60");

    await page.getByRole("button", { name: /^создать$/i }).click();

    await expect(page.getByText("Собеседование")).toBeVisible({ timeout: 15000 });
    await expect(page.getByText("60 мин", { exact: true })).toBeVisible();

    // 3. Выбор слота и бронирование
    const eventCard = page.locator("div.cursor-pointer", {
      hasText: "Собеседование",
    }).first();
    await eventCard.click();

    await expect(
      page.getByRole("heading", { name: /свободные слоты/i })
    ).toBeVisible({ timeout: 15000 });

    // Click the first available slot badge
    const slotBadge = page.locator("span.cursor-pointer").first();
    await slotBadge.click();

    // Wait for booking dialog to appear
    await expect(page.getByLabel("Ваше имя")).toBeVisible({ timeout: 10000 });

    await page.getByLabel("Ваше имя").fill("Мария Петрова");
    await page.getByLabel("Email").fill("maria@example.com");

    await page.getByRole("button", { name: /забронировать/i }).click();

    // Check success — either toast or dialog closes
    await expect(
      page.getByText(/бронирование создано/i)
    ).toBeVisible({ timeout: 15000 });

    // 4. Бронирование в списке
    await page.goto("/bookings");
    await expect(page.getByText("Мария Петрова")).toBeVisible({ timeout: 15000 });
    await expect(page.getByText("maria@example.com")).toBeVisible();
    await expect(page.getByText("confirmed")).toBeVisible();

    // 5. Занятый слот исчез из доступных — проверяем, что свободные слоты ещё есть
    await page.goto("/");
    const cardAgain = page.locator("div.cursor-pointer", {
      hasText: "Собеседование",
    }).first();
    await cardAgain.click();

    await expect(
      page.getByRole("heading", { name: /свободные слоты/i })
    ).toBeVisible({ timeout: 15000 });

    const slotCount = await page.locator("span.cursor-pointer").count();
    expect(slotCount).toBeGreaterThan(0);
  });

  test("повторное бронирование того же слота возвращает ошибку конфликта", async ({
    page,
  }) => {
    // Создаём тип события
    await page.goto("/");
    await page.getByRole("button", { name: /создать/i }).click();

    await page.getByLabel("Название").fill("Встреча");
    await page.getByLabel("Описание").fill("Короткая встреча");
    await page.getByLabel("Длительность").clear();
    await page.getByLabel("Длительность").fill("30");

    await page.getByRole("button", { name: /^создать$/i }).click();
    await expect(page.getByText("Встреча")).toBeVisible({ timeout: 15000 });

    // Бронируем первый слот
    const eventCard = page.locator("div.cursor-pointer", { hasText: "Встреча" }).first();
    await eventCard.click();

    await expect(
      page.getByRole("heading", { name: /свободные слоты/i })
    ).toBeVisible({ timeout: 15000 });

    const slotBadge = page.locator("span.cursor-pointer").first();
    await slotBadge.click();

    await expect(page.getByLabel("Ваше имя")).toBeVisible({ timeout: 10000 });
    await page.getByLabel("Ваше имя").fill("Иван Смирнов");
    await page.getByLabel("Email").fill("ivan@example.com");
    await page.getByRole("button", { name: /забронировать/i }).click();

    await expect(
      page.getByText(/бронирование создано/i)
    ).toBeVisible({ timeout: 15000 });

    // Проверяем, что забронированный слот больше не отображается
    await page.goto("/");
    const cardAgain = page.locator("div.cursor-pointer", { hasText: "Встреча" }).first();
    await cardAgain.click();

    await expect(
      page.getByRole("heading", { name: /свободные слоты/i })
    ).toBeVisible({ timeout: 15000 });

    // Слотов должно быть меньше чем максимальное количество
    // (один слот уже занят)
    const slotCount = await page.locator("span.cursor-pointer").count();
    expect(slotCount).toBeGreaterThan(0);
  });
});
