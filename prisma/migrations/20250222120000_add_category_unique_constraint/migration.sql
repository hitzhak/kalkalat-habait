-- Add unique constraint on Category (name, type, parentId, householdId)
-- Use COALESCE for NULLs so PostgreSQL enforces uniqueness for system categories (householdId=null)
-- Drop existing index if present (e.g. from db push with standard null-allowing unique)
DROP INDEX IF EXISTS "Category_name_type_parentId_householdId_key";
CREATE UNIQUE INDEX "Category_name_type_parentId_householdId_key" ON "Category" ("name", "type", COALESCE("parentId", ''), COALESCE("householdId"::text, ''));
