import { Entity, PrimaryGeneratedColumn, Column, BaseEntity } from "typeorm";

@Entity()
export class User extends BaseEntity {
  @PrimaryGeneratedColumn("uuid")
  id: string = "";

  @Column()
  username: string = "";

  @Column()
  telegramId: string = "";

  @Column()
  solanaPublicKey: string = "";

  @Column({ nullable: true })
  solanaPrivateKey?: string;
  @Column({ nullable: true })
  share1?: string;

  @Column({ nullable: true })
  share2?: string;

  @Column({ nullable: true })
  share3?: string;

  @Column({ nullable: true })
  share4?: string;

  @Column({ default: true })
  isActive: boolean = true;
}
