# AutoZap OS — Production Checklist

## P0 — Security
- [x] API ownership / role checks на GET/PATCH/DELETE
- [x] Users API: не отдавать passwordHash; PATCH только ADMIN
- [x] Uploads: только через авторизованный API `/api/v1/catalogs/:id/file`
- [x] Сильные AUTH_SECRET / NEXTAUTH_SECRET
- [x] Demo-пароль только в NODE_ENV=development
- [x] Mass-assignment: whitelist полей на create/patch

## P0 — Микрологика
- [x] Импорт: preview → `mode=commit` реально создаёт записи
- [x] Create/Edit/Archive для всех сущностей меню
- [x] Конвертация лида через changeStatus (+ история)
- [x] Загрузка каталога: файл без смены статуса → потом changeStatus
- [x] Поиск case-insensitive (Postgres)
- [x] Export scoped для MANAGER
- [x] Import кнопки: лиды / компании / контакты
- [x] Bitrix export только для CRM-сущностей

## P1 — Качество
- [x] Archive scoped по роли
- [x] editHref → /edit для tasks/stores
- [x] UNAUTHORIZED → redirect /login
- [ ] Settings: создание пользователей (ADMIN) — следующий этап
- [ ] Dashboard KPI scoped для MANAGER — следующий этап
- [ ] Detail pages: server-side ownership assert — частично через actions/API

## P2
- [ ] E2E smoke suite
- [ ] Обновить ARCHITECTURE.md (Postgres)
- [ ] UI объединения дублей

## Smoke после деплоя
1. Login admin
2. Создать лид → сменить статус → конвертировать
3. Создать каталог → загрузить Excel → задача «Проверить каталог»
4. Импорт CSV лидов (preview + commit)
5. Экспорт CSV (менеджер видит только свои)
6. Архив → восстановить
7. Файл каталога недоступен без сессии
