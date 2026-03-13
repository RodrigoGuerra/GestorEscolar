import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity({ name: 'users', schema: 'public' })
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column({ name: 'google_id', nullable: true })
  googleId: string;

  @Column()
  name: string;

  @Column({ default: 'student' })
  role: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
