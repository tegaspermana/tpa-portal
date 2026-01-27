
PRAGMA foreign_keys = ON;

-- users
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('admin','teacher','wali')),
    full_name TEXT NOT NULL,
    phone TEXT,
    active INTEGER DEFAULT 1,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT
);

-- santri
CREATE TABLE IF NOT EXISTS santri (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nis TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    birth_date TEXT,
    guardian_name TEXT,
    phone TEXT,
    active INTEGER DEFAULT 1,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT
);

-- wali <-> santri mapping
CREATE TABLE IF NOT EXISTS user_santri (
    user_id INTEGER NOT NULL,
    santri_id INTEGER NOT NULL,
    PRIMARY KEY (user_id, santri_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (santri_id) REFERENCES santri(id) ON DELETE CASCADE
);

-- classes
CREATE TABLE IF NOT EXISTS classes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    program TEXT,
    active INTEGER DEFAULT 1
);

-- santri class membership (historical)
CREATE TABLE IF NOT EXISTS santri_class_membership (
    santri_id INTEGER NOT NULL,
    class_id INTEGER NOT NULL,
    start_date TEXT NOT NULL,
    end_date TEXT,
    PRIMARY KEY (santri_id, class_id, start_date),
    FOREIGN KEY (santri_id) REFERENCES santri(id) ON DELETE CASCADE,
    FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE
);

-- class teachers
CREATE TABLE IF NOT EXISTS class_teachers (
    class_id INTEGER NOT NULL,
    teacher_user_id INTEGER NOT NULL,
    PRIMARY KEY (class_id, teacher_user_id),
    FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE,
    FOREIGN KEY (teacher_user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- bill templates per santri
CREATE TABLE IF NOT EXISTS bill_templates (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    santri_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    amount INTEGER NOT NULL,
    recurrence TEXT NOT NULL CHECK (recurrence IN ('monthly')),
    start_month TEXT NOT NULL,
    end_month TEXT,
    active INTEGER DEFAULT 1,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (santri_id) REFERENCES santri(id) ON DELETE CASCADE
);

-- bills
CREATE TABLE IF NOT EXISTS bills (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    santri_id INTEGER NOT NULL,
    period_year INTEGER NOT NULL,
    period_month INTEGER NOT NULL,
    template_id INTEGER,
    name TEXT NOT NULL,
    amount_due INTEGER NOT NULL,
    amount_paid INTEGER DEFAULT 0,
    status TEXT NOT NULL CHECK (status IN ('unpaid','partial','paid')) DEFAULT 'unpaid',
    created_at TEXT DEFAULT (datetime('now')),
    UNIQUE (santri_id, period_year, period_month, template_id),
    FOREIGN KEY (santri_id) REFERENCES santri(id) ON DELETE CASCADE
);

-- payments
CREATE TABLE IF NOT EXISTS payments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    santri_id INTEGER NOT NULL,
    payer_user_id INTEGER,
    payment_date TEXT DEFAULT (datetime('now')),
    method TEXT NOT NULL,
    total_amount INTEGER NOT NULL,
    receipt_no TEXT UNIQUE,
    notes TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (santri_id) REFERENCES santri(id) ON DELETE CASCADE,
    FOREIGN KEY (payer_user_id) REFERENCES users(id)
);

-- payment allocations
CREATE TABLE IF NOT EXISTS payment_allocations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    payment_id INTEGER NOT NULL,
    bill_id INTEGER NOT NULL,
    amount_applied INTEGER NOT NULL,
    FOREIGN KEY (payment_id) REFERENCES payments(id) ON DELETE CASCADE,
    FOREIGN KEY (bill_id) REFERENCES bills(id) ON DELETE CASCADE
);

-- receipt sequence
CREATE TABLE IF NOT EXISTS receipt_sequence (
    year_month TEXT PRIMARY KEY,
    last_seq INTEGER NOT NULL
);

-- progress
CREATE TABLE IF NOT EXISTS progress_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    santri_id INTEGER NOT NULL,
    date TEXT NOT NULL,
    teacher_user_id INTEGER NOT NULL,
    category TEXT NOT NULL,
    value TEXT NOT NULL,
    note TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (santri_id) REFERENCES santri(id) ON DELETE CASCADE,
    FOREIGN KEY (teacher_user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- teacher attendance
CREATE TABLE IF NOT EXISTS teacher_attendance (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    teacher_user_id INTEGER NOT NULL,
    date TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('hadir','izin','sakit','alpha')),
    note TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    UNIQUE (teacher_user_id, date),
    FOREIGN KEY (teacher_user_id) REFERENCES users(id) ON DELETE CASCADE
);
