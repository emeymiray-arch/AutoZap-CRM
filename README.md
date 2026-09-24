# AutoZap OS

Внутренняя операционная система компании AutoZap: CRM + операционка партнёров, каталогов и магазинов.

## Быстрый старт

```bash
npm install
npx prisma db push
npm run db:seed
npm run dev
```

Откройте http://localhost:3000

### Демо-пользователи

| Email | Пароль | Роль |
|-------|--------|------|
| admin@autozap.local | admin123 | Администратор |
| lead@autozap.local | admin123 | Руководитель |
| manager@autozap.local | admin123 | Менеджер |

## Архитектура

См. [ARCHITECTURE.md](./ARCHITECTURE.md)

## База данных

Продакшен / общая БД: **Neon Postgres**.

1. Создайте проект на [console.neon.tech](https://console.neon.tech)
2. Скопируйте **Connection string** ( pooled / Prisma )
3. Положите в `.env`:

```env
DATABASE_URL="postgresql://...@...neon.tech/neondb?sslmode=require"
```

4. Примените схему и сиды:

```bash
npx prisma db push
npm run db:seed
```

Локальный SQLite больше не используется — одна схема Postgres для всех окружений.


## API

CRUD: `/api/v1/{companies|contacts|leads|deals|partners|catalogs|stores|tasks|users}`

- `POST .../:id/archive` — архив
- `POST .../:id/restore` — восстановление
- `DELETE .../:id` — физическое удаление (только ADMIN, объект должен быть в архиве)
- `GET /api/v1/export?entity=leads&format=csv|xlsx|bitrix24`
- `POST /api/v1/import?entity=leads&mode=preview|commit`
- `GET /api/v1/search?q=`
- `POST /api/v1/catalogs/:id/upload`
