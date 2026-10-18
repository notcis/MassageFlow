---
trigger: always_on
---

# Project Rules

## 1. Tech Stack
- Framework: Next.js เวอร์ชันล่าสุด โดยใช้ **App Router**
- Backend operations และ form mutations: **Next.js Server Actions**
- Client state, cache, optimistic update และ server-state: **TanStack Query**
- Database: **MySQL**
- ORM: **Prisma ORM**
- Authentication และ authorization: **Better Auth**
- Upload ไฟล์/รูปภาพ: **UploadThing**
- UI Components: **shadcn/ui**
- Styling: **Tailwind CSS**
- Deployment: Docker ด้วย `Dockerfile` และ `docker-compose.yml`

## 2. Core Principles
- ใช้ TypeScript แบบ strict เสมอ ห้ามใช้ `any` หากหลีกเลี่ยงได้
- เขียนโค้ดให้แยกความรับผิดชอบชัดเจน อ่านง่าย และนำกลับมาใช้ซ้ำได้
- หลีกเลี่ยงการ hardcode ค่าใด ๆ ที่อาจเปลี่ยนแปลงในอนาคต
- Static values ที่ใช้ซ้ำ เช่น ชื่อระบบ, คำอธิบาย, route path, pagination หรือข้อความกลาง ให้รวมไว้ที่ `lib/constants.ts`
- Domain, URL, API endpoint ภายนอก, secret, credential, database connection และ configuration ที่ขึ้นกับ environment ต้องเก็บใน `.env` เสมอ
- ห้ามเปิดเผยหรือ commit ค่า secret, token, password หรือ credential ลง Git
- ก่อนเพิ่ม dependency ใหม่ ให้ตรวจสอบก่อนว่ามี library ที่ติดตั้งอยู่แล้วรองรับหรือไม่

## 3. Environment Variables
- สร้าง `.env.example` เพื่อระบุชื่อตัวแปรที่จำเป็นโดยไม่มีข้อมูลลับ
- ตรวจสอบและ parse environment variables จากศูนย์กลาง เช่น `lib/env.ts`
- ห้ามเข้าถึง `process.env` กระจัดกระจายทั่วโปรเจกต์
- ใช้ prefix `NEXT_PUBLIC_` เฉพาะค่าที่อนุญาตให้เปิดเผยฝั่ง client เท่านั้น
- ตัวอย่างตัวแปรที่ควรอยู่ใน `.env`:

```env
DATABASE_URL="mysql://USER:PASSWORD@HOST:3306/DATABASE"
BETTER_AUTH_SECRET="replace-with-secure-secret"
BETTER_AUTH_URL="http://localhost:3000"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
UPLOADTHING_TOKEN="replace-with-uploadthing-token"
```

## 4. Recommended Structure
```text
app/
├── (public)/                 # Public routes สำหรับผู้ใช้ทั่วไป
│   ├── page.tsx
│   └── ...
├── admin/                    # Protected routes สำหรับผู้ดูแลระบบ
│   ├── layout.tsx
│   ├── page.tsx
│   └── ...
├── api/
│   ├── auth/
│   └── uploadthing/
├── layout.tsx
├── loading.tsx
├── error.tsx
├── not-found.tsx
└── globals.css

components/
├── ui/                       # shadcn/ui components
├── shared/                   # Component ที่ใช้ร่วมกัน
├── layouts/
└── features/                 # Component ตาม feature

lib/
├── auth.ts                   # Better Auth configuration
├── constants.ts              # APP_CONFIG, ROUTES และ static values
├── env.ts                    # Environment validation
├── prisma.ts                 # Prisma client singleton
├── query-client.ts
├── utils.ts
└── actions/                  # Server Actions แยกตาม feature

hooks/
├── queries/                  # TanStack Query hooks
├── mutations/
└── use-*.ts

prisma/
├── schema.prisma
├── migrations/
└── seed.ts

types/
├── index.ts
└── *.ts

public/
├── images/
└── icons/
```

## 5. Routing and Access Control
- Public routes สำหรับผู้ใช้ทั่วไปอยู่ภายใต้ `app/` หรือ `app/(public)/`
- Admin routes ต้องอยู่ภายใต้ `app/admin/`
- ทุก route ใน `app/admin/` ต้องตรวจสอบ session และ role ฝั่ง server ก่อน render
- ผู้ใช้ที่ไม่ได้ login ให้ redirect ไปหน้า login
- ผู้ใช้ที่ไม่มีสิทธิ์ admin ให้ redirect ไปหน้าที่เหมาะสมหรือแสดง Unauthorized
- ห้ามพึ่งพาการซ่อนปุ่มหรือเมนูฝั่ง client เป็น authorization เพียงอย่างเดียว
- กำหนด route path ส่วนกลางใน `lib/constants.ts`

