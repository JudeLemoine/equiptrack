import Database from "better-sqlite3"
import { readFileSync } from "fs"
import { join } from "path"
import { randomUUID } from "crypto"

const dbPath = join(process.cwd(), "dev.db")
const db = new Database(dbPath)

const schemaSQL = readFileSync(join(__dirname, "..", "db", "schema.sql"), "utf-8")
db.exec(schemaSQL)

try { db.exec("ALTER TABLE User ADD COLUMN passwordHash TEXT") } catch { /* already exists */ }

export function generateId(): string {
  return randomUUID()
}

export function toDbBool(value: boolean | undefined | null): number | undefined {
  if (value === undefined || value === null) return undefined
  return value ? 1 : 0
}

export function fromDbBool(value: number | null | undefined): boolean {
  return value === 1
}

export function toDbDate(value: Date | string | null | undefined): string | null {
  if (!value) return null
  if (value instanceof Date) return value.toISOString()
  return new Date(value).toISOString()
}

export function fromDbDate(value: string | null | undefined): Date | null {
  if (!value) return null
  return new Date(value)
}

export default db
