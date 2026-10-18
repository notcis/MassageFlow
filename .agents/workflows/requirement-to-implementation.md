---
description: วิเคราะห์ Requirement, Workflow, Business Logic หรือ Idea ตาม Rules.md วางแผน รอการยืนยัน พัฒนา ตรวจสอบ ทดสอบ และสรุปผลอย่างเป็นระบบ
---

# Requirement to Implementation Workflow

## Purpose

ใช้ Workflow นี้เมื่อผู้ใช้ส่ง Requirement, Workflow, Business Logic, Idea, Feature Request, Bug Fix หรือคำขอปรับปรุง UX/UI

เป้าหมายคือเปลี่ยนความต้องการของผู้ใช้ให้เป็นแผนพัฒนาที่ชัดเจน ปลอดภัย สอดคล้องกับ `Rules.md` และต้องได้รับการยืนยันก่อนเริ่มแก้ไขโค้ด

## Mandatory Process

```text
User Input
  → 1. Read Rules.md
  → 2. Analysis
  → 3. Implementation Plan
  → 4. Wait for User Confirmation
  → 5. Implement
  → 6. Validation
  → 7. Testing
  → 8. Summary
```

> ห้ามข้ามขั้นตอน และห้ามเริ่ม Implement ก่อนผู้ใช้ยืนยันแผนอย่างชัดเจน

---

## Phase 1: Read Rules.md

### Objective

อ่าน `Rules.md` ก่อนเริ่มวิเคราะห์ทุกครั้ง เพื่อให้การทำงานเป็นไปตามมาตรฐาน สถาปัตยกรรม ความปลอดภัย และข้อจำกัดของโปรเจกต์

### Actions

- อ่าน `Rules.md` ทั้งหมด
- ระบุข้อกำหนดที่เกี่ยวข้องกับงาน
- ตรวจสอบ Tech Stack, route structure, authentication, authorization, database, environment variables และ Docker
- ตรวจสอบว่าคำขอขัดกับ Rules หรือไม่
- หากไม่มี `Rules.md` ให้แจ้งผู้ใช้และขออนุญาตสร้างหรือกำหนดมาตรฐานก่อนดำเนินงาน

### Output

```md
## Rules Review

- **Status:** Read
- **Relevant Rules:** [รายการ rules ที่เกี่ยวข้อง]
- **Constraints:** [ข้อจำกัดสำคัญ]
- **Approach:** [สรุปแนวทาง]
```

---

## Phase 2: Analysis

### Objective

วิเคราะห์ User Input ให้กลายเป็นขอบเขตงาน, user flow, business rules, validation และผลกระทบต่อระบบอย่างชัดเจน

### Actions

- สรุปความเข้าใจจากคำขอของผู้ใช้
- ระบุเป้าหมายและผลลัพธ์ที่ต้องการ
- วิเคราะห์ user flow ตั้งแต่เริ่มต้นจนจบ
- ระบุ business rules และ validation rules
- ระบุ edge cases, risks และข้อผิดพลาดที่อาจเกิดขึ้น
- ตรวจสอบผลกระทบต่อ UI, Server Actions, TanStack Query, Prisma, MySQL, Better Auth, UploadThing และ Docker ตามความเกี่ยวข้อง
- หากข้อมูลไม่เพียงพอ ให้ถามคำถามที่จำเป็นก่อนวางแผน

### Analysis Checklist

- ผู้ใช้กลุ่มใดใช้งาน feature นี้
- ต้อง login หรือมี role ใดจึงใช้งานได้
- ข้อมูลใดถูกสร้าง, แก้ไข, ลบ หรือแสดงผล
- ต้องเปลี่ยน Prisma schema หรือสร้าง migration หรือไม่
- ต้องใช้ Server Action หรือ Route Handler หรือไม่
- ต้องใช้ TanStack Query สำหรับ client-side cache หรือ mutation หรือไม่
- ต้องมี loading, empty, error, success และ confirmation state หรือไม่
- มีข้อมูลสำคัญที่ต้องป้องกันหรือไม่
- มี environment variable ใหม่หรือไม่
- มีผลกระทบกับ route ใต้ `app/admin` หรือไม่

