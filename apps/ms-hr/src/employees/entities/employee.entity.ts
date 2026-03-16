import { Entity, PrimaryGeneratedColumn, Column, OneToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { BankDetails } from '../../bank-details/entities/bank-details.entity';
import { Address } from './address.entity';

@Entity({ name: 'employees' })
export class Employee {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'school_id' })
  schoolId: string;

  @Column({ name: 'user_id', nullable: true })
  userId: string;

  @Column()
  name: string;

  @Column()
  email: string;

  @Column({ unique: true })
  cpf: string;

  @Column({ nullable: true })
  phone: string;

  @Column()
  position: string;

  @Column({ 
    name: 'hourly_rate', 
    type: 'decimal', 
    precision: 10, 
    scale: 2,
    transformer: {
      to: (value: number) => value,
      from: (value: string) => parseFloat(value)
    }
  })
  hourlyRate: number;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @OneToOne(() => BankDetails, (bankDetails) => bankDetails.employee, { cascade: true })
  bankDetails: BankDetails;

  @OneToOne(() => Address, (address) => address.employee, { cascade: true })
  address: Address;
}