```ts
export const ROUTES = {
  HOME: "/",
  LOGIN: "/login",
  ADMIN: "/admin",
  ADMIN_USERS: "/admin/users",
} as const;
```

## 6. Authentication and Authorization
- ใช้ Better Auth เป็นระบบ authentication หลัก
- ตรวจสอบ authentication และ authorization ใน Server Actions, Route Handlers และ protected pages ทุกครั้ง
- ตรวจสอบ role/permission ก่อนทำงานที่กระทบข้อมูลสำคัญ เช่น create, update, delete
- ห้ามส่งข้อมูลสำคัญของผู้ใช้อื่นกลับไปยัง client โดยไม่มีสิทธิ์
- เก็บ Better Auth secret และ URL ไว้ใน `.env` เท่านั้น

## 7. Database and Prisma
- ใช้ Prisma เป็นช่องทางหลักในการเข้าถึงฐานข้อมูล MySQL
- สร้าง Prisma client แบบ singleton ใน `lib/prisma.ts` เพื่อป้องกัน connection ซ้ำระหว่าง development
- แก้ไข schema ผ่าน `prisma/schema.prisma` และสร้าง migration ทุกครั้งเมื่อมีการเปลี่ยนโครงสร้างฐานข้อมูล
- ห้ามแก้ไข production database โดยตรงโดยไม่มี migration
- ใช้ transaction สำหรับงานที่แก้ไขหลายตารางและต้องสำเร็จพร้อมกัน
- กำหนด relation, index, unique constraint และ default value ให้เหมาะสมใน Prisma schema
- ห้ามส่ง Prisma model ทั้งก้อนให้ client หากมี field สำคัญ เช่น password hash, token หรือ internal metadata

## 8. Server Actions
- ใช้ Server Actions สำหรับ mutation เช่น create, update, delete และการ submit form
- Validate input ทุกครั้งก่อนเรียกใช้งาน database ด้วย schema validation เช่น Zod
- ตรวจสอบ session และ permission ภายใน Server Action เสมอ
- Server Action ต้องคืนค่ารูปแบบที่สม่ำเสมอ

```ts
type ActionResult<T> =
  | { success: true; data: T; message?: string }
  | { success: false; message: string; errors?: Record<string, string[]> };
```

- หลัง mutation ให้ revalidate path/tag ที่เกี่ยวข้อง และ sync cache ของ TanStack Query ตามความจำเป็น
- ห้ามเชื่อถือข้อมูลจาก client โดยไม่ validate

## 9. TanStack Query
- ใช้ TanStack Query สำหรับ client-side server state, caching, pagination, filtering และ optimistic updates
- กำหนด query key เป็นมาตรฐานและรวมไว้ตาม feature
- ใช้ `useQuery` สำหรับ read data และ `useMutation` สำหรับ mutation ฝั่ง client
- หลัง mutation ต้อง invalidate หรือ update query cache ที่เกี่ยวข้อง
- หลีกเลี่ยงการ fetch ข้อมูลซ้ำซ้อนระหว่าง Server Components และ Client Components
- ไม่ใช้ TanStack Query แทน local UI state เล็กน้อย เช่น modal open/close หรือ input state

## 10. UI/UX Rules
- UI ต้องเป็น **Responsive Design** รองรับ mobile, tablet และ desktop
- ใช้แนวทาง **Flat Design**: เรียบง่าย ชัดเจน ลดเงาหนักและองค์ประกอบเกินจำเป็น
- ใช้ shadcn/ui เป็นพื้นฐาน และปรับแต่งด้วย Tailwind CSS
- รักษาความสม่ำเสมอของสี, spacing, typography, border radius และ interaction
- ทุก form ต้องมี loading, success, error และ disabled state ที่เหมาะสม
- ทุก action สำคัญ เช่น ลบข้อมูล ต้องมี confirmation ก่อนดำเนินการ
- รองรับ accessibility: semantic HTML, label สำหรับ input, keyboard navigation, focus state และ aria attributes เมื่อจำเป็น
- รูปภาพต้องใช้ `next/image` เมื่อเหมาะสม และมี `alt` text เสมอ
- หน้า loading, error และ empty state ต้องชัดเจนและเป็นมิตรต่อผู้ใช้

