import { Column, Entity, Index, PrimaryGeneratedColumn } from "typeorm";

@Index("id", ["id"], { unique: true })
@Index("client_id", ["client_id"], { unique: true })
@Entity("demotions")
export class Demotions {
  @PrimaryGeneratedColumn({ type: "int", name: "id" })
  id: number;

  @Column("int", { name: "client_id", unique: true })
  client_id: number;

  @Column("int", { name: "admin_id" })
  admin_id: number;

  @Column("int", { name: "count", default: () => "'1'" })
  count: number;

  @Column("tinyint", { name: "inactive", default: () => "'0'" })
  inactive: number;

  @Column("int", { name: "time_add" })
  time_add: number;

  @Column("int", { name: "time_edit", default: () => "'0'" })
  time_edit: number;

  @Column("varchar", { name: "reason", length: 255 })
  reason: string;
}
