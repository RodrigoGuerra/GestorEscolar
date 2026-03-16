import { Entity, PrimaryGeneratedColumn, Column, OneToMany, ManyToOne, JoinColumn } from 'typeorm';

@Entity({ name: 'schools' })
export class School {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  name: string;

  @Column({ unique: true })
  cnpj: string;

  @Column({ name: 'is_matrix', default: false })
  isMatrix: boolean;

  @Column({ name: 'parent_school_id', nullable: true })
  parentSchoolId: string | null;

  @ManyToOne(() => School, (school) => school.branches)
  @JoinColumn({ name: 'parent_school_id' })
  parentSchool: School;

  @OneToMany(() => School, (school) => school.parentSchool)
  branches: School[];
}
