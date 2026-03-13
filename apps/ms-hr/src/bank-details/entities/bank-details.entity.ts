import { Entity, PrimaryGeneratedColumn, Column, OneToOne, JoinColumn } from 'typeorm';
import { Employee } from '../../employees/entities/employee.entity';

@Entity({ name: 'bank_details' })
export class BankDetails {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'employee_id' })
  employeeId: string;

  @OneToOne(() => Employee, (employee) => employee.bankDetails)
  @JoinColumn({ name: 'employee_id' })
  employee: Employee;

  @Column({ name: 'bank_code' })
  bankCode: string;

  @Column()
  agency: string;

  @Column()
  account: string;

  @Column({ name: 'pix_key', nullable: true })
  pixKey: string;
}
