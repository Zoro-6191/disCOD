import { Column, Entity, Index, PrimaryGeneratedColumn } from "typeorm";

@Index("name", ["name"], { unique: true })
@Entity("xlr_actionstats", { schema: "bonk" })
export class XlrActionstats {
  @PrimaryGeneratedColumn({ type: "tinyint", name: "id", unsigned: true })
  id: number;

  @Column("varchar", { name: "name", unique: true, length: 26 })
  name: string;

  @Column("mediumint", { name: "count", unsigned: true, default: () => "'0'" })
  count: number;
}
