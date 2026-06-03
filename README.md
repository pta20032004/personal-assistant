# Personal Assistant

Trợ lý cá nhân chạy local (Next.js + SQLite). Dùng một mình.

## Tính năng

- Đăng nhập bằng mật khẩu (lưu trong env, session ký bằng HMAC)
- To-do, Cuộc họp, Dự án (CRUD)
- Widget cổ phiếu HPG (TCBS API, cache 60s)
- Widget tin tức 24h (Google News RSS, cache 10 phút)

## Chạy lần đầu

```sh
# 1. Cài dependencies
pnpm install   # hoặc: npm install / yarn

# 2. Tạo .env.local từ mẫu
cp .env.example .env.local
# rồi mở ra sửa OWNER_PASSWORD và SESSION_SECRET

# 3. Khởi tạo DB SQLite
pnpm prisma migrate deploy
# hoặc nhanh hơn: pnpm prisma db push

# 4. Chạy
pnpm dev
```

Mở `http://localhost:3000` rồi đăng nhập bằng `OWNER_PASSWORD` đã set.

## Triển khai

Có thể chạy trên một VPS bất kỳ:

```sh
pnpm build
pnpm start
```

Vercel cũng được, nhưng SQLite không phù hợp serverless. Nếu muốn lên Vercel,
đổi `provider = "postgresql"` trong `prisma/schema.prisma` và migration tương ứng.

## Cấu trúc

```
app/                # Next.js App Router
  (protected)/      # Mọi route cần đăng nhập
    dashboard/      # Trang chính
    projects/       # Danh sách + chi tiết dự án
  login/            # Trang đăng nhập
  api/              # Route handlers (REST đơn giản)
components/         # React Client Components
lib/
  db.ts             # Prisma singleton
  session.ts        # HMAC-signed session cookie
  services/         # CRUD + Zod validation
  integrations/     # HPG (TCBS) + News (Google RSS)
prisma/
  schema.prisma
  migrations/
middleware.ts       # Chặn route khi chưa đăng nhập
```
