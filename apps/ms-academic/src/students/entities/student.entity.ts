import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToMany,
  JoinTable,
} from 'typeorm';
import { School } from '../../schools/entities/school.entity';
import { Class } from '../../classes/entities/class.entity';

@Entity({ name: 'students' })
export class Student {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // Personal Data
  @Column()
  name: string;

  @Column({ unique: true })
  email: string;

  @Column({ unique: true })
  cpf: string;

  @Column({ default: '' })
  phone: string;

  @Column({ name: 'birth_date' })
  birthDate: Date;

  // Enrollment Data
  @Column({ name: 'enrollment_number', unique: true })
  enrollmentNumber: string;

  @Column({ name: 'enrollment_date', default: () => 'CURRENT_TIMESTAMP' })
  enrollmentDate: Date;

  @Column({ default: 'ACTIVE' })
  status: string; // ACTIVE, INACTIVE, SUSPENDED

  // Address
  @Column({ nullable: true })
  street: string;

  @Column({ nullable: true })
  number: string;

  @Column({ nullable: true })
  complement: string;

  @Column({ nullable: true })
  neighborhood: string;

  @Column({ nullable: true })
  city: string;

  @Column({ nullable: true })
  state: string;

  @Column({ name: 'zip_code', nullable: true })
  zipCode: string;

  // Guardian Data
  @Column({ name: 'guardian_name', nullable: true })
  guardianName: string;

  @Column({ name: 'guardian_cpf', nullable: true })
  guardianCpf: string;

  @Column({ name: 'guardian_email', nullable: true })
  guardianEmail: string;

  @Column({ name: 'guardian_phone', nullable: true })
  guardianPhone: string;

  // Multi-tenancy & Relationships
  @ManyToMany(() => School, (school) => school.students)
  @JoinTable({
    name: 'student_schools',
    joinColumn: { name: 'student_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'school_id', referencedColumnName: 'id' },
  })
  schools: School[];

  @ManyToMany(() => Class)
  @JoinTable({
    name: 'student_classes',
    joinColumn: { name: 'student_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'class_id', referencedColumnName: 'id' },
  })
  classes: Class[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
