import { Column, Entity, Index, PrimaryGeneratedColumn } from "typeorm";

@Index("id", ["id"], { unique: true })
@Index("b3_id", ["b3Id"], { unique: true })
@Index("dc_id", ["dcId"], { unique: true })
@Entity("discod")
export class Discod {
  @PrimaryGeneratedColumn({ type: "int", name: "id" })
  id: number;

  @Column("int", { name: "b3_id", unique: true })
  b3Id: number;

  @Column("varchar", { name: "dc_id", unique: true, length: 32 })
  dcId: string;

  @Column("varchar", { name: "dc_tag", length: 32 })
  dcTag: string;

  @Column("varchar", { name: "pass", length: 12 })
  pass: string;

  @Column("tinyint", { name: "linked", default: () => "'0'" })
  linked: number;

  @Column("int", { name: "linktime", default: () => "'0'" })
  linktime: number;

  @Column("int", { name: "time_add", default: () => "'0'" })
  timeAdd: number;
}
