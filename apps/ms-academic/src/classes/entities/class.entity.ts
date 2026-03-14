import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { School } from '../../schools/entities/school.entity';

@Entity({ name: 'classes' })
export class Class {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column()
  year: number;

  @Column({ name: 'school_id' })
  schoolId: string;

  @ManyToOne(() => School)
  @JoinColumn({ name: 'school_id' })
  school: School;
}
