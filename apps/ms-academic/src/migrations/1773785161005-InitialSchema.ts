import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1773785161005 implements MigrationInterface {
  name = 'InitialSchema1773785161005';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "schools" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "cnpj" character varying NOT NULL, "is_matrix" boolean NOT NULL DEFAULT false, "parent_school_id" uuid, CONSTRAINT "UQ_32fbaf4feccea51ef7aeefa62bb" UNIQUE ("name"), CONSTRAINT "UQ_f59797a609614dd6c2931216e6a" UNIQUE ("cnpj"), CONSTRAINT "PK_95b932e47ac129dd8e23a0db548" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "subjects" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "workload" integer NOT NULL, "syllabus" text, "matrix_id" character varying, CONSTRAINT "UQ_47a287fe64bd0e1027e603c335c" UNIQUE ("name"), CONSTRAINT "PK_1a023685ac2b051b4e557b0b280" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "students" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "email" character varying NOT NULL, "cpf" character varying NOT NULL, "phone" character varying NOT NULL DEFAULT '', "birth_date" TIMESTAMP NOT NULL, "enrollment_number" character varying NOT NULL, "enrollment_date" TIMESTAMP NOT NULL DEFAULT now(), "status" character varying NOT NULL DEFAULT 'ACTIVE', "street" character varying, "number" character varying, "complement" character varying, "neighborhood" character varying, "city" character varying, "state" character varying, "zip_code" character varying, "guardian_name" character varying, "guardian_cpf" character varying, "guardian_email" character varying, "guardian_phone" character varying, "school_id" uuid NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_25985d58c714a4a427ced57507b" UNIQUE ("email"), CONSTRAINT "UQ_f6fb3427bdbd16321776573d176" UNIQUE ("cpf"), CONSTRAINT "UQ_bdae944fe70952b25d3b4d8234c" UNIQUE ("enrollment_number"), CONSTRAINT "PK_7d7f07271ad4ce999880713f05e" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "classes" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "year" integer NOT NULL, "school_id" uuid NOT NULL, CONSTRAINT "PK_e207aa15404e9b2ce35910f9f7f" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "grades" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "student_id" character varying NOT NULL, "class_id" character varying NOT NULL, "subject_id" uuid NOT NULL, "score" numeric(5,2) NOT NULL, "term" character varying NOT NULL, CONSTRAINT "PK_4740fb6f5df2505a48649f1687b" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "student_classes" ("student_id" uuid NOT NULL, "class_id" uuid NOT NULL, CONSTRAINT "PK_72cb908330b0e7eac3846c0998b" PRIMARY KEY ("student_id", "class_id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_09b94eccbdedd86b77d54daaeb" ON "student_classes" ("student_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_250de2754beaff18091a60a665" ON "student_classes" ("class_id") `,
    );
    await queryRunner.query(
      `ALTER TABLE "schools" ADD CONSTRAINT "FK_d5ca45f47960ba1d5487271aad7" FOREIGN KEY ("parent_school_id") REFERENCES "schools"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "students" ADD CONSTRAINT "FK_aa8edc7905ad764f85924569647" FOREIGN KEY ("school_id") REFERENCES "schools"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "classes" ADD CONSTRAINT "FK_398f3990f5da4a1efda173f576f" FOREIGN KEY ("school_id") REFERENCES "schools"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "grades" ADD CONSTRAINT "FK_ae1618ce22f07ef3e5e51d4c9e8" FOREIGN KEY ("subject_id") REFERENCES "subjects"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "student_classes" ADD CONSTRAINT "FK_09b94eccbdedd86b77d54daaeb8" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "student_classes" ADD CONSTRAINT "FK_250de2754beaff18091a60a6654" FOREIGN KEY ("class_id") REFERENCES "classes"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "student_classes" DROP CONSTRAINT "FK_250de2754beaff18091a60a6654"`,
    );
    await queryRunner.query(
      `ALTER TABLE "student_classes" DROP CONSTRAINT "FK_09b94eccbdedd86b77d54daaeb8"`,
    );
    await queryRunner.query(
      `ALTER TABLE "grades" DROP CONSTRAINT "FK_ae1618ce22f07ef3e5e51d4c9e8"`,
    );
    await queryRunner.query(
      `ALTER TABLE "classes" DROP CONSTRAINT "FK_398f3990f5da4a1efda173f576f"`,
    );
    await queryRunner.query(
      `ALTER TABLE "students" DROP CONSTRAINT "FK_aa8edc7905ad764f85924569647"`,
    );
    await queryRunner.query(
      `ALTER TABLE "schools" DROP CONSTRAINT "FK_d5ca45f47960ba1d5487271aad7"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_250de2754beaff18091a60a665"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_09b94eccbdedd86b77d54daaeb"`,
    );
    await queryRunner.query(`DROP TABLE "student_classes"`);
    await queryRunner.query(`DROP TABLE "grades"`);
    await queryRunner.query(`DROP TABLE "classes"`);
    await queryRunner.query(`DROP TABLE "students"`);
    await queryRunner.query(`DROP TABLE "subjects"`);
    await queryRunner.query(`DROP TABLE "schools"`);
  }
}
