import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialSchema1773785116043 implements MigrationInterface {
    name = 'InitialSchema1773785116043'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "users" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "email" character varying NOT NULL, "google_id" character varying, "name" character varying, "role" character varying NOT NULL DEFAULT 'student', "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "tenant_mappings" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "user_id" uuid NOT NULL, "franchise_schema" character varying NOT NULL, "school_id" character varying NOT NULL, "role" character varying NOT NULL, CONSTRAINT "PK_da02e0f199b95f14f0177d03f92" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "tenant_mappings" ADD CONSTRAINT "FK_6f47b6180e0d3b284d6ff7da906" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "tenant_mappings" DROP CONSTRAINT "FK_6f47b6180e0d3b284d6ff7da906"`);
        await queryRunner.query(`DROP TABLE "tenant_mappings"`);
        await queryRunner.query(`DROP TABLE "users"`);
    }

}
