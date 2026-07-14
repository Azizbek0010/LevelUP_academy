import { pool } from '../../../config/db.js';

/** Текущий долг студента (student_profiles.total_debt). */
export async function getTotalDebt(studentId) {
  const { rows: [row] } = await pool.query(
    `SELECT total_debt FROM student_profiles WHERE user_id = $1`,
    [studentId],
  );
  return row?.total_debt ?? 0;
}

/** Группы студента (активное членство) с ФИО ментора. */
export async function getGroupsForStudent(studentId) {
  const { rows } = await pool.query(
    `SELECT g.id, g.name, g.subject,
            m.first_name AS mentor_first_name, m.last_name AS mentor_last_name
       FROM group_students gs
       JOIN groups g ON g.id = gs.group_id AND g.deleted_at IS NULL
       JOIN users m ON m.id = g.mentor_id
      WHERE gs.student_id = $1 AND gs.left_at IS NULL
      ORDER BY g.name`,
    [studentId],
  );
  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    subject: r.subject,
    mentorName: `${r.mentor_first_name} ${r.mentor_last_name}`,
  }));
}
