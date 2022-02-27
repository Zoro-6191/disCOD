import { Column, Entity, Index, PrimaryGeneratedColumn } from "typeorm";

@Index("action_id", ["actionId"], {})
@Index("player_id", ["playerId"], {})
@Entity("xlr_playeractions", { schema: "bonk" })
export class XlrPlayeractions {
  @PrimaryGeneratedColumn({ type: "mediumint", name: "id", unsigned: true })
  id: number;

  @Column("tinyint", {
    name: "action_id",
    unsigned: true,
    default: () => "'0'",
  })
  actionId: number;

  @Column("smallint", {
    name: "player_id",
    unsigned: true,
    default: () => "'0'",
  })
  playerId: number;

  @Column("mediumint", { name: "count", unsigned: true, default: () => "'0'" })
  count: number;
}
