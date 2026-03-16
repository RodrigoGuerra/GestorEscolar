import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Subject } from '../../subjects/entities/subject.entity';

@Entity({ name: 'grades' })
export class Grade {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'student_id' })
  studentId: string;

  @Column({ name: 'class_id' })
  classId: string;

  @Column({ name: 'subject_id' })
  subjectId: string;

  @Column({ type: 'decimal', precision: 5, scale: 2 })
  score: number;

  @Column()
  term: string; // e.g., '1st Term'

  @ManyToOne(() => Subject)
  @JoinColumn({ name: 'subject_id' })
  subject: Subject;
}
