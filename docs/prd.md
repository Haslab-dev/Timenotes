Product Requirement Document (PRD) — TimeNotes (Revised with Repository + IndexedDB)

1. Product Overview

TimeNotes adalah aplikasi web stunning & modern untuk pencatatan timesheet by project, notes ide, tagging aktivitas, serta basic analytics, dengan arsitektur frontend-first.
Arsitektur data menggunakan Repository pattern dengan IndexedDB, agar fleksibel mengganti BaaS/API tanpa memodifikasi implementasi UI.

⸻

2. Goals
	•	Menyediakan pencatatan timesheet & notes yang cepat.
	•	Menyediakan laporan & analytics dasar.
	•	Membuat arsitektur decoupled, sehingga backend dapat diganti dengan mudah.
	•	Memastikan skalabilitas untuk integrasi BaaS atau API custom.

⸻

3. Target Users
	•	Freelancer, startup kecil, personal productivity users.

⸻

4. Core Features (MVP)

4.1 Timesheet
	•	CRUD Project (nama, deskripsi, warna/tag).
	•	Input waktu manual (start–end, durasi).
	•	Tagging aktivitas.
	•	Ringkasan jam per hari/minggu/bulan.

4.2 Notes / Idea
	•	CRUD notes.
	•	Opsional: kaitkan dengan project.
	•	Filter by project/tag.

4.3 Dashboard & Analytics
	•	Ringkasan minggu ini: total jam, top project, ide terbaru.
	•	Chart:
	•	Jam per project.
	•	Jam per tag/kategori.
	•	Top 3 project teratas.

4.4 Export
	•	Export CSV/PDF (dibuat di frontend).

4.5 User Management
	•	Auth melalui BaaS (Email/Password, optional OAuth).
	•	Profile sederhana.

⸻

5. Technical Architecture

Repository Pattern
	•	Semua akses data lewat Repository layer (ProjectRepository, TimesheetRepository, NoteRepository, TagRepository).
	•	Repository memutus UI dari detail implementasi (BaaS/API/DB).
	•	Bisa plug-in BaaS apapun (Supabase/Firebase/Appwrite) tanpa ubah UI.

IndexedDB Cache
	•	Data disimpan ke IndexedDB agar:
	•	Offline-first.
	•	Sync otomatis saat online.
	•	TanStack Query tetap dipakai untuk fetch + cache state, tapi source utama lewat Repository.

Flow

UI → Repository → (IndexedDB cache + Remote API/BaaS)
	•	Read: ambil dari IndexedDB, sync ke remote.
	•	Write: simpan ke IndexedDB, kirim ke remote jika online.

⸻

6. Technical Requirements
	•	Frontend: React + Vite + Tailwind + Shadcn UI.
	•	Routing: React Router v6.
	•	Data layer: TanStack Query + Repository pattern.
	•	Storage: IndexedDB (via Dexie.js atau localforage).
	•	Charts: Recharts / Chart.js.
	•	Export: PDF/CSV di client.

⸻

7. KPIs / Success Metrics
	•	Persentase operasi berhasil disimpan offline.
	•	Jumlah jam & notes per user.
	•	Engagement dashboard analytics.
	•	Export laporan per user.