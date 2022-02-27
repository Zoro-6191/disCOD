import { Column, Entity, Index, PrimaryGeneratedColumn } from "typeorm";

@Index("id", ["id"], { unique: true })
@Index("client_id", ["clientId"], { unique: true })
@Entity("demotions", { schema: "bonk" })
export class Demotions {
  @PrimaryGeneratedColumn({ type: "int", name: "id" })
  id: number;

  @Column("int", { name: "client_id", unique: true })
  clientId: number;

  @Column("int", { name: "admin_id" })
  adminId: number;

  @Column("int", { name: "count", default: () => "'1'" })
  count: number;

  @Column("tinyint", { name: "inactive", default: () => "'0'" })
  inactive: number;

  @Column("int", { name: "time_add" })
  timeAdd: number;

  @Column("int", { name: "time_edit", default: () => "'0'" })
  timeEdit: number;

  @Column("varchar", { name: "reason", length: 255 })
  reason: string;
}
