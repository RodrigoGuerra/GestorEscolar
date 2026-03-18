import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialSchema1773785227636 implements MigrationInterface {
    name = 'InitialSchema1773785227636'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."invoices_status_enum" AS ENUM('PENDING', 'PAID', 'OVERDUE')`);
        await queryRunner.query(`CREATE TABLE "invoices" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "school_id" character varying NOT NULL, "student_id" character varying NOT NULL, "amount" numeric(10,2) NOT NULL, "due_date" date NOT NULL, "status" "public"."invoices_status_enum" NOT NULL DEFAULT 'PENDING', "payment_date" TIMESTAMP, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_668cef7c22a427fd822cc1be3ce" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "transactions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "school_id" character varying NOT NULL, "amount" numeric(12,2) NOT NULL, "type" character varying NOT NULL, "description" character varying NOT NULL, "relatedEntityId" character varying, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_a219afd8dd77ed80f5a862f1db9" PRIMARY KEY ("id"))`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "transactions"`);
        await queryRunner.query(`DROP TABLE "invoices"`);
        await queryRunner.query(`DROP TYPE "public"."invoices_status_enum"`);
    }

}
