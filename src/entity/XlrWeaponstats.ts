import { Column, Entity, Index, PrimaryGeneratedColumn } from "typeorm";

@Index("name", ["name"], { unique: true })
@Entity("xlr_weaponstats", { schema: "bonk" })
export class XlrWeaponstats {
  @PrimaryGeneratedColumn({ type: "smallint", name: "id", unsigned: true })
  id: number;

  @Column("varchar", { name: "name", unique: true, length: 64 })
  name: string;

  @Column("mediumint", { name: "kills", unsigned: true, default: () => "'0'" })
  kills: number;

  @Column("smallint", {
    name: "teamkills",
    unsigned: true,
    default: () => "'0'",
  })
  teamkills: number;

  @Column("smallint", {
    name: "suicides",
    unsigned: true,
    default: () => "'0'",
  })
  suicides: number;
}
