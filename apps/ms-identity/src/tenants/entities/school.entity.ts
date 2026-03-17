import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity({ name: 'schools', schema: 'public' })
export class School {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;
}
