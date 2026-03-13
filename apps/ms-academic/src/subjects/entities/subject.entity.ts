import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity({ name: 'subjects' })
export class Subject {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column()
  workload: number;

  @Column({ type: 'text', nullable: true })
  syllabus: string;

  @Column({ name: 'matrix_id' })
  matrixId: string;
}
