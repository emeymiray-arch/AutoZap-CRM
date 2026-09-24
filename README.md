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

Продакшен: **Neon Postgres** + **Data API** + **Neon Auth**.

```bash
neon link --project-id falling-silence-26638843 --branch production -y
neon env pull -s postgres,auth,data-api
npx prisma db push && npm run db:seed
```

| Переменная | Назначение |
|------------|------------|
| `DATABASE_URL` | Prisma / CRM (основной путь) |
| `NEON_DATA_API_URL` | PostgREST REST `…/neondb/rest/v1` |
| `NEON_AUTH_BASE_URL` | JWT для Data API |
| `NEON_AUTH_JWKS_URL` | JWKS Neon Auth |

Статус Data API: `GET /api/v1/neon/status` (нужна сессия AutoZap).

Клиент: `src/lib/neon-data-api.ts` (`@neondatabase/postgrest-js`).


## API

CRUD: `/api/v1/{companies|contacts|leads|deals|partners|catalogs|stores|tasks|users}`

- `POST .../:id/archive` — архив
- `POST .../:id/restore` — восстановление
- `DELETE .../:id` — физическое удаление (только ADMIN, объект должен быть в архиве)
- `GET /api/v1/export?entity=leads&format=csv|xlsx|bitrix24`
- `POST /api/v1/import?entity=leads&mode=preview|commit`
- `GET /api/v1/search?q=`
- `POST /api/v1/catalogs/:id/upload`