### Output

```md
## Analysis

### Understanding

- **Goal:** [เป้าหมาย]
- **Scope:** [ขอบเขตงาน]
- **Expected Result:** [ผลลัพธ์]

### User Flow

1. [ขั้นตอน]
2. [ขั้นตอน]
3. [ขั้นตอน]

### Business Rules

- [Business rule]
- [Business rule]

### Validation Rules

- [Validation rule]
- [Validation rule]

### Impacted Areas

- **UI/UX:** [รายละเอียด]
- **Server Actions/API:** [รายละเอียด]
- **Database/Prisma:** [รายละเอียด]
- **Authentication/Authorization:** [รายละเอียด]
- **External Services:** [รายละเอียด]

### Risks and Edge Cases

- [รายการ]

### Clarifications Needed

- [คำถาม หรือ None]
```

---

## Phase 3: Implementation Plan

### Objective

สร้างแผนพัฒนาที่ละเอียดพอให้ผู้ใช้ตรวจสอบและยืนยันได้ โดยยังห้ามเริ่มเขียนหรือแก้ไขโค้ด

### Actions

- แยกงานเป็นลำดับที่นำไปทำได้จริง
- ระบุไฟล์ที่จะ Create, Update หรือ Delete
- ระบุ Prisma schema, migration และ data migration หากเกี่ยวข้อง
- ระบุ Server Actions, query hooks, mutation hooks และ UI components ที่เกี่ยวข้อง
- ระบุการตรวจสอบ Better Auth และ role/permission
- ระบุ environment variables ที่จำเป็น
- ระบุ validation และ test scenarios
- ระบุ temporary files ที่อาจต้องสร้าง และยืนยันว่าจะลบหลังใช้เสร็จ
- ห้าม hardcode domain, URL, secret หรือ credential

### Output

```md
## Implementation Plan

### Proposed Changes

1. **[Feature/Module]**
   - **File:** `[path/to/file.ts]`
   - **Action:** Create / Update / Delete
   - **Changes:** [รายละเอียด]
   - **Reason:** [เหตุผล]

2. **[Feature/Module]**
   - **File:** `[path/to/file.tsx]`
   - **Action:** Create / Update / Delete
   - **Changes:** [รายละเอียด]
   - **Reason:** [เหตุผล]

### Database Plan

- **Schema Change:** [รายละเอียด หรือ None]
- **Migration Required:** Yes / No
- **Data Migration:** [รายละเอียด หรือ None]

### Security Plan

- **Authentication:** [รายละเอียด]
- **Authorization/RBAC:** [รายละเอียด]
- **Input Validation:** [รายละเอียด]
- **Environment Variables:** [รายการ หรือ None]

### UI/UX Plan

- **Responsive Design:** [รายละเอียด]
- **Loading State:** [รายละเอียด]
- **Empty State:** [รายละเอียด]
- **Error State:** [รายละเอียด]
- **Success Feedback:** [รายละเอียด]
- **Confirmation Dialog:** [รายละเอียด หรือ None]

### Validation Plan

- [รายการ]

### Testing Plan

- [รายการ]

### Temporary Files

- [รายการ หรือ None]

## Confirmation Required

โปรดยืนยันแผนด้วยคำว่า **ยืนยัน**, **Proceed**, **เริ่มทำได้**, **อนุมัติแผน** หรือแจ้งสิ่งที่ต้องการปรับ
```

---

## Phase 4: Wait for User Confirmation

### Mandatory Rules

- หยุดการทำงานหลังแสดง Implementation Plan
- ห้ามสร้าง แก้ไข หรือลบไฟล์ก่อนผู้ใช้ยืนยัน
- ห้ามรัน migration, seed, script หรือคำสั่งที่เปลี่ยนข้อมูลก่อนผู้ใช้ยืนยัน
- หากผู้ใช้ขอปรับแผน ให้กลับไปทำ Analysis และ Implementation Plan ใหม่
- เริ่ม Phase 5 ได้เมื่อผู้ใช้ยืนยันอย่างชัดเจนเท่านั้น

