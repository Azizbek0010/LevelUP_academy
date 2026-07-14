/**
 * Add 'methodist' role to user_role enum.
 * Methodist — создаёт методики, тесты, задания для групп.
 * Не имеет доступа к финансовой информации.
 */
export const up = (pgm) => {
  pgm.sql(`ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'methodist'`);
};

export const down = (pgm) => {
  // PostgreSQL не позволяет удалять значения из enum без пересоздания типа.
  // Для отката потребуется:
  //   ALTER TYPE user_role RENAME TO user_role_old;
  //   CREATE TYPE user_role AS ENUM ('main_admin','superadmin','admin','mentor','parent','student');
  //   ALTER TABLE users ALTER COLUMN role TYPE user_role USING role::text::user_role;
  //   DROP TYPE user_role_old;
  pgm.sql(`ALTER TYPE user_role RENAME TO user_role_old;
    CREATE TYPE user_role AS ENUM ('main_admin','superadmin','admin','mentor','parent','student');
    ALTER TABLE users ALTER COLUMN role TYPE user_role USING role::text::user_role;
    DROP TYPE user_role_old;`);
};
