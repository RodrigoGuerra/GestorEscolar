// apps/ms-academic/src/migrations/1748000000000-StudentSchoolManyToMany.ts
import { MigrationInterface, QueryRunner } from 'typeorm';

export class StudentSchoolManyToMany1748000000000 implements MigrationInterface {
  name = 'StudentSchoolManyToMany1748000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create join table
    await queryRunner.query(`
      CREATE TABLE "student_schools" (
        "student_id" uuid NOT NULL,
        "school_id"  uuid NOT NULL,
        CONSTRAINT "PK_student_schools" PRIMARY KEY ("student_id", "school_id")
      )
    `);
    await queryRunner.query(`CREATE INDEX "IDX_student_schools_student_id" ON "student_schools" ("student_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_student_schools_school_id"  ON "student_schools" ("school_id")`);
    await queryRunner.query(`
      ALTER TABLE "student_schools"
        ADD CONSTRAINT "FK_student_schools_student" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE CASCADE,
        ADD CONSTRAINT "FK_student_schools_school"  FOREIGN KEY ("school_id")  REFERENCES "schools"("id")  ON DELETE CASCADE
    `);

    // Migrate existing data
    await queryRunner.query(`
      INSERT INTO "student_schools" ("student_id", "school_id")
      SELECT "id", "school_id" FROM "students" WHERE "school_id" IS NOT NULL
    `);

    // Drop old FK and column
    await queryRunner.query(`ALTER TABLE "students" DROP CONSTRAINT "FK_aa8edc7905ad764f85924569647"`);
    await queryRunner.query(`ALTER TABLE "students" DROP COLUMN "school_id"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Restore column and FK
    await queryRunner.query(`ALTER TABLE "students" ADD COLUMN "school_id" uuid`);
    await queryRunner.query(`
      UPDATE "students" s
      SET "school_id" = (
        SELECT "school_id" FROM "student_schools" ss WHERE ss."student_id" = s."id" LIMIT 1
      )
    `);
    await queryRunner.query(`ALTER TABLE "students" ALTER COLUMN "school_id" SET NOT NULL`);
    await queryRunner.query(`
      ALTER TABLE "students"
        ADD CONSTRAINT "FK_aa8edc7905ad764f85924569647" FOREIGN KEY ("school_id") REFERENCES "schools"("id") ON DELETE NO ACTION
    `);

    // Drop new table
    await queryRunner.query(`ALTER TABLE "student_schools" DROP CONSTRAINT "FK_student_schools_student"`);
    await queryRunner.query(`ALTER TABLE "student_schools" DROP CONSTRAINT "FK_student_schools_school"`);
    await queryRunner.query(`DROP INDEX "IDX_student_schools_student_id"`);
    await queryRunner.query(`DROP INDEX "IDX_student_schools_school_id"`);
    await queryRunner.query(`DROP TABLE "student_schools"`);
  }
}
