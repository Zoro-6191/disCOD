import { Column, Entity, Index, PrimaryGeneratedColumn } from "typeorm";

@Index("bodypart_id", ["bodypartId"], {})
@Index("player_id", ["playerId"], {})
@Entity("xlr_playerbody", { schema: "bonk" })
export class XlrPlayerbody {
  @PrimaryGeneratedColumn({ type: "mediumint", name: "id", unsigned: true })
  id: number;

  @Column("tinyint", {
    name: "bodypart_id",
    unsigned: true,
    default: () => "'0'",
  })
  bodypartId: number;

  @Column("smallint", {
    name: "player_id",
    unsigned: true,
    default: () => "'0'",
  })
  playerId: number;

  @Column("mediumint", { name: "kills", unsigned: true, default: () => "'0'" })
  kills: number;

  @Column("mediumint", { name: "deaths", unsigned: true, default: () => "'0'" })
  deaths: number;

  @Column("smallint", {
    name: "teamkills",
    unsigned: true,
    default: () => "'0'",
  })
  teamkills: number;

  @Column("smallint", {
    name: "teamdeaths",
    unsigned: true,
    default: () => "'0'",
  })
  teamdeaths: number;

  @Column("smallint", {
    name: "suicides",
    unsigned: true,
    default: () => "'0'",
  })
  suicides: number;
}