## 11. UploadThing
- ใช้ UploadThing สำหรับจัดการการอัปโหลดไฟล์และรูปภาพ
- Validate ประเภทไฟล์, ขนาดไฟล์ และจำนวนไฟล์ทั้งฝั่ง client และ server
- ตรวจสอบสิทธิ์ผู้ใช้งานก่อนอนุญาตให้อัปโหลด
- ห้ามเชื่อถือ URL หรือ metadata ที่ client ส่งมาโดยไม่ validate
- ลบไฟล์ที่ไม่ถูกใช้งานเมื่อมีการลบหรือแทนที่ resource ที่เกี่ยวข้อง หากระบบรองรับ

## 12. Code Quality
- ตั้งชื่อไฟล์, function, variable และ component ให้สื่อความหมาย
- Component ใช้ PascalCase, function/variable ใช้ camelCase และ constant ใช้ UPPER_SNAKE_CASE เมื่อเหมาะสม
- แยก business logic ออกจาก UI component
- หลีกเลี่ยง component ขนาดใหญ่เกินไป ให้แยกย่อยตาม feature หรือ responsibility
- ใช้ server component เป็นค่าเริ่มต้น และเติม `"use client"` เฉพาะเมื่อจำเป็น
- ห้ามใส่ secret หรือ business logic สำคัญใน client component
- จัดการ error อย่างชัดเจน ห้ามกลืน error โดยไม่มีการ log หรือ feedback
- เพิ่ม comment เฉพาะส่วนที่มีเหตุผลหรือ logic ซับซ้อน ไม่ comment สิ่งที่โค้ดอธิบายตัวเองได้อยู่แล้ว

## 13. Constants
- เก็บ static values ที่ใช้ร่วมกันใน `lib/constants.ts`
- ตัวอย่าง: `APP_CONFIG`, `ROUTES`, `DEFAULT_PAGE_SIZE`, `USER_ROLES`, `ERROR_MESSAGES`
- ห้ามเก็บ secret, credential หรือ environment-specific value ไว้ใน constants

```ts
export const APP_CONFIG = {
  name: "Application Name",
  description: "Application description",
} as const;

export const DEFAULT_PAGE_SIZE = 20;
```

## 14. Docker
- ต้องมี `Dockerfile` สำหรับ build และ run production application
- ต้องมี `docker-compose.yml` สำหรับจัดการ application และ MySQL ใน local environment
- ใช้ multi-stage build เพื่อลดขนาด Docker image เมื่อเหมาะสม
- Configuration ทั้งหมดต้องรับผ่าน environment variables
- ห้าม hardcode domain, host, database URL หรือ secret ใน Dockerfile และ docker-compose.yml
- กำหนด healthcheck สำหรับ service สำคัญเมื่อเหมาะสม
- ตรวจสอบว่า Prisma migration ทำงานตามขั้นตอน deployment ที่กำหนด

## 15. Git and Ignore Files
- ต้องมี `.gitignore` และ `.dockerignore`
- `.gitignore` ต้องไม่ให้ commit อย่างน้อย: `.env`, `.env.local`, `node_modules`, `.next`, log files และ generated files ที่ไม่จำเป็น
- `.dockerignore` ต้องไม่ copy อย่างน้อย: `node_modules`, `.next`, `.git`, `.env`, log files และ test artifacts
- Commit ต้องมีขอบเขตชัดเจนและไม่รวมไฟล์ที่ไม่เกี่ยวข้อง

## 16. Temporary Files
- เมื่อสร้างไฟล์ชั่วคราวเพื่อทดสอบ เช่น script, mock data, fixture, debug file, export file หรือ temporary component ต้องลบทันทีหลังทดสอบเสร็จ
- ห้าม commit ไฟล์ชั่วคราวเข้าสู่ repository
- หาก mock data จำเป็นต่อ automated test ให้เก็บในตำแหน่ง test fixture ที่ชัดเจนและระบุวัตถุประสงค์

## 17. Pre-Completion Checklist
- ตรวจสอบ TypeScript errors และ lint errors
- ตรวจสอบ responsive UI บน mobile และ desktop
- ตรวจสอบ loading, error, empty และ success states
- ตรวจสอบ validation ทุก form
- ตรวจสอบ authorization ของ admin routes และ Server Actions
- ตรวจสอบว่าไม่มี hardcoded domain, URL, secret หรือ credential
- ตรวจสอบ `.env.example`, `.gitignore` และ `.dockerignore`
- ตรวจสอบ migration และ Prisma schema เมื่อมีการเปลี่ยนแปลง database
- ลบไฟล์ทดสอบและไฟล์ชั่วคราวทั้งหมดก่อนส่งงาน