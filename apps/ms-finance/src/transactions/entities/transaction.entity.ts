import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity({ name: 'transactions' })
export class Transaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'school_id' })
  schoolId: string;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  amount: number;

  @Column()
  type: 'INCOME' | 'EXPENSE';

  @Column()
  description: string;

  @Column({ nullable: true })
  relatedEntityId: string; // e.g., invoice_id or employee_id

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