### Accepted Confirmations

- `ยืนยัน`
- `Proceed`
- `เริ่มทำได้`
- `อนุมัติแผน`
- `ทำตามแผนนี้`

---

## Phase 5: Implement

### Objective

พัฒนาตามแผนที่ได้รับอนุมัติ โดยยึด `Rules.md` เป็นข้อบังคับ

### Actions

- Implement เฉพาะงานตามแผนที่ผู้ใช้ยืนยัน
- ใช้ Next.js App Router และ Server Actions ตามมาตรฐานโปรเจกต์
- ใช้ Prisma ORM สำหรับการเข้าถึง MySQL
- ตรวจสอบ authentication และ authorization ก่อนเข้าถึงหรือแก้ไขข้อมูล
- ใช้ TanStack Query สำหรับ client-side server state, caching และ mutation เมื่อเหมาะสม
- ใช้ shadcn/ui, Tailwind CSS และ Flat Design
- ทำ responsive design สำหรับ mobile, tablet และ desktop
- เก็บ static values ที่ใช้ซ้ำใน `lib/constants.ts`
- เก็บ domain, URL, secret และ credential ใน `.env` เท่านั้น
- อัปเดต `.env.example` เมื่อมี environment variable ใหม่
- ลบ mock data, debug script และ temporary file เมื่อใช้งานเสร็จ

### Output

```md
## Implementation

### Completed Changes

- [รายการงานที่ทำเสร็จ]

### Files Created

- `[path/to/file]`

### Files Updated

- `[path/to/file]`

### Files Deleted

- `[path/to/file]`

### Database Changes

- [รายละเอียด หรือ None]

### Environment Changes

- [รายละเอียด หรือ None]

### Temporary Files Cleanup

- [รายการที่ลบแล้ว หรือ None]
```

---

## Phase 6: Validation

### Objective

ตรวจสอบว่า implementation ตรงตาม Requirement, Business Logic และ Rules ของโปรเจกต์

### Validation Checklist

- ตรวจสอบ TypeScript errors
- ตรวจสอบ lint errors
- ตรวจสอบ input validation ทุก form และ Server Action
- ตรวจสอบ authentication และ authorization
- ตรวจสอบ protected routes ใน `app/admin`
- ตรวจสอบ Prisma query, relation, transaction และ migration
- ตรวจสอบว่าไม่มี secret, credential, URL หรือ domain ถูก hardcode
- ตรวจสอบ `.env` และ `.env.example`
- ตรวจสอบ responsive design
- ตรวจสอบ loading, empty, error, success และ disabled states
- ตรวจสอบ accessibility เบื้องต้น เช่น semantic HTML, label, focus state และ keyboard navigation
- ตรวจสอบ `.gitignore` และ `.dockerignore` หากมีไฟล์หรือ dependency ใหม่
- ตรวจสอบว่า temporary files ถูกลบแล้ว

### Output

```md
## Validation

| Item                    | Status      | Notes        |
| ----------------------- | ----------- | ------------ |
| Rules Compliance        | Pass / Fail | [รายละเอียด] |
| TypeScript / Lint       | Pass / Fail | [รายละเอียด] |
| Input Validation        | Pass / Fail | [รายละเอียด] |
| Authentication          | Pass / Fail | [รายละเอียด] |
| Authorization / RBAC    | Pass / Fail | [รายละเอียด] |
| Database / Prisma       | Pass / Fail | [รายละเอียด] |
| Environment Security    | Pass / Fail | [รายละเอียด] |
| Responsive UI           | Pass / Fail | [รายละเอียด] |
| UX States               | Pass / Fail | [รายละเอียด] |
| Temporary Files Cleanup | Pass / Fail | [รายละเอียด] |
```

---

## Phase 7: Testing

### Objective

ทดสอบตาม user flow, business logic และกรณีผิดพลาดที่สำคัญ

### Required Test Scenarios

