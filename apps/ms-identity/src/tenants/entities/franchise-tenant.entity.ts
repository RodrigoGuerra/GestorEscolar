import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity({ name: 'tenant_mappings', schema: 'public' })
export class FranchiseTenant {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id' })
  userId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'franchise_schema' })
  franchiseSchema: string;

  @Column({ name: 'school_id' })
  schoolId: string;

  @Column()
  role: string;
}
