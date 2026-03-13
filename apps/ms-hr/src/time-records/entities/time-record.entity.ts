import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Employee } from '../../employees/entities/employee.entity';

@Entity({ name: 'time_records' })
export class TimeRecord {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'employee_id' })
  employeeId: string;

  @ManyToOne(() => Employee)
  @JoinColumn({ name: 'employee_id' })
  employee: Employee;

  @Column({ type: 'date' })
  date: string;

  @Column({ name: 'clock_in', type: 'timestamp', nullable: true })
  clockIn: Date;

  @Column({ name: 'clock_out', type: 'timestamp', nullable: true })
  clockOut: Date;
}