- **Happy Path:** ผู้ใช้ดำเนินการตามขั้นตอนปกติได้สำเร็จ
- **Invalid Input:** ระบบปฏิเสธข้อมูลที่ไม่ครบหรือไม่ถูกต้อง
- **Unauthenticated:** ผู้ใช้ที่ยังไม่ได้ login ไม่สามารถเข้าถึงข้อมูลหรือ action ที่ป้องกันไว้
- **Unauthorized:** ผู้ใช้ที่ไม่มี role หรือ permission ไม่สามารถทำ admin action
- **Empty State:** UI แสดงผลเหมาะสมเมื่อไม่มีข้อมูล
- **Error Handling:** ระบบจัดการ database, Server Action หรือ external service error ได้อย่างเหมาะสม
- **Responsive UI:** หน้าจอใช้งานได้บน mobile, tablet และ desktop
- **Regression:** ฟังก์ชันเดิมที่ได้รับผลกระทบยังทำงานได้

### Rules

- หาก Test ไม่ผ่าน ต้องแก้ไขและทดสอบซ้ำ
- ห้ามสรุปว่างานเสร็จสมบูรณ์หากมี test สำคัญที่ยังไม่ผ่าน
- ลบไฟล์ทดสอบชั่วคราวทันทีหลังทดสอบเสร็จ

### Output

```md
## Testing

| Scenario             | Expected Result | Result   | Status      |
| -------------------- | --------------- | -------- | ----------- |
| Happy Path           | [ผลที่คาดหวัง]  | [ผลจริง] | Pass / Fail |
| Invalid Input        | [ผลที่คาดหวัง]  | [ผลจริง] | Pass / Fail |
| Unauthenticated User | [ผลที่คาดหวัง]  | [ผลจริง] | Pass / Fail |
| Unauthorized User    | [ผลที่คาดหวัง]  | [ผลจริง] | Pass / Fail |
| Empty State          | [ผลที่คาดหวัง]  | [ผลจริง] | Pass / Fail |
| Error Handling       | [ผลที่คาดหวัง]  | [ผลจริง] | Pass / Fail |
| Responsive UI        | [ผลที่คาดหวัง]  | [ผลจริง] | Pass / Fail |
| Regression           | [ผลที่คาดหวัง]  | [ผลจริง] | Pass / Fail |
```

---

## Phase 8: Summary

### Objective

สรุปสิ่งที่ทำ ผลการตรวจสอบ ผลการทดสอบ และงานที่ผู้ใช้ต้องดำเนินการต่อ

### Output

```md
## Summary

### Completed

- [รายการงานที่เสร็จ]

### Key Changes

- [การเปลี่ยนแปลงสำคัญ]

### Database and Environment

- **Database Migration:** Required / Not Required
- **Environment Variables:** [รายการ หรือ None]

### Validation Result

- **Status:** Pass / Fail
- **Notes:** [รายละเอียด]

### Testing Result

- **Status:** Pass / Fail
- **Passed Scenarios:** [รายการ]
- **Failed Scenarios:** [รายการ หรือ None]

### Cleanup

- **Temporary Files Removed:** Yes / No
- **Remaining Actions:** [รายการ หรือ None]

### User Action Required

- [เช่น ตั้งค่า .env, รัน migration, restart Docker หรือ None]
```

---

## Non-Negotiable Rules

- ต้องอ่าน `Rules.md` ก่อนเริ่ม Analysis ทุกครั้ง
- ต้องทำ Analysis และ Implementation Plan ก่อนเขียนโค้ด
- ต้องรอ User Confirmation ก่อนเริ่ม Implement
- ต้องตรวจสอบ authentication, authorization และ input validation เสมอ
- ต้องใช้ `.env` สำหรับ domain, URL, secret และ credential
- ห้าม hardcode ข้อมูลลับหรือค่าที่ขึ้นกับ environment
- ต้องเก็บ static values ที่ใช้ซ้ำใน `lib/constants.ts`
- ต้องลบ temporary script, mock data, fixture, debug file และไฟล์ทดสอบที่ไม่จำเป็นทันทีหลังใช้งาน
- ต้องทำ Validation และ Testing ก่อนสรุปผล
- หากมี test สำคัญไม่ผ่าน ต้องแก้ไขและทดสอบซ้ำก่อนปิดงาน