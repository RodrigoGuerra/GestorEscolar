import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialSchema1773785196924 implements MigrationInterface {
    name = 'InitialSchema1773785196924'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "bank_details" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "employee_id" uuid NOT NULL, "bank_code" character varying NOT NULL, "agency" character varying NOT NULL, "account" character varying NOT NULL, "pix_key" character varying, CONSTRAINT "REL_3194c1ef98ce1a8b0556d85a41" UNIQUE ("employee_id"), CONSTRAINT "PK_ddbbcb9586b7f4d6124fe58f257" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "addresses" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "employee_id" uuid NOT NULL, "cep" character varying NOT NULL, "street" character varying NOT NULL, "number" character varying NOT NULL, "complement" character varying, "neighborhood" character varying NOT NULL, "city" character varying NOT NULL, "state" character varying NOT NULL, CONSTRAINT "REL_c9e1be43167f1b8e927f69b6b9" UNIQUE ("employee_id"), CONSTRAINT "PK_745d8f43d3af10ab8247465e450" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "employees" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "school_id" character varying NOT NULL, "user_id" character varying, "name" character varying NOT NULL, "email" character varying NOT NULL, "cpf" character varying NOT NULL, "phone" character varying, "position" character varying NOT NULL, "hourly_rate" numeric(10,2) NOT NULL, "is_active" boolean NOT NULL DEFAULT true, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_0ac9216832e4dda06946c37cb73" UNIQUE ("cpf"), CONSTRAINT "PK_b9535a98350d5b26e7eb0c26af4" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "time_records" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "employee_id" uuid NOT NULL, "date" date NOT NULL, "clock_in" TIMESTAMP, "clock_out" TIMESTAMP, CONSTRAINT "PK_0d2985ead4ba3604143eee43f90" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "bank_details" ADD CONSTRAINT "FK_3194c1ef98ce1a8b0556d85a411" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "addresses" ADD CONSTRAINT "FK_c9e1be43167f1b8e927f69b6b96" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "time_records" ADD CONSTRAINT "FK_2c6191ebf312f5dd529153b52ae" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "time_records" DROP CONSTRAINT "FK_2c6191ebf312f5dd529153b52ae"`);
        await queryRunner.query(`ALTER TABLE "addresses" DROP CONSTRAINT "FK_c9e1be43167f1b8e927f69b6b96"`);
        await queryRunner.query(`ALTER TABLE "bank_details" DROP CONSTRAINT "FK_3194c1ef98ce1a8b0556d85a411"`);
        await queryRunner.query(`DROP TABLE "time_records"`);
        await queryRunner.query(`DROP TABLE "employees"`);
        await queryRunner.query(`DROP TABLE "addresses"`);
        await queryRunner.query(`DROP TABLE "bank_details"`);
    }

}
