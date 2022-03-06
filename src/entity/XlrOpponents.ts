import { Column, Entity, Index, PrimaryGeneratedColumn } from "typeorm";

@Index("target_id", ["targetId"], {})
@Index("killer_id", ["killerId"], {})
@Entity("xlr_opponents")
export class XlrOpponents {
  @PrimaryGeneratedColumn({ type: "mediumint", name: "id", unsigned: true })
  id: number;

  @Column("smallint", {
    name: "target_id",
    unsigned: true,
    default: () => "'0'",
  })
  targetId: number;

  @Column("smallint", {
    name: "killer_id",
    unsigned: true,
    default: () => "'0'",
  })
  killerId: number;

  @Column("smallint", { name: "kills", unsigned: true, default: () => "'0'" })
  kills: number;

  @Column("smallint", { name: "retals", unsigned: true, default: () => "'0'" })
  retals: number;
}
